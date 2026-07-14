import { z } from "zod";
import {
  App,
  cors,
  rateLimit,
  requestId,
  secureHeaders,
} from "@daloyjs/core";
import { PriceTick, tick } from "./btc-feed.js";
import { createBtcFeed, type BtcFeed } from "./btc-broadcast.js";
import {
  Order,
  Wallet,
  buy,
  deleteOrder,
  getWallet,
  listOrders,
  resetWallet,
  sell,
  updateOrderNote,
} from "./wallet.js";

/**
 * Build the application as a pure factory.
 *
 * Keeping construction separate from `serve(app, ...)` lets tooling
 * (`scripts/dump-openapi.ts`, contract tests, in-process tests via
 * `app.request(...)`) import and reuse the app without booting an
 * HTTP listener as a side effect.
 */
type BuildAppOptions = {
  btcFeed?: BtcFeed;
};

export function buildApp(options: BuildAppOptions = {}): App {
  const btcFeed = options.btcFeed ?? createBtcFeed();
  const app = new App({
    bodyLimitBytes: 1024 * 1024,
    requestTimeoutMs: 5_000,
    production: process.env.NODE_ENV === "production",
    // daloy-minimal:strip-start docs
    // One-line API docs: mounts GET /docs (Swagger UI), GET /openapi.json,
    // and GET /openapi.yaml straight from the live route contracts.
    openapi: {
      info: { title: "Bitcoin Trading Demo API", version: "0.0.1" },
      servers: [{ url: `http://localhost:${process.env.PORT ?? 3000}` }],
    },
    docs: { ui: "swagger", title: "Bitcoin Trading Demo API" },
    // daloy-minimal:strip-end docs
  });

  app.use(requestId());
  app.use(secureHeaders());
  app.use(
    cors({
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["content-type"],
    }),
  );
  app.use(rateLimit({ windowMs: 60_000, max: 120 }));

  app.get(
    "/healthz",
    {
      operationId: "healthz",
      tags: ["Ops"],
      responses: {
        200: {
          description: "Service is healthy",
          body: z.object({ ok: z.literal(true), uptime: z.number() }),
        },
      },
    },
    async () => ({
      status: 200 as const,
      body: { ok: true as const, uptime: process.uptime() },
    }),
  );

  app.get(
    "/btc/snapshot",
    {
      operationId: "getBtcSnapshot",
      tags: ["BTC"],
      responses: {
        200: {
          description: "Current simulated Bitcoin price snapshot",
          body: PriceTick,
        },
      },
    },
    async () => ({
      status: 200 as const,
      body: tick(),
    }),
  );

  // Live price feed over WebSocket on the same port as the REST API.
  // Connect with: ws://localhost:3000/btc/feed
  app.ws("/btc/feed", btcFeed.handler);

  app.group("/wallet", { tags: ["Wallet"] }, (wallet) => {
    wallet.get(
      "/",
      {
        operationId: "getWallet",
        responses: {
          200: {
            description: "Current wallet balances and mark price",
            body: Wallet,
          },
        },
      },
      async () => ({ status: 200 as const, body: getWallet() }),
    );

    wallet.post(
      "/buy",
      {
        operationId: "buyBtc",
        summary: "Buy BTC with USD at the current mark price",
        request: {
          body: z.object({ usd: z.number().positive() }).strict(),
        },
        responses: {
          201: {
            description: "Buy order executed",
            body: z.object({ wallet: Wallet, order: Order }).strict(),
          },
          400: { description: "Insufficient funds or invalid amount" },
        },
      },
      async ({ body }) => ({
        status: 201 as const,
        body: buy(body.usd),
      }),
    );

    wallet.post(
      "/sell",
      {
        operationId: "sellBtc",
        summary: "Sell BTC for USD at the current mark price",
        request: {
          body: z.object({ btc: z.number().positive() }).strict(),
        },
        responses: {
          201: {
            description: "Sell order executed",
            body: z.object({ wallet: Wallet, order: Order }).strict(),
          },
          400: { description: "Insufficient BTC or invalid amount" },
        },
      },
      async ({ body }) => ({
        status: 201 as const,
        body: sell(body.btc),
      }),
    );

    wallet.post(
      "/reset",
      {
        operationId: "resetWallet",
        summary: "Reset balances and clear order history",
        responses: {
          200: { description: "Wallet reset", body: Wallet },
        },
      },
      async () => ({ status: 200 as const, body: resetWallet() }),
    );
  });

  app.group("/orders", { tags: ["Orders"] }, (orders) => {
    orders.get(
      "/",
      {
        operationId: "listOrders",
        responses: {
          200: {
            description: "All executed orders, newest first",
            body: z.array(Order),
          },
        },
      },
      async () => ({ status: 200 as const, body: listOrders() }),
    );

    orders.put(
      "/:id",
      {
        operationId: "updateOrderNote",
        summary: "Edit the note attached to an order",
        request: {
          params: z.object({ id: z.string().min(1) }),
          body: z.object({ note: z.string().max(200) }).strict(),
        },
        responses: {
          200: { description: "Updated order", body: Order },
          404: { description: "Order not found" },
        },
      },
      async ({ params, body }) => ({
        status: 200 as const,
        body: updateOrderNote(params.id, body.note),
      }),
    );

    orders.delete(
      "/:id",
      {
        operationId: "deleteOrder",
        summary: "Remove an order from history",
        request: {
          params: z.object({ id: z.string().min(1) }),
        },
        responses: {
          200: {
            description: "Deleted",
            body: z.object({ ok: z.literal(true) }),
          },
          404: { description: "Order not found" },
        },
      },
      async ({ params }) => {
        deleteOrder(params.id);
        return { status: 200 as const, body: { ok: true as const } };
      },
    );
  });

  return app;
}

export default buildApp;
