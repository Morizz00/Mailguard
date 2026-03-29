import { CheckCircle2, XCircle } from 'lucide-react'
import type { HistoryEntry } from '../types'

const GRADE_COLORS: Record<string, string> = {
  A: 'text-zinc-100',
  B: 'text-zinc-200',
  C: 'text-zinc-300',
  D: 'text-zinc-400',
  F: 'text-zinc-500',
}

interface Props {
  entries: HistoryEntry[]
}

function StatusIcon({ ok }: { ok: boolean }) {
  return ok ? <CheckCircle2 size={15} className="text-zinc-200" /> : <XCircle size={15} className="text-zinc-500" />
}

export default function HistoryTable({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-950/75 p-10 text-center text-sm text-zinc-500">
        No checks have been recorded yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-zinc-950/75">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-zinc-500">
            <th className="px-5 py-4 font-medium">Domain</th>
            <th className="px-5 py-4 font-medium">Checked</th>
            <th className="px-5 py-4 font-medium">Grade</th>
            <th className="px-5 py-4 font-medium">Score</th>
            <th className="px-5 py-4 font-medium">Receives Mail</th>
            <th className="px-5 py-4 font-medium">Sending Rules</th>
            <th className="px-5 py-4 font-medium">Spoof Protection</th>
          </tr>
        </thead>
        <tbody>
          {[...entries].reverse().map((entry, index) => (
            <tr key={`${entry.domain}-${entry.checkedAt}-${index}`} className="border-b border-white/5 last:border-b-0 hover:bg-white/5">
              <td className="px-5 py-4 font-mono text-zinc-200">{entry.domain}</td>
              <td className="px-5 py-4 text-zinc-400">{new Date(entry.checkedAt).toLocaleString()}</td>
              <td className={`px-5 py-4 text-lg font-bold ${GRADE_COLORS[entry.grade] ?? 'text-zinc-400'}`}>{entry.grade || '-'}</td>
              <td className="px-5 py-4 text-zinc-200">{entry.score || '-'}</td>
              <td className="px-5 py-4"><StatusIcon ok={entry.hasMX} /></td>
              <td className="px-5 py-4"><StatusIcon ok={entry.hasSPF} /></td>
              <td className="px-5 py-4"><StatusIcon ok={entry.hasDMARC} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
