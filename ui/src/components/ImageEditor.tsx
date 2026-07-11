import { useState } from 'react'
import { editImage } from '../services/api'

interface Props {
  /** URL of the image to edit (must be fetchable from the browser) */
  imageUrl: string
  /** Called with the edited image — a local object-URL blob */
  onEdited: (editedObjectUrl: string, editedFile: File) => void
}

// ── Preset edit categories ────────────────────────────────────────────────────

const PRESETS: { category: string; label: string; instruction: string }[] = [
  // Clothing color
  { category: 'Clothing', label: 'Red shirt',    instruction: 'Change the shirt/top color to red' },
  { category: 'Clothing', label: 'Blue shirt',   instruction: 'Change the shirt/top color to blue' },
  { category: 'Clothing', label: 'Green shirt',  instruction: 'Change the shirt/top color to green' },
  { category: 'Clothing', label: 'Yellow shirt', instruction: 'Change the shirt/top color to yellow' },
  { category: 'Clothing', label: 'White shirt',  instruction: 'Change the shirt/top color to white' },
  { category: 'Clothing', label: 'Black shirt',  instruction: 'Change the shirt/top color to black' },
  // Eye color
  { category: 'Eyes',     label: 'Brown eyes',   instruction: 'Change the eye color to brown' },
  { category: 'Eyes',     label: 'Black eyes',   instruction: 'Change the eye color to black' },
  { category: 'Eyes',     label: 'Blue eyes',    instruction: 'Change the eye color to blue' },
  { category: 'Eyes',     label: 'Green eyes',   instruction: 'Change the eye color to green' },
  { category: 'Eyes',     label: 'Hazel eyes',   instruction: 'Change the eye color to hazel' },
  // Hair
  { category: 'Hair',     label: 'Black hair',   instruction: 'Change the hair color to black' },
  { category: 'Hair',     label: 'Brown hair',   instruction: 'Change the hair color to dark brown' },
  { category: 'Hair',     label: 'Short hair',   instruction: 'Change the hairstyle to short cropped hair' },
  { category: 'Hair',     label: 'Long hair',    instruction: 'Change the hairstyle to longer hair past the ears' },
  { category: 'Hair',     label: 'Curly hair',   instruction: 'Change the hair texture to curly' },
  // Skin tone
  { category: 'Skin',     label: 'Lighter tone', instruction: 'Adjust skin tone to be slightly lighter' },
  { category: 'Skin',     label: 'Darker tone',  instruction: 'Adjust skin tone to be slightly darker' },
]

const CATEGORIES = Array.from(new Set(PRESETS.map((p) => p.category)))

export default function ImageEditor({ imageUrl, onEdited }: Props) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])
  const [customInstruction, setCustomInstruction] = useState('')
  const [pendingInstruction, setPendingInstruction] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appliedEdits, setAppliedEdits] = useState<string[]>([])

  // current displayed image — starts as the input, updated after each edit
  const [currentUrl, setCurrentUrl] = useState(imageUrl)
  const [currentFile, setCurrentFile] = useState<File | null>(null)

  async function applyEdit(instruction: string) {
    setLoading(true)
    setError(null)
    setPendingInstruction(instruction)
    try {
      let file = currentFile
      if (!file) {
        // First edit: fetch the image URL and convert to File
        const res = await fetch(currentUrl)
        const blob = await res.blob()
        file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })
      }

      const result = await editImage(file, instruction)
      // result.edited_image_url is like /outputs/edited_xxx.jpg — proxied via Vite
      const editedUrl = result.edited_image_url

      // Fetch the edited image and turn into a local File for subsequent edits
      const editedRes = await fetch(editedUrl)
      const editedBlob = await editedRes.blob()
      const editedFile = new File([editedBlob], 'edited.jpg', { type: 'image/jpeg' })

      setCurrentUrl(editedUrl)
      setCurrentFile(editedFile)
      setAppliedEdits((prev) => [...prev, instruction])
      onEdited(editedUrl, editedFile)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
      setPendingInstruction(null)
    }
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (customInstruction.trim()) applyEdit(customInstruction.trim())
  }

  const categoryPresets = PRESETS.filter((p) => p.category === activeCategory)

  return (
    <div className="flex flex-col gap-4">
      {/* Image preview */}
      <div className="relative">
        <img
          src={currentUrl}
          alt="Editable portrait"
          className="w-full max-h-80 object-contain rounded-xl border border-gray-200 bg-gray-50"
        />
        {loading && (
          <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-xs font-medium">{pendingInstruction}</p>
            </div>
          </div>
        )}
      </div>

      {/* Applied edits log */}
      {appliedEdits.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {appliedEdits.map((edit, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
              ✓ {edit}
            </span>
          ))}
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-colors ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {categoryPresets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={loading}
            onClick={() => applyEdit(preset.instruction)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-40 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom instruction */}
      <form onSubmit={handleCustomSubmit} className="flex gap-2">
        <input
          type="text"
          value={customInstruction}
          onChange={(e) => setCustomInstruction(e.target.value)}
          placeholder="Custom edit, e.g. add a red cap, remove glasses…"
          disabled={loading}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !customInstruction.trim()}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          Apply
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">{error}</div>
      )}
    </div>
  )
}
