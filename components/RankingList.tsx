'use client'
import type { RankingRow } from '@/app/ranking/page'

const MEDALS = ['🥇', '🥈', '🥉']

export default function RankingList({ initialRanking }: { initialRanking: RankingRow[] }) {
  return (
    <div className="space-y-3">
      {initialRanking.map((row, i) => (
        <div
          key={row.user_name}
          className={`bg-gray-900 rounded-xl border p-4 flex items-center gap-4 ${
            i === 0 ? 'border-yellow-500' : i === 1 ? 'border-gray-500' : i === 2 ? 'border-amber-700' : 'border-gray-800'
          }`}
        >
          <div className="text-2xl w-8 text-center">{MEDALS[i] ?? `${i + 1}`}</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate">{row.user_name}</p>
            <div className="flex gap-3 mt-1 text-xs text-gray-400">
              <span>🏆 {row.placar_exato} exatos</span>
              <span>✅ {row.resultado_certo} resultados</span>
              <span>❌ {row.erros} erros</span>
            </div>
          </div>
          {row.premio_euros > 0 && (
            <div className="text-right ml-2 bg-green-900/50 border border-green-700 rounded-lg px-3 py-2">
              <p className="text-xl font-black text-green-300">€{row.premio_euros}</p>
              <p className="text-xs text-green-500">prêmio</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
