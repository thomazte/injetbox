const messages: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'Invalid login credentials.': 'E-mail ou senha incorretos.',
  'User already registered': 'Este e-mail já possui uma conta.',
  'User already registered.': 'Este e-mail já possui uma conta.',
  'Email not confirmed': 'Confirme o e-mail para entrar.',
  'Email not confirmed.': 'Confirme o e-mail para entrar.',
  'Password should be at least 6 characters.': 'A senha precisa ter pelo menos 6 caracteres.',
  'Password should be at least 6 characters': 'A senha precisa ter pelo menos 6 caracteres.',
  'Unable to validate email address: invalid format': 'E-mail inválido.',
  'Signup requires a valid password': 'Informe uma senha válida.',
  'New password should be different from the old password.': 'A nova senha precisa ser diferente.',
}

export function authMessage(error: string | null | undefined): string {
  if (!error) return 'Não foi possível entrar.'
  const lower = error.toLowerCase()
  if (messages[error]) return messages[error]
  const found = Object.entries(messages).find(([key]) => lower.includes(key.toLowerCase()))
  if (found) return found[1]
  if (lower.includes('rate limit')) {
    return 'Muitas tentativas. Espere um pouco e tente de novo.'
  }
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('load failed') ||
    lower.includes('the internet connection appears to be offline')
  ) {
    return 'Sem conexão com o banco. Confira a internet e tente de novo.'
  }
  return error
}

export function authCaught(err: unknown): string {
  if (err instanceof Error) return authMessage(err.message)
  return 'Não foi possível entrar.'
}
