import type { Grade, ScoreResult } from '../types'

const GRADE_COLORS: Record<Grade, string> = {
  A: 'text-zinc-100',
  B: 'text-zinc-200',
  C: 'text-zinc-300',
  D: 'text-zinc-400',
  F: 'text-zinc-500',
}

const RISK_BADGE: Record<string, string> = {
  low: 'bg-white/10 text-zinc-100',
  medium: 'bg-white/8 text-zinc-200',
  high: 'bg-white/6 text-zinc-300',
  critical: 'bg-white/5 text-zinc-400',
}

interface Props {
  score: ScoreResult | null
}

function PlaceholderScore() {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/75 p-6">
      <div className="animate-pulse">
        <div className="mb-4 h-4 w-36 rounded bg-zinc-800" />
        <div className="mb-6 flex items-center gap-6">
          <div className="h-28 w-28 rounded-full bg-zinc-800" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-28 rounded bg-zinc-800" />
            <div className="h-4 w-2/3 rounded bg-zinc-800" />
            <div className="h-4 w-1/2 rounded bg-zinc-800" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3 rounded bg-zinc-800" />
          <div className="h-3 rounded bg-zinc-800" />
          <div className="h-3 w-5/6 rounded bg-zinc-800" />
        </div>
      </div>
      <p className="mt-4 text-sm text-zinc-500">Score details will appear here when available.</p>
    </div>
  )
}

export default function SecurityScore({ score }: Props) {
  if (!score) {
    return <PlaceholderScore />
  }

  const gradeColor = GRADE_COLORS[score.grade] ?? 'text-zinc-300'
  const riskBadge = RISK_BADGE[score.riskLevel] ?? 'bg-zinc-900 text-zinc-300'
  const circumference = 2 * Math.PI * 42
  const offset = circumference - (Math.max(0, Math.min(score.score, 100)) / 100) * circumference

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/75 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Overall Rating</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">How well this domain protects email</h3>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${riskBadge}`}>
          {score.riskLevel} risk level
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-5">
          <div className="relative">
            <svg width="116" height="116" className="-rotate-90">
              <circle cx="58" cy="58" r="42" stroke="#27272a" strokeWidth="10" fill="none" />
              <circle
                cx="58"
                cy="58"
                r="42"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="text-zinc-100 transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{score.score}</span>
              <span className={`text-xl font-black ${gradeColor}`}>{score.grade}</span>
            </div>
          </div>
          <div className="max-w-sm">
            <p className="text-lg font-medium text-zinc-200">{score.summary}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">This score combines the main email protection records and shows how much each one helps.</p>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {[
            { label: 'MX: Where mail is received', value: score.breakdown.mxScore, max: 30 },
            { label: 'SPF: Who can send mail', value: score.breakdown.spfScore, max: 35 },
            { label: 'DMARC: How failed mail is handled', value: score.breakdown.dmarcScore, max: 35 },
          ].map(({ label, value, max }) => (
            <div key={label} className="rounded-2xl border border-white/5 bg-black p-3">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-300">{label}</span>
                <span className="text-zinc-500">
                  {value}/{max}
                </span>
              </div>
              <div className="h-2 rounded-full bg-zinc-900">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-zinc-700 to-zinc-200 transition-all duration-700"
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/5 bg-black p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Suggested Improvements</p>
        <div className="mt-3 space-y-2">
          {score.recommendations.length > 0 ? (
            score.recommendations.map((recommendation, index) => (
              <div key={index} className="flex gap-3 text-sm leading-6 text-zinc-300">
                <span className="text-zinc-100">+</span>
                <span>{recommendation}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-500">No suggested improvements were returned for this result.</p>
          )}
        </div>
      </div>

      {!score.aiGenerated && <p className="mt-4 text-xs text-zinc-500">This rating is based on the data currently available in the app.</p>}
    </div>
  )
}
