import { useState, useRef } from 'react'
import { Card, CardContent, Typography, Button, Box, Alert, CircularProgress, Grid } from '@mui/material'
import { matchFoundChild } from '../services/api'
import type { MatchResponse } from '../types'

export default function FoundChildPage() {
  const [photo, setPhoto] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matchData, setMatchData] = useState<MatchResponse | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      setPreviewUrl(URL.createObjectURL(file))
      setMatchData(null)
      setError(null)
    }
  }

  async function handleSearch() {
    if (!photo) return

    setLoading(true)
    setError(null)
    
    // Automatically get geolocation
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await matchFoundChild(photo, position.coords.latitude, position.coords.longitude)
          setMatchData(res)
        } catch (e) {
          setError(String(e))
        } finally {
          setLoading(false)
        }
      },
      (geoError) => {
        // Fallback without location if user denies
        console.warn('Geolocation error:', geoError)
        matchFoundChild(photo)
          .then(res => setMatchData(res))
          .catch(e => setError(String(e)))
          .finally(() => setLoading(false))
      }
    )
  }

  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h1" gutterBottom>Report Found Child</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Upload a photo of a child you have found, and we will cross-reference it with missing child reports.
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <input
            type="file"
            accept="image/*"
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Button 
            variant="outlined" 
            size="large" 
            onClick={() => fileInputRef.current?.click()}
            sx={{ py: 3, borderStyle: 'dashed' }}
          >
            {photo ? 'Change Photo' : 'Click to Upload Photo of Found Child'}
          </Button>

          {previewUrl && (
            <Box sx={{ textAlign: 'center' }}>
              <img src={previewUrl} alt="Found child" style={{ maxHeight: '300px', borderRadius: '8px' }} />
            </Box>
          )}

          <Button
            variant="contained"
            size="large"
            disabled={!photo || loading}
            onClick={handleSearch}
            sx={{ py: 2, fontSize: '1.1rem' }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Search Database'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error">{error}</Alert>
      )}

      {matchData && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h5" gutterBottom>
            {matchData.matches.length > 0 ? `Found ${matchData.matches.length} Potential Matches` : 'No Matches Found (>60% similarity)'}
          </Typography>
          
          <Grid container spacing={3}>
            {matchData.matches.map((match, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <img src={match.image_base64} alt={`Match ${idx}`} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
                  <CardContent>
                    <Typography variant="h6" color={match.similarity_score > 80 ? 'success.main' : 'warning.main'}>
                      {match.similarity_score}% Match
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <strong>Case Ref:</strong> {match.case_detail}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  )
}
