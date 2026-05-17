import {
  defineWebSocket,
  WS_READY_STATE,
  type WebSocketConnection,
} from "@daloyjs/core/websocket";
import { tick } from "./btc-feed.js";

export type BtcFeed = ReturnType<typeof createBtcFeed>;

export function createBtcFeed() {
  const subscribers = new Set<WebSocketConnection>();

  const handler = defineWebSocket({
    open(conn) {
      subscribers.add(conn);
      conn.send(JSON.stringify({ type: "tick", data: tick() }));
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

      const payload = JSON.stringify({ type: "tick", data: tick() });
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
