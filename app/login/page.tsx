'use client'

import { AuthView } from '@neondatabase/auth/react/ui'
import { authClient } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.user) {
      router.push('/')
    }
  }, [session, router])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-400 dark:text-stone-500">Loading...</div>
      </div>
    )
  }

  if (session?.user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-8">SpoilSport</h1>
        <AuthView pathname="sign-in" />
      </div>
    </div>
  )
}
