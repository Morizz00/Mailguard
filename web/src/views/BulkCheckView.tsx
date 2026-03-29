import { useBulkCheck } from '../hooks/useCheckDomain'
import BulkInput from '../components/BulkInput'
import SecurityScore from '../components/SecurityScore'

export default function BulkCheckView() {
  const { mutate, data, isPending, error } = useBulkCheck()

  return (
    <div className="space-y-6">
      <BulkInput onSubmit={(domains) => mutate(domains)} loading={isPending} />

      {error && (
        <div className="rounded-2xl border border-white/10 bg-black p-4 text-sm text-zinc-200">
          {(error as Error).message}
        </div>
      )}

      {data && (
        <section className="rounded-3xl border border-white/10 bg-zinc-950/75 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Bulk results</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Checked {data.totalChecked} domains in {data.durationMs}ms.
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-zinc-500">
                  <th className="pb-3 pr-4 font-medium">Domain</th>
                  <th className="pb-3 pr-4 font-medium">Checked</th>
                  <th className="pb-3 pr-4 font-medium">Receives Mail</th>
                  <th className="pb-3 pr-4 font-medium">Sending Rules</th>
                  <th className="pb-3 pr-4 font-medium">Spoof Protection</th>
                  <th className="pb-3 pr-4 font-medium">Rating</th>
                  <th className="pb-3 font-medium">Letter Grade</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((result, index) => (
                  <tr key={`${result.domain || 'invalid'}-${index}`} className="border-b border-white/5 last:border-b-0">
                    <td className="py-4 pr-4 font-mono text-zinc-200">{result.domain || 'Invalid input'}</td>
                    <td className="py-4 pr-4 text-zinc-400">
                      {result.checkedAt ? new Date(result.checkedAt).toLocaleString() : '-'}
                    </td>
                    <td className="py-4 pr-4 text-zinc-300">{result.mx.present ? 'Present' : 'Missing'}</td>
                    <td className="py-4 pr-4 text-zinc-300">{result.spf.present ? 'Present' : 'Missing'}</td>
                    <td className="py-4 pr-4 text-zinc-300">{result.dmarc.present ? 'Present' : 'Missing'}</td>
                    <td className="py-4 pr-4 text-zinc-200">{result.score?.score ?? '-'}</td>
                    <td className="py-4 font-bold text-zinc-100">{result.score?.grade ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!data && (
        <section className="rounded-3xl border border-dashed border-white/10 bg-zinc-950/75 p-6">
          <h3 className="text-lg font-semibold text-white">Comparison panel</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            This view gives you a quick side-by-side summary. Use the single-domain view when you want the full explanation for one result.
          </p>
          <div className="mt-6 max-w-xl">
            <SecurityScore score={null} />
          </div>
        </section>
      )}
    </div>
  )
}
