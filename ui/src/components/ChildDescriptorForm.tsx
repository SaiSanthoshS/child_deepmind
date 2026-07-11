import type { ChildDescriptor } from '../types'

const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata']

interface Props {
  descriptor: ChildDescriptor
  onChange: (updated: ChildDescriptor) => void
}

export default function ChildDescriptorForm({ descriptor, onChange }: Props) {
  function set(key: keyof ChildDescriptor, value: string) {
    onChange({ ...descriptor, [key]: value === '' ? undefined : value })
  }

  const inputClass = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full'

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: Name */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Name</label>
        <input type="text" value={descriptor.name ?? ''} onChange={(e) => set('name', e.target.value)} className={inputClass} />
      </div>

      {/* Row 2: Age + Gender */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Age</label>
          <input type="number" value={descriptor.age ?? ''} onChange={(e) => set('age', e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Gender</label>
          <select value={descriptor.gender ?? ''} onChange={(e) => set('gender', e.target.value)} className={inputClass}>
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      {/* Row 3: City */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">City</label>
        <select value={descriptor.city ?? ''} onChange={(e) => set('city', e.target.value)} className={inputClass}>
          <option value="">Select city…</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Row 4: Height + Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Height (cm)</label>
          <input type="number" value={descriptor.height_cm ?? ''} onChange={(e) => set('height_cm', e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Weight (kg)</label>
          <input type="number" value={descriptor.weight_kg ?? ''} onChange={(e) => set('weight_kg', e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Row 5: Distinguishing marks */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Distinguishing Marks</label>
        <input type="text" value={descriptor.distinguishing_marks ?? ''} onChange={(e) => set('distinguishing_marks', e.target.value)}
          placeholder="e.g. scar on left cheek, birthmark on neck" className={inputClass} />
      </div>

      {/* Row 6: Last seen location + date */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Last Seen Location</label>
          <input type="text" value={descriptor.last_seen_location ?? ''} onChange={(e) => set('last_seen_location', e.target.value)}
            placeholder="e.g. Central Park, Mall" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Last Seen Date</label>
          <input type="date" value={descriptor.last_seen_date ?? ''} onChange={(e) => set('last_seen_date', e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Row 7: Clothing */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Clothing Description</label>
        <input type="text" value={descriptor.clothing_description ?? ''} onChange={(e) => set('clothing_description', e.target.value)}
          placeholder="e.g. blue jeans, red t-shirt" className={inputClass} />
      </div>
    </div>
  )
}
