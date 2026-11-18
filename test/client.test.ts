// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PepkioClient } from "../src/client.js";
import {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  isLocalUrl,
  resolveApiKey,
  resolveBaseUrl,
} from "../src/config.js";
import { PepkioAPIError } from "../src/types.js";

const mockManifest = {
  schema_version: "1.0",
  tool_id: TOOL_ID,
  title: "Matched Null Gene Set Generator",
  description: "Generate confound-matched random gene sets as negative controls",
  examples: [
    {
      name: "human_example",
      input: {
        gene_list: "TP53\nBRCA1\nEGFR\nMYC\nKRAS",
        organism: "human",
        null_set_count: 3,
        seed: 42,
        match_expression: true,
        match_length: true,
        match_gc: true,
      },
      output: {
        ready: true,
      },
    },
  ],
};

const mockRunResponse = {
  run_id: "test-run-matched-null-123",
  status: "completed",
  result: {
    ready: true,
    errors: [],
    warnings: [],
    seed: 42,
    query_size: 5,
    matched_query_count: 5,
    not_found_count: 0,
    not_found_genes: [],
    adaptive_binning_genes: 0,
    null_sets: [
      { name: "NULL_SET_1", genes: ["COPB2", "LCT", "PLPBP", "PRPF31", "TFIP11"] },
      { name: "NULL_SET_2", genes: ["FNDC1", "MIOS", "NFATC2IP", "PML", "TGFB1"] },
      { name: "NULL_SET_3", genes: ["CUL5", "EAPP", "FBXL6", "SERPINA3", "WNT2B"] },
    ],
    balance: [
      { criterion: "expression", smd: 0.221, ks_p_value: 0.209, level: "imbalanced" },
      { criterion: "length", smd: 0.132, ks_p_value: 0.6974, level: "acceptable" },
      { criterion: "gc", smd: 0.154, ks_p_value: 0.9996, level: "acceptable" },
    ],
    methods_text: "Matched null gene sets were generated...",
    gmt_export: "NULL_SET_1\tNA\tCOPB2\tLCT\tPLPBP\tPRPF31\tTFIP11\n",
    csv_export: "NULL_SET_1,NULL_SET_2,NULL_SET_3\n",
    r_script: "library(fgsea)\n",
    python_script: "import numpy as np\n",
    background_size: 22420,
    matching_criteria: ["expression", "length", "gc"],
  },
  error: null,
  duration_ms: 120,
};

describe("config utilities", () => {
  const origBase = process.env.PEPKIO_API_BASE_URL;
  const origLocal = process.env.LOCAL_PEPKIO_API_KEY;
  const origProd = process.env.PEPKIO_API_KEY;

  beforeEach(() => {
    delete process.env.PEPKIO_API_BASE_URL;
    delete process.env.LOCAL_PEPKIO_API_KEY;
    delete process.env.PEPKIO_API_KEY;
  });

  afterEach(() => {
    if (origBase) process.env.PEPKIO_API_BASE_URL = origBase;
    if (origLocal) process.env.LOCAL_PEPKIO_API_KEY = origLocal;
    if (origProd) process.env.PEPKIO_API_KEY = origProd;
  });

  it("resolves default production URL", () => {
    expect(resolveBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });

  it("prefers explicit override over env var", () => {
    process.env.PEPKIO_API_BASE_URL = "https://env.pepkio.com/";
    expect(resolveBaseUrl("https://override.pepkio.com/")).toBe(
      "https://override.pepkio.com",
    );
  });

  it("detects local URLs", () => {
    expect(isLocalUrl("https://tools.localtest.me")).toBe(true);
    expect(isLocalUrl("http://localhost:8000")).toBe(true);
    expect(isLocalUrl("https://tools.pepkio.com")).toBe(false);
  });

  it("picks LOCAL_PEPKIO_API_KEY for local URLs", () => {
    process.env.LOCAL_PEPKIO_API_KEY = "loc-key";
    process.env.PEPKIO_API_KEY = "prod-key";
    expect(resolveApiKey("https://tools.localtest.me")).toBe("loc-key");
    expect(resolveApiKey("https://tools.pepkio.com")).toBe("prod-key");
  });
});

describe("PepkioClient", () => {
  const origFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = origFetch;
    vi.restoreAllMocks();
  });

  it("fetches and caches manifest", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockManifest),
    });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-key" });
    const manifest1 = await client.getManifest();
    expect(manifest1.tool_id).toBe(TOOL_ID);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const manifest2 = await client.getManifest();
    expect(manifest2.tool_id).toBe(TOOL_ID);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await client.getManifest({ refresh: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("extracts and validates example inputs", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockManifest),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const examples = await client.getExamples();
    expect(examples).toHaveLength(1);
    expect(examples[0].name).toBe("human_example");

    const input = await client.getExampleInput("human_example");
    expect(input.organism).toBe("human");
    expect(input.gene_list).toContain("TP53");
    expect(input.null_set_count).toBe(3);

    await expect(client.getExampleInput("non_existent")).rejects.toThrow(
      /Example "non_existent" not found/,
    );
  });

  it("executes run and generate calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockRunResponse),
    });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-key" });
    const input = mockManifest.examples[0].input as any;

    const res = await client.run(input, { label: "test-label" });
    expect(res.status).toBe("completed");
    expect(res.result?.null_sets).toHaveLength(3);
    expect(res.result?.null_sets[0].name).toBe("NULL_SET_1");

    const genRes = await client.generate(input);
    expect(genRes.status).toBe("completed");
    expect(genRes.result?.balance).toHaveLength(3);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("requires API key for run()", async () => {
    const client = new PepkioClient({ apiKey: "" });
    const input = mockManifest.examples[0].input as any;

    await expect(client.run(input)).rejects.toThrow(PepkioAPIError);
    await expect(client.run(input)).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining("API key required"),
    });
  });

  it("handles HTTP error responses gracefully", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () =>
        JSON.stringify({ error: { message: "Invalid gene list", code: "INVALID_INPUT" } }),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const input = mockManifest.examples[0].input as any;

    await expect(client.run(input)).rejects.toThrow("Invalid gene list");
  });

  it("handles error in response body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          run_id: "run-failed",
          status: "failed",
          error: "Background sampling pool empty",
        }),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const input = mockManifest.examples[0].input as any;

    await expect(client.run(input)).rejects.toThrow(
      "Background sampling pool empty",
    );
  });

  it("waitForRun polls until completed", async () => {
    const queuedRes = {
      run_id: "async-run",
      status: "running",
    };
    const doneRes = {
      run_id: "async-run",
      status: "completed",
      result: mockRunResponse.result,
    };

    let count = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      count++;
      return {
        ok: true,
        text: async () => JSON.stringify(count < 2 ? queuedRes : doneRes),
      };
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const res = await client.waitForRun("async-run", { intervalMs: 10, timeoutMs: 1000 });
    expect(res.status).toBe("completed");
    expect(count).toBe(2);
  });
});
