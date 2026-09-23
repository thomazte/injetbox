import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { Field } from './Field'

export function PasswordSheet({ onClose }: { onClose: () => void }) {
  const { changePassword } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (next !== confirm) {
      setError('As senhas não conferem.')
      return
    }

    setBusy(true)
    try {
      await changePassword(current, next)
      setDone(true)
      window.setTimeout(onClose, 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível alterar a senha.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="overlay fixed inset-0 z-40 flex items-center justify-center px-3 py-6"
      onClick={onClose}
    >
      <form
        className="sheet-enter sheet-panel mx-auto w-full max-w-lg rounded-3xl p-5 lg:max-w-md"
        onClick={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Alterar senha</h2>
          <button type="button" className="text-sm text-muted" onClick={onClose}>
            Fechar
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">A próxima entrada usa a nova senha desta conta.</p>

        <div className="mt-5 space-y-3.5">
          <Field label="Senha atual">
            <input
              type="password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              autoComplete="current-password"
              minLength={6}
              required
            />
          </Field>
          <Field label="Nova senha">
            <input
              type="password"
              value={next}
              onChange={(event) => setNext(event.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </Field>
          <Field label="Confirmar nova senha">
            <input
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </Field>
        </div>

        {error && <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        {done && !error && (
          <p className="mt-3 rounded-xl bg-ok-soft px-3 py-2 text-sm text-accent">Senha alterada.</p>
        )}

        <button
          type="submit"
          disabled={busy || done}
          className="mt-5 w-full rounded-xl bg-accent py-3.5 font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Salvando…' : done ? 'Pronto' : 'Salvar senha'}
        </button>
      </form>
    </div>
  )
}
