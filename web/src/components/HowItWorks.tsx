import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function HowItWorks() {
  return (
    <div className="space-y-6">
      {/* Why It Matters */}
      <section className="rounded-3xl border border-white/10 bg-zinc-950/75 p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="mt-1 flex-shrink-0 text-amber-500" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-white">Why Email Security Matters</h3>
            <p className="mt-2 text-sm text-zinc-300">
              Email is the #1 vector for cyberattacks. Attackers impersonate your domain to phish employees, steal credentials, and spread malware. 
              Proper DNS email authentication (MX, SPF, DMARC) proves your emails are legitimate and blocks forgeries.
            </p>
            <div className="mt-4 space-y-2 text-sm text-zinc-400">
              <p>✓ <strong>SPF</strong> – Authorizes which servers can send mail from your domain</p>
              <p>✓ <strong>DMARC</strong> – Tells receivers what to do with unauthenticated mail (quarantine or reject)</p>
              <p>✓ <strong>MX Records</strong> – Routes incoming emails to your mail servers</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="rounded-3xl border border-white/10 bg-zinc-950/75 p-6">
        <div className="flex items-start gap-4">
          <Shield className="mt-1 flex-shrink-0 text-emerald-500" size={24} />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">How MailGuard Works</h3>
            <div className="mt-4 space-y-4">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold">1</div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">You enter a domain</p>
                  <p className="mt-1 text-xs text-zinc-400">e.g., "google.com"</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold">2</div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">We query DNS records</p>
                  <p className="mt-1 text-xs text-zinc-400">Checks for MX, SPF, and DMARC records</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold">3</div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">AI analyzes the config</p>
                  <p className="mt-1 text-xs text-zinc-400">LLM evaluates policies and provides recommendations</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold">4</div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">Get a security score</p>
                  <p className="mt-1 text-xs text-zinc-400">Grade A–F + actionable recommendations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scoring Guide */}
      <section className="rounded-3xl border border-white/10 bg-zinc-950/75 p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <CheckCircle2 size={20} className="text-blue-500" />
          Understanding Your Score
        </h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-black/50 p-4">
            <p className="text-sm font-semibold text-emerald-400">A (90–100)</p>
            <p className="mt-1 text-xs text-zinc-400">Excellent. All records present and policies strict (p=reject, -all)</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/50 p-4">
            <p className="text-sm font-semibold text-blue-400">B (75–89)</p>
            <p className="mt-1 text-xs text-zinc-400">Good. Main records present but some soft policies (~all, p=quarantine)</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/50 p-4">
            <p className="text-sm font-semibold text-amber-400">F (0–24)</p>
            <p className="mt-1 text-xs text-zinc-400">Critical. Missing records or permissive policies. Easy target for phishing.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
