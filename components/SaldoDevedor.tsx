'use client'
import { useState } from 'react'

interface SaldoRow {
  nome: string
  jogos: number
  devido: number
  ganhou: number
  pago: number
  saldo: number
}

interface AliasRow {
  alias_name: string
  canonical_name: string
}

interface PaymentRow {
  id: number
  nome: string
  amount: number
  notes: string | null
}

interface Props {
  initialSaldo: SaldoRow[]
  initialAliases: AliasRow[]
  initialPayments: PaymentRow[]
  allNames: string[]
}

function fmt(n: number) {
  const abs = Math.abs(Number(n))
  const str = abs % 1 === 0 ? `€${abs}` : `€${abs.toFixed(2)}`
  return n < 0 ? `-${str}` : `+${str}`
}

export default function SaldoDevedor({ initialSaldo, initialAliases, initialPayments, allNames }: Props) {
  const [saldo] = useState(initialSaldo)
  const [aliases, setAliases] = useState(initialAliases)
  const [payments, setPayments] = useState(initialPayments)
  const [showAliases, setShowAliases] = useState(false)
  const [showPayments, setShowPayments] = useState(false)
  const [aliasFrom, setAliasFrom] = useState('')
  const [aliasTo, setAliasTo] = useState('')
  const [saving, setSaving] = useState(false)
  const [payNome, setPayNome] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payNotes, setPayNotes] = useState('')
  const [payingSaving, setPayingSaving] = useState(false)

  const saldoNames = [...new Set(saldo.map((r) => r.nome))].sort()

  async function addAlias() {
    if (!aliasFrom || !aliasTo || aliasFrom === aliasTo) return
    setSaving(true)
    await fetch('/api/aliases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias_name: aliasFrom, canonical_name: aliasTo }),
    })
    setSaving(false)
    setAliasFrom('')
    setAliasTo('')
    window.location.reload()
  }

  async function removeAlias(alias: string) {
    await fetch(`/api/aliases?alias_name=${encodeURIComponent(alias)}`, { method: 'DELETE' })
    setAliases((prev) => prev.filter((a) => a.alias_name !== alias))
    window.location.reload()
  }

  async function addPayment() {
    if (!payNome || !payAmount || isNaN(Number(payAmount))) return
    setPayingSaving(true)
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: payNome, amount: Number(payAmount), notes: payNotes || null }),
    })
    const data = await res.json()
    setPayingSaving(false)
    setPayNome('')
    setPayAmount('')
    setPayNotes('')
    if (res.ok) {
      setPayments((prev) => [data, ...prev])
      window.location.reload()
    }
  }

  async function removePayment(id: number) {
    await fetch(`/api/payments?id=${id}`, { method: 'DELETE' })
    setPayments((prev) => prev.filter((p) => p.id !== id))
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xl font-black text-white">💸 Saldo</h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowPayments((v) => !v); setShowAliases(false) }}
            className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            💰 Pagamentos
          </button>
          <button
            onClick={() => { setShowAliases((v) => !v); setShowPayments(false) }}
            className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            ⚙️ Nomes
          </button>
        </div>
      </div>

      {/* Payment recorder */}
      {showPayments && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 space-y-4">
          <p className="text-xs text-gray-400">Registre quando alguém resgatar seus ganhos — o valor é descontado do saldo pendente.</p>
          <div className="flex gap-2 flex-wrap">
            <select
              value={payNome}
              onChange={(e) => setPayNome(e.target.value)}
              className="flex-1 min-w-0 bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">Quem recebeu...</option>
              {saldoNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <input
              type="number"
              placeholder="€ valor"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-24 bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              min={0}
              step={0.5}
            />
            <input
              type="text"
              placeholder="Obs (opcional)"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              className="flex-1 min-w-[100px] bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              onClick={addPayment}
              disabled={payingSaving || !payNome || !payAmount}
              className="bg-yellow-400 hover:bg-yellow-300 text-green-900 font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {payingSaving ? '...' : 'Salvar'}
            </button>
          </div>
          {payments.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Histórico</p>
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm bg-gray-800 rounded-lg px-3 py-2">
                  <span className="text-gray-300 truncate">
                    <span className="text-white font-medium">{p.nome}</span>
                    <span className="text-yellow-400 font-bold ml-2">€{Number(p.amount).toFixed(2)}</span>
                    {p.notes && <span className="text-gray-500 ml-2">· {p.notes}</span>}
                  </span>
                  <button onClick={() => removePayment(p.id)} className="text-red-400 hover:text-red-300 text-xs ml-2 shrink-0">remover</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alias manager */}
      {showAliases && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 space-y-4">
          <p className="text-xs text-gray-400">Mescle nomes duplicados — o alias some e os dados ficam no nome canonical.</p>
          <div className="flex gap-2 flex-wrap">
            <select
              value={aliasFrom}
              onChange={(e) => setAliasFrom(e.target.value)}
              className="flex-1 min-w-0 bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">Este nome...</option>
              {allNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="self-center text-gray-500 text-sm">→ é o mesmo que →</span>
            <select
              value={aliasTo}
              onChange={(e) => setAliasTo(e.target.value)}
              className="flex-1 min-w-0 bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">Este nome</option>
              {allNames.filter((n) => n !== aliasFrom).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <button
              onClick={addAlias}
              disabled={saving || !aliasFrom || !aliasTo}
              className="bg-yellow-400 hover:bg-yellow-300 text-green-900 font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? '...' : 'Mesclar'}
            </button>
          </div>
          {aliases.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Mesclagens ativas</p>
              {aliases.map((a) => (
                <div key={a.alias_name} className="flex items-center justify-between text-sm bg-gray-800 rounded-lg px-3 py-2">
                  <span className="text-gray-400"><span className="text-white">{a.alias_name}</span> → {a.canonical_name}</span>
                  <button onClick={() => removeAlias(a.alias_name)} className="text-red-400 hover:text-red-300 text-xs">remover</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saldo table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
        {saldo.map((row) => {
          const s = Number(row.saldo)
          const pago = Number(row.pago)
          return (
            <div key={row.nome} className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{row.nome}</p>
                <p className="text-xs text-gray-500">
                  {row.jogos} jogo{row.jogos !== 1 ? 's' : ''} · €{row.jogos} devidos · €{Number(row.ganhou).toFixed(2)} ganhos
                  {pago > 0 && <span className="text-orange-400"> · €{pago.toFixed(2)} resgatados</span>}
                </p>
              </div>
              <span className={`font-black text-lg shrink-0 ${s >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {fmt(s)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
