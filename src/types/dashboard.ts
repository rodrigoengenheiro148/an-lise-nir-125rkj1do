export type Company = string

export interface CompanyEntity {
  id: string
  name: string
  logo_url?: string
  created_at: string
}

export const DEFAULT_COMPANIES: string[] = [
  'Brasmix',
  'Mar Reciclagem',
  'Farinorte',
  'Juina',
  'Nutrição',
  'Varzea',
]

export const MATERIALS_OPTIONS = [
  'Sebo',
  'Umidade',
  'FCO',
  'Farinha de Penas e Sangue',
  'Farinha de Sangue',
  'Farinha de Peixe',
  'Farinha de Vísceras',
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
]

export interface AnalysisRecord {
  id: string
  company: Company
  company_id?: string
  company_logo?: string
  material?: string
  date: string

  // Dynamic keys for metrics: *_lab, *_nir, *_anl
  [key: string]: string | number | undefined
}
