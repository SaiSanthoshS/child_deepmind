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

const STATUS_ICONS: Record<string, string> = {
  pending: '⏳',
  in_progress: '🔄',
  done: '✅',
  failed: '❌',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-[var(--text-secondary)] bg-[var(--bg-color)] border-[var(--border-color)]',
  in_progress: 'text-[var(--warning-text)] bg-[var(--warning-bg)] border-[var(--warning-border)]',
  done: 'text-[var(--success-text)] bg-[var(--success-bg)] border-[var(--success-border)]',
  failed: 'text-[var(--error-text)] bg-[var(--error-bg)] border-[var(--error-border)]',
}

export default function DispatchPanel({ channelStatuses, overallStatus }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
        <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Live Dispatch Status</span>
        <div className="flex items-center gap-2">
          {overallStatus === 'in_progress' && <span className="text-[var(--primary-color)] text-sm font-bold animate-pulse">●</span>}
          <span className={`text-sm font-bold uppercase tracking-wider ${overallStatus === 'done' ? 'text-[var(--success-text)]' : overallStatus.startsWith('failed') ? 'text-[var(--error-text)]' : 'text-[var(--warning-text)]'}`}>
            {overallStatus}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channelStatuses.map((cs) => (
          <div 
            key={cs.channel} 
            className={`rounded p-5 border shadow-sm transition-colors duration-300 ${STATUS_COLORS[cs.status] ?? STATUS_COLORS.pending}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">{STATUS_ICONS[cs.status] ?? STATUS_ICONS.pending}</span>
                <span className="font-semibold text-[var(--text-primary)] tracking-wide">{CHANNEL_LABELS[cs.channel] ?? cs.channel}</span>
              </div>
            </div>
            <div className="w-full bg-[var(--border-color)] rounded-full h-2 overflow-hidden">
              <div
                style={{ width: cs.total > 0 ? `${(cs.sent / cs.total) * 100}%` : '0%' }}
                className={`h-full rounded-full transition-all duration-500 ${cs.status === 'done' ? 'bg-[var(--success-text)]' : 'bg-[var(--warning-text)]'}`}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs font-mono text-[var(--text-secondary)]">
              <span>{cs.sent.toLocaleString()} sent</span>
              <span>{cs.total.toLocaleString()} total</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
