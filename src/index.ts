// SPDX-License-Identifier: MIT

export {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  apiPath,
  isLocalUrl,
  resolveApiKey,
  resolveBaseUrl,
} from "./config.js";

export {
  binResolutionSchema,
  matchedNullInputSchema,
  organismSchema,
  outputIdTypeSchema,
  parseRunInput,
  type BinResolution,
  type MatchedNullInput,
  type Organism,
  type OutputIdType,
} from "./schemas.js";

export {
  PepkioAPIError,
  type CovariateBalance,
  type ExampleMeta,
  type ManifestExample,
  type MatchedNullResult,
  type NullGeneSet,
  type RunOptions,
  type RunResult,
  type RunStatus,
  type ToolManifest,
} from "./types.js";

export {
  PepkioClient,
  type PepkioClientOptions,
} from "./client.js";

import { PepkioClient } from "./client.js";
export default PepkioClient;
