import { AnalysisRecord } from '@/types/dashboard'

export const calculateResidue = (
  val1: string | number | undefined | null,
  val2: string | number | undefined | null,
): number | null => {
  if (
    val1 === undefined ||
    val1 === null ||
    val1 === '' ||
    val2 === undefined ||
    val2 === null ||
    val2 === ''
  ) {
    return null
  }
  const num1 = typeof val1 === 'string' ? parseFloat(val1) : val1
  const num2 = typeof val2 === 'string' ? parseFloat(val2) : val2

  if (isNaN(num1) || isNaN(num2)) return null

  return num1 - num2
}

export const getResidueColor = (val: number | null): string => {
  if (val === null) return 'text-zinc-500'
  return val >= 0 ? 'text-green-400' : 'text-red-400'
}

export const formatResidue = (val: number | null): string => {
  if (val === null) return '-'
  return val.toFixed(3)
}
