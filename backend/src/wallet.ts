/**
 * In-memory wallet state for the demo. No persistence; resets on restart.
 * Pure functions guard the invariants; all errors bubble up as typed
 * `@daloyjs/core` errors at the route layer.
 */

import { z } from "zod";
import { BadRequestError, NotFoundError } from "@daloyjs/core";
import { tick } from "./btc-feed.js";

export const Wallet = z
  .object({
    usd: z.number(),
    btc: z.number(),
    portfolioUsd: z.number(),
    markPrice: z.number(),
  })
  .strict();
export type Wallet = z.infer<typeof Wallet>;

export const Order = z
  .object({
    id: z.string(),
    side: z.enum(["BUY", "SELL"]),
    btc: z.number(),
    usd: z.number(),
    price: z.number(),
    note: z.string(),
    ts: z.number(),
  })
  .strict();
export type Order = z.infer<typeof Order>;

const STARTING_USD = 50_000;
const STARTING_BTC = 0.25;

interface State {
  usd: number;
  btc: number;
  orders: Order[];
}

let state: State = freshState();

function freshState(): State {
  return { usd: STARTING_USD, btc: STARTING_BTC, orders: [] };
}

function snapshot(markPrice = tick().price): Wallet {
  return {
    usd: round(state.usd, 2),
    btc: round(state.btc, 8),
    markPrice,
    portfolioUsd: round(state.usd + state.btc * markPrice, 2),
  };
}

export function getWallet(): Wallet {
  return snapshot();
}

export function buy(usd: number): { wallet: Wallet; order: Order } {
  if (usd <= 0) throw new BadRequestError("Amount must be positive");
  if (usd > state.usd) {
    throw new BadRequestError(
      `Insufficient USD: have ${state.usd.toFixed(2)}, need ${usd.toFixed(2)}`,
    );
  }
  const price = tick().price;
  const btc = usd / price;
  state.usd = round(state.usd - usd, 2);
  state.btc = round(state.btc + btc, 8);
  const order = recordOrder("BUY", btc, usd, price);
  return { wallet: snapshot(price), order };
}

export function sell(btc: number): { wallet: Wallet; order: Order } {
  if (btc <= 0) throw new BadRequestError("Amount must be positive");
  if (btc > state.btc) {
    throw new BadRequestError(
      `Insufficient BTC: have ${state.btc.toFixed(8)}, need ${btc.toFixed(8)}`,
    );
  }
  const price = tick().price;
  const usd = btc * price;
  state.btc = round(state.btc - btc, 8);
  state.usd = round(state.usd + usd, 2);
  const order = recordOrder("SELL", btc, usd, price);
  return { wallet: snapshot(price), order };
}

export function listOrders(): Order[] {
  return [...state.orders].sort((a, b) => b.ts - a.ts);
}

export function updateOrderNote(id: string, note: string): Order {
  const found = state.orders.find((o) => o.id === id);
  if (!found) throw new NotFoundError(`Order ${id} not found`);
  found.note = note;
  return found;
}

export function deleteOrder(id: string): void {
  const before = state.orders.length;
  state.orders = state.orders.filter((o) => o.id !== id);
  if (state.orders.length === before) {
    throw new NotFoundError(`Order ${id} not found`);
  }
}

export function resetWallet(): Wallet {
  state = freshState();
  return snapshot();
}

function recordOrder(
  side: Order["side"],
  btc: number,
  usd: number,
  price: number,
): Order {
  const order: Order = {
    id: crypto.randomUUID(),
    side,
    btc: round(btc, 8),
    usd: round(usd, 2),
    price: round(price, 2),
    note: "",
    ts: Date.now(),
  };
  state.orders.push(order);
  return order;
}

function round(n: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
