import type { ChildDescriptor } from '../types'

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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {FIELDS.map(({ key, label, type }) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
          <input
            type={type ?? 'text'}
            value={descriptor[key] ?? ''}
            onChange={(e) => handleChange(key, e.target.value)}
            className="mui-input"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        </div>
      ))}
    </div>
  )
}
