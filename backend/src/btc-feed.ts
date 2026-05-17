import { z } from "zod";

export const PriceTick = z
  .object({
    price: z.number(),
    changeAbs: z.number(),
    changePct: z.number(),
    high1h: z.number(),
    low1h: z.number(),
    vol24hBtc: z.number(),
    vol24hUsdB: z.number(),
    ath: z.number(),
    marketCapT: z.number(),
    satsPerUsd: z.number(),
    ts: z.number(),
  })
  .strict();

export type PriceTick = z.infer<typeof PriceTick>;

interface InternalState {
  open: number;
  price: number;
  high1h: number;
  low1h: number;
}

const BASE_PRICE = 78_400;
const ATH = 126_277.05;

function makeInternal(): InternalState {
  const open = BASE_PRICE + (Math.random() - 0.5) * 40;
  return { open, price: open, high1h: open, low1h: open };
}

let internal: InternalState = makeInternal();

export function tick(): PriceTick {
  // Random walk with a tiny mean-reverting pull toward the 1h open.
  const drift = (internal.open - internal.price) * 0.002;
  const step = (Math.random() - 0.5) * internal.price * 0.0012 + drift;
  const next = Math.max(1, internal.price + step);

  internal.price = next;
  if (next > internal.high1h) internal.high1h = next;
  if (next < internal.low1h) internal.low1h = next;

  const changeAbs = next - internal.open;
  const changePct = (changeAbs / internal.open) * 100;
  const vol24hBtc = 150_000 + Math.random() * 8_000;
  const vol24hUsdB = (vol24hBtc * next) / 1_000_000_000;

  return {
    price: round(next, 2),
    changeAbs: round(changeAbs, 2),
    changePct: round(changePct, 2),
    high1h: round(internal.high1h, 2),
    low1h: round(internal.low1h, 2),
    vol24hBtc: round(vol24hBtc, 0),
    vol24hUsdB: round(vol24hUsdB, 2),
    ath: ATH,
    marketCapT: round((next * 19_800_000) / 1_000_000_000_000, 2),
    satsPerUsd: Math.round(100_000_000 / next),
    ts: Date.now(),
  };
}

function round(n: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
