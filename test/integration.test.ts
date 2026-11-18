// SPDX-License-Identifier: MIT
import { describe, expect, it } from "vitest";
import { PepkioClient } from "../src/client.js";
import { TOOL_ID } from "../src/config.js";

const LOCAL_BASE_URL = "https://tools.localtest.me";
const PRODUCTION_BASE_URL = "https://tools.pepkio.com";

function envConfig(env: "local" | "production") {
  const baseUrl = process.env.PEPKIO_API_BASE_URL
    ? process.env.PEPKIO_API_BASE_URL.replace(/\/$/, "")
    : env === "local"
      ? LOCAL_BASE_URL
      : PRODUCTION_BASE_URL;

  const isLocal = baseUrl.includes("localtest.me") || baseUrl.includes("localhost");
  const apiKey = isLocal
    ? process.env.LOCAL_PEPKIO_API_KEY ?? process.env.PEPKIO_API_KEY
    : process.env.PEPKIO_API_KEY;

  return { baseUrl, apiKey, isLocal };
}

describe("integration: local", () => {
  const { baseUrl, apiKey } = envConfig("local");

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("Matched Null Gene Set Generator");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("human_example");
    },
    30_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs human_example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("human_example");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.ready).toBe(true);
      expect(result.result?.null_sets?.length).toBe(3);
      expect(result.result?.null_sets?.[0].genes?.length).toBe(5);
      expect(result.result?.balance?.length).toBe(3);
      expect(result.result?.gmt_export).toBeTruthy();
    },
    60_000,
  );
});

describe("integration: production", () => {
  const { baseUrl, apiKey } = envConfig("production");

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("Matched Null Gene Set Generator");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("human_example");
    },
    30_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs human_example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("human_example");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.ready).toBe(true);
      expect(result.result?.null_sets?.length).toBe(3);
      expect(result.result?.null_sets?.[0].genes?.length).toBe(5);
      expect(result.result?.balance?.length).toBe(3);
      expect(result.result?.gmt_export).toBeTruthy();
    },
    60_000,
  );
});
