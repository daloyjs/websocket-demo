# Bitcoin Trading Demo

A full-stack demo app that shows how to combine a contract-first DaloyJS API, DaloyJS-native WebSocket updates, and a React/Vite SPA.

The app is intentionally in-memory and uses random-walk Bitcoin pricing. There is no database and no external market API. It is built to demonstrate full-stack mechanics: typed REST routes, request/response validation, OpenAPI generation, DaloyJS `app.ws(...)` WebSocket updates, and a frontend that exercises `GET`, `POST`, `PUT`, and `DELETE` requests.

## What The App Is For

This project is a teaching and demo app for:

- Showing a live Bitcoin price that changes every second over WebSocket.
- Displaying a dashboard-style Bitcoin chart and market stats.
- Demonstrating a simple trading wallet with fake USD and BTC balances.
- Exercising REST endpoints from the UI: fetch balances, buy BTC, sell BTC, edit order notes, delete order history, and reset the wallet.
- Generating OpenAPI docs from DaloyJS route definitions.
- Running a live WebSocket feed from the same DaloyJS `App` as the REST API.
- Running backend tests against the app without starting a network listener.

## What The App Does

The frontend renders a Bitcoin trading dashboard with:

- A live Bitcoin price header.
- A shadcn chart powered by Recharts v3 and fed by WebSocket ticks.
- Market stats such as 1H high, 1H low, 24H volume, ATH, market cap, and sats per USD.
- Range toggles for changing how much recent chart history is visible.
- A wallet panel showing fake USD, BTC, and portfolio value.
- Buy and sell forms that call REST endpoints.
- An order history table where notes can be edited and orders can be deleted.

The backend provides:

- A DaloyJS REST API on `http://localhost:3000`.
- Swagger UI on `http://localhost:3000/docs`.
- OpenAPI JSON on `http://localhost:3000/openapi.json`.
- A WebSocket endpoint on `ws://localhost:3000/btc/feed` that broadcasts one price tick per second.
- In-memory wallet and order state that resets when the server restarts or when `POST /wallet/reset` is called.

## What Is DaloyJS?

[DaloyJS](https://daloyjs.dev/) is a TypeScript web framework for building runtime-portable, contract-first REST APIs. Routes define the contract in one place: HTTP method, path, request schemas, response schemas, OpenAPI metadata, and handler logic.

In this app, DaloyJS is used for:

- Route registration with `app.route(...)`.
- Route grouping with `app.group(...)` for `/wallet` and `/orders`.
- Zod request validation for JSON bodies and path parameters.
- Zod response schemas for typed route outputs.
- OpenAPI 3.1 generation from live route definitions.
- Swagger UI docs.
- WebSocket route registration with `app.ws(...)` and `defineWebSocket(...)`.
- Secure defaults such as request IDs, security headers, CORS, and rate limiting.
- In-process tests through `app.request(...)`, so route tests do not need a running server.

## Architecture

```text
bitcoin-trading/
  backend/   DaloyJS API, OpenAPI generation, WebSocket broadcaster, tests
  frontend/  React + Vite + shadcn UI, Recharts v3 chart, live dashboard, wallet UI
```

The backend has two real-time surfaces:

- REST via DaloyJS: contract-first API endpoints for snapshots, wallet, orders, docs, and health.
- WebSocket via DaloyJS: the same `App` exposes `ws://localhost:3000/btc/feed` using DaloyJS's built-in WebSocket primitives (`app.ws(...)` + `defineWebSocket`), so the REST API and the live tick feed share one port and one process.

DaloyJS handles both surfaces in one app: routes are declared with `app.route(...)` / `app.group(...)`, and the WebSocket handler is registered with `app.ws("/btc/feed", ...)`. The live feed is created with `createBtcFeed()` so each app instance owns its own subscriber set; the server entrypoint passes that feed into `buildApp({ btcFeed })` and drives broadcasts with a one-second interval.

## API Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/healthz` | Health check |
| `GET` | `/btc/snapshot` | Current simulated Bitcoin tick |
| `GET` | `/wallet/` | Current fake USD/BTC wallet and portfolio value |
| `POST` | `/wallet/buy` | Buy BTC with USD. Body: `{ "usd": 100 }` |
| `POST` | `/wallet/sell` | Sell BTC for USD. Body: `{ "btc": 0.01 }` |
| `POST` | `/wallet/reset` | Reset wallet balances and clear orders |
| `GET` | `/orders/` | List executed orders, newest first |
| `PUT` | `/orders/:id` | Update an order note. Body: `{ "note": "text" }` |
| `DELETE` | `/orders/:id` | Delete an order from the demo order history |
| `GET` | `/openapi.json` | Generated OpenAPI 3.1 document |
| `GET` | `/docs` | Swagger UI |

### WebSocket Payload

Connect to `ws://localhost:3000/btc/feed`. Each tick looks like:

```json
{
  "type": "tick",
  "data": {
    "price": 78414.31,
    "changeAbs": -16.84,
    "changePct": -0.02,
    "high1h": 78435.63,
    "low1h": 78270.81,
    "vol24hBtc": 153418,
    "vol24hUsdB": 12.02,
    "ath": 126277.05,
    "marketCapT": 1.55,
    "satsPerUsd": 1275,
    "ts": 1779030000000
  }
}
```

Values are simulated and intentionally random.

## Getting Started

Install dependencies in both packages:

```bash
cd backend
pnpm install

cd ../frontend
pnpm install
```

Run the backend:

```bash
cd backend
pnpm dev
```

Run the frontend in another terminal:

```bash
cd frontend
pnpm dev
```

Open the Vite URL, usually `http://localhost:5173`.

## Useful Commands

Backend:

```bash
cd backend
pnpm gen        # write generated/openapi.json and generated/client
pnpm typecheck  # TypeScript check
pnpm test       # Node test runner
pnpm build      # compile to dist
pnpm dev        # DaloyJS REST API + WebSocket broadcaster
```

Frontend:

```bash
cd frontend
pnpm typecheck
pnpm lint
pnpm build
pnpm dev
```

Full verification used for this project:

```bash
cd backend && pnpm gen && pnpm typecheck && pnpm test && pnpm build
cd ../frontend && pnpm typecheck && pnpm lint && pnpm build
```

## Tests

The backend tests live in `backend/tests/` and cover:

- `GET /btc/snapshot` and method rejection.
- OpenAPI route documentation for the trading endpoints.
- Wallet balance reads.
- Buy and sell happy paths.
- Oversized buy/sell failures with `400`.
- Zod validation failures with `422`.
- Order note updates through `PUT /orders/:id`.
- Order deletion through `DELETE /orders/:id`.
- Wallet reset clearing balances and order history.

The frontend currently uses TypeScript, ESLint, and production build checks. It does not yet include a browser test runner such as Playwright or Vitest.

## Environment Variables

Backend:

- `PORT` - REST API and WebSocket port. Default: `3000`.

Frontend:

- `VITE_BTC_API_URL` - REST API base URL. Default: `http://localhost:3000`.
- `VITE_BTC_WS_URL` - WebSocket URL. Default: `ws://localhost:3000/btc/feed`.

## Demo Notes

- This app does not use a database.
- Balances and orders are stored in memory only.
- Prices are random and not financial data.
- Buying and selling are fake operations intended to show REST mutations.
- OpenAPI output is generated from DaloyJS route definitions, so the docs follow the implemented API contract.
