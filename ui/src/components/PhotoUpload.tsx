import { useRef, useState } from 'react'

interface Props {
  onFile: (file: File) => void
  disabled?: boolean
}

export default function PhotoUpload({ onFile, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed rounded p-10 text-center cursor-pointer transition-colors ${
        disabled 
          ? 'opacity-50 cursor-not-allowed border-[var(--border-color)]' 
          : isDragging 
            ? 'border-[var(--primary-color)] bg-[var(--info-bg)]' 
            : 'border-[var(--border-color)] hover:bg-[var(--border-color)] hover:bg-opacity-20'
      }`}
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
      
      <div className="flex flex-col items-center">
        <div className="text-4xl mb-2 text-[var(--text-secondary)] opacity-70">
          📷
        </div>
        <p className="text-[var(--text-primary)] font-medium text-lg">Drop a photo or click to select</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Any quality — we'll enhance it automatically</p>
      </div>
    </div>
  )
}
