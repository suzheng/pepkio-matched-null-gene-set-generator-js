// SPDX-License-Identifier: MIT
import type {
  BinResolution,
  MatchedNullInput,
  Organism,
  OutputIdType,
} from "./schemas.js";

export type {
  BinResolution,
  MatchedNullInput,
  Organism,
  OutputIdType,
};

export type RunStatus = "queued" | "running" | "completed" | "failed" | (string & {});

export interface RunOptions {
  idempotency_key?: string;
  label?: string;
  [key: string]: unknown;
}

export interface ManifestExample {
  name: string;
  description?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface ToolManifest {
  schema_version: string;
  tool_id: string;
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  execution_mode?: string;
  estimated_runtime_sec?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  agent_notes?: string;
  example_prompts?: string[];
  examples?: ManifestExample[];
  limits?: Record<string, unknown>;
  input_schema?: Record<string, unknown>;
}

export interface ExampleMeta {
  name: string;
  description?: string;
}

export interface NullGeneSet {
  name: string;
  genes: string[];
  [key: string]: unknown;
}

export interface CovariateBalance {
  criterion: string;
  smd: number;
  ks_p_value: number;
  level: "acceptable" | "imbalanced" | string;
  [key: string]: unknown;
}

export interface MatchedNullResult {
  ready: boolean;
  errors: string[];
  warnings: string[];
  seed?: number;
  query_size: number;
  matched_query_count: number;
  not_found_count: number;
  not_found_genes?: string[];
  adaptive_binning_genes?: number;
  null_sets: NullGeneSet[];
  balance: CovariateBalance[];
  methods_text?: string;
  gmt_export?: string;
  csv_export?: string;
  r_script?: string;
  python_script?: string;
  background_size?: number;
  matching_criteria?: string[];
  [key: string]: unknown;
}

export interface RunResult<T = MatchedNullResult> {
  run_id: string;
  status: RunStatus;
  result?: T;
  error?: string | { message?: string; code?: string; details?: unknown } | null;
  result_url?: string;
  permalink?: string;
  duration_ms?: number;
}

export class PepkioAPIError extends Error {
  readonly status: number;
  readonly body?: unknown;
  readonly runId?: string;
  readonly code?: string;

  constructor(
    message: string,
    opts: { status: number; body?: unknown; runId?: string; code?: string },
  ) {
    super(message);
    this.name = "PepkioAPIError";
    this.status = opts.status;
    this.body = opts.body;
    this.runId = opts.runId;
    this.code = opts.code;
  }
}
