# Bitcoin Trading Demo Frontend

React + Vite SPA for the Bitcoin Trading Demo. See the root [README](../README.md) for the full app overview.

## What It Shows

- A dark Bitcoin market dashboard.
- Live Bitcoin price and shadcn/Recharts v3 chart updates from `ws://localhost:3000/btc/feed`.
- Fake wallet balances from the DaloyJS REST API.
- Buy and sell forms that call `POST /wallet/buy` and `POST /wallet/sell`.
- Order history loaded with `GET /orders/`.
- Inline note editing with `PUT /orders/:id`.
- Order deletion with `DELETE /orders/:id`.
- Reset action with `POST /wallet/reset`.

## Commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
```

## Environment Variables

- `VITE_BTC_API_URL` - REST API base URL. Default: `http://localhost:3000`.
- `VITE_BTC_WS_URL` - WebSocket URL. Default: `ws://localhost:3000/btc/feed`.

## Notes

- The UI uses local shadcn-style components, the shadcn chart wrapper, Recharts v3, and Tailwind CSS.
- The wallet is demo-only and uses fake in-memory backend state.
- Prices are random and not financial data.
