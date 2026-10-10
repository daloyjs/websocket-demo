import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { fmt, type PriceTick } from "@/lib/btc"
import { cn } from "@/lib/utils"

const chartConfig = {
  price: {
    label: "BTC Price",
    color: "#f7931a",
  },
} satisfies ChartConfig

// Tick colour comes from ChartContainer (`fill-muted-foreground`).
const AXIS_TICK = {
  fontSize: 11,
  fontFamily: "var(--font-heading)",
}

const X_TICKS = 5
const Y_TICKS = 5

type Props = {
  history: PriceTick[]
  className?: string
}

export function BtcChart({ history, className }: Props) {
  const data = React.useMemo(
    () => history.map((t) => ({ ts: t.ts, price: t.price })),
    [history]
  )

  if (data.length < 2) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-2",
          className
        )}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f7931a]" />
        <span className="font-heading text-sm text-zinc-500">
          Waiting for live ticks…
        </span>
      </div>
    )
  }

  const first = data[0].ts
  const last = data[data.length - 1].ts
  const xTicks = evenTicks(first, last, X_TICKS)
  const y = niceScale(
    Math.min(...data.map((d) => d.price)),
    Math.max(...data.map((d) => d.price)),
    Y_TICKS
  )

  return (
    <ChartContainer
      config={chartConfig}
      className={cn("aspect-auto h-full w-full", className)}
    >
      <AreaChart
        data={data}
        margin={{ top: 16, right: 8, left: 16, bottom: 8 }}
      >
        <defs>
          <linearGradient id="btcAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7931a" stopOpacity={0.24} />
            <stop offset="90%" stopColor="#f7931a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#1f1f23" />
        <XAxis
          dataKey="ts"
          type="number"
          domain={[first, last]}
          ticks={xTicks}
          interval="preserveStartEnd"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tick={AXIS_TICK}
          tickFormatter={(v: number) => fmt.time(v)}
        />
        <YAxis
          orientation="right"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={AXIS_TICK}
          tickFormatter={(v: number) => `$${fmt.usd(v, y.decimals)}`}
          domain={[y.min, y.max]}
          ticks={y.ticks}
          width={84}
        />
        <ChartTooltip
          cursor={{ stroke: "#f7931a", strokeWidth: 1, strokeOpacity: 0.35 }}
          content={
            <ChartTooltipContent
              className="border-zinc-800 bg-zinc-950/95 font-heading"
              labelFormatter={(_, payload) => {
                const ts = (
                  payload as unknown as
                    Array<{ payload?: { ts?: number } }> | undefined
                )?.[0]?.payload?.ts
                return ts != null ? fmt.time(ts) : ""
              }}
              formatter={(value) => (
                <span className="flex w-full justify-between gap-4">
                  <span className="text-zinc-400">Price</span>
                  <span className="text-zinc-50 tabular-nums">
                    ${fmt.usd(value as number)}
                  </span>
                </span>
              )}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke="var(--color-price)"
          strokeWidth={1.75}
          fill="url(#btcAreaGrad)"
          dot={false}
          activeDot={{
            r: 4,
            fill: "#f7931a",
            stroke: "#0a0a0a",
            strokeWidth: 2,
          }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}

/** `count` evenly spaced, de-duplicated timestamps from `from` to `to`. */
function evenTicks(from: number, to: number, count: number): number[] {
  const step = (to - from) / (count - 1)
  const ticks = Array.from({ length: count }, (_, i) =>
    Math.round(from + step * i)
  )
  return [...new Set(ticks)]
}

/**
 * Round price ticks ($78,300 / $78,350 …) that bracket the data, instead of
 * the raw min/max ± padding, which yields labels like 78,279.89.
 */
function niceScale(min: number, max: number, count: number) {
  const span = Math.max(max - min, 1)
  const rough = span / (count - 1)
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const residual = rough / magnitude
  const step =
    (residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1) * magnitude

  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(v)

  return {
    min: lo,
    max: hi,
    ticks,
    decimals: step >= 1 ? 0 : 2,
  }
}
