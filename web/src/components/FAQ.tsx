import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const FAQS = [
  {
    q: 'What is an MX record and why do I need it?',
    a: 'An MX (Mail eXchange) record tells the internet where to deliver emails for your domain. Without it, your domain cannot receive emails. Multiple MX records with different priority numbers provide redundancy—if one mail server is down, email still gets delivered to another.',
  },
  {
    q: 'What does SPF do?',
    a: 'SPF (Sender Policy Framework) is a DNS record that lists which mail servers are authorized to send emails on behalf of your domain. A proper SPF record with "-all" (hard fail) at the end prevents attackers from impersonating your domain in emails. "~all" (soft fail) is weaker protection.',
  },
  {
    q: 'What is DMARC and what are the policy options?',
    a: 'DMARC (Domain-based Message Authentication, Reporting, and Conformance) defines what happens to emails that fail SPF or DKIM checks. p=reject rejects failed emails (safest), p=quarantine moves them to spam, and p=none only reports failures (monitoring only). Always use p=reject for maximum protection.',
  },
  {
    q: 'Why does my score matter?',
    a: 'A higher score means better protection against email spoofing and phishing. A score of 90+ (grade A) means your domain has excellent anti-spoofing protection. Below 25 (grade F) means your domain is vulnerable and attackers can easily impersonate you.',
  },
  {
    q: 'What if my domain is missing one of these records?',
    a: 'Missing records significantly increase your score risk. If you\'re missing MX records, you cannot receive email. If you\'re missing SPF or DMARC, attackers can impersonate your domain with almost no detection. Add these records immediately to your DNS provider.',
  },
  {
    q: 'Can I use MailGuard to check other companies\' domains?',
    a: 'Yes! All DNS records are public. MailGuard is useful for checking your own domains, client domains, or even competitors. It\'s a great way to audit email security across your organization.',
  },
  {
    q: 'How often does my score change?',
    a: 'Your score changes whenever your DNS records change. If you update your SPF, DMARC, or MX records, your score will reflect the changes the next time you check. DNS changes can take a few hours to propagate globally.',
  },
  {
    q: 'Is the AI-generated score always accurate?',
    a: 'The AI-generated score uses an LLM (large language model) to analyze your configuration and provide nuanced recommendations. If the API is unavailable, MailGuard falls back to a deterministic scoring algorithm that always works. Both approaches evaluate the same key principles.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/75 p-6">
      <h3 className="text-lg font-semibold text-white">Frequently Asked Questions</h3>
      <p className="mt-2 text-sm text-zinc-400">Still have questions? Here are answers to common ones:</p>
      <div className="mt-4 space-y-2">
        {FAQS.map((faq, index) => (
          <div key={index} className="rounded-2xl border border-white/5 bg-black/50">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-black/80"
            >
              <span className="text-sm font-medium text-zinc-100">{faq.q}</span>
              {openIndex === index ? (
                <ChevronUp size={18} className="flex-shrink-0 text-zinc-400" />
              ) : (
                <ChevronDown size={18} className="flex-shrink-0 text-zinc-400" />
              )}
            </button>
            {openIndex === index && (
              <div className="border-t border-white/5 px-4 py-3">
                <p className="text-sm leading-6 text-zinc-400">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
