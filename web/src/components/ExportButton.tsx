import { Download } from 'lucide-react'
import { getExportUrl } from '../api/client'

export default function ExportButton() {
  return (
    <a
      href={getExportUrl()}
      download="mailguard-export.csv"
      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-300 hover:text-white"
    >
      <Download size={16} />
      Export CSV
    </a>
  )
}
