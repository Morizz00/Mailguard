import ExportButton from '../components/ExportButton'
import HistoryTable from '../components/HistoryTable'
import { useHistory } from '../hooks/useCheckDomain'

export default function HistoryView() {
  const { data, isLoading, error, refetch, isFetching } = useHistory()

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-950/75 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Past Checks</h3>
          <p className="mt-1 text-sm text-zinc-400">Review your recent checks and download the latest results from this dashboard.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-2xl border border-white/10 bg-black px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-300 hover:text-white"
          >
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
          <ExportButton />
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-white/10 bg-black p-4 text-sm text-zinc-200">
          {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl border border-white/10 bg-zinc-950/75 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-40 rounded bg-zinc-800" />
            <div className="h-14 rounded bg-zinc-800" />
            <div className="h-14 rounded bg-zinc-800" />
            <div className="h-14 rounded bg-zinc-800" />
          </div>
        </div>
      ) : (
        <HistoryTable entries={data ?? []} />
      )}
    </div>
  )
}
