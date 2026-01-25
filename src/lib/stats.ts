// Statistical utility functions

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
  sep: number
  n: number
}

export function calculateStats(points: SimplePoint[]): StatsResult {
  const n = points.length
  if (n < 2) {
    return { r2: 0, r: 0, slope: 0, intercept: 0, sep: 0, bias: 0, n }
  }

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0
  let sumY2 = 0
  let sumDiff = 0

  for (const p of points) {
    sumX += p.x
    sumY += p.y
    sumXY += p.x * p.y
    sumX2 += p.x * p.x
    sumY2 += p.y * p.y
    sumDiff += p.y - p.x // NIR - LAB
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

  let sumSqDiffMinusBias = 0
  for (const p of points) {
    const diff = p.y - p.x
    sumSqDiffMinusBias += Math.pow(diff - bias, 2)
  }
  const sep = Math.sqrt(sumSqDiffMinusBias / (n - 1))

  return { r2, r, slope, intercept, bias, sep, n }
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

  // Add 5% padding
  const padding = (maxX - minX) * 0.05
  const start = Math.max(0, minX - padding)
  const end = maxX + padding

  return [
    { x: start, y: slope * start + intercept },
    { x: end, y: slope * end + intercept },
  ]
}
