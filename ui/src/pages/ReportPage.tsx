import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, Typography, Button, Box, Alert } from '@mui/material'
import VoiceRecorder from '../components/VoiceRecorder'
import PhotoUpload from '../components/PhotoUpload'
import { transcribeVoice, enhancePhoto } from '../services/api'
import type { ChildDescriptor, PhotoEnhanceResponse } from '../types'

export default function ReportPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [descriptor, setDescriptor] = useState<ChildDescriptor | null>(null)
  const [photoResult, setPhotoResult] = useState<PhotoEnhanceResponse | null>(null)

  async function handleAudio(blob: Blob) {
    setLoading(true)
    setError(null)
    try {
      const result = await transcribeVoice(blob)
      setDescriptor(result.descriptor)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handlePhoto(file: File) {
    setLoading(true)
    setError(null)
    try {
      const result = await enhancePhoto(file, photoResult?.case_id)
      setPhotoResult(result)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  function proceed() {
    navigate('/review', { state: { descriptor, photoResult } })
  }

  return (
    <Box sx={{ maxWidth: '600px', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h1" gutterBottom>Report Missing Child</Typography>
        <Typography variant="subtitle1" color="text.secondary">Step 1 of 4 — Voice description & photo</Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>Describe your child (any language)</Typography>
          <Box sx={{ mt: 2 }}>
            <VoiceRecorder onRecorded={handleAudio} disabled={loading} />
          </Box>
          {descriptor && (
            <Alert severity="success" sx={{ mt: 3, borderRadius: 2 }}>
              Detected: <strong>{descriptor.name ?? 'Unknown'}</strong>, Age {descriptor.age ?? '?'} — language: {descriptor.language_used ?? 'auto'}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>Upload a photo</Typography>
          <Box sx={{ mt: 2 }}>
            <PhotoUpload onFile={handlePhoto} disabled={loading} />
          </Box>
          {photoResult && (
            <Alert severity="success" sx={{ mt: 3, borderRadius: 2 }}>
              Photo enhanced — {photoResult.variants.length} angle variants generated
            </Alert>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      )}

      {loading && (
        <Typography align="center" color="primary.main" className="animate-pulse">
          Processing…
        </Typography>
      )}

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={proceed}
        disabled={!descriptor && !photoResult}
        sx={{ py: 2, fontSize: '1.1rem', borderRadius: 3 }}
      >
        Continue to Review →
      </Button>
    </Box>
  )
}
