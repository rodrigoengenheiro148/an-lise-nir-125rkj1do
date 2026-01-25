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

export const METRICS: {
  key: MetricKey
  label: string
  unit: string
  color: string
}[] = [
  { key: 'acidity', label: 'Acidez', unit: '%', color: 'hsl(var(--chart-1))' },
  {
    key: 'moisture',
    label: 'Umidade',
    unit: '%',
    color: 'hsl(var(--chart-2))',
  },
  { key: 'fco', label: 'FCO', unit: 'mg/kg', color: 'hsl(var(--chart-3))' },
  {
    key: 'protein',
    label: 'Proteína',
    unit: '%',
    color: 'hsl(var(--chart-4))',
  },
  {
    key: 'phosphorus',
    label: 'Fósforo',
    unit: '%',
    color: 'hsl(var(--chart-5))',
  },
  {
    key: 'mineralMatter',
    label: 'Mat. Mineral',
    unit: '%',
    color: 'hsl(var(--chart-1))',
  },
  {
    key: 'peroxide',
    label: 'Peróxido',
    unit: 'meq/kg',
    color: 'hsl(var(--chart-2))',
  },
  {
    key: 'etherExtract',
    label: 'Ext. Etéreo',
    unit: '%',
    color: 'hsl(var(--chart-3))',
  },
  {
    key: 'proteinDigestibility',
    label: 'Dig. Proteica',
    unit: '%',
    color: 'hsl(var(--chart-4))',
  },
  { key: 'calcium', label: 'Cálcio', unit: '%', color: 'hsl(var(--chart-5))' },
]

export interface AnalysisRecord {
  id: string
  company: Company
  date: string
  acidity: number
  moisture: number
  fco: number
  protein: number
  phosphorus: number
  mineralMatter: number
  peroxide: number
  etherExtract: number
  proteinDigestibility: number
  calcium: number
}
