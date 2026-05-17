import * as React from "react"

import { Button } from "@/components/ui/button"
import { fmt } from "@/lib/btc"
import { useWallet, type Order } from "@/lib/wallet"
import { cn } from "@/lib/utils"

export function WalletPanel({ markPrice }: { markPrice: number | null }) {
  const { wallet, orders, pending, error, buy, sell, reset, updateNote, remove } =
    useWallet()
  const [usdInput, setUsdInput] = React.useState("100")
  const [btcInput, setBtcInput] = React.useState("0.01")

  const onBuy = async () => {
    const usd = Number(usdInput)
    if (!Number.isFinite(usd) || usd <= 0) return
    await buy(usd)
  }
  const onSell = async () => {
    const btc = Number(btcInput)
    if (!Number.isFinite(btc) || btc <= 0) return
    await sell(btc)
  }

  return (
    <section className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {/* Left: controls */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xs tracking-[0.2em] text-zinc-500 uppercase">
              Wallet
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => void reset()}
              disabled={pending}
              className="h-7 rounded-sm px-3 font-heading text-[11px] tracking-wide text-zinc-600 hover:bg-zinc-900 hover:text-zinc-300"
            >
              RESET
            </Button>
          </div>

          {/* Balance cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <BalanceCard
              label="USD"
              value={wallet ? `$${fmt.usd(wallet.usd)}` : "—"}
            />
            <BalanceCard
              label="BTC"
              value={wallet ? wallet.btc.toFixed(8) : "—"}
            />
            <BalanceCard
              label="Portfolio"
              value={wallet ? `$${fmt.usd(wallet.portfolioUsd)}` : "—"}
              accent
            />
          </div>

          {/* Trade forms */}
          <div className="grid gap-3 xl:grid-cols-2">
            <TradeForm
              label="Buy with USD"
              suffix="USD"
              value={usdInput}
              onChange={setUsdInput}
              onSubmit={onBuy}
              ctaLabel="BUY"
              ctaClass="bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20 hover:text-emerald-300"
              hint={
                markPrice
                  ? `≈ ${(Number(usdInput) / markPrice || 0).toFixed(8)} BTC`
                  : ""
              }
              disabled={pending}
            />
            <TradeForm
              label="Sell BTC"
              suffix="BTC"
              value={btcInput}
              onChange={setBtcInput}
              onSubmit={onSell}
              ctaLabel="SELL"
              ctaClass="bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30 hover:bg-rose-500/20 hover:text-rose-300"
              hint={
                markPrice
                  ? `≈ $${fmt.usd(Number(btcInput) * markPrice || 0)}`
                  : ""
              }
              disabled={pending}
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-900/50 bg-rose-950/20 px-3 py-2.5 font-heading text-xs text-rose-400">
              {error}
            </p>
          ) : null}
        </div>

        {/* Right: orders */}
        <OrdersTable
          orders={orders}
          pending={pending}
          onSaveNote={(id, note) => void updateNote(id, note)}
          onDelete={(id) => void remove(id)}
        />
      </div>
    </section>
  )
}

function BalanceCard({
  label,
  value,
  accent,
}: {
  label: string
  value: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-zinc-900 bg-[#0f0f0f] p-3">
      <span className="font-heading text-[9px] tracking-[0.18em] text-zinc-600 uppercase">
        {label}
      </span>
      <span
        className={cn(
          "font-heading text-sm font-semibold leading-none tabular-nums",
          accent ? "text-[#f7931a]" : "text-zinc-100",
        )}
      >
        {value}
      </span>
    </div>
  )
}

function TradeForm({
  label,
  suffix,
  value,
  onChange,
  onSubmit,
  ctaLabel,
  ctaClass,
  hint,
  disabled,
}: {
  label: string
  suffix: string
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  ctaLabel: string
  ctaClass: string
  hint: string
  disabled?: boolean
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="flex flex-col gap-3 rounded-lg border border-zinc-900 bg-[#0f0f0f] p-4"
    >
      <label className="font-heading text-[9px] tracking-[0.18em] text-zinc-600 uppercase">
        {label}
      </label>
      <div className="flex items-stretch overflow-hidden rounded-md border border-zinc-800 bg-[#0a0a0a] transition-colors focus-within:border-zinc-700">
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-heading w-full bg-transparent px-3 py-2.5 text-sm text-zinc-100 outline-none"
        />
        <span className="flex items-center border-l border-zinc-800 px-3 font-heading text-[11px] tracking-wide text-zinc-500">
          {suffix}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="font-heading text-[11px] text-zinc-600 break-all">
          {hint}
        </span>
        <Button
          type="submit"
          disabled={disabled}
          className={cn(
            "h-8 shrink-0 rounded-md px-5 font-heading text-xs tracking-wide",
            ctaClass,
          )}
        >
          {ctaLabel}
        </Button>
      </div>
    </form>
  )
}

function OrdersTable({
  orders,
  pending,
  onSaveNote,
  onDelete,
}: {
  orders: Order[]
  pending: boolean
  onSaveNote: (id: string, note: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xs tracking-[0.2em] text-zinc-500 uppercase">
          Orders
        </h2>
        <span className="font-heading text-[11px] text-zinc-600">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-900 bg-[#0f0f0f]">
        <div className="grid min-w-155 grid-cols-[80px_120px_120px_minmax(0,1fr)_72px] gap-3 border-b border-zinc-900 px-4 py-2.5 font-heading text-[9px] tracking-[0.18em] text-zinc-600 uppercase">
          <span>Side</span>
          <span>Amount</span>
          <span>Price</span>
          <span>Note</span>
          <span className="text-right">Del</span>
        </div>

        {orders.length === 0 ? (
          <p className="px-4 py-8 font-heading text-sm text-zinc-600">
            No orders yet — buy or sell to get started.
          </p>
        ) : (
          <ul>
            {orders.map((o) => (
              <OrderRow
                key={`${o.id}:${o.note}`}
                order={o}
                disabled={pending}
                onSaveNote={(note) => onSaveNote(o.id, note)}
                onDelete={() => onDelete(o.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function OrderRow({
  order,
  disabled,
  onSaveNote,
  onDelete,
}: {
  order: Order
  disabled?: boolean
  onSaveNote: (note: string) => void
  onDelete: () => void
}) {
  const [note, setNote] = React.useState(order.note)

  const dirty = note !== order.note
  const isBuy = order.side === "BUY"

  return (
    <li
      className={cn(
        "grid min-w-155 grid-cols-[80px_120px_120px_minmax(0,1fr)_72px] items-center gap-3 border-b border-zinc-900/60 px-4 py-3 last:border-b-0",
        isBuy ? "bg-emerald-500/[0.03]" : "bg-rose-500/[0.03]",
      )}
    >
      <span
        className={cn(
          "font-heading text-xs font-medium tracking-wide",
          isBuy ? "text-emerald-400" : "text-rose-400",
        )}
      >
        {order.side}
      </span>
      <span className="font-heading text-xs tabular-nums text-zinc-300">
        {order.btc.toFixed(6)} BTC
      </span>
      <span className="font-heading text-xs tabular-nums text-zinc-400">
        ${fmt.usd(order.price)}
      </span>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => {
          if (dirty) onSaveNote(note)
        }}
        placeholder="Add a note…"
        className="font-heading w-full rounded-md border border-zinc-800 bg-transparent px-2 py-1 text-xs text-zinc-300 outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-700 focus:bg-[#0a0a0a]"
      />
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onDelete}
          disabled={disabled}
          className="h-7 rounded-md px-3 font-heading text-[11px] tracking-wide text-zinc-600 hover:bg-rose-950/30 hover:text-rose-400"
        >
          DEL
        </Button>
      </div>
    </li>
  )
}
