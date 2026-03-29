import { useState } from 'react'
import { useSingleCheck } from '../hooks/useCheckDomain'
import DomainInput from '../components/DomainInput'
import ResultCard from '../components/ResultCard'
import SecurityScore from '../components/SecurityScore'
import HowItWorks from '../components/HowItWorks'
import ExampleDomains from '../components/ExampleDomains'
import FAQ from '../components/FAQ'

type ExpandedCard = 'mx' | 'spf' | 'dmarc' | null

export default function SingleCheckView() {
  const { mutate, data, isPending, error } = useSingleCheck()
  const [expandedCard, setExpandedCard] = useState<ExpandedCard>(null)

  function toggleCard(card: Exclude<ExpandedCard, null>) {
    setExpandedCard((current) => (current === card ? null : card))
  }

  function handleDomainSubmit(domain: string) {
    setExpandedCard(null)
    mutate(domain)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-zinc-950/75 p-6">
        <h3 className="text-lg font-semibold text-white">Check a domain</h3>
        <p className="mt-1 text-sm text-zinc-400">Enter a domain to see whether the key records that help protect email are present and properly configured.</p>
        <div className="mt-5">
          <DomainInput
            onSubmit={handleDomainSubmit}
            loading={isPending}
          />
        </div>
      </section>

      {/* Show HowItWorks and Examples before first check, hide after */}
      {!data && !isPending && !error && <HowItWorks />}
      {!data && !isPending && !error && <ExampleDomains onSelectDomain={handleDomainSubmit} loading={isPending} />}

      {error && (
        <div className="rounded-2xl border border-white/10 bg-black p-4 text-sm text-zinc-200">
          {(error as Error).message}
        </div>
      )}

      <SecurityScore score={data?.score ?? null} />

      <div className="grid gap-4 lg:grid-cols-3">
        <ResultCard
          type="mx"
          result={data?.mx ?? { present: false, records: [], parsed: null }}
          expanded={expandedCard === 'mx'}
          onToggle={() => toggleCard('mx')}
        />
        <ResultCard
          type="spf"
          result={data?.spf ?? { present: false, rawRecord: '', parsed: null }}
          expanded={expandedCard === 'spf'}
          onToggle={() => toggleCard('spf')}
        />
        <ResultCard
          type="dmarc"
          result={data?.dmarc ?? { present: false, rawRecord: '', parsed: null }}
          expanded={expandedCard === 'dmarc'}
          onToggle={() => toggleCard('dmarc')}
        />
      </div>

      {/* FAQ always available at bottom */}
      <FAQ />
    </div>
  )
}
