import * as React from "react"

import { BtcChart } from "@/components/btc-chart"
import { Button } from "@/components/ui/button"
import { WalletPanel } from "@/components/wallet-panel"
import { fmt, useBtcFeed } from "@/lib/btc"
import { cn } from "@/lib/utils"

const RANGES = ["1H", "1D", "7D", "1M", "YTD", "1Y", "5Y", "ALL"] as const
type Range = (typeof RANGES)[number]
const RANGE_POINTS: Record<Range, number> = {
  "1H": 300,
  "1D": 260,
  "7D": 220,
  "1M": 180,
  YTD: 150,
  "1Y": 120,
  "5Y": 90,
  ALL: 60,
}

export function App() {
  const [range, setRange] = React.useState<Range>("1H")
  const { latest, history, status } = useBtcFeed(900)
  const visibleHistory = React.useMemo(
    () => history.slice(-RANGE_POINTS[range]),
    [history, range],
  )

  const isDown = (latest?.changeAbs ?? 0) < 0
  const changeColor = isDown ? "text-rose-400" : "text-emerald-400"

  return (
    <div className="min-h-svh bg-[#080808] text-zinc-100">
      {/* ── Header ── */}
      <header className="flex items-center justify-between border-b border-zinc-900 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <BitcoinLogo />
          <span className="font-heading text-sm font-semibold tracking-widest text-zinc-200 uppercase">
            Bitcoin
          </span>
          <span className="hidden h-4 w-px bg-zinc-800 sm:block" aria-hidden />
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                status === "open"
                  ? "bg-emerald-500"
                  : status === "connecting"
                    ? "animate-pulse bg-amber-500"
                    : "bg-rose-500",
              )}
              aria-label={`WebSocket status: ${status}`}
            />
            <span className="font-heading text-[10px] tracking-widest text-zinc-500 uppercase">
              {status === "open"
                ? "Live"
                : status === "connecting"
                  ? "Connecting"
                  : "Offline"}
            </span>
          </div>
        </div>
        <span className="font-heading text-[11px] tracking-[0.2em] text-zinc-600 uppercase">
          BTC / USD
        </span>
      </header>

      <div className="mx-auto max-w-screen-2xl">
        {/* ── Price Hero ── */}
        <section className="border-b border-zinc-900 px-4 py-6 sm:px-6 sm:py-7">
          <div className="flex flex-wrap items-end justify-between gap-6">
            {/* Big price */}
            <div>
              <p className="mb-2 font-heading text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
                Bitcoin Live Price
              </p>
              <div className="flex items-baseline gap-4">
                <h1 className="font-heading text-4xl font-semibold leading-none text-zinc-50 tabular-nums sm:text-5xl lg:text-6xl">
                  {latest ? `$${fmt.usd(latest.price)}` : "—"}
                </h1>
                {latest && (
                  <div className={cn("flex flex-col gap-0.5", changeColor)}>
                    <span className="font-heading text-base font-medium leading-none tabular-nums sm:text-lg">
                      {fmt.signed(latest.changeAbs)}
                    </span>
                    <span className="font-heading text-xs leading-none tabular-nums">
                      {fmt.pct(latest.changePct)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-x-6 gap-y-4 sm:grid-cols-6">
              <MiniStat
                label="1H High"
                value={latest ? fmt.usd(latest.high1h) : "—"}
              />
              <MiniStat
                label="1H Low"
                value={latest ? fmt.usd(latest.low1h) : "—"}
              />
              <MiniStat
                label="Vol (BTC)"
                value={latest ? fmt.int(latest.vol24hBtc) : "—"}
              />
              <MiniStat
                label="Vol (USD)"
                value={latest ? `${latest.vol24hUsdB.toFixed(1)}B` : "—"}
              />
              <MiniStat
                label="Market Cap"
                value={latest ? `${latest.marketCapT.toFixed(1)}T` : "—"}
              />
              <MiniStat
                label="Sats / $"
                value={latest ? fmt.int(latest.satsPerUsd) : "—"}
              />
            </div>
          </div>
        </section>

        {/* ── Chart ── */}
        <section className="border-b border-zinc-900 px-4 py-4 sm:px-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div
              className="flex flex-wrap items-center gap-1"
              role="tablist"
              aria-label="Chart range"
            >
              {RANGES.map((r) => (
                <Button
                  key={r}
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setRange(r)}
                  role="tab"
                  aria-selected={r === range}
                  className={cn(
                    "h-7 rounded-sm px-2.5 font-heading text-[11px] tracking-wide sm:px-3",
                    r === range
                      ? "bg-[#f7931a]/10 text-[#f7931a] ring-1 ring-[#f7931a]/30 hover:bg-[#f7931a]/15 hover:text-[#f7931a]"
                      : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300",
                  )}
                >
                  {r}
                </Button>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-7 rounded-sm px-3 font-heading text-[11px] tracking-wide text-zinc-600 hover:bg-zinc-900 hover:text-zinc-300"
            >
              LOG
            </Button>
          </div>

          <div className="h-72 overflow-hidden rounded-lg border border-zinc-900 bg-[#0a0a0a] sm:h-96 lg:h-[420px]">
            <BtcChart history={visibleHistory} />
          </div>
        </section>

        <WalletPanel markPrice={latest?.price ?? null} />
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-heading text-[9px] tracking-[0.18em] text-zinc-600 uppercase">
        {label}
      </span>
      <span className="font-heading text-sm font-medium tabular-nums text-zinc-300">
        {value}
      </span>
    </div>
  )
}

function BitcoinLogo() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bitcoin"
      role="img"
    >
      <circle cx="12" cy="12" r="12" fill="#f7931a" />
      <path
        d="M15.8 10.7c.22-1.46-.89-2.25-2.41-2.77l.49-1.98-1.2-.3-.48 1.93c-.32-.08-.64-.16-.96-.23l.48-1.94-1.2-.3-.49 1.98c-.26-.06-.52-.12-.77-.18v-.01l-1.66-.41-.32 1.29s.89.2.87.22c.49.12.58.44.56.7l-.56 2.25c.03.01.08.02.13.04l-.13-.03-.79 3.16c-.06.15-.21.37-.55.29.02.02-.87-.22-.87-.22l-.6 1.38 1.57.39c.29.07.58.15.86.22l-.5 2 1.2.3.49-1.98c.33.09.65.17.96.25l-.49 1.97 1.2.3.5-2c2.05.39 3.59.23 4.24-1.62.52-1.49-.03-2.35-1.11-2.91.79-.18 1.38-.7 1.54-1.78Zm-2.75 3.84c-.37 1.49-2.87.69-3.68.49l.66-2.65c.81.2 3.41.6 3.02 2.16Zm.37-3.86c-.34 1.36-2.42.67-3.1.5l.6-2.4c.68.17 2.85.49 2.5 1.9Z"
        fill="#ffffff"
      />
    </svg>
  )
}

export default App

