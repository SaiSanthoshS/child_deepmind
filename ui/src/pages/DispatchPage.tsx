import { useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, Typography, Button, Box, Alert } from '@mui/material'
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
    <Box sx={{ maxWidth: '600px', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h1" gutterBottom>Dispatch Alerts</Typography>
        <Typography variant="subtitle1" color="text.secondary">Step 5 of 5 — Send to 8,000+ railway stations, NGOs & police</Typography>
      </Box>

      {overallStatus === 'idle' && (
        <Card>
          <CardContent sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="body1" color="text.secondary">
              Ready to dispatch <strong>missing child alert</strong> for {descriptor.name ?? 'this child'} simultaneously to:
            </Typography>
            
            <Box component="ul" sx={{ textAlign: 'left', color: 'text.secondary', typography: 'body2', mx: 'auto', display: 'inline-block' }}>
              <li>8,000 railway station networks</li>
              <li>500 NGO WhatsApp groups</li>
              <li>600 local police stations</li>
            </Box>
            
            <Button
              variant="contained"
              color="error"
              size="large"
              onClick={dispatch}
              disabled={loading || !caseId}
              sx={{ py: 2, fontSize: '1.25rem', fontWeight: 'bold', borderRadius: 3, mt: 1 }}
            >
              DISPATCH NOW
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      )}

      {channelStatuses.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <DispatchPanel channelStatuses={channelStatuses} overallStatus={overallStatus} />
        </Box>
      )}

      {overallStatus === 'done' && (
        <Alert severity="success" icon={false} sx={{ py: 3, borderRadius: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h3" sx={{ mb: 1 }}>✅</Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Alert dispatched successfully</Typography>
          <Typography variant="body2">All networks notified in local languages</Typography>
        </Alert>
      )}
    </Box>
  )
}
