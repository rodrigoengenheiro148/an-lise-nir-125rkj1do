export type Company =
  | 'AgroCorp Alpha'
  | 'GreenField Ltd'
  | 'Harvest Moon'
  | "Nature's Best"
  | 'Pure Earth'
  | 'Golden Grain'

export const COMPANIES: Company[] = [
  'AgroCorp Alpha',
  'GreenField Ltd',
  'Harvest Moon',
  "Nature's Best",
  'Pure Earth',
  'Golden Grain',
]

export type MetricKey =
  | 'acidity'
  | 'moisture'
  | 'fco'
  | 'protein'
  | 'phosphorus'
  | 'mineralMatter'
  | 'peroxide'
  | 'etherExtract'
  | 'proteinDigestibility'
  | 'calcium'
  | 'sodium'

export const METRICS: {
  key: MetricKey
  label: string
  unit: string
  color: string
}[] = [
  { key: 'acidity', label: 'Acidez', unit: '%', color: '#0ea5e9' },
  { key: 'moisture', label: 'Umidade', unit: '%', color: '#3b82f6' },
  { key: 'fco', label: 'FCO', unit: 'mg/kg', color: '#8b5cf6' },
  { key: 'protein', label: 'Proteína', unit: '%', color: '#10b981' },
  { key: 'phosphorus', label: 'Fósforo', unit: '%', color: '#f59e0b' },
  { key: 'mineralMatter', label: 'Mat. Mineral', unit: '%', color: '#6366f1' },
  { key: 'peroxide', label: 'Peróxido', unit: 'meq/kg', color: '#ef4444' },
  { key: 'etherExtract', label: 'Ext. Etéreo', unit: '%', color: '#ec4899' },
  {
    key: 'proteinDigestibility',
    label: 'Dig. Proteica',
    unit: '%',
    color: '#14b8a6',
  },
  { key: 'calcium', label: 'Cálcio', unit: '%', color: '#f97316' },
  { key: 'sodium', label: 'Sódio', unit: '%', color: '#06b6d4' },
]

export interface AnalysisRecord {
  id: string
  company: Company
  date: string

  // Lab and NIR values for each metric
  acidity_lab: number
  acidity_nir: number

  moisture_lab: number
  moisture_nir: number

  fco_lab: number
  fco_nir: number

  protein_lab: number
  protein_nir: number

  phosphorus_lab: number
  phosphorus_nir: number

  mineralMatter_lab: number
  mineralMatter_nir: number

  peroxide_lab: number
  peroxide_nir: number

  etherExtract_lab: number
  etherExtract_nir: number

  proteinDigestibility_lab: number
  proteinDigestibility_nir: number

  calcium_lab: number
  calcium_nir: number

  sodium_lab: number
  sodium_nir: number
}
