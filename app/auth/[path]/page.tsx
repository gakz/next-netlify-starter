import type { Metadata } from 'next'
import { AuthView } from '@neondatabase/auth/react'

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ path: string }> }): Promise<Metadata> {
  const { path } = await params
  const titles: Record<string, string> = {
    'sign-in': 'Sign In',
    'sign-up': 'Create Account',
    'forgot-password': 'Reset Password',
  }
  const title = titles[path] || 'Authentication'
  return {
    title,
    description: `${title} to SpoilSport to save your favorite teams and get personalized game ratings.`,
  }
}

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-8 text-stone-900 dark:text-stone-100">SpoilSport</h1>
        <AuthView path={path} />
      </div>
    </main>
  )
}
