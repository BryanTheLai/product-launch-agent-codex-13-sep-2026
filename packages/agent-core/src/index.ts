/**
 * Server surface. Importing this from a client component pulls
 * @copilotkit/runtime (and Express, and Node's `fs`) into the browser bundle.
 * Client code wants `agent-core/shared`.
 */
export { makeAgent } from "./agent";

export { MOBILE_FINANCE_PROMPT } from "./mobile-finance-prompt";
export { resolveModel } from "./model";
export { searchWeb, isSearchConfigured } from "./capabilities/search";
export {
  workplaceMcpClients,
  workplaceMcpServers,
  isWorkplaceConfigured,
  WORKPLACE_CONTEXT,
} from "./capabilities/workplace";
export * from "./shared";
export * from "./creative/types";
export * from "./creative/product-spec";
export * from "./creative/storage";
export * from "./creative/providers/openai-images";
export * from "./creative/providers/exa-research";
export * from "./creative/providers/fal-video";
export * from "./creative/deck/presentation";
export * from "./creative/director";
