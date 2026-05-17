import * as React from "react"

export type PriceTick = {
  price: number
  changeAbs: number
  changePct: number
  high1h: number
  low1h: number
  vol24hBtc: number
  vol24hUsdB: number
  ath: number
  marketCapT: number
  satsPerUsd: number
  ts: number
}

type WsMessage = { type: "tick"; data: PriceTick }

type Status = "connecting" | "open" | "closed"

const WS_URL =
  (import.meta.env.VITE_BTC_WS_URL as string | undefined) ??
  "ws://localhost:3000/btc/feed"
const API_URL =
  (import.meta.env.VITE_BTC_API_URL as string | undefined) ??
  "http://localhost:3000"

export function useBtcFeed(maxPoints = 240): {
  latest: PriceTick | null
  history: PriceTick[]
  status: Status
} {
  const [latest, setLatest] = React.useState<PriceTick | null>(null)
  const [history, setHistory] = React.useState<PriceTick[]>([])
  const [status, setStatus] = React.useState<Status>("connecting")
  const wsRef = React.useRef<WebSocket | null>(null)

  const appendTick = React.useCallback(
    (tick: PriceTick) => {
      setLatest(tick)
      setHistory((prev) => trimHistory([...prev, tick], maxPoints))
    },
    [maxPoints],
  )

  React.useEffect(() => {
    let cancelled = false

    fetch(`${API_URL}/btc/snapshot`)
      .then((res) => (res.ok ? res.json() : null))
      .then((tick: PriceTick | null) => {
        if (!cancelled && tick) appendTick(tick)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [appendTick])

  React.useEffect(() => {
    let cancelled = false
    let retry = 0
    let timer: number | undefined

    const connect = () => {
      if (cancelled) return
      setStatus("connecting")
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.addEventListener("open", () => {
        retry = 0
        setStatus("open")
      })

      ws.addEventListener("message", (event) => {
        try {
          const msg = JSON.parse(event.data as string) as WsMessage
          if (msg.type !== "tick") return
          appendTick(msg.data)
        } catch {
          // Ignore malformed frames from dev tools or interrupted reloads.
        }
      })

      const reconnect = () => {
        if (cancelled) return
        setStatus("closed")
        retry = Math.min(retry + 1, 6)
        const delay = Math.min(1000 * 2 ** retry, 10_000)
        timer = window.setTimeout(connect, delay)
      }

      ws.addEventListener("close", reconnect)
      ws.addEventListener("error", () => ws.close())
    }

    connect()

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
      wsRef.current?.close()
    }
  }, [appendTick])

  return { latest, history, status }
}

export const fmt = {
  usd(n: number, dp = 2): string {
    return n.toLocaleString("en-US", {
      minimumFractionDigits: dp,
      maximumFractionDigits: dp,
    })
  },
  int(n: number): string {
    return Math.round(n).toLocaleString("en-US")
  },
  pct(n: number, dp = 2): string {
    const sign = n >= 0 ? "+" : ""
    return `${sign}${n.toFixed(dp)}%`
  },
  signed(n: number, dp = 2): string {
    const sign = n >= 0 ? "+" : ""
    return `${sign}${n.toFixed(dp)}`
  },
}

function trimHistory(history: PriceTick[], maxPoints: number): PriceTick[] {
  return history.length > maxPoints
    ? history.slice(history.length - maxPoints)
    : history
}
