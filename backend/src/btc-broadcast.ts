import { z } from "zod";
import {
  defineWebSocket,
  wsRateLimit,
  WS_READY_STATE,
  type WebSocketConnection,
} from "@daloyjs/core/websocket";
import { BtcFeedMessage, tick } from "./btc-feed.js";
import { FRONTEND_ORIGINS } from "./origins.js";

export type BtcFeed = ReturnType<typeof createBtcFeed>;

/**
 * The feed is server-push only. Declaring `request.body` as `never` both
 * documents that in the AsyncAPI `receive` operation and enforces it: any
 * client message closes the socket with 1007 before `message()` would run.
 */
const NoClientMessages = z
  .never()
  .meta({ description: "The feed is server-push only; clients must not send messages." });

function encode(message: BtcFeedMessage): string {
  return JSON.stringify(message);
}

export function createBtcFeed() {
  const subscribers = new Set<WebSocketConnection>();

  const handler = defineWebSocket({
    meta: {
      operationId: "btcFeed",
      summary: "Live simulated BTC price feed",
      description:
        "Sends one `tick` message immediately on connect, then one per second " +
        "to every open connection. Clients only listen; any inbound message " +
        "closes the socket with 1007.",
      tags: ["BTC"],
      send: BtcFeedMessage,
    },
    request: { body: NoClientMessages },
    // Global middleware (CORS, rateLimit) never runs on the upgrade request,
    // so this channel carries its own CSWSH and rate-limit protection.
    allowedOrigins: FRONTEND_ORIGINS,
    beforeUpgrade: wsRateLimit({ windowMs: 60_000, max: 30 }),
    maxPayloadLength: 1024,
    acknowledgeHeaderMutatingMiddleware: true,
    open(conn) {
      subscribers.add(conn);
      conn.send(encode({ type: "tick", data: tick() }));
    },
    close(conn) {
      subscribers.delete(conn);
    },
    error(conn) {
      subscribers.delete(conn);
    },
  });

  return {
    handler,
    broadcast() {
      if (subscribers.size === 0) return;

      const payload = encode({ type: "tick", data: tick() });
      for (const conn of subscribers) {
        if (conn.readyState === WS_READY_STATE.OPEN) {
          conn.send(payload);
        } else {
          subscribers.delete(conn);
        }
      }
    },
    subscriberCount() {
      return subscribers.size;
    },
  };
}
