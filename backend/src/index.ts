import { serve } from "@daloyjs/core/node";
import { buildApp } from "./build-app.js";
import { createBtcFeed } from "./btc-broadcast.js";

const btcFeed = createBtcFeed();
const app = buildApp({ btcFeed });
const port = Number(process.env.PORT ?? 3000);

const server = serve(app, { port, handleSignals: false });
console.log(`DaloyJS listening on http://localhost:${port}`);
// daloy-minimal:strip-start docs
console.log(`  Swagger UI:   http://localhost:${port}/docs`);
console.log(`  OpenAPI JSON: http://localhost:${port}/openapi.json`);
// daloy-minimal:strip-end docs
console.log(`  Health:       http://localhost:${port}/healthz`);
console.log(`  BTC Snapshot: http://localhost:${port}/btc/snapshot`);
console.log(`  BTC WS:       ws://localhost:${port}/btc/feed`);

const interval = setInterval(() => btcFeed.broadcast(), 1000);

let shuttingDown = false;

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(interval);
  await server.close();
}

process.once("SIGINT", () => {
  void shutdown();
});
process.once("SIGTERM", () => {
  void shutdown();
});

export default app;
