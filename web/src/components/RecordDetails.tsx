import type { DMARCResult, MXResult, SPFResult } from '../types'

type RecordType = 'mx' | 'spf' | 'dmarc'

interface Props {
  type: RecordType
  result: MXResult | SPFResult | DMARCResult
}

export default function RecordDetails({ type, result }: Props) {
  const rawRecord = type === 'mx' ? undefined : (result as SPFResult | DMARCResult).rawRecord

  return (
    <div className="space-y-4">
      {rawRecord && (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Exact Text Found</p>
          <code className="block rounded-2xl border border-white/10 bg-black p-3 text-xs leading-6 text-zinc-300 break-all">
            {rawRecord}
          </code>
        </section>
      )}

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Structured Breakdown</p>
        {result.parsed ? (
          <pre className="max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black p-3 text-xs leading-6 text-zinc-300">
            {JSON.stringify(result.parsed, null, 2)}
          </pre>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black p-4 text-sm text-zinc-500">
            A deeper explanation is not available yet, so this area stays as a placeholder for now.
          </div>
        )}
      </section>
    </div>
  )
}
