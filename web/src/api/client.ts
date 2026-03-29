import type { BulkResult, DomainResult, HistoryEntry } from '../types'

const BASE = '/api/v1'

async function parseError(res: Response, fallback: string) {
  const text = await res.text()
  return text || fallback
}

export async function checkDomain(domain: string): Promise<DomainResult> {
  const res = await fetch(`${BASE}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain }),
  })

  if (!res.ok) {
    throw new Error(await parseError(res, `Check failed: ${res.status}`))
  }

  return res.json()
}

export async function bulkCheck(domains: string[]): Promise<BulkResult> {
  const res = await fetch(`${BASE}/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domains }),
  })

  if (!res.ok) {
    throw new Error(await parseError(res, `Bulk check failed: ${res.status}`))
  }

  return res.json()
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const res = await fetch(`${BASE}/history`)

  if (!res.ok) {
    throw new Error(await parseError(res, 'Failed to load history'))
  }

  const payload = (await res.json()) as HistoryEntry[] | { entries: HistoryEntry[] }
  return Array.isArray(payload) ? payload : payload.entries
}

export function getExportUrl(): string {
  return `${BASE}/export?format=csv`
}
