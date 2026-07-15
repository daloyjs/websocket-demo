import * as React from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  ChartLineUp,
  Pulse,
} from "@phosphor-icons/react"

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
    [history, range]
  )

  const isDown = (latest?.changeAbs ?? 0) < 0
  const ChangeIcon = isDown ? ArrowDownRight : ArrowUpRight

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#090909] text-[#f5f4f1]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_at_top_left,rgba(247,147,26,0.12),transparent_48%)]" />
      <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-[#f7931a]/[0.04] blur-3xl" />

      <header className="relative z-10 border-b border-white/[0.07] bg-[#090909]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-[1480px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3.5">
            <BitcoinLogo />
            <div>
              <p className="text-sm font-semibold tracking-tight text-white">
                Satoshi Desk
              </p>
              <p className="text-[10px] font-medium tracking-[0.18em] text-zinc-600 uppercase">
                Market terminal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 sm:flex">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  status === "open"
                    ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
                    : status === "connecting"
                      ? "animate-pulse bg-amber-400"
                      : "bg-rose-400"
                )}
              />
              <span className="font-heading text-[10px] tracking-[0.12em] text-zinc-400 uppercase">
                {status === "open"
                  ? "Live market"
                  : status === "connecting"
                    ? "Connecting"
                    : "Offline"}
              </span>
            </div>
            <div className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3.5 py-1.5 font-heading text-[10px] tracking-[0.14em] text-zinc-400">
              BTC <span className="px-1 text-zinc-700">/</span> USD
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1480px] px-5 py-6 sm:px-8 sm:py-9">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-[#f7931a]/15 bg-[linear-gradient(135deg,rgba(247,147,26,0.12),rgba(255,255,255,0.025)_44%,rgba(255,255,255,0.015))] p-5 shadow-2xl shadow-black/30 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full border border-[#f7931a]/10" />
          <div className="pointer-events-none absolute -top-10 -right-2 size-40 rounded-full border border-[#f7931a]/10" />

          <div className="relative flex flex-col gap-9 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="mb-4 flex items-center gap-2 text-zinc-400">
                <Pulse className="size-4 text-[#f7931a]" weight="bold" />
                <p className="font-heading text-[10px] font-medium tracking-[0.18em] uppercase">
                  Bitcoin live price
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-4 sm:gap-5">
                <h1 className="text-[clamp(2.8rem,7vw,5.75rem)] leading-[0.88] font-semibold tracking-[-0.065em] text-white tabular-nums">
                  {latest ? `$${fmt.usd(latest.price)}` : "—"}
                </h1>
                {latest && (
                  <div
                    className={cn(
                      "mb-1.5 flex items-center gap-2 rounded-full border px-3 py-1.5 sm:mb-2",
                      isDown
                        ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
                        : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                    )}
                  >
                    <ChangeIcon className="size-4" weight="bold" />
                    <span className="font-heading text-xs font-semibold tabular-nums">
                      {fmt.signed(latest.changeAbs)} ·{" "}
                      {fmt.pct(latest.changePct)}
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-500">
                Real-time Bitcoin market data, portfolio tracking, and simulated
                execution in one focused workspace.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:w-[42rem]">
              <MiniStat
                label="1H High"
                value={latest ? fmt.usd(latest.high1h) : "—"}
              />
              <MiniStat
                label="1H Low"
                value={latest ? fmt.usd(latest.low1h) : "—"}
              />
              <MiniStat
                label="Volume BTC"
                value={latest ? fmt.int(latest.vol24hBtc) : "—"}
              />
              <MiniStat
                label="Volume USD"
                value={latest ? `${latest.vol24hUsdB.toFixed(1)}B` : "—"}
              />
              <MiniStat
                label="Market cap"
                value={latest ? `${latest.marketCapT.toFixed(1)}T` : "—"}
              />
              <MiniStat
                label="Sats / USD"
                value={latest ? fmt.int(latest.satsPerUsd) : "—"}
              />
            </div>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[1.75rem] border border-white/[0.075] bg-[#111110]/90 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#f7931a]/10 text-[#f7931a]">
                <ChartLineUp className="size-5" weight="bold" />
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-zinc-100">
                  Price performance
                </h2>
                <p className="text-xs text-zinc-600">Live market movement</p>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <div
                className="flex rounded-xl border border-white/[0.06] bg-black/20 p-1"
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
                      "h-7 rounded-lg px-2.5 font-heading text-[10px] tracking-wide sm:px-3",
                      r === range
                        ? "bg-[#f7931a] text-[#17100a] shadow-sm hover:bg-[#f7a136] hover:text-[#17100a]"
                        : "text-zinc-600 hover:bg-white/[0.05] hover:text-zinc-300"
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
                className="h-9 rounded-xl border border-white/[0.06] px-3 font-heading text-[10px] tracking-wide text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300"
              >
                LOG
              </Button>
            </div>
          </div>

          <div className="h-80 px-1 pt-4 pb-2 sm:h-[28rem] sm:px-4 sm:pt-6">
            <BtcChart history={visibleHistory} />
          </div>
        </section>

        <WalletPanel markPrice={latest?.price ?? null} />

        <footer className="flex flex-col gap-2 border-t border-white/[0.06] py-7 text-xs text-zinc-700 sm:flex-row sm:items-center sm:justify-between">
          <span>Simulated trading environment</span>
          <span className="font-heading text-[10px] tracking-[0.14em] uppercase">
            Market data · WebSocket stream
          </span>
        </footer>
      </main>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 px-3.5 py-3 backdrop-blur-sm sm:px-4">
      <span className="font-heading text-[9px] tracking-[0.14em] text-zinc-600 uppercase">
        {label}
      </span>
      <span className="mt-1.5 block font-heading text-sm font-medium text-zinc-200 tabular-nums">
        {value}
      </span>
    </div>
  )
}

function BitcoinLogo() {
  return (
    <div className="flex size-10 items-center justify-center rounded-2xl bg-[#f7931a] shadow-[0_8px_30px_rgba(247,147,26,0.2)]">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Bitcoin"
        role="img"
      >
        <path
          d="M15.8 10.7c.22-1.46-.89-2.25-2.41-2.77l.49-1.98-1.2-.3-.48 1.93c-.32-.08-.64-.16-.96-.23l.48-1.94-1.2-.3-.49 1.98c-.26-.06-.52-.12-.77-.18v-.01l-1.66-.41-.32 1.29s.89.2.87.22c.49.12.58.44.56.7l-.56 2.25c.03.01.08.02.13.04l-.13-.03-.79 3.16c-.06.15-.21.37-.55.29.02.02-.87-.22-.87-.22l-.6 1.38 1.57.39c.29.07.58.15.86.22l-.5 2 1.2.3.49-1.98c.33.09.65.17.96.25l-.49 1.97 1.2.3.5-2c2.05.39 3.59.23 4.24-1.62.52-1.49-.03-2.35-1.11-2.91.79-.18 1.38-.7 1.54-1.78Zm-2.75 3.84c-.37 1.49-2.87.69-3.68.49l.66-2.65c.81.2 3.41.6 3.02 2.16Zm.37-3.86c-.34 1.36-2.42.67-3.1.5l.6-2.4c.68.17 2.85.49 2.5 1.9Z"
          fill="#16100a"
        />
      </svg>
    </div>
  )
}

export default App
