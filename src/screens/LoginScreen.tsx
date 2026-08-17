import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { APP_NAME, APP_TAGLINE } from '../lib/brand'
import { CopyrightMark } from '../components/CopyrightMark'

export function LoginScreen() {
  const { signIn, signUp, error, notice } = useAuth()
  const [mode, setMode] = useState<'entrar' | 'criar'>('entrar')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (notice) setMode('entrar')
  }, [notice])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (mode === 'criar') {
      if (name.trim().length < 2) {
        setFormError('Informe seu nome.')
        return
      }
      if (password !== confirm) {
        setFormError('As senhas não conferem.')
        return
      }
    }

    setBusy(true)
    try {
      if (mode === 'criar') {
        await signUp(name, email, password)
      } else {
        await signIn(email, password)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10 lg:max-w-lg">
      <div className="glass-strong rounded-3xl p-5 lg:p-8">
        <p className="text-sm font-medium tracking-wide text-accent uppercase">{APP_NAME}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{APP_TAGLINE}</h1>
        <p className="mt-3 text-muted">
          Crie sua conta com e-mail e senha. Cada usuário tem o próprio estoque, separado dos demais.
        </p>

        <div className="mt-8 grid grid-cols-2 rounded-xl glass p-1">
          <button
            type="button"
            className={`rounded-lg py-2 text-sm font-medium ${mode === 'entrar' ? 'bg-surface text-ink' : 'text-muted'}`}
            onClick={() => {
              setMode('entrar')
              setFormError(null)
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`rounded-lg py-2 text-sm font-medium ${mode === 'criar' ? 'bg-surface text-ink' : 'text-muted'}`}
            onClick={() => {
              setMode('criar')
              setFormError(null)
            }}
          >
            Criar conta
          </button>
        </div>

        <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit}>
          {mode === 'criar' && (
            <label className="text-sm font-medium text-ink">
              Seu nome
              <input
                className="mt-1"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Como aparece no histórico"
                required
                autoComplete="name"
              />
            </label>
          )}
          <label className="text-sm font-medium text-ink">
            E-mail
            <input
              className="mt-1"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@email.com"
              required
              autoComplete="email"
            />
          </label>
          <label className="text-sm font-medium text-ink">
            Senha
            <input
              className="mt-1"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              autoComplete={mode === 'criar' ? 'new-password' : 'current-password'}
            />
          </label>
          {mode === 'criar' && (
            <label className="text-sm font-medium text-ink">
              Confirmar senha
              <input
                className="mt-1"
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="Repita a senha"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
          )}
          {(formError || error) && (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{formError || error}</p>
          )}
          {notice && !formError && !error && (
            <p className="rounded-xl bg-ok-soft px-3 py-2 text-sm text-accent">{notice}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-xl bg-accent py-3 font-semibold text-white disabled:opacity-60"
          >
            {busy ? 'Aguarde…' : mode === 'criar' ? 'Criar conta' : 'Entrar'}
          </button>
        </form>
      </div>
      <CopyrightMark className="mt-5 text-center" />
    </main>
  )
}
