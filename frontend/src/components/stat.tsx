import * as React from "react"

import { cn } from "@/lib/utils"

export function Stat({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string
  value: React.ReactNode
  className?: string
  valueClassName?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[10px] font-medium tracking-[0.18em] text-zinc-500 uppercase">
        {label}
      </span>
      <span
        className={cn(
          "font-heading text-lg leading-none text-zinc-100",
          valueClassName,
        )}
      >
        {value}
      </span>
    </div>
  )
}
