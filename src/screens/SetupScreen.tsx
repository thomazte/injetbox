export function SetupScreen() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10">
      <p className="text-sm font-medium tracking-wide text-accent uppercase">InjetBox</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Banco na nuvem</h1>
      <p className="mt-3 text-muted">
        O cadastro de contas já funciona neste aparelho. Para vender o produto com estoque na nuvem,
        conecte um projeto Supabase.
      </p>
    </main>
  )
}
