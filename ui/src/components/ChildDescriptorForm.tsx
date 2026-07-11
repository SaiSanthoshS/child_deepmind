import type { ChildDescriptor } from '../types'
import { Box, TextField } from '@mui/material'

interface Props {
  descriptor: ChildDescriptor
  onChange: (updated: ChildDescriptor) => void
}

const FIELDS: { key: keyof ChildDescriptor; label: string; type?: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'age', label: 'Age', type: 'number' },
  { key: 'height_cm', label: 'Height (cm)', type: 'number' },
  { key: 'weight_kg', label: 'Weight (kg)', type: 'number' },
  { key: 'distinguishing_marks', label: 'Distinguishing Marks' },
  { key: 'last_seen_location', label: 'Last Seen Location' },
  { key: 'last_seen_date', label: 'Last Seen Date', type: 'date' },
  { key: 'clothing_description', label: 'Clothing Description' },
]

export default function ChildDescriptorForm({ descriptor, onChange }: Props) {
  function handleChange(key: keyof ChildDescriptor, value: string) {
    onChange({
      ...descriptor,
      [key]: value === '' ? undefined : value,
    })
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
      {FIELDS.map(({ key, label, type }) => (
        <TextField
          key={key}
          label={label}
          type={type ?? 'text'}
          value={descriptor[key] ?? ''}
          onChange={(e) => handleChange(key, e.target.value)}
          fullWidth
          variant="outlined"
          slotProps={type === 'date' ? { inputLabel: { shrink: true } } : undefined}
        />
      ))}
    </Box>
  )
}
