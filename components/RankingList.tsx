'use client'
import type { RankingRow } from '@/app/ranking/page'

const MEDALS = ['🥇', '🥈', '🥉']

function formatPremio(value: number): string {
  const n = Number(value)
  return n % 1 === 0 ? `€${n}` : `€${n.toFixed(2)}`
}

export default function RankingList({ initialRanking }: { initialRanking: RankingRow[] }) {
  return (
    <div className="space-y-3">
      {initialRanking.map((row, i) => (
        <div
          key={row.user_name}
          className={`bg-gray-900 rounded-xl border p-3 flex items-center gap-3 ${
            i === 0 ? 'border-yellow-500' : i === 1 ? 'border-gray-500' : i === 2 ? 'border-amber-700' : 'border-gray-800'
          }`}
        >
          <div className="text-2xl w-8 shrink-0 text-center">{MEDALS[i] ?? `${i + 1}`}</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate">{row.user_name}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-400">
              <span>🏆 {row.placar_exato} exatos</span>
              <span>✅ {row.resultado_certo} resultados</span>
              <span>❌ {row.erros} erros</span>
            </div>
          </div>
          {Number(row.premio_euros) > 0 && (
            <div className="shrink-0 text-center bg-green-900/50 border border-green-700 rounded-lg px-2 py-1.5">
              <p className="text-lg font-black text-green-300 leading-tight">{formatPremio(row.premio_euros)}</p>
              <p className="text-xs text-green-500">prêmio</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
