import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bolão Copa',
  description: 'Palpites e ranking dos jogos da Copa do Mundo 2026',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${geist.className} bg-gray-950 text-white min-h-screen`}>
        <Nav />
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
