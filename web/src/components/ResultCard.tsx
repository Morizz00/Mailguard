import { CheckCircle2, ChevronDown, ChevronUp, XCircle } from 'lucide-react'
import type { DMARCResult, MXResult, SPFResult } from '../types'
import RecordDetails from './RecordDetails'

type RecordType = 'mx' | 'spf' | 'dmarc'

interface Props {
  type: RecordType
  result: MXResult | SPFResult | DMARCResult
  expanded: boolean
  onToggle: () => void
}

const LABELS: Record<RecordType, { title: string; desc: string; whyMatters: string }> = {
  mx: { 
    title: 'MX Records', 
    desc: 'These tell other mail servers where this domain receives email.',
    whyMatters: 'Without MX records, no one can send emails to this domain. Multiple MX records provide redundancy—if one server is down, mail still gets delivered.'
  },
  spf: { 
    title: 'SPF Record', 
    desc: 'This lists which servers are allowed to send email for the domain.',
    whyMatters: 'SPF prevents attackers from impersonating your domain in emails. A proper SPF record with -all (hard fail) blocks forged emails effectively.'
  },
  dmarc: { 
    title: 'DMARC Record', 
    desc: 'This tells receiving providers what to do with suspicious email that fails checks.',
    whyMatters: 'DMARC is your enforcement policy. p=reject rejects failed emails, p=quarantine moves them to spam, and p=none just reports (no protection).'
  },
}

export default function ResultCard({ type, result, expanded, onToggle }: Props) {
  const present = result.present
  const hasMxRecords = type === 'mx' && (result as MXResult).records.length > 0
  const hasDetails = present && (hasMxRecords || Boolean(result.parsed) || (type !== 'mx' && Boolean((result as SPFResult | DMARCResult).rawRecord)))
  const palette = present ? 'border-white/10 bg-white/[0.03]' : 'border-white/10 bg-black'

  return (
    <article className={`overflow-hidden rounded-3xl border ${palette}`}>
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex gap-3 flex-1">
          {present ? (
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-zinc-200" />
          ) : (
            <XCircle size={20} className="mt-0.5 shrink-0 text-zinc-500" />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-white">{LABELS[type].title}</h3>
            <p className="mt-1 text-sm leading-6 text-zinc-400">{LABELS[type].desc}</p>
            <p className="mt-2 text-xs text-zinc-500 italic">{LABELS[type].whyMatters}</p>
          </div>
        </div>

        {hasDetails ? (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full border border-white/10 p-2 text-zinc-400 transition hover:border-white/20 hover:text-white"
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        ) : null}
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">What we found</span>
          <span className={present ? 'font-medium text-zinc-200' : 'font-medium text-zinc-500'}>
            {present ? 'Present' : 'Missing'}
          </span>
        </div>

        {hasMxRecords && !expanded && (
          <div className="mt-4 space-y-2">
            {(result as MXResult).records.map((record, index) => (
              <div key={`${record.host}-${index}`} className="flex items-center justify-between rounded-2xl bg-black px-3 py-2 text-sm">
                <span className="font-mono text-zinc-200">{record.host}</span>
                <span className="text-zinc-500">Priority {record.priority}</span>
              </div>
            ))}
          </div>
        )}

        {expanded && hasDetails && (
          <div className="mt-4" id={`${type}-details`}>
            <RecordDetails type={type} result={result} />
          </div>
        )}
      </div>
    </article>
  )
}
