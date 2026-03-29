import { Zap } from 'lucide-react'

interface Props {
  onSelectDomain: (domain: string) => void
  loading: boolean
}

const EXAMPLE_DOMAINS = [
  { name: 'google.com', label: 'Google', description: 'Excellent security (A)' },
  { name: 'microsoft.com', label: 'Microsoft', description: 'Strong policies' },
  { name: 'github.com', label: 'GitHub', description: 'Modern setup' },
  { name: 'example.com', label: 'Example.com', description: 'No records (F)' },
]

export default function ExampleDomains({ onSelectDomain, loading }: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/75 p-6">
      <div className="flex items-center gap-2">
        <Zap size={20} className="text-yellow-500" />
        <h3 className="text-lg font-semibold text-white">Try These Examples</h3>
      </div>
      <p className="mt-2 text-sm text-zinc-400">Click a domain below to see how MailGuard scores it:</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {EXAMPLE_DOMAINS.map((domain) => (
          <button
            key={domain.name}
            onClick={() => onSelectDomain(domain.name)}
            disabled={loading}
            className="group rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-left transition hover:border-emerald-500/30 hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <p className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400">{domain.label}</p>
            <p className="mt-1 text-xs text-zinc-500 group-hover:text-zinc-400">{domain.name}</p>
            <p className="mt-2 text-xs font-medium text-zinc-600 group-hover:text-zinc-500">{domain.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
