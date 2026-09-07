import type { ReactNode } from 'react'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
        {label}
      </p>
      {children}
    </div>
  )
}
