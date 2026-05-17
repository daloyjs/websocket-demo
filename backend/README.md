# Bitcoin Trading Demo Backend

DaloyJS REST API plus a DaloyJS-native WebSocket broadcaster for the Bitcoin Trading Demo. See the root [README](../README.md) for the full app overview.

## What It Provides

- `GET /btc/snapshot` for the current simulated Bitcoin tick.
- Wallet routes under `/wallet` for reading balances, buying BTC, selling BTC, and resetting the demo wallet.
- Order routes under `/orders` for listing orders, editing notes, and deleting order history.
- Swagger UI at `http://localhost:3000/docs`.
- OpenAPI JSON at `http://localhost:3000/openapi.json`.
- WebSocket ticks at `ws://localhost:3000/btc/feed`.

## DaloyJS Usage

This backend uses DaloyJS for contract-first routing:

- `app.route(...)` defines each route contract and handler.
- `app.group(...)` groups `/wallet` and `/orders` routes.
- `app.ws("/btc/feed", ...)` registers the live price feed on the same server and port.
- `defineWebSocket(...)` provides the WebSocket handler shape used by the broadcaster.
- Zod schemas validate request bodies, path params, and responses.
- `generateOpenAPI(app, ...)` creates OpenAPI 3.1 docs from the live route definitions.
- `app.request(...)` powers tests without opening a port.

## Commands

```bash
pnpm install
pnpm dev        # REST API and WebSocket on :3000
pnpm gen        # generated/openapi.json and generated/client
pnpm typecheck
pnpm test
pnpm build
```

## Notes

- State is in memory only and resets on restart.
- Prices are random demo values, not market data.
- The WebSocket feed uses DaloyJS `app.ws(...)` and shares the REST server port.
