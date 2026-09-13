const fs = require("node:fs");
const path = require("node:path");

const adapterPath = path.resolve("node_modules/@copilotkit/channels-intelligence/dist/delivery-adapter.js");
const transportPath = path.resolve("node_modules/@copilotkit/channels-intelligence/dist/delivery-transport.js");

if (fs.existsSync(adapterPath)) {
  let adapter = fs.readFileSync(adapterPath, "utf8");

  const targetCall = `                const providerHistory = target.delivery.turn.input.kind === "text"
                    ? await this.loadProviderAgentHistory(target)
                    : undefined;`;

  const safeCall = `                let providerHistory;
                try {
                    providerHistory = target.delivery.turn.input.kind === "text"
                        ? await this.loadProviderAgentHistory(target)
                        : undefined;
                } catch (historyErr) {
                    this.options.log?.("Failed to fetch provider transcript history (non-fatal), proceeding with fallback", historyErr);
                }`;

  if (adapter.includes(targetCall)) {
    adapter = adapter.replace(targetCall, safeCall);
    console.log("Patched getOrCreate LF in delivery-adapter.js");
  } else if (adapter.includes(targetCall.replace(/\n/g, "\r\n"))) {
    adapter = adapter.replace(targetCall.replace(/\n/g, "\r\n"), safeCall.replace(/\n/g, "\r\n"));
    console.log("Patched getOrCreate CRLF in delivery-adapter.js");
  }

  const targetImplRegex = /async loadProviderAgentHistory\(target\)\s*\{[\s\S]*?return\s*\{[\s\S]*?messages,[\s\S]*?historyIds:[\s\S]*?\};\s*\}/;
  if (targetImplRegex.test(adapter)) {
    adapter = adapter.replace(targetImplRegex, `async loadProviderAgentHistory(target) {
        try {
            const transcript = await target.claimedDelivery.getTranscript();
            const messages = await transcriptAgentMessages(transcript, target, this.options.log);
            const persistCurrentTrigger = target.claimedDelivery.consumeTranscriptTriggerPersistence();
            return {
                messages,
                historyIds: new Set(messages
                    .filter((message) => !persistCurrentTrigger ||
                    !message.id.startsWith("channel-transcript-trigger:"))
                    .map((message) => message.id)),
            };
        } catch (error) {
            this.options.log?.("Non-fatal: Failed to load provider transcript history, proceeding with empty history", error);
            return {
                messages: [],
                historyIds: new Set(),
            };
        }
    }`);
    console.log("Patched loadProviderAgentHistory in delivery-adapter.js");
  }

  fs.writeFileSync(adapterPath, adapter, "utf8");
}

if (fs.existsSync(transportPath)) {
  let transport = fs.readFileSync(transportPath, "utf8");
  const targetRegex = /getTranscript\(\)\s*\{[\s\S]*?this\.transcriptPromise\s*\?\?=\s*this\.transcripts[\s\S]*?\.fetchTranscript\(this\.delivery\.deliveryId\)[\s\S]*?\.then\(\(transcript\)\s*=>\s*restorePreparedTriggerFiles\(transcript,\s*this\.delivery\.turn\.input\)\);[\s\S]*?return this\.transcriptPromise;\s*\}/;
  if (targetRegex.test(transport)) {
    transport = transport.replace(targetRegex, `getTranscript() {
        if (!this.transcripts) {
            return Promise.reject(new Error("Channel transcript requires both appApiBaseUrl and apiKey"));
        }
        this.transcriptPromise ??= this.transcripts
            .fetchTranscript(this.delivery.deliveryId)
            .then((transcript) => restorePreparedTriggerFiles(transcript, this.delivery.turn.input))
            .catch((err) => {
                if (err && (err.code === "CHANNEL_DELIVERY_NOT_FOUND" || String(err).includes("CHANNEL_DELIVERY_NOT_FOUND"))) {
                    return { messages: [], truncation: { messageLimit: false, byteLimit: false, omittedMessageCount: 0 } };
                }
                throw err;
            });
        return this.transcriptPromise;
    }`);
    console.log("Patched getTranscript in delivery-transport.js");
  }
  fs.writeFileSync(transportPath, transport, "utf8");
}
