export type Company = string

export interface CompanyEntity {
  id: string
  name: string
  logo_url?: string
  created_at: string
}

export const MATERIALS_OPTIONS = [
  'farinha de peixe',
  'farinha de pena e sangue',
  'farinha de sangue',
  'sebo',
  'farinha de carne e osso',
  'farinha de visceras',
]

export const MATERIAL_DISPLAY_NAMES: Record<string, string> = {
  'farinha de peixe': 'Farinha de Peixe',
  'farinha de pena e sangue': 'Farinha de Pena e Sangue',
  'farinha de penas e sangue': 'Farinha de Pena e Sangue',
  'farinha de sangue': 'Farinha de Sangue',
  sebo: 'Sebo',
  'farinha de carne e osso': 'Farinha de Carne e Osso',
  fco: 'Farinha de Carne e Osso',
  'farinha de vísceras': 'Farinha de Vísceras',
  'farinha de visceras': 'Farinha de Vísceras',
}

export const getMaterialDisplayName = (material: string) => {
  if (!material) return ''
  const lower = material.toLowerCase()
  return (
    MATERIAL_DISPLAY_NAMES[lower] ||
    material.charAt(0).toUpperCase() + material.slice(1)
  )
}

export const STATIC_SUBMATERIALS = [
  'Acidez',
  'Umidade',
  'FCO',
  'Proteína',
  'Fósforo',
  'Mat. Mineral',
  'Peróxido',
  'Ext. Etéreo',
  'Cálcio',
  'Dig. Proteica',
  'Sódio',
  'Iodo',
  'Impureza',
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
  | 'iodine'
  | 'impurity'

export const METRICS: {
  key: MetricKey
  label: string
  unit: string
  color: string
  aliases?: string[]
}[] = [
  {
    key: 'acidity',
    label: 'Acidez',
    unit: '%',
    color: '#0ea5e9',
    aliases: ['acidez', 'acidity'],
  },
  {
    key: 'moisture',
    label: 'Umidade',
    unit: '%',
    color: '#3b82f6',
    aliases: ['umidade', 'moisture', 'humid'],
  },
  {
    key: 'fco',
    label: 'FCO',
    unit: 'mg/kg',
    color: '#8b5cf6',
    aliases: ['fco'],
  },
  {
    key: 'protein',
    label: 'Proteína',
    unit: '%',
    color: '#10b981',
    aliases: ['proteina', 'protein', 'pb', 'proteina bruta'],
  },
  {
    key: 'sodium',
    label: 'Sódio',
    unit: '%',
    color: '#eab308',
    aliases: ['sodio', 'sodium'],
  },
  {
    key: 'peroxide',
    label: 'Peróxido',
    unit: 'meq/kg',
    color: '#ef4444',
    aliases: ['peroxido', 'peroxide'],
  },
  {
    key: 'etherExtract',
    label: 'Ext. Etéreo',
    unit: '%',
    color: '#ec4899',
    aliases: [
      'extrato etereo',
      'ext. etereo',
      'ether extract',
      'ee',
      'gordura',
    ],
  },
  {
    key: 'proteinDigestibility',
    label: 'Dig. Proteica',
    unit: '%',
    color: '#14b8a6',
    aliases: [
      'digestibilidade proteica',
      'dig. proteica',
      'protein digestibility',
      'pepsina',
    ],
  },
  {
    key: 'calcium',
    label: 'Cálcio',
    unit: '%',
    color: '#f97316',
    aliases: ['calcio', 'calcium'],
  },
  {
    key: 'mineralMatter',
    label: 'Mat. Mineral',
    unit: '%',
    color: '#6366f1',
    aliases: [
      'materia mineral',
      'mat. mineral',
      'cinzas',
      'mineral matter',
      'mm',
    ],
  },
  {
    key: 'phosphorus',
    label: 'Fósforo',
    unit: '%',
    color: '#f59e0b',
    aliases: ['fosforo', 'phosphorus'],
  },
  {
    key: 'iodine',
    label: 'Iodo',
    unit: 'g/100g',
    color: '#d946ef',
    aliases: ['iodo', 'iodine', 'iv'],
  },
  {
    key: 'impurity',
    label: 'Impureza',
    unit: '%',
    color: '#a1a1aa',
    aliases: ['impureza', 'impurity', 'sujeira', 'imp'],
  },
]

export const BULK_IMPORT_ORDER: MetricKey[] = [
  'acidity',
  'calcium',
  'etherExtract',
  'fco',
  'mineralMatter',
  'moisture',
  'peroxide',
  'phosphorus',
  'protein',
  'proteinDigestibility',
  'sodium',
  'iodine',
  'impurity',
]

export interface AnalysisRecord {
  id: string
  company: Company
  company_id?: string
  company_logo?: string
  material?: string
  submaterial?: string
  date?: string | null
  created_at?: string

  // Dynamic keys for metrics: *_lab, *_nir, *_anl
  [key: string]: string | number | undefined | null
}
