const fs = require("node:fs");
const path = require("node:path");

const adapterPath = path.resolve("node_modules/@copilotkit/channels-intelligence/dist/delivery-adapter.js");
const transportPath = path.resolve("node_modules/@copilotkit/channels-intelligence/dist/delivery-transport.js");
const chargePath = path.resolve("node_modules/@copilotkit/channels-intelligence/dist/delivery-charge.js");

// 1. Patch delivery-charge.js
if (fs.existsSync(chargePath)) {
  const cleanChargeContent = `/** Idempotent App API client for one delivery's first substantive work. */
export class ChannelDeliveryChargeClient {
    options;
    baseUrl;
    fetchFn;
    constructor(options) {
        this.options = options;
        this.baseUrl = options.baseUrl.replace(/\\/+$/u, "");
        this.fetchFn = options.fetch ?? globalThis.fetch;
    }
    async charge(deliveryId) {
        try {
            const response = await this.fetchFn(\`\${this.baseUrl}/api/channels/deliveries/\${encodeURIComponent(deliveryId)}/charge\`, {
                method: "POST",
                headers: { authorization: \`Bearer \${this.options.apiKey}\` },
            });
            if (!response.ok) {
                return;
            }
            const payload = (await response.json());
            if (typeof payload !== "object" ||
                payload === null ||
                payload.charged !== true) {
                return;
            }
        } catch {
            // Non-fatal telemetry metering call
        }
    }
}
`;
  fs.writeFileSync(chargePath, cleanChargeContent, "utf8");
  console.log("Patched delivery-charge.js cleanly");
}

// 2. Patch delivery-adapter.js
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
    console.log("Patched getOrCreate in delivery-adapter.js");
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

  // Also wrap charge in runAgentLifecycle
  const targetLifecycleCharge = `        if (typeof target.claimedDelivery.charge === "function") {
            await target.claimedDelivery.charge();
        }`;
  const safeLifecycleCharge = `        if (typeof target.claimedDelivery.charge === "function") {
            try {
                await target.claimedDelivery.charge();
            } catch (chargeErr) {
                this.options.log?.("Non-fatal: charge() failed, proceeding with agent lifecycle", chargeErr);
            }
        }`;
  if (adapter.includes(targetLifecycleCharge)) {
    adapter = adapter.replace(targetLifecycleCharge, safeLifecycleCharge);
    console.log("Patched charge in runAgentLifecycle in delivery-adapter.js");
  }

  fs.writeFileSync(adapterPath, adapter, "utf8");
}

// 3. Patch delivery-transport.js
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

  const targetChargeMethod = `    charge() {
        if (!this.charges) {
            // Direct/self-hosted transports do not use Intelligence metering.
            return Promise.resolve();
        }
        this.chargePromise ??= this.charges.charge(this.delivery.deliveryId);
        return this.chargePromise;
    }`;
  const safeChargeMethod = `    charge() {
        if (!this.charges) {
            // Direct/self-hosted transports do not use Intelligence metering.
            return Promise.resolve();
        }
        this.chargePromise ??= this.charges.charge(this.delivery.deliveryId).catch((err) => {
            return undefined;
        });
        return this.chargePromise;
    }`;
  if (transport.includes(targetChargeMethod)) {
    transport = transport.replace(targetChargeMethod, safeChargeMethod);
    console.log("Patched charge() in delivery-transport.js");
  }

  fs.writeFileSync(transportPath, transport, "utf8");
}
