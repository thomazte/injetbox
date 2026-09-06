import { useState } from 'react'
import { Field } from './Field'

export function SuggestField({
  value,
  onChange,
  options,
  placeholder,
  label,
  required = false,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  label?: string
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const needle = value.trim().toLowerCase()
  const exactMatch = options.some((option) => option.toLowerCase() === needle)
  const matches = options
    .filter((option) => !needle || exactMatch || option.toLowerCase().includes(needle))
    .slice(0, 12)

  const field = (
    <div className="relative">
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120)
        }}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {open && matches.length > 0 && (
        <ul className="glass-strong absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-xl">
          {matches.map((option) => (
            <li key={option}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-white/10"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option)
                  setOpen(false)
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  if (!label) return field
  return <Field label={label}>{field}</Field>
}
