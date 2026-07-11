import { useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import DispatchPanel from '../components/DispatchPanel'
import { dispatchAlert, getDispatchStatus } from '../services/api'
import type { ChildDescriptor, ChannelStatus } from '../types'

export default function DispatchPage() {
  const { state } = useLocation()
  const descriptor: ChildDescriptor = state?.descriptor ?? {}
  const caseId: string = state?.caseId ?? ''

  const [channelStatuses, setChannelStatuses] = useState<ChannelStatus[]>([])
  const [overallStatus, setOverallStatus] = useState('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function dispatch() {
    setLoading(true)
    setError(null)
    try {
      const res = await dispatchAlert({
        case_id: caseId,
        descriptor,
        channels: ['railway', 'ngo_whatsapp', 'police'],
      })
      setChannelStatuses(res.channel_statuses)
      setOverallStatus('dispatching')
      startPolling()
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  function startPolling() {
    pollRef.current = setInterval(async () => {
      try {
        const status = await getDispatchStatus(caseId)
        setChannelStatuses(status.channel_statuses)
        setOverallStatus(status.overall_status)
        if (status.overall_status === 'done' || status.overall_status.startsWith('failed')) {
          clearInterval(pollRef.current!)
        }
      } catch (_) {}
    }, 2000)
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  return (
    <div className="max-w-xl mx-auto px-4 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dispatch Alerts</h1>
        <p className="text-gray-500 text-sm mt-1">Step 3 of 3 — Send to 8,000+ railway stations, NGOs & police</p>
      </div>

      {overallStatus === 'idle' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-600 mb-6">
            Ready to dispatch <strong>missing child alert</strong> for {descriptor.name ?? 'this child'} simultaneously to:
          </p>
          <ul className="text-sm text-gray-500 text-left mb-6 space-y-1 list-disc list-inside">
            <li>8,000 railway station networks</li>
            <li>500 NGO WhatsApp groups</li>
            <li>600 local police stations</li>
          </ul>
          <button
            onClick={dispatch}
            disabled={loading || !caseId}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 disabled:opacity-40 transition-colors"
          >
            DISPATCH NOW
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      {channelStatuses.length > 0 && (
        <DispatchPanel channelStatuses={channelStatuses} overallStatus={overallStatus} />
      )}

      {overallStatus === 'done' && (
        <div className="bg-green-50 border border-green-300 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="font-bold text-green-800 text-lg">Alert dispatched successfully</p>
          <p className="text-sm text-green-600 mt-1">All networks notified in local languages</p>
        </div>
      )}
    </div>
  )
}
