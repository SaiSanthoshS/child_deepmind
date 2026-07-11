import { useLocation, useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import { Card, CardContent, Typography, Button, Box, TextField, Select, MenuItem, FormControl, InputLabel, Chip, CircularProgress, Alert } from '@mui/material'
import AgeProgressionGrid from '../components/AgeProgressionGrid'
import ImageEditor from '../components/ImageEditor'
import { generateAgeProgression } from '../services/api'
import type { ChildDescriptor, PhotoEnhanceResponse, AgeProgressionResponse, AgeProgressionResult } from '../types'

const TARGET_AGE_OPTIONS = [10, 12, 14, 16, 18, 20, 25]

export default function GeneratePage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const descriptor: ChildDescriptor = state?.descriptor ?? {}
  const photoResult: PhotoEnhanceResponse | null = state?.photoResult ?? null
  const caseId: string = photoResult?.case_id ?? crypto.randomUUID()

  // ── Photo upload ──────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [customPhotoB64, setCustomPhotoB64] = useState('')
  const [customPhotoPreview, setCustomPhotoPreview] = useState('')

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setCustomPhotoB64(dataUrl.split(',')[1] ?? '')
      setCustomPhotoPreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const effectivePhotoB64 = customPhotoB64 || photoResult?.variants[0]?.image_base64 || ''
  const effectivePhotoPreview =
    customPhotoPreview ||
    (photoResult?.variants[0] ? `data:image/jpeg;base64,${photoResult.variants[0].image_base64}` : '')

  // ── Age Progression ───────────────────────────────────────────────────────
  const [currentAge, setCurrentAge] = useState<number>(descriptor.age ?? 8)
  const [gender, setGender] = useState<string>('male')
  const [description, setDescription] = useState<string>('')
  const [selectedTargetAges, setSelectedTargetAges] = useState<number[]>([12, 16])

  function toggleTargetAge(age: number) {
    setSelectedTargetAges((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age].sort((a, b) => a - b)
    )
  }

  const [ageProgressResult, setAgeProgressResult] = useState<AgeProgressionResponse | null>(null)
  const [loadingAge, setLoadingAge] = useState(false)
  const [errorAge, setErrorAge] = useState<string | null>(null)

  async function runAgeProgression() {
    if (!photoFile && !effectivePhotoB64) { setErrorAge('Please upload a photo first.'); return }
    if (selectedTargetAges.length === 0) { setErrorAge('Select at least one target age.'); return }
    setLoadingAge(true); setErrorAge(null)
    try {
      let file = photoFile
      if (!file) {
        const bytes = atob(effectivePhotoB64)
        const arr = new Uint8Array(bytes.length)
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
        file = new File([arr], 'photo.jpg', { type: 'image/jpeg' })
      }
      const res = await generateAgeProgression(
        file, currentAge, selectedTargetAges, gender,
        description || `${gender}, ${currentAge} years old`,
        descriptor.name ?? undefined,
      )
      setAgeProgressResult(res)
      setSelectedBase(null)
      setEditedImageUrl(null)
      setEditedImageFile(null)
    } catch (e) {
      setErrorAge(String(e))
    } finally {
      setLoadingAge(false)
    }
  }

  // ── Image Editor ──────────────────────────────────────────────────────────
  const [selectedBase, setSelectedBase] = useState<AgeProgressionResult | null>(null)
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null)
  const [editedImageFile, setEditedImageFile] = useState<File | null>(null)

  function selectBase(result: AgeProgressionResult) {
    setSelectedBase(result)
    setEditedImageUrl(null)
    setEditedImageFile(null)
  }

  function handleEdited(url: string, file: File) {
    setEditedImageUrl(url)
    setEditedImageFile(file)
  }

  // ── Navigate to posters ───────────────────────────────────────────────────
  async function goToPosters() {
    let finalPhotoB64 = effectivePhotoB64

    if (editedImageFile) {
      finalPhotoB64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '')
        reader.readAsDataURL(editedImageFile)
      })
    } else if (editedImageUrl) {
      const res = await fetch(editedImageUrl)
      const blob = await res.blob()
      finalPhotoB64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '')
        reader.readAsDataURL(blob)
      })
    }

    navigate('/posters', { state: { descriptor, caseId, photoB64: finalPhotoB64 } })
  }

  const canProceed = !!ageProgressResult

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h1" gutterBottom>Generate Materials</Typography>
        <Typography variant="subtitle1" color="text.secondary">Step 3 of 5 — Age-progression & image editing</Typography>
      </Box>

      {/* ── Photo upload ── */}
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>Child's Photo</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {photoResult ? 'Photo carried over from previous step. You can replace it here.' : 'Upload a photo to use for age-progression.'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {effectivePhotoPreview && (
              <img src={effectivePhotoPreview} alt="Child preview" className="w-16 h-16 object-cover rounded-lg border border-gray-700 shadow-sm" />
            )}
            <Button variant="outlined" onClick={() => fileInputRef.current?.click()}>
              {effectivePhotoPreview ? 'Replace photo' : 'Upload photo'}
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            {customPhotoB64 && (
              <Button color="error" size="small" onClick={() => { setPhotoFile(null); setCustomPhotoB64(''); setCustomPhotoPreview('') }}>
                Remove
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* ── Age Progression ── */}
      <Card>
        <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Age Progression</Typography>
            <Chip label="Step 1" color="primary" size="small" />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
            <TextField
              label="Current age"
              type="number"
              value={currentAge}
              onChange={(e) => setCurrentAge(Number(e.target.value))}
              slotProps={{ htmlInput: { min: 1, max: 17 } }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={gender}
                label="Gender"
                onChange={(e) => setGender(e.target.value)}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="Physical description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. brown eyes, black hair, wheat complexion"
            fullWidth
          />

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>Target ages to generate</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {TARGET_AGE_OPTIONS.filter((a) => a > currentAge).map((age) => (
                <Chip
                  key={age}
                  label={`Age ${age}`}
                  clickable
                  onClick={() => toggleTargetAge(age)}
                  color={selectedTargetAges.includes(age) ? "primary" : "default"}
                  variant={selectedTargetAges.includes(age) ? "filled" : "outlined"}
                />
              ))}
            </Box>
          </Box>

          {!loadingAge && (
            <Button
              variant="contained"
              fullWidth
              onClick={runAgeProgression}
              sx={{ py: 1.5 }}
            >
              {ageProgressResult ? 'Regenerate' : 'Generate Age-Progression Images'}
            </Button>
          )}

          {loadingAge && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Generating {selectedTargetAges.length} image{selectedTargetAges.length > 1 ? 's' : ''}… ~20–40 s
              </Typography>
            </Box>
          )}

          {errorAge && <Alert severity="error">{errorAge}</Alert>}

          {ageProgressResult && (
            <Box sx={{ mt: 2 }}>
              <AgeProgressionGrid
                results={ageProgressResult.results}
                gridUrl={ageProgressResult.grid_url}
                currentAge={ageProgressResult.current_age}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Image Editor ── */}
      {ageProgressResult && ageProgressResult.results.length > 0 && (
        <Card>
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6">Edit Image</Typography>
                <Typography variant="body2" color="text.secondary">Select a base image, apply changes, then generate posters</Typography>
              </Box>
              <Chip label="Step 2" color="primary" size="small" />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
              {ageProgressResult.results.map((r) => (
                <Box
                  key={r.target_age}
                  onClick={() => selectBase(r)}
                  sx={{
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: selectedBase?.target_age === r.target_age ? 'primary.main' : 'divider',
                    bgcolor: selectedBase?.target_age === r.target_age ? 'action.selected' : 'background.paper',
                    '&:hover': { borderColor: 'primary.light' }
                  }}
                >
                  <img src={r.image_url} alt={`Age ${r.target_age}`} className="w-20 h-20 object-cover rounded-lg" />
                  <Typography variant="caption">Age {r.target_age}</Typography>
                </Box>
              ))}
            </Box>

            {!selectedBase && (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                ← Select an age-progressed image above to begin editing
              </Typography>
            )}

            {selectedBase && (
              <Box sx={{ mt: 1 }}>
                <ImageEditor imageUrl={selectedBase.image_url} onEdited={handleEdited} />
              </Box>
            )}

            {editedImageUrl && (
              <Alert severity="success">✓ Edited image ready — posters will use this version</Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Generate Posters CTA ── */}
      {canProceed && (
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={goToPosters}
          sx={{ py: 2, fontSize: '1.1rem', borderRadius: 3 }}
        >
          Generate Posters →
        </Button>
      )}
    </Box>
  )
}
