import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BulkCheckView from './views/BulkCheckView'
import HistoryView from './views/HistoryView'
import SingleCheckView from './views/SingleCheckView'

const queryClient = new QueryClient()

type Tab = 'single' | 'bulk' | 'history'

const TAB_COPY: Record<Tab, { title: string; blurb: string }> = {
  single: {
    title: 'Check One Domain',
    blurb: 'Review one domain in detail and see whether its email protection records are set up correctly.',
  },
  bulk: {
    title: 'Check Multiple Domains',
    blurb: 'Review several domains at once and compare how complete their email protection setup looks.',
  },
  history: {
    title: 'Past Checks',
    blurb: 'Look back at recent checks and download a copy of the results when you need to share them.',
  },
}

export default function App() {
  const [tab, setTab] = useState<Tab>('single')

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-transparent text-zinc-100">
        <header className="border-b border-white/10 bg-black/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-3">
                <img 
                  src="/logo.svg" 
                  alt="MailGuard Logo" 
                  className="h-10 w-10 drop-shadow-lg"
                />
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-300">
                  MailGuard
                </p>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Email security intelligence dashboard
              </h1>
              <p className="mt-3 text-sm leading-6 text-zinc-400 md:text-base">
                Analyze email authentication records (MX, SPF, DMARC) for any domain. Understand your security posture, get AI-powered recommendations, and protect against domain spoofing attacks.
              </p>
            </div>

            <nav className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-zinc-950/80 p-2">
              {(['single', 'bulk', 'history'] as Tab[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    tab === item
                      ? 'bg-zinc-200 text-black shadow-[0_0_24px_rgba(255,255,255,0.14)]'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-10">
          <section className="mb-8 rounded-3xl border border-white/10 bg-zinc-950/75 p-6 shadow-2xl shadow-black/50">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-zinc-500">Current View</p>
            <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">{TAB_COPY[tab].title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{TAB_COPY[tab].blurb}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs text-zinc-400">
                <div className="rounded-2xl border border-white/10 bg-black px-4 py-3">
                  <div className="text-lg font-semibold text-zinc-100">Focused</div>
                  <div>Single checks</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black px-4 py-3">
                  <div className="text-lg font-semibold text-zinc-100">Scalable</div>
                  <div>Bulk review</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black px-4 py-3">
                  <div className="text-lg font-semibold text-zinc-100">Portable</div>
                  <div>CSV export</div>
                </div>
              </div>
            </div>
          </section>

          {tab === 'single' && <SingleCheckView />}
          {tab === 'bulk' && <BulkCheckView />}
          {tab === 'history' && <HistoryView />}
        </main>
      </div>
    </QueryClientProvider>
  )
}
