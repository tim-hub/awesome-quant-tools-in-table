import type { Metadata } from 'next'
import '../src/index.css'

export const metadata: Metadata = {
  title: 'Awesome Quant Tools Table',
  description: 'A curated, searchable index of 400+ quantitative finance tools, libraries, and resources across Python, R, Julia, C++, and more.',
  openGraph: {
    title: 'Awesome Quant Tools Table',
    description: 'A curated, searchable index of 400+ quantitative finance tools, libraries, and resources across Python, R, Julia, C++, and more.',
    type: 'website',
    url: 'https://awesomequant.tools',
  },
  twitter: {
    card: 'summary',
    title: 'Awesome Quant Tools Table',
    description: 'A curated, searchable index of 400+ quantitative finance tools.',
  },
  icons: { icon: '/favicon.svg' },
}

const antiFlashScript = `(function(){var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: antiFlashScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;1,6..72,400;1,6..72,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
