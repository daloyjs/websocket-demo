# Bitcoin Trading Demo Backend

DaloyJS REST API plus a DaloyJS-native WebSocket broadcaster for the Bitcoin Trading Demo. See the root [README](../README.md) for the full app overview.

## What It Provides

- `GET /btc/snapshot` for the current simulated Bitcoin tick.
- Wallet routes under `/wallet` for reading balances, buying BTC, selling BTC, and resetting the demo wallet.
- Order routes under `/orders` for listing orders, editing notes, and deleting order history.
- Swagger UI at `http://localhost:3000/docs`.
- OpenAPI JSON at `http://localhost:3000/openapi.json`.
- WebSocket ticks at `ws://localhost:3000/btc/feed`.
- AsyncAPI 3.0 docs for the WebSocket feed at `http://localhost:3000/asyncapi` (UI), `/asyncapi.json`, and `/asyncapi.yaml`. Not mounted in production.

## DaloyJS Usage

This backend uses DaloyJS for contract-first routing:

- `app.route(...)` defines each route contract and handler.
- `app.group(...)` groups `/wallet` and `/orders` routes.
- `app.ws("/btc/feed", ...)` registers the live price feed on the same server and port.
- `defineWebSocket(...)` provides the WebSocket handler shape used by the broadcaster. Its `meta` block (summary, tags, `send: BtcFeedMessage`) and `request.body` feed the AsyncAPI document.
- `new App({ asyncapi: { ... } })` mounts the AsyncAPI UI and documents; `generateAsyncAPI(app, ...)` writes `generated/asyncapi.json` and `generated/asyncapi.yaml` for tooling.
- Zod schemas validate request bodies, path params, and responses.
- `generateOpenAPI(app, ...)` creates OpenAPI 3.1 docs from the live route definitions.
- `app.request(...)` powers tests without opening a port.

## Commands

```bash
pnpm install
pnpm dev        # REST API and WebSocket on :3000
pnpm gen        # generated/openapi.json, generated/asyncapi.{json,yaml}, generated/client
pnpm typecheck
pnpm test
pnpm build
```

## Notes

- State is in memory only and resets on restart.
- Prices are random demo values, not market data.
- The WebSocket feed uses DaloyJS `app.ws(...)` and shares the REST server port.
- The feed is server-push only. Any client message closes the socket with `1007`.
- Global middleware does not run on WebSocket upgrades, so `/btc/feed` has its own protection: an `allowedOrigins` allowlist that matches CORS (`src/origins.ts`) and `wsRateLimit` in `beforeUpgrade`.
