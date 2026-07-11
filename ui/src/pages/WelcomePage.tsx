import { useNavigate } from 'react-router-dom'

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.12)_0%,_transparent_70%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-lg">
        {/* Logo mark */}
        <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-900/40">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="12" cy="8" r="4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l2 2 4-4" />
          </svg>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl font-extrabold text-white tracking-tight leading-tight">
            Missing<span className="text-blue-400">Mesh</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Generate multilingual alerts, age-progressed images, and dispatch to 8,000+ stations, NGOs & police — in under 2 minutes.
          </p>
        </div>

        {/* Step preview */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {['Details & Photo', 'Generate Posters', 'Dispatch Alerts'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <span className="text-gray-700">→</span>}
              <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full border border-gray-700">
                {i + 1}. {label}
              </span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-2 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <button
            onClick={() => navigate('/generate')}
            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-95 text-white text-xl font-bold rounded-2xl shadow-[0_20px_50px_rgba(59,130,246,0.3)] transition-all duration-150 ring-2 ring-blue-500/20"
          >
            Report Missing Child
          </button>
          
          <button
            onClick={() => navigate('/found-child')}
            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-br from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 active:scale-95 text-white text-xl font-bold rounded-2xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all duration-150 ring-2 ring-indigo-500/20"
          >
            I Found a Child
          </button>
        </div>

        <p className="text-gray-600 text-xs">
          All data is processed locally and never stored beyond the session.
        </p>
      </div>
    </div>
  )
}
