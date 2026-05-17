import assert from "node:assert/strict";
import test from "node:test";
import { PriceTick } from "../src/btc-feed.js";
import { buildApp } from "../src/build-app.js";

test("GET /btc/snapshot returns the simulated BTC tick", async () => {
  const app = buildApp();
  const res = await app.request("/btc/snapshot");
  const body = PriceTick.parse(await res.json());

  assert.equal(res.status, 200);
  assert.equal(typeof body.price, "number");
  assert.equal(typeof body.changeAbs, "number");
  assert.equal(typeof body.changePct, "number");
  assert.equal(typeof body.high1h, "number");
  assert.equal(typeof body.low1h, "number");
  assert.equal(typeof body.ts, "number");
  assert.ok(body.high1h >= body.low1h);
});

test("POST /btc/snapshot is rejected", async () => {
  const app = buildApp();
  const res = await app.request("/btc/snapshot", { method: "POST" });

  assert.equal(res.status, 405);
});
