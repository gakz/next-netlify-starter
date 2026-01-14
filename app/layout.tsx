import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'SpoilSport',
  description: 'Spoiler-free sports watchability guide',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var isDark = theme === 'dark' ||
                    (theme === 'system' || !theme) &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-stone-50 text-stone-800 min-h-screen dark:bg-stone-900 dark:text-stone-200">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
