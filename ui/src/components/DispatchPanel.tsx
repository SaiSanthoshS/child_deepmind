import { useState, useEffect, useRef } from 'react'
import { getDispatchLocations } from '../services/api'
import type { ChannelStatus } from '../types'

interface Props {
  channelStatuses: ChannelStatus[]
  overallStatus: string
  dispatching: boolean
  city?: string
}

type RecipientStatus = 'pending' | 'notified' | 'acknowledged' | 'failed'

interface Recipient {
  id: string
  name: string
  type: 'railway' | 'ngo'
  location: string
  contact: string
  status: RecipientStatus
  updatedAt: string
}

const FALLBACK_RAILWAY = [
  { name: 'New Delhi Railway Station',  location: 'New Delhi',  contact: 'SM: Rajesh Kumar' },
  { name: 'Mumbai CST',                  location: 'Mumbai',     contact: 'SM: Priya Nair' },
  { name: 'Howrah Junction',             location: 'Kolkata',    contact: 'SM: Debashish Roy' },
  { name: 'Chennai Central',             location: 'Chennai',    contact: 'SM: Anand Rajan' },
  { name: 'Bengaluru City Junction',     location: 'Bengaluru',  contact: 'SM: Suresh Babu' },
]

const FALLBACK_NGOS = [
  { name: 'Bachpan Bachao Andolan',     location: 'New Delhi',  contact: 'Coordinator: Meera Singh' },
  { name: 'CRY – Child Rights',         location: 'Mumbai',     contact: 'Coordinator: Farhan Sheikh' },
  { name: 'Childline India Foundation', location: 'Mumbai',     contact: 'Coordinator: David Dsouza' },
]

const STATUS_META: Record<RecipientStatus, { label: string; bg: string; text: string }> = {
  pending:      { label: 'Pending',      bg: 'bg-gray-100',  text: 'text-gray-500'  },
  notified:     { label: 'Notified',     bg: 'bg-blue-50',   text: 'text-blue-600'  },
  acknowledged: { label: 'Acknowledged', bg: 'bg-green-50',  text: 'text-green-700' },
  failed:       { label: 'Failed',       bg: 'bg-red-50',    text: 'text-red-600'   },
}

const CHANNEL_LABELS: Record<string, string> = {
  railway: 'Railway Networks',
  ngo_whatsapp: 'NGO WhatsApp Groups',
  police: 'Police Stations',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'text-gray-400', in_progress: 'text-yellow-500',
  done: 'text-green-600', failed: 'text-red-500',
}

function ts() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function buildRecipients(
  railway: { name: string; location: string; contact: string }[],
  ngos: { name: string; location: string; contact: string }[],
): Recipient[] {
  return [
    ...railway.map((r, i) => ({ id: `r${i}`, type: 'railway' as const, ...r, status: 'pending' as RecipientStatus, updatedAt: '' })),
    ...ngos.map((r, i)    => ({ id: `n${i}`, type: 'ngo' as const,     ...r, status: 'pending' as RecipientStatus, updatedAt: '' })),
  ]
}

export default function DispatchPanel({ channelStatuses, overallStatus, dispatching, city }: Props) {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [locLoading, setLocLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const indexRef = useRef(0)
  const phaseRef = useRef<'notifying' | 'acknowledging' | 'done'>('notifying')
  const startedRef = useRef(false)

  // Trigger once when channelStatuses first appear (dispatch just fired)
  useEffect(() => {
    if (channelStatuses.length === 0 || startedRef.current) return
    startedRef.current = true

    async function load() {
      setLocLoading(true)
      let list: Recipient[] = buildRecipients(FALLBACK_RAILWAY, FALLBACK_NGOS)
      if (city) {
        try {
          const data = await getDispatchLocations(city)
          list = buildRecipients(data.railway_stations ?? [], data.ngos ?? [])
        } catch {
          // fall back to defaults
        }
      }
      setLocLoading(false)
      indexRef.current = 0
      phaseRef.current = 'notifying'
      setRecipients(list)
      tick(list.length)
    }

    load()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [channelStatuses.length]) // eslint-disable-line react-hooks/exhaustive-deps

  function tick(total: number) {
    timerRef.current = setTimeout(() => {
      const idx = indexRef.current
      if (phaseRef.current === 'notifying') {
        if (idx < total) {
          setRecipients(prev => prev.map((r, i) => i === idx ? { ...r, status: 'notified', updatedAt: ts() } : r))
          indexRef.current++
          tick(total)
        } else {
          // All notified — start acknowledgement phase
          phaseRef.current = 'acknowledging'
          indexRef.current = 0
          tick(total)
        }
      } else if (phaseRef.current === 'acknowledging') {
        if (idx < total) {
          const rand = Math.random()
          // ~60% acknowledge, ~8% fail, ~32% stay notified (no response)
          const next: RecipientStatus = rand < 0.60 ? 'acknowledged' : rand < 0.68 ? 'failed' : 'notified'
          if (next !== 'notified') {
            setRecipients(prev => prev.map((r, i) => i === idx ? { ...r, status: next, updatedAt: ts() } : r))
          }
          indexRef.current++
          tick(total)
        } else {
          phaseRef.current = 'done'
        }
      }
    }, 400 + Math.random() * 600)
  }

  const railwayRows = recipients.filter(r => r.type === 'railway')
  const ngoRows     = recipients.filter(r => r.type === 'ngo')
  const ackCount      = recipients.filter(r => r.status === 'acknowledged').length
  const notifiedCount = recipients.filter(r => r.status === 'notified').length
  const failedCount   = recipients.filter(r => r.status === 'failed').length
  const pendingCount  = recipients.filter(r => r.status === 'pending').length

  function RecipientTable({ rows, title }: { rows: Recipient[]; title: string }) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 font-medium">
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2 hidden sm:table-cell">Location</th>
                <th className="text-left px-3 py-2 hidden md:table-cell">Contact</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2 hidden sm:table-cell">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(r => {
                const meta = STATUS_META[r.status]
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-gray-800">{r.name}</td>
                    <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell">{r.location}</td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs hidden md:table-cell">{r.contact}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.text}`}>
                        {r.status === 'notified'     && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                        {r.status === 'acknowledged' && '✓ '}
                        {r.status === 'failed'       && '✕ '}
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 text-right hidden sm:table-cell">{r.updatedAt || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Channel progress bars */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Overall:</span>
          <span className={`text-sm font-semibold ${overallStatus === 'done' ? 'text-green-600' : overallStatus.startsWith('failed') ? 'text-red-500' : 'text-yellow-500'}`}>
            {overallStatus}
          </span>
        </div>
        {channelStatuses.map(cs => (
          <div key={cs.channel} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-800">{CHANNEL_LABELS[cs.channel] ?? cs.channel}</span>
              <span className={`text-sm font-semibold ${STATUS_COLORS[cs.status] ?? 'text-gray-500'}`}>{cs.status}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: cs.total > 0 ? `${(cs.sent / cs.total) * 100}%` : '0%' }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">{cs.sent.toLocaleString()} / {cs.total.toLocaleString()} dispatched</p>
          </div>
        ))}
      </div>

      {/* Recipient tables */}
      {locLoading && (
        <p className="text-sm text-blue-600 animate-pulse">
          Fetching stations and NGOs in {city}…
        </p>
      )}

      {recipients.length > 0 && (
        <div className="flex flex-col gap-5">
          {/* Summary strip */}
          <div className="flex gap-3 text-sm flex-wrap">
            {city && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">{city}</span>}
            {pendingCount > 0  && <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full font-medium">{pendingCount} pending</span>}
            {notifiedCount > 0 && <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">{notifiedCount} notified</span>}
            {ackCount > 0      && <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium">{ackCount} acknowledged</span>}
            {failedCount > 0   && <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full font-medium">{failedCount} failed</span>}
          </div>

          {railwayRows.length > 0 && <RecipientTable rows={railwayRows} title="Railway Stations" />}
          {ngoRows.length > 0     && <RecipientTable rows={ngoRows}     title="NGO WhatsApp Groups" />}
        </div>
      )}
    </div>
  )
}
