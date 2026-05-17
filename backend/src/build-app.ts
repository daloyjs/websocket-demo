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
// daloy-minimal:strip-start docs
import { generateOpenAPI } from "@daloyjs/core/openapi";
import { htmlResponse, swaggerUiHtml } from "@daloyjs/core/docs";
// daloy-minimal:strip-end docs

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

type WebSocketApp = App & {
  ws(path: "/btc/feed", handler: BtcFeed["handler"]): App;
};

export function buildApp(options: BuildAppOptions = {}): App {
  const btcFeed = options.btcFeed ?? createBtcFeed();
  const app = new App({
    bodyLimitBytes: 1024 * 1024,
    requestTimeoutMs: 5_000,
    production: process.env.NODE_ENV === "production",
  }) as WebSocketApp;

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

  app.route({
    method: "GET",
    path: "/healthz",
    operationId: "healthz",
    tags: ["Ops"],
    responses: {
      200: {
        description: "Service is healthy",
        body: z.object({ ok: z.literal(true), uptime: z.number() }),
      },
    },
    handler: async () => ({
      status: 200,
      body: { ok: true as const, uptime: process.uptime() },
    }),
  });

  app.route({
    method: "GET",
    path: "/btc/snapshot",
    operationId: "getBtcSnapshot",
    tags: ["BTC"],
    responses: {
      200: {
        description: "Current simulated Bitcoin price snapshot",
        body: PriceTick,
      },
    },
    handler: async () => ({
      status: 200 as const,
      body: tick(),
    }),
  });

  // Live price feed over WebSocket on the same port as the REST API.
  // Connect with: ws://localhost:3000/btc/feed
  app.ws("/btc/feed", btcFeed.handler);

  app.group("/wallet", { tags: ["Wallet"] }, (wallet) => {
    wallet.route({
      method: "GET",
      path: "/",
      operationId: "getWallet",
      responses: {
        200: {
          description: "Current wallet balances and mark price",
          body: Wallet,
        },
      },
      handler: async () => ({ status: 200 as const, body: getWallet() }),
    });

    wallet.route({
      method: "POST",
      path: "/buy",
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
      handler: async ({ body }) => ({
        status: 201 as const,
        body: buy(body.usd),
      }),
    });

    wallet.route({
      method: "POST",
      path: "/sell",
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
      handler: async ({ body }) => ({
        status: 201 as const,
        body: sell(body.btc),
      }),
    });

    wallet.route({
      method: "POST",
      path: "/reset",
      operationId: "resetWallet",
      summary: "Reset balances and clear order history",
      responses: {
        200: { description: "Wallet reset", body: Wallet },
      },
      handler: async () => ({ status: 200 as const, body: resetWallet() }),
    });
  });

  app.group("/orders", { tags: ["Orders"] }, (orders) => {
    orders.route({
      method: "GET",
      path: "/",
      operationId: "listOrders",
      responses: {
        200: {
          description: "All executed orders, newest first",
          body: z.array(Order),
        },
      },
      handler: async () => ({ status: 200 as const, body: listOrders() }),
    });

    orders.route({
      method: "PUT",
      path: "/:id",
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
      handler: async ({ params, body }) => ({
        status: 200 as const,
        body: updateOrderNote(params.id, body.note),
      }),
    });

    orders.route({
      method: "DELETE",
      path: "/:id",
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
      handler: async ({ params }) => {
        deleteOrder(params.id);
        return { status: 200 as const, body: { ok: true as const } };
      },
    });
  });

  // daloy-minimal:strip-start docs
  // --- API documentation ---------------------------------------------------
  // `/openapi.json` returns the live OpenAPI 3.1 spec generated from the
  // routes defined above. `/docs` serves a Swagger UI page that loads it.

  app.route({
    method: "GET",
    path: "/openapi.json",
    operationId: "getOpenAPI",
    tags: ["Docs"],
    responses: { 200: { description: "OpenAPI 3.1 document" } },
    handler: async () => ({
      status: 200 as const,
      body: generateOpenAPI(app, {
        info: { title: "Bitcoin Trading Demo API", version: "0.0.1" },
        servers: [{ url: `http://localhost:${process.env.PORT ?? 3000}` }],
      }),
    }),
  });

  app.route({
    method: "GET",
    path: "/docs",
    operationId: "docs",
    tags: ["Docs"],
    responses: { 200: { description: "API reference UI" } },
    handler: async () => {
      const html = swaggerUiHtml({
        specUrl: "/openapi.json",
        title: "Bitcoin Trading Demo API",
      });
      const res = htmlResponse(html);
      return {
        status: 200 as const,
        body: html,
        headers: Object.fromEntries(res.headers),
      };
    },
  });
  // daloy-minimal:strip-end docs

  return app;
}

export default buildApp;
