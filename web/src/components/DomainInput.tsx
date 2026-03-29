import { useState } from 'react'
import { Search } from 'lucide-react'

interface Props {
  onSubmit: (domain: string) => void
  loading: boolean
}

export default function DomainInput({ onSubmit, loading }: Props) {
  const [value, setValue] = useState('')

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const normalized = value.trim()
        if (normalized) {
          onSubmit(normalized)
        }
      }}
      className="flex flex-col gap-3 md:flex-row"
    >
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="your-company.com or gmail.com"
        className="flex-1 rounded-2xl border border-white/10 bg-black px-4 py-3 text-zinc-100 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-white/10"
        autoFocus
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-zinc-200 px-6 py-3 font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Search size={18} />
        {loading ? 'Checking...' : 'Verify'}
      </button>
    </form>
  )
}
