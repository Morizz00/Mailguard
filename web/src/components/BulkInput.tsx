import { useState } from 'react'

interface Props {
  onSubmit: (domains: string[]) => void
  loading: boolean
}

export default function BulkInput({ onSubmit, loading }: Props) {
  const [text, setText] = useState('')
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const overLimit = lines.length > 20
  const actionableLines = lines.slice(0, 20)

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/75 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Bulk domain list</h3>
          <p className="mt-1 text-sm text-zinc-400">Enter one domain per line. Up to 20 domains can be checked at once.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${overLimit ? 'bg-white/10 text-zinc-100' : 'bg-zinc-900 text-zinc-300'}`}>
          {lines.length}/20
        </span>
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={10}
        placeholder={'google.com\ngithub.com\ncloudflare.com'}
        className="mt-4 w-full rounded-2xl border border-white/10 bg-black p-4 font-mono text-sm text-zinc-200 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-white/10"
      />

      {overLimit && <p className="mt-3 text-sm text-zinc-300">Only the first 20 domains will be submitted.</p>}

      <button
        type="button"
        disabled={loading || actionableLines.length === 0}
        onClick={() => onSubmit(actionableLines)}
        className="mt-4 rounded-2xl border border-white/10 bg-zinc-200 px-5 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? `Checking ${actionableLines.length} domains...` : `Check ${actionableLines.length} domain${actionableLines.length === 1 ? '' : 's'}`}
      </button>
    </div>
  )
}
