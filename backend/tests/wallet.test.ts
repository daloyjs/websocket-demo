import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { Order, Wallet } from "../src/wallet.js";
import { buildApp } from "../src/build-app.js";

const TradeResponse = z.object({ wallet: Wallet, order: Order });

test("GET /wallet returns the starting balances", async () => {
  const app = buildApp();
  const res = await app.request("/wallet/");
  const body = Wallet.parse(await res.json());

  assert.equal(res.status, 200);
  assert.ok(body.usd > 0);
  assert.ok(body.btc > 0);
  assert.ok(body.markPrice > 0);
});

test("POST /wallet/buy debits USD and credits BTC", async () => {
  const app = buildApp();
  // Reset to get a clean starting state for this test.
  await app.request("/wallet/reset", { method: "POST" });
  const before = Wallet.parse(await (await app.request("/wallet/")).json());

  const res = await app.request("/wallet/buy", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ usd: 1_000 }),
  });
  const payload = TradeResponse.parse(await res.json());
  const { wallet, order } = payload;

  assert.equal(res.status, 201);
  assert.equal(order.side, "BUY");
  assert.ok(wallet.usd < before.usd);
  assert.ok(wallet.btc > before.btc);
});

test("POST /wallet/buy rejects oversized buys with 400", async () => {
  const app = buildApp();
  await app.request("/wallet/reset", { method: "POST" });
  const res = await app.request("/wallet/buy", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ usd: 9_999_999 }),
  });

  assert.equal(res.status, 400);
});

test("POST /wallet/sell rejects oversized sells with 400", async () => {
  const app = buildApp();
  await app.request("/wallet/reset", { method: "POST" });
  const res = await app.request("/wallet/sell", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ btc: 99 }),
  });

  assert.equal(res.status, 400);
});

test("POST /wallet/sell + PUT /orders/:id + DELETE /orders/:id round-trip", async () => {
  const app = buildApp();
  await app.request("/wallet/reset", { method: "POST" });

  const sellRes = await app.request("/wallet/sell", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ btc: 0.05 }),
  });
  const sellPayload = TradeResponse.parse(await sellRes.json());
  const order = sellPayload.order;

  assert.equal(sellRes.status, 201);
  assert.equal(order.side, "SELL");

  const putRes = await app.request(`/orders/${order.id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ note: "took profit" }),
  });
  const updated = Order.parse(await putRes.json());
  assert.equal(putRes.status, 200);
  assert.equal(updated.note, "took profit");

  const delRes = await app.request(`/orders/${order.id}`, {
    method: "DELETE",
  });
  assert.equal(delRes.status, 200);

  const missing = await app.request(`/orders/${order.id}`, {
    method: "DELETE",
  });
  assert.equal(missing.status, 404);
});

test("POST /wallet/buy rejects invalid bodies with 422", async () => {
  const app = buildApp();
  const res = await app.request("/wallet/buy", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ usd: -1 }),
  });

  assert.equal(res.status, 422);
});

test("GET /orders lists executed orders newest first", async () => {
  const app = buildApp();
  await app.request("/wallet/reset", { method: "POST" });

  await app.request("/wallet/buy", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ usd: 100 }),
  });
  await app.request("/wallet/sell", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ btc: 0.001 }),
  });

  const res = await app.request("/orders/");
  const orders = z.array(Order).parse(await res.json());

  assert.equal(res.status, 200);
  assert.equal(orders.length, 2);
  assert.ok(orders[0]!.ts >= orders[1]!.ts);
});

test("POST /wallet/reset restores balances and clears orders", async () => {
  const app = buildApp();
  await app.request("/wallet/buy", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ usd: 100 }),
  });

  const res = await app.request("/wallet/reset", { method: "POST" });
  const wallet = Wallet.parse(await res.json());
  const orders = z.array(Order).parse(await (await app.request("/orders/")).json());

  assert.equal(res.status, 200);
  assert.equal(wallet.usd, 50_000);
  assert.equal(wallet.btc, 0.25);
  assert.deepEqual(orders, []);
});
