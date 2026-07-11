import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { matchFoundChild, sendFamilyEmail } from '../services/api'
import type { MatchProfile } from '../types'

export default function FoundChildPage() {
  const navigate = useNavigate()
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<MatchProfile[]>([])
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualLocation, setManualLocation] = useState('')
  const [emailingId, setEmailingId] = useState<string | null>(null)
  const [sentEmails, setSentEmails] = useState<Set<string>>(new Set())

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSearch = async () => {
    if (!photo) return
    setLoading(true)
    setError(null)
    setSearched(false)
    try {
      const res = await matchFoundChild(photo)
      setMatches(res.matches)
      setSearched(true)
    } catch (err) {
      setError('Failed to analyze identity. Please try a clearer photo.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailFamily = async (match: MatchProfile) => {
    setEmailingId(match.case_id)
    try {
      const base64Image = preview ? preview.split(',')[1] : ''
      await sendFamilyEmail(
        match.case_id,
        match.name || 'Unknown',
        manualLocation || 'Location denied/not provided',
        base64Image
      )
      setSentEmails(prev => new Set(prev).add(match.case_id))
    } catch (err) {
      alert('Failed to send email notification.')
      console.error(err)
    } finally {
      setEmailingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <span className="font-bold text-blue-600 text-xl tracking-tight">MissingMesh</span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Registered Missing Children button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center justify-between bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4 hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900">Registered Missing Children</p>
              <p className="text-xs text-gray-400">View all cases grouped by city</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Search section */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">I Found a Child</h1>
          <p className="text-gray-500 text-sm">Perform a forensic search to identify a child and alert their family.</p>
        </div>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <label className="text-sm font-semibold text-gray-700 block">Identity Photo</label>
              <div
                className="relative bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 aspect-square flex items-center justify-center cursor-pointer hover:border-blue-400 transition-all group overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoSelect} />
                {preview ? (
                  <img src={preview} alt="Found" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="text-center space-y-2">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto text-gray-400 group-hover:text-blue-500">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">Click to upload</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">Found Location</label>
                <input
                  type="text"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  placeholder="e.g. Near HSR Layout Park"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !photo}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
              >
                {loading ? 'Analyzing Identity...' : 'Search Records'}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">
              {error}
            </div>
          )}
        </section>

        {/* Results */}
        {searched && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
              Potential Matches ({matches.length})
            </h2>

            {matches.length > 0 ? (
              <div className="space-y-4">
                {matches.map((match) => (
                  <div key={match.case_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col sm:flex-row">
                    <div className="w-full sm:w-48 h-48 bg-gray-100 shrink-0">
                      <img
                        src={`data:image/jpeg;base64,${match.image_base64}`}
                        alt={match.name || 'Child'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-bold text-gray-900">{match.name || 'Unregistered'}</h3>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            match.similarity_score >= 70 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {match.similarity_score}% Match
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-widest">
                          {match.age} Yrs • {match.gender || 'Unknown'}{match.city ? ` • ${match.city}` : ''}
                        </p>

                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                            <span>{match.last_seen_location || 'No area recorded'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span>Missing since {match.last_seen_date || 'Unknown'}</span>
                          </div>
                          {(match.height_cm || match.weight_kg) && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              <span>
                                {match.height_cm ? `${match.height_cm} cm` : ''}
                                {match.height_cm && match.weight_kg ? ' · ' : ''}
                                {match.weight_kg ? `${match.weight_kg} kg` : ''}
                              </span>
                            </div>
                          )}
                          {match.clothing_description && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 11h10M7 15h6" /></svg>
                              <span>{match.clothing_description}</span>
                            </div>
                          )}
                          {match.distinguishing_marks && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span>{match.distinguishing_marks}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                          <p className="text-[10px] text-blue-800 leading-relaxed italic">
                            <span className="font-bold not-italic mr-1">AI Rationale:</span>
                            "{match.rationale}"
                          </p>
                        </div>

                        <button
                          onClick={() => handleEmailFamily(match)}
                          disabled={emailingId === match.case_id || sentEmails.has(match.case_id)}
                          className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                            sentEmails.has(match.case_id)
                              ? 'bg-green-100 text-green-700 cursor-default'
                              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm'
                          }`}
                        >
                          {emailingId === match.case_id ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Sending...
                            </span>
                          ) : sentEmails.has(match.case_id) ? (
                            'Email Sent ✓'
                          ) : (
                            'Email Family'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center space-y-2">
                <p className="text-gray-400 font-medium">No matches found above the threshold.</p>
                <p className="text-xs text-gray-300">Try adjusting the photo or check manual records.</p>
              </div>
            )}
          </div>
        )}

        <div className="h-10" />
      </div>
    </div>
  )
}
