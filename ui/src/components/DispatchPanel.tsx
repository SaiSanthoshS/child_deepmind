import type { ChannelStatus } from '../types'

interface Props {
  channelStatuses: ChannelStatus[]
  overallStatus: string
}

const CHANNEL_LABELS: Record<string, string> = {
  railway: 'Railway Networks',
  ngo_whatsapp: 'NGO WhatsApp Groups',
  police: 'Police Stations',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-gray-400',
  in_progress: 'text-yellow-500',
  done: 'text-green-600',
  failed: 'text-red-500',
}

export default function DispatchPanel({ channelStatuses, overallStatus }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Overall:</span>
        <span className={`text-sm font-semibold ${overallStatus === 'done' ? 'text-green-600' : overallStatus.startsWith('failed') ? 'text-red-500' : 'text-yellow-500'}`}>
          {overallStatus}
        </span>
      </div>
      {channelStatuses.map((cs) => (
        <div key={cs.channel} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-800">{CHANNEL_LABELS[cs.channel] ?? cs.channel}</span>
            <span className={`text-sm font-semibold ${STATUS_COLORS[cs.status] ?? 'text-gray-500'}`}>
              {cs.status}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: cs.total > 0 ? `${(cs.sent / cs.total) * 100}%` : '0%' }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{cs.sent.toLocaleString()} / {cs.total.toLocaleString()} dispatched</p>
        </div>
      ))}
    </div>
  )
}
