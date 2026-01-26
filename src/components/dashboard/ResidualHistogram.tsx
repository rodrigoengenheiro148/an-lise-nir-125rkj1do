import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import { AnalysisRecord, MetricKey, METRICS } from '@/types/dashboard'
import { useMemo } from 'react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface ResidualHistogramProps {
  data: AnalysisRecord[]
  metricKey: MetricKey
}

export const ResidualHistogram = ({
  data,
  metricKey,
}: ResidualHistogramProps) => {
  const metricInfo = METRICS.find((m) => m.key === metricKey) || METRICS[0]

  const histogramData = useMemo(() => {
    if (data.length === 0) return []

    // Calculate Residuals: LAB - ANL
    const residuals = data
      .map((d) => {
        const lab = d[`${metricKey}_lab`]
        const anl = d[`${metricKey}_anl`]
        if (typeof lab !== 'number' || typeof anl !== 'number') return null
        return lab - anl
      })
      .filter((v): v is number => v !== null)

    if (residuals.length === 0) return []

    const min = Math.min(...residuals)
    const max = Math.max(...residuals)
    const binCount = 15
    const range = max - min
    const step = range === 0 ? 1 : range / binCount

    const bins = Array.from({ length: binCount }, (_, i) => {
      const start = min + i * step
      const end = start + step
      return {
        name: `${start.toFixed(2)} a ${end.toFixed(2)}`,
        count: 0,
        start,
        end,
        mid: (start + end) / 2,
      }
    })

    residuals.forEach((v) => {
      const bin =
        bins.find((b) => v >= b.start && v < b.end) || bins[bins.length - 1]
      if (v === max) {
        bins[bins.length - 1].count++
      } else if (bin) {
        bin.count++
      }
    })

    // Sort bins descending by count (frequency)
    bins.sort((a, b) => b.count - a.count)

    return bins
  }, [data, metricKey])

  const chartConfig = {
    count: {
      label: 'Frequência',
      color: metricInfo.color,
    },
  }

  if (histogramData.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500 min-h-[200px]">
        Sem dados para exibir
      </div>
    )
  }

  return (
    <ChartContainer
      config={chartConfig}
      className={`w-full h-full min-h-[200px]`}
    >
      <BarChart
        data={histogramData}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: '#888' }}
          interval={0}
          angle={-45}
          textAnchor="end"
          height={70}
          label={{
            value: 'Resíduo (LAB - ANL)',
            position: 'insideBottom',
            offset: -10,
            fill: '#666',
            fontSize: 10,
          }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: '#888' }}
        />
        <ChartTooltip
          cursor={{ fill: '#333', opacity: 0.4 }}
          content={<ChartTooltipContent />}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {histogramData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.mid < -0.5
                  ? '#ef4444'
                  : entry.mid > 0.5
                    ? '#eab308'
                    : '#10b981'
              }
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
