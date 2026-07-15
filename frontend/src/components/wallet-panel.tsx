import * as React from "react"
import {
  ArrowCounterClockwise,
  ArrowDown,
  ArrowUp,
  Coins,
  NotePencil,
  Trash,
  Wallet,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { fmt } from "@/lib/btc"
import { useWallet, type Order } from "@/lib/wallet"
import { cn } from "@/lib/utils"

export function WalletPanel({ markPrice }: { markPrice: number | null }) {
  const {
    wallet,
    orders,
    pending,
    error,
    buy,
    sell,
    reset,
    updateNote,
    remove,
  } = useWallet()
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
    <section className="py-5 sm:py-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(25rem,0.85fr)_minmax(0,1.4fr)]">
        {/* Left: controls */}
        <div className="flex flex-col gap-5 rounded-[1.75rem] border border-white/[0.075] bg-[#111110]/90 p-5 shadow-2xl shadow-black/20 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#f7931a]/10 text-[#f7931a]">
                <Wallet className="size-5" weight="bold" />
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-zinc-100">
                  Paper wallet
                </h2>
                <p className="text-xs text-zinc-600">
                  Practice without the risk
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => void reset()}
              disabled={pending}
              className="h-8 rounded-xl border border-white/[0.07] px-3 font-heading text-[10px] tracking-wide text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200"
            >
              <ArrowCounterClockwise className="size-3.5" />
              RESET
            </Button>
          </div>

          {/* Balance cards */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <TradeForm
              label="Buy with USD"
              suffix="USD"
              value={usdInput}
              onChange={setUsdInput}
              onSubmit={onBuy}
              ctaLabel="Buy BTC"
              ctaClass="bg-emerald-400 text-[#07130e] hover:bg-emerald-300 hover:text-[#07130e]"
              side="buy"
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
              ctaLabel="Sell BTC"
              ctaClass="bg-rose-400 text-[#1c090d] hover:bg-rose-300 hover:text-[#1c090d]"
              side="sell"
              hint={
                markPrice
                  ? `≈ $${fmt.usd(Number(btcInput) * markPrice || 0)}`
                  : ""
              }
              disabled={pending}
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-3.5 py-3 font-heading text-xs text-rose-300">
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
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1.5 rounded-2xl border p-3.5",
        accent
          ? "border-[#f7931a]/15 bg-[#f7931a]/[0.075]"
          : "border-white/[0.065] bg-white/[0.025]"
      )}
    >
      <span className="font-heading text-[9px] tracking-[0.15em] text-zinc-600 uppercase">
        {label}
      </span>
      <span
        className={cn(
          "truncate font-heading text-sm leading-none font-semibold tabular-nums",
          accent ? "text-[#f7a136]" : "text-zinc-100"
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
  side,
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
  side: "buy" | "sell"
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="flex flex-col gap-3.5 rounded-2xl border border-white/[0.065] bg-white/[0.025] p-4"
    >
      <label className="flex items-center gap-2 text-xs font-medium text-zinc-400">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-lg",
            side === "buy"
              ? "bg-emerald-400/10 text-emerald-400"
              : "bg-rose-400/10 text-rose-400"
          )}
        >
          {side === "buy" ? (
            <ArrowDown className="size-3.5" weight="bold" />
          ) : (
            <ArrowUp className="size-3.5" weight="bold" />
          )}
        </span>
        {label}
      </label>
      <div className="flex items-stretch overflow-hidden rounded-xl border border-white/[0.08] bg-black/20 transition-colors focus-within:border-[#f7931a]/40 focus-within:ring-2 focus-within:ring-[#f7931a]/10">
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="w-full min-w-0 bg-transparent px-3.5 py-3 font-heading text-sm text-zinc-100 outline-none"
        />
        <span className="flex items-center border-l border-white/[0.07] px-3 font-heading text-[10px] tracking-wide text-zinc-500">
          {suffix}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="font-heading text-[10px] break-all text-zinc-600">
          {hint}
        </span>
        <Button
          type="submit"
          disabled={disabled}
          className={cn(
            "h-8 shrink-0 rounded-lg px-4 font-heading text-[10px] font-semibold tracking-wide",
            ctaClass
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
    <div className="flex min-h-[28rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.075] bg-[#111110]/90 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-5 sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#f7931a]/10 text-[#f7931a]">
            <Coins className="size-5" weight="bold" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-100">
              Recent orders
            </h2>
            <p className="text-xs text-zinc-600">
              Your simulated trade history
            </p>
          </div>
        </div>
        <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 font-heading text-[10px] text-zinc-500">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </span>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="grid min-w-155 grid-cols-[80px_130px_130px_minmax(0,1fr)_56px] gap-3 border-b border-white/[0.05] bg-white/[0.015] px-5 py-3 font-heading text-[9px] tracking-[0.16em] text-zinc-600 uppercase sm:px-7">
          <span>Side</span>
          <span>Amount</span>
          <span>Price</span>
          <span>Note</span>
          <span className="text-right">Edit</span>
        </div>

        {orders.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025] text-zinc-600">
              <NotePencil className="size-6" />
            </div>
            <p className="text-sm font-medium text-zinc-400">
              No trades to show
            </p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-600">
              Buy or sell Bitcoin and your order history will appear here.
            </p>
          </div>
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
        "grid min-w-155 grid-cols-[80px_130px_130px_minmax(0,1fr)_56px] items-center gap-3 border-b border-white/[0.05] px-5 py-3.5 transition-colors last:border-b-0 hover:bg-white/[0.02] sm:px-7"
      )}
    >
      <span
        className={cn(
          "w-fit rounded-full px-2.5 py-1 font-heading text-[10px] font-semibold tracking-wide",
          isBuy
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-rose-400/10 text-rose-300"
        )}
      >
        {order.side}
      </span>
      <span className="font-heading text-xs text-zinc-300 tabular-nums">
        {order.btc.toFixed(6)} BTC
      </span>
      <span className="font-heading text-xs text-zinc-400 tabular-nums">
        ${fmt.usd(order.price)}
      </span>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => {
          if (dirty) onSaveNote(note)
        }}
        placeholder="Add a note…"
        aria-label="Order note"
        className="w-full rounded-lg border border-transparent bg-transparent px-2.5 py-1.5 font-heading text-xs text-zinc-300 transition-colors outline-none placeholder:text-zinc-700 hover:border-white/[0.06] focus:border-[#f7931a]/30 focus:bg-black/20"
      />
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onDelete}
          disabled={disabled}
          aria-label="Delete order"
          className="size-8 rounded-lg p-0 text-zinc-600 hover:bg-rose-400/10 hover:text-rose-400"
        >
          <Trash className="size-3.5" />
        </Button>
      </div>
    </li>
  )
}
