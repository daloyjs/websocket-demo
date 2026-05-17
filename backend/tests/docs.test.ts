import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { buildApp } from "../src/build-app.js";

const OpenApiDoc = z.object({
  openapi: z.string(),
  paths: z.record(z.string(), z.unknown()),
});

test("GET /openapi.json documents the trading demo routes", async () => {
  const app = buildApp();
  const res = await app.request("/openapi.json");
  const doc = OpenApiDoc.parse(await res.json());

  assert.equal(res.status, 200);
  assert.equal(doc.openapi, "3.1.0");
  assert.ok(doc.paths["/btc/snapshot"]);
  assert.ok(doc.paths["/wallet/"]);
  assert.ok(doc.paths["/wallet/buy"]);
  assert.ok(doc.paths["/wallet/sell"]);
  assert.ok(doc.paths["/orders/"]);
  assert.ok(doc.paths["/orders/{id}"]);
});
