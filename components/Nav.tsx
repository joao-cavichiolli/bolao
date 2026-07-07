'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const path = usePathname()

  return (
    <header className="bg-green-800 border-b border-green-700 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <span className="font-bold text-xl text-yellow-400">Bolão Copa</span>
        </Link>
        <nav className="flex gap-2">
          <Link
            href="/"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              path === '/' ? 'bg-yellow-400 text-green-900' : 'text-white hover:bg-green-700'
            }`}
          >
            Jogos
          </Link>
          <Link
            href="/palpites"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              path === '/palpites' ? 'bg-yellow-400 text-green-900' : 'text-white hover:bg-green-700'
            }`}
          >
            📋 Palpites
          </Link>
          <Link
            href="/ranking"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              path === '/ranking' ? 'bg-yellow-400 text-green-900' : 'text-white hover:bg-green-700'
            }`}
          >
            🏆 Ranking
          </Link>
        </nav>
      </div>
    </header>
  )
}
