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
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="mb-8 text-center pt-8">
        <h1 className="text-4xl font-bold tracking-tight mb-3 text-white">Dispatch Alerts</h1>
        <p className="text-slate-300 text-lg">Send to 8,000+ railway stations, NGOs & police</p>
      </div>

      {overallStatus === 'idle' && (
        <div className="mui-paper p-8 text-center">
          <p className="text-[var(--text-primary)] text-lg mb-8">
            Ready to dispatch <strong className="text-[var(--error-text)]">missing child alert</strong> for {descriptor.name ?? 'this child'} simultaneously to:
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-8">
            <div className="flex flex-col items-center">
              <span className="text-[var(--primary-color)] text-3xl mb-1">🚂</span>
              <p className="font-semibold text-lg">8,000</p>
              <p className="text-[var(--text-secondary)] text-sm uppercase">Railway Stations</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[var(--success-text)] text-3xl mb-1">👥</span>
              <p className="font-semibold text-lg">500</p>
              <p className="text-[var(--text-secondary)] text-sm uppercase">NGO WhatsApps</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[var(--warning-text)] text-3xl mb-1">🛡️</span>
              <p className="font-semibold text-lg">600</p>
              <p className="text-[var(--text-secondary)] text-sm uppercase">Police Stations</p>
            </div>
          </div>

          <button
            onClick={dispatch}
            disabled={loading || !caseId}
            className="mui-btn-primary !bg-[var(--error-text)] hover:!opacity-80 text-lg py-3 px-8"
          >
            DISPATCH NOW
          </button>
        </div>
      )}

      {overallStatus !== 'idle' && channelStatuses.length > 0 && (
        <div className="mui-paper p-6">
          <DispatchPanel channelStatuses={channelStatuses} overallStatus={overallStatus} />
        </div>
      )}

      {overallStatus === 'done' && (
        <div className="mt-4 bg-[var(--success-bg)] text-[var(--success-text)] rounded p-6 text-center border border-[var(--success-border)]">
          <div className="flex justify-center mb-3">
            <span className="text-4xl text-[var(--success-text)]">✅</span>
          </div>
          <p className="font-bold text-xl mb-1">Alert dispatched successfully</p>
          <p className="text-sm">All networks notified in their respective local languages</p>
        </div>
      )}

      {error && (
        <div className="bg-[var(--error-bg)] text-[var(--error-text)] rounded px-4 py-3 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
