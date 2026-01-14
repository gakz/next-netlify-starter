'use client'

import { NeonAuthUIProvider } from '@neondatabase/auth/react'
import { authClient } from '@/lib/auth/client'
import { ThemeProvider } from './ThemeProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NeonAuthUIProvider
        // @ts-expect-error - Type compatibility issue with Better Auth internals
        authClient={authClient}
        social={{ providers: ['google'] }}
      >
        {children}
      </NeonAuthUIProvider>
    </ThemeProvider>
  )
}
