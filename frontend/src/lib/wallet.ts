import * as React from "react"

const API_URL =
  (import.meta.env.VITE_BTC_API_URL as string | undefined) ??
  "http://localhost:3000"

export type Wallet = {
  usd: number
  btc: number
  portfolioUsd: number
  markPrice: number
}

export type Order = {
  id: string
  side: "BUY" | "SELL"
  btc: number
  usd: number
  price: number
  note: string
  ts: number
}

type TradeResponse = { wallet: Wallet; order: Order }

async function http<T>(
  path: string,
  init?: Omit<RequestInit, "body"> & { body?: unknown },
): Promise<T> {
  const headers: Record<string, string> = {}
  let body: BodyInit | undefined
  if (init?.body !== undefined) {
    headers["content-type"] = "application/json"
    body = JSON.stringify(init.body)
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
    body,
  })
  if (!res.ok) {
    let detail = ""
    try {
      const problem = await res.json()
      detail = problem?.detail ?? problem?.title ?? ""
    } catch {
      detail = res.statusText
    }
    throw new Error(detail || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const walletApi = {
  get: () => http<Wallet>("/wallet/"),
  buy: (usd: number) =>
    http<TradeResponse>("/wallet/buy", { method: "POST", body: { usd } }),
  sell: (btc: number) =>
    http<TradeResponse>("/wallet/sell", { method: "POST", body: { btc } }),
  reset: () => http<Wallet>("/wallet/reset", { method: "POST" }),
}

export const ordersApi = {
  list: () => http<Order[]>("/orders/"),
  updateNote: (id: string, note: string) =>
    http<Order>(`/orders/${id}`, { method: "PUT", body: { note } }),
  delete: (id: string) =>
    http<{ ok: true }>(`/orders/${id}`, { method: "DELETE" }),
}

/**
 * Source of truth for wallet + order state on the client. Refreshes both
 * after every mutation so the UI always reflects the server response.
 */
export function useWallet() {
  const [wallet, setWallet] = React.useState<Wallet | null>(null)
  const [orders, setOrders] = React.useState<Order[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  const refresh = React.useCallback(async () => {
    try {
      const [w, o] = await Promise.all([walletApi.get(), ordersApi.list()])
      setWallet(w)
      setOrders(o)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load wallet")
    }
  }, [])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  const run = React.useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      setError(null)
      setPending(true)
      try {
        const out = await fn()
        await refresh()
        return out
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed")
        return null
      } finally {
        setPending(false)
      }
    },
    [refresh],
  )

  return {
    wallet,
    orders,
    error,
    pending,
    refresh,
    buy: (usd: number) => run(() => walletApi.buy(usd)),
    sell: (btc: number) => run(() => walletApi.sell(btc)),
    reset: () => run(() => walletApi.reset()),
    updateNote: (id: string, note: string) =>
      run(() => ordersApi.updateNote(id, note)),
    remove: (id: string) => run(() => ordersApi.delete(id)),
  }
}
