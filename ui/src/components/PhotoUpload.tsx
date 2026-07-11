import { useRef } from 'react'

interface Props {
  onFile: (file: File) => void
  disabled?: boolean
}

export default function PhotoUpload({ onFile, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'border-blue-400 hover:border-blue-600 hover:bg-blue-50'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
      <div className="text-4xl mb-2">📷</div>
      <p className="text-gray-600 font-medium">Drop a photo or tap to capture</p>
      <p className="text-sm text-gray-400 mt-1">Any quality — we'll enhance it</p>
    </div>
  )
}
