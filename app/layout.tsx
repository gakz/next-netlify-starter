import type { Metadata } from 'next'
import './globals.css'
import { FavoritesProvider } from './context/FavoritesContext'

export const metadata: Metadata = {
  title: 'Game Review',
  description: 'Spoiler-free sports watchability guide',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-800 min-h-screen dark:bg-stone-900 dark:text-stone-200">
        <FavoritesProvider>{children}</FavoritesProvider>
      </body>
    </html>
  )
}
