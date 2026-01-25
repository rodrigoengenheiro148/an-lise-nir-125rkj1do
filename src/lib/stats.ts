import { Sample, Stats } from './types'

export function calculateStats(samples: Sample[]): Stats {
  const n = samples.length
  if (n < 2) {
    return { r2: 0, r: 0, slope: 0, intercept: 0, sep: 0, bias: 0, n }
  }

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0
  let sumY2 = 0
  let sumDiff = 0
  let sumSqDiff = 0

  for (const s of samples) {
    const x = s.labValue
    const y = s.nirValue
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
    sumY2 += y * y
    const diff = y - x
    sumDiff += diff
    sumSqDiff += diff * diff
  }

  const meanX = sumX / n
  const meanY = sumY / n

  // Slope (m) and Intercept (b) for y = mx + b
  const numerator = n * sumXY - sumX * sumY
  const denominator = n * sumX2 - sumX * sumX

  const slope = denominator !== 0 ? numerator / denominator : 0
  const intercept = meanY - slope * meanX

  // Correlation Coefficient (r)
  const rNumerator = numerator
  const rDenominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
  )
  const r = rDenominator !== 0 ? rNumerator / rDenominator : 0
  const r2 = r * r

  // Bias (Average Difference)
  const bias = sumDiff / n

  // SEP (Standard Error of Prediction) - using simplified version often used in NIR: RMSEP adjusted for bias or simple RMSEP
  // Classic SEP = sqrt( sum((diff - bias)^2) / (n - 1) )
  let sumSqDiffMinusBias = 0
  for (const s of samples) {
    const diff = s.nirValue - s.labValue
    sumSqDiffMinusBias += Math.pow(diff - bias, 2)
  }
  const sep = Math.sqrt(sumSqDiffMinusBias / (n - 1))

  return {
    r2,
    r,
    slope,
    intercept,
    sep,
    bias,
    n,
  }
}

export function generateRegressionPoints(
  samples: Sample[],
  slope: number,
  intercept: number,
) {
  if (samples.length === 0) return []
  const xValues = samples.map((s) => s.labValue)
  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues)

  // Extend line slightly beyond points
  const padding = (maxX - minX) * 0.1
  const x1 = Math.max(0, minX - padding)
  const x2 = maxX + padding

  return [
    { x: x1, y: slope * x1 + intercept },
    { x: x2, y: slope * x2 + intercept },
  ]
}
