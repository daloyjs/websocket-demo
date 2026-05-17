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

type Props = {
  history: PriceTick[]
  className?: string
}

export function BtcChart({ history, className }: Props) {
  const data = React.useMemo(
    () => history.map((t) => ({ ts: t.ts, price: t.price })),
    [history],
  )

  if (data.length < 2) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center",
          className,
        )}
      >
        <span className="font-heading text-sm text-zinc-600">
          Awaiting live ticks…
        </span>
      </div>
    )
  }

  const prices = data.map((d) => d.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const pad = (maxPrice - minPrice) * 0.08 || 200
  const domain: [number, number] = [minPrice - pad, maxPrice + pad]

  return (
    <ChartContainer
      config={chartConfig}
      className={cn("aspect-auto h-full w-full", className)}
    >
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="btcAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7931a" stopOpacity={0.22} />
            <stop offset="85%" stopColor="#f7931a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          strokeDasharray="2 8"
          stroke="#27272a"
          strokeOpacity={0.5}
        />
        <XAxis
          dataKey="ts"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickLine={false}
          axisLine={false}
          tick={{
            fill: "#52525b",
            fontSize: 10,
            fontFamily: "var(--font-heading)",
          }}
          tickCount={6}
          tickFormatter={(v: number) =>
            new Date(v).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })
          }
        />
        <YAxis
          orientation="right"
          tickLine={false}
          axisLine={false}
          tick={{
            fill: "#52525b",
            fontSize: 10,
            fontFamily: "var(--font-heading)",
          }}
          tickFormatter={(v: number) => fmt.usd(v)}
          domain={domain}
          width={76}
        />
        <ChartTooltip
          cursor={{ stroke: "#f7931a", strokeWidth: 1, strokeOpacity: 0.25 }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const ts = (
                  payload as unknown as
                    | Array<{ payload?: { ts?: number } }>
                    | undefined
                )?.[0]?.payload?.ts
                return ts != null
                  ? new Date(ts).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : ""
              }}
              formatter={(value) => [fmt.usd(value as number), "Price"]}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke="var(--color-price)"
          strokeWidth={1.5}
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
