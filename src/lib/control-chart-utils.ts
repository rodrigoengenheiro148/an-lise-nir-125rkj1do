import { AnalysisRecord } from '@/types/dashboard'

export interface ControlChartDataPoint {
  id: string
  label: string
  value: number // X-bar
  range: number // R
  originalValues: number[]
}

export interface ControlChartStats {
  xBar: {
    data: ControlChartDataPoint[]
    mean: number
    ucl: number
    lcl: number
  }
  rChart: {
    data: ControlChartDataPoint[]
    mean: number
    ucl: number
    lcl: number
  }
}

// Constants for Control Charts (Shewhart)
// n: subgroup size
// A2: factor for X-bar limits
// D3: factor for R lower limit
// D4: factor for R upper limit
const CONSTANTS: Record<number, { A2: number; D3: number; D4: number }> = {
  2: { A2: 1.88, D3: 0, D4: 3.267 },
  3: { A2: 1.023, D3: 0, D4: 2.574 },
  4: { A2: 0.729, D3: 0, D4: 2.282 },
  5: { A2: 0.577, D3: 0, D4: 2.114 },
  6: { A2: 0.483, D3: 0, D4: 2.004 },
  7: { A2: 0.419, D3: 0.076, D4: 1.924 },
  8: { A2: 0.373, D3: 0.136, D4: 1.864 },
  9: { A2: 0.337, D3: 0.184, D4: 1.816 },
  10: { A2: 0.308, D3: 0.223, D4: 1.777 },
}

export function calculateControlChartStats(
  records: AnalysisRecord[],
  metricKey: string,
  subgroupSize: number = 5,
): ControlChartStats | null {
  // 1. Filter and sort records
  const sorted = [...records]
    .filter((r) => {
      // Prioritize analysis value, then lab, then nir
      const v =
        r[`${metricKey}_anl`] ?? r[`${metricKey}_lab`] ?? r[`${metricKey}_nir`]
      return v !== undefined && v !== null && v !== ''
    })
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0
      const db = b.date ? new Date(b.date).getTime() : 0
      return da - db
    })

  if (sorted.length < subgroupSize) return null

  const subgroups: ControlChartDataPoint[] = []

  // 2. Group records into subgroups of fixed size
  for (let i = 0; i < sorted.length; i += subgroupSize) {
    const chunk = sorted.slice(i, i + subgroupSize)

    // For statistical accuracy, we ignore the last partial chunk
    if (chunk.length < subgroupSize) continue

    const values = chunk.map((r) =>
      Number(
        r[`${metricKey}_anl`] ?? r[`${metricKey}_lab`] ?? r[`${metricKey}_nir`],
      ),
    )

    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min

    // Generate label from the first date in the subgroup
    let label = ''
    if (chunk[0].date) {
      try {
        const d = chunk[0].date.split('-')
        // Assuming YYYY-MM-DD
        if (d.length === 3) label = `${d[2]}/${d[1]}`
        else label = chunk[0].date
      } catch (e) {
        label = `#${subgroups.length + 1}`
      }
    } else {
      label = `#${subgroups.length + 1}`
    }

    subgroups.push({
      id: chunk[0].id,
      label,
      value: avg,
      range,
      originalValues: values,
    })
  }

  if (subgroups.length === 0) return null

  // 3. Calculate Center Lines (Grand Mean and Average Range)
  const grandMean =
    subgroups.reduce((s, g) => s + g.value, 0) / subgroups.length
  const rangeMean =
    subgroups.reduce((s, g) => s + g.range, 0) / subgroups.length

  // 4. Calculate Limits
  const c = CONSTANTS[subgroupSize] || CONSTANTS[5]

  return {
    xBar: {
      data: subgroups,
      mean: grandMean,
      ucl: grandMean + c.A2 * rangeMean,
      lcl: grandMean - c.A2 * rangeMean,
    },
    rChart: {
      data: subgroups,
      mean: rangeMean,
      ucl: c.D4 * rangeMean,
      lcl: c.D3 * rangeMean,
    },
  }
}
