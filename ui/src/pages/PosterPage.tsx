import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Card, CardContent, Typography, Button, Box, Alert, CircularProgress, Chip } from '@mui/material'
import PosterGrid from '../components/PosterGrid'
import { generatePosters } from '../services/api'
import type { ChildDescriptor, PosterVariant } from '../types'

const LANGUAGE_CHIPS = [
  'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi',
  'Tamil', 'Urdu', 'Gujarati', 'Kannada', 'Odia', 'Punjabi', 'Malayalam',
]

export default function PosterPage() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const descriptor: ChildDescriptor = state?.descriptor ?? {}
  const caseId: string = state?.caseId ?? crypto.randomUUID()
  const photoB64: string = state?.photoB64 ?? ''

  const [posters, setPosters] = useState<PosterVariant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await generatePosters({ case_id: caseId, descriptor, photo_base64: photoB64 })
      setPosters(res.posters)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  // Auto-start on mount
  useEffect(() => { generate() }, [])

  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h1" gutterBottom>Missing Child Posters</Typography>
          <Typography variant="subtitle1" color="text.secondary">Step 4 of 5 — 12 languages generated from the edited image</Typography>
        </Box>
        {posters.length > 0 && (
          <Button variant="outlined" size="small" onClick={generate}>
            Regenerate
          </Button>
        )}
      </Box>

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">Generating 12 posters in 12 languages…</Typography>
              <Typography variant="caption" color="text.secondary">~30–40 s</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {LANGUAGE_CHIPS.map((lang) => (
                <Chip
                  key={lang}
                  label={lang}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                />
              ))}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Building consistent layout in all scripts — each poster shares the same template
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={generate}>
              Try again
            </Button>
          }
        >
          <Typography variant="subtitle2">Failed to generate posters</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {/* Poster grid */}
      {posters.length > 0 && (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="subtitle2" color="text.primary">{posters.length} posters ready</Typography>
              <Typography variant="caption" color="text.secondary">Click any poster to download</Typography>
            </Box>
            <PosterGrid posters={posters} />
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      {posters.length > 0 && (
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={() => navigate('/dispatch', { state: { descriptor, caseId } })}
          sx={{ py: 2, fontSize: '1.1rem', borderRadius: 3 }}
        >
          Dispatch Alerts →
        </Button>
      )}
    </Box>
  )
}
