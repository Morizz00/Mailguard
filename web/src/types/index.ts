export interface MXRecord {
  host: string
  priority: number
}

export interface PriorityGroup {
  priority: number
  hosts: string[]
}

export interface MXParsed {
  primaryMx: string
  hasMultiplePriorities: boolean
  priorityGroups: PriorityGroup[]
}

export interface MXResult {
  present: boolean
  records: MXRecord[]
  parsed: MXParsed | null
}

export interface SPFMechanism {
  type: string
  value: string
  qualifier: string
}

export interface SPFParsed {
  version: string
  mechanisms: SPFMechanism[]
  qualifier: string
  lookupCount: number
  isValid: boolean
  warnings: string[]
}

export interface SPFResult {
  present: boolean
  rawRecord?: string
  parsed: SPFParsed | null
}

export interface DMARCParsed {
  version: string
  policy: string
  subdomainPolicy: string
  pct: number
  rua: string[]
  adkim: string
  aspf: string
  isValid: boolean
  warnings: string[]
}

export interface DMARCResult {
  present: boolean
  rawRecord?: string
  parsed: DMARCParsed | null
}

export interface ScoreBreakdown {
  mxScore: number
  spfScore: number
  dmarcScore: number
  maxPossible: number
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface ScoreResult {
  score: number
  grade: Grade
  riskLevel: RiskLevel
  summary: string
  recommendations: string[]
  breakdown: ScoreBreakdown
  aiGenerated: boolean
}

export interface DomainResult {
  domain: string
  checkedAt: string
  mx: MXResult
  spf: SPFResult
  dmarc: DMARCResult
  score: ScoreResult | null
}

export interface BulkResult {
  results: DomainResult[]
  totalChecked: number
  durationMs: number
}

export interface HistoryEntry {
  domain: string
  checkedAt: string
  grade: string
  score: number
  hasMX: boolean
  hasSPF: boolean
  hasDMARC: boolean
}
