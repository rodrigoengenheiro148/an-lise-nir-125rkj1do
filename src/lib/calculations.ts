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

/**
 * Calculates a simple moving average for a numerical array.
 * @param data Array of numbers or nulls
 * @param windowSize Size of the moving window
 * @returns Array of moving averages matching the input length
 */
export const calculateSimpleMovingAverage = (
  data: (number | null)[],
  windowSize: number = 5,
): (number | null)[] => {
  const result: (number | null)[] = []

  for (let i = 0; i < data.length; i++) {
    // Get the window ending at current index
    // We only consider non-null values for the average
    const start = Math.max(0, i - windowSize + 1)
    const window = data
      .slice(start, i + 1)
      .filter((v) => v !== null) as number[]

    if (window.length === 0) {
      result.push(null)
    } else {
      const sum = window.reduce((a, b) => a + b, 0)
      result.push(sum / window.length)
    }
  }

  return result
}
