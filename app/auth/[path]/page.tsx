import { AuthView } from '@neondatabase/auth/react'

export const dynamicParams = false

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-8">SpoilSport</h1>
        <AuthView path={path} />
      </div>
    </main>
  )
}
