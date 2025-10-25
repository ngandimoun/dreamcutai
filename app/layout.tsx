import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth/auth-provider'
import { GoogleScript } from '@/components/auth/google-script'
import { Toaster } from '@/components/ui/sonner'
import { Toaster as CustomToaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dreamcut',
  description: 'Created with Dreamcut',
  generator: 'Dreamcut',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <GoogleScript />
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
        <CustomToaster />
        <Analytics />
      </body>
    </html>
  )
}
