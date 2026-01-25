export interface Point {
  x: number
  y: number
}

export interface StatsResult {
  r2: number
  bias: number
  sep: number
  slope: number
  n: number
  min: number
  max: number
}

export function calculateStats(data: Point[]): StatsResult {
  const n = data.length
  if (n === 0) {
    return {
      r2: 0,
      bias: 0,
      sep: 0,
      slope: 0,
      n: 0,
      min: 0,
      max: 0,
    }
  }

  let sumX = 0
  let sumY = 0
  let min = data[0].x
  let max = data[0].x

  for (const p of data) {
    sumX += p.x
    sumY += p.y
    if (p.x < min) min = p.x
    if (p.x > max) max = p.x
  }

  const meanX = sumX / n
  const meanY = sumY / n

  let numerator = 0
  let denomX = 0
  let denomY = 0
  let sumDiff = 0

  for (const p of data) {
    const diffX = p.x - meanX
    const diffY = p.y - meanY
    numerator += diffX * diffY
    denomX += diffX * diffX
    denomY += diffY * diffY

    // Bias is mean(y - x) (pred - ref) or (y - x)
    // Assuming y is prediction (ANL/NIR) and x is reference (LAB)
    sumDiff += p.y - p.x
  }

  const slope = denomX !== 0 ? numerator / denomX : 0
  const r2 =
    denomX * denomY !== 0 ? Math.pow(numerator, 2) / (denomX * denomY) : 0
  const bias = sumDiff / n

  // SEP (Standard Error of Prediction)
  // SEP = sqrt( sum((res - mean_res)^2) / (n-1) )
  // where res = y - x
  let sumSqRes = 0
  for (const p of data) {
    const res = p.y - p.x - bias
    sumSqRes += res * res
  }
  const sep = Math.sqrt(sumSqRes / (n > 1 ? n - 1 : 1))

  return {
    r2,
    bias,
    sep,
    slope,
    n,
    min,
    max,
  }
}
