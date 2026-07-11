import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Card, CardContent, Typography, Button, Box } from '@mui/material'
import ChildDescriptorForm from '../components/ChildDescriptorForm'
import type { ChildDescriptor, PhotoEnhanceResponse } from '../types'

export default function ReviewPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [descriptor, setDescriptor] = useState<ChildDescriptor>(state?.descriptor ?? {})
  const photoResult: PhotoEnhanceResponse | null = state?.photoResult ?? null

  function proceed() {
    navigate('/generate', { state: { descriptor, photoResult } })
  }

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h1" gutterBottom>Review & Edit Details</Typography>
        <Typography variant="subtitle1" color="text.secondary">Step 2 of 4 — Correct any errors from voice transcription</Typography>
      </Box>

      {photoResult && (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>Enhanced Photo Variants</Typography>
            <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2, mt: 2 }}>
              {photoResult.variants.map((v) => (
                <Box key={v.angle} sx={{ flexShrink: 0, textAlign: 'center' }}>
                  <img
                    src={`data:${v.mime_type};base64,${v.image_base64}`}
                    alt={v.angle}
                    className="w-28 h-28 object-cover rounded-lg border border-gray-700 shadow-sm"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textTransform: 'capitalize' }}>
                    {v.angle}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>Child Details</Typography>
          <Box sx={{ mt: 3 }}>
            <ChildDescriptorForm descriptor={descriptor} onChange={setDescriptor} />
          </Box>
        </CardContent>
      </Card>

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={proceed}
        sx={{ py: 2, fontSize: '1.1rem', borderRadius: 3 }}
      >
        Generate Video & Posters →
      </Button>
    </Box>
  )
}
