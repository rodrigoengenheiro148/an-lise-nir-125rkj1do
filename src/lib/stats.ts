export interface SimplePoint {
  x: number
  y: number
}

export interface StatsResult {
  r2: number
  r: number
  slope: number
  intercept: number
  bias: number
  sep: number // Standard Error of Prediction (often used as StdDev of residuals)
  mae: number // Mean Absolute Error
  n: number
  min: number
  max: number
  stdDevResiduals: number
}

export function calculateStats(points: SimplePoint[]): StatsResult {
  const n = points.length
  if (n < 2) {
    return {
      r2: 0,
      r: 0,
      slope: 0,
      intercept: 0,
      sep: 0,
      bias: 0,
      mae: 0,
      n,
      min: 0,
      max: 0,
      stdDevResiduals: 0,
    }
  }

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0
  let sumY2 = 0
  let sumDiff = 0
  let sumAbsDiff = 0

  let minVal = Infinity
  let maxVal = -Infinity

  for (const p of points) {
    sumX += p.x
    sumY += p.y
    sumXY += p.x * p.y
    sumX2 += p.x * p.x
    sumY2 += p.y * p.y

    const diff = p.x - p.y // LAB - NIR
    sumDiff += diff
    sumAbsDiff += Math.abs(diff)

    minVal = Math.min(minVal, p.x, p.y)
    maxVal = Math.max(maxVal, p.x, p.y)
  }

  const meanX = sumX / n
  const meanY = sumY / n

  const numerator = n * sumXY - sumX * sumY
  const denominator = n * sumX2 - sumX * sumX

  const slope = denominator !== 0 ? numerator / denominator : 0
  const intercept = meanY - slope * meanX

  const rNumerator = numerator
  const rDenominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
  )
  const r = rDenominator !== 0 ? rNumerator / rDenominator : 0
  const r2 = r * r

  const bias = sumDiff / n
  const mae = sumAbsDiff / n

  let sumSqDiffMinusBias = 0
  for (const p of points) {
    const diff = p.x - p.y // LAB - NIR
    sumSqDiffMinusBias += Math.pow(diff - bias, 2)
  }

  // SEP (Standard Error of Prediction) ~ Standard Deviation of Residuals
  const stdDevResiduals = Math.sqrt(sumSqDiffMinusBias / (n - 1))
  const sep = stdDevResiduals // In this context using same formula

  return {
    r2,
    r,
    slope,
    intercept,
    bias,
    sep,
    mae,
    n,
    min: minVal,
    max: maxVal,
    stdDevResiduals,
  }
}

export function generateRegressionPoints(
  points: SimplePoint[],
  slope: number,
  intercept: number,
) {
  if (points.length === 0) return []
  const xValues = points.map((p) => p.x)
  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues)

  const padding = (maxX - minX) * 0.05
  const start = Math.max(0, minX - padding)
  const end = maxX + padding

  return [
    { x: start, y: slope * start + intercept },
    { x: end, y: slope * end + intercept },
  ]
}
