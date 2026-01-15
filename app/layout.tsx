import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'SpoilSport - Spoiler-Free Sports Ratings',
    template: '%s | SpoilSport',
  },
  description: 'Find out which games are worth watching without spoilers. SpoilSport rates games so you can skip the blowouts and catch the thrillers.',
  keywords: ['sports', 'NBA', 'NFL', 'game ratings', 'spoiler-free', 'watchability'],
  authors: [{ name: 'SpoilSport' }],
  openGraph: {
    title: 'SpoilSport - Spoiler-Free Sports Ratings',
    description: 'Find out which games are worth watching without spoilers. Skip the blowouts, catch the thrillers.',
    type: 'website',
    locale: 'en_US',
    siteName: 'SpoilSport',
  },
  twitter: {
    card: 'summary',
    title: 'SpoilSport - Spoiler-Free Sports Ratings',
    description: 'Find out which games are worth watching without spoilers. Skip the blowouts, catch the thrillers.',
  },
  robots: {
    index: true,
    follow: true,
  },
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
