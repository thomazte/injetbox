import { COPYRIGHT } from '../lib/brand'

export function CopyrightMark({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[11px] tracking-wide text-muted/80 ${className}`}>
      {COPYRIGHT}
    </p>
  )
}
