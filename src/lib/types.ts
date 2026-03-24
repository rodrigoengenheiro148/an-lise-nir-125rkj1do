export type AnalysisType =
  | 'UMIDADE'
  | 'ACIDEZ'
  | 'PROTEINA'
  | 'FOSFORO'
  | 'MATERIA_MINERAL'
  | 'PEROXIDO'
  | 'EXTRATO_ETEREO'
  | 'GORDURA'
  | 'DIG_PROTEICA'
  | 'CALCIO'
  | 'FCO'
  | 'SODIO'
  | 'IODO'
  | 'IMPUREZA'
  | 'CINZAS'

export interface Sample {
  id: string
  companyId: string
  date: string
  analysisType: AnalysisType
  labValue: number
  nirValue: number
}

export interface Company {
  id: string
  name: string
}

export const ANALYSIS_TYPES: AnalysisType[] = [
  'UMIDADE',
  'ACIDEZ',
  'PROTEINA',
  'FOSFORO',
  'MATERIA_MINERAL',
  'PEROXIDO',
  'EXTRATO_ETEREO',
  'GORDURA',
  'DIG_PROTEICA',
  'CALCIO',
  'FCO',
  'SODIO',
  'IODO',
  'IMPUREZA',
  'CINZAS',
]

export const ANALYSIS_LABELS: Record<AnalysisType, string> = {
  UMIDADE: 'Umidade',
  ACIDEZ: 'Acidez',
  PROTEINA: 'Proteína',
  FOSFORO: 'Fósforo',
  MATERIA_MINERAL: 'Matéria Mineral',
  PEROXIDO: 'Peróxido',
  EXTRATO_ETEREO: 'Ext. Etéreo',
  GORDURA: 'Gordura',
  DIG_PROTEICA: 'Dig. Proteica',
  CALCIO: 'Cálcio',
  FCO: 'FCO',
  SODIO: 'Sódio',
  IODO: 'Iodo',
  IMPUREZA: 'Impureza',
  CINZAS: 'Cinzas',
}

export interface Stats {
  r2: number
  r: number
  slope: number
  intercept: number
  sep: number
  bias: number
  n: number
}
