'use client'

import { NeonAuthUIProvider } from '@neondatabase/auth/react'
import { authClient } from '@/lib/auth/client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // @ts-expect-error - Type compatibility issue with Better Auth internals
    <NeonAuthUIProvider authClient={authClient}>
      {children}
    </NeonAuthUIProvider>
  )
}
