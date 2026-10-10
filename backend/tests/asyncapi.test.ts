import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { z } from "zod";
import { serve } from "@daloyjs/core/node";
import { BtcFeedMessage } from "../src/btc-feed.js";
import { buildApp } from "../src/build-app.js";

const AsyncApiDoc = z.object({
  asyncapi: z.string(),
  servers: z.record(z.string(), z.object({ host: z.string(), protocol: z.string() })),
  channels: z.record(z.string(), z.object({ address: z.string() })),
  operations: z.record(z.string(), z.object({ action: z.enum(["send", "receive"]) })),
  components: z.object({
    messages: z.record(z.string(), z.object({ payload: z.record(z.string(), z.unknown()) })),
  }),
});

test("GET /asyncapi.json documents the BTC feed channel", async () => {
  const app = buildApp();
  const res = await app.request("/asyncapi.json");
  const doc = AsyncApiDoc.parse(await res.json());

  assert.equal(res.status, 200);
  assert.equal(doc.asyncapi, "3.0.0");
  assert.equal(doc.servers.local?.protocol, "ws");
  assert.equal(doc.channels.btcFeed?.address, "/btc/feed");
  assert.equal(doc.operations.btcFeedSend?.action, "send");
  assert.equal(doc.operations.btcFeedReceive?.action, "receive");

  const send = doc.components.messages.btcFeedSend?.payload;
  assert.deepEqual(send?.required, ["type", "data"]);
  // Inbound is documented as "no messages accepted".
  assert.deepEqual(doc.components.messages.btcFeedReceive?.payload.not, {});
});

test("GET /asyncapi.yaml and /asyncapi serve the YAML document and UI", async () => {
  const app = buildApp();

  const yaml = await app.request("/asyncapi.yaml");
  assert.equal(yaml.status, 200);
  assert.match(yaml.headers.get("content-type") ?? "", /text\/yaml/);
  assert.match(await yaml.text(), /^asyncapi: 3\.0\.0/);

  const ui = await app.request("/asyncapi");
  assert.equal(ui.status, 200);
  assert.match(ui.headers.get("content-type") ?? "", /text\/html/);
  assert.ok(ui.headers.get("content-security-policy"));
});

// Regression: the AsyncAPI viewer compiles validators with `new Function`, so
// without 'unsafe-eval' the /asyncapi page rendered blank.
test("GET /asyncapi allows eval in script-src so the viewer can render", async () => {
  const app = buildApp();
  const res = await app.request("/asyncapi");
  const csp = res.headers.get("content-security-policy") ?? "";

  assert.match(csp, /script-src [^;]*'unsafe-eval'/);
});

test("eval stays blocked on every other docs response", async () => {
  const app = buildApp();

  for (const path of ["/docs", "/asyncapi.json", "/asyncapi.yaml"]) {
    const res = await app.request(path);
    const csp = res.headers.get("content-security-policy") ?? "";
    assert.doesNotMatch(csp, /unsafe-eval/, `${path} must not allow eval`);
  }
});

test("POST /asyncapi.json is rejected", async () => {
  const app = buildApp();
  const res = await app.request("/asyncapi.json", { method: "POST" });

  assert.equal(res.status, 405);
});

// The runtime half of the contract needs a real socket: app.request() does not
// perform RFC 6455 upgrades.
async function withServer(fn: (wsUrl: string) => Promise<void>) {
  const server = serve(buildApp(), { port: 0, handleSignals: false });
  if (!server.server.listening) await once(server.server, "listening");
  try {
    await fn(`ws://127.0.0.1:${server.port}/btc/feed`);
  } finally {
    await server.close();
  }
}

function connect(url: string, origin: string) {
  return new WebSocket(url, { headers: { origin } });
}

test("ws /btc/feed sends a tick that matches the documented send schema", async () => {
  await withServer(async (url) => {
    const ws = connect(url, "http://localhost:5173");
    const [event] = (await once(ws, "message")) as [{ data: string }];
    const msg = BtcFeedMessage.parse(JSON.parse(event.data));
    ws.close();

    assert.equal(msg.type, "tick");
    assert.equal(typeof msg.data.price, "number");
  });
});

test("ws /btc/feed closes with 1007 when a client sends a message", async () => {
  await withServer(async (url) => {
    const ws = connect(url, "http://localhost:5173");
    await once(ws, "open");
    ws.send(JSON.stringify({ type: "subscribe" }));
    const [event] = (await once(ws, "close")) as [CloseEvent];

    assert.equal(event.code, 1007);
  });
});

test("ws /btc/feed refuses upgrades from origins outside the allowlist", async () => {
  await withServer(async (url) => {
    const ws = connect(url, "https://evil.example");
    let opened = false;
    ws.addEventListener("open", () => (opened = true));
    await once(ws, "close");

    assert.equal(opened, false);
  });
});
