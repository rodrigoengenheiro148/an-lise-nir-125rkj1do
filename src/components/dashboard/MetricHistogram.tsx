import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { AnalysisRecord, MetricKey, METRICS } from '@/types/dashboard'
import { useMemo } from 'react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface MetricHistogramProps {
  data: AnalysisRecord[]
  metricKey: MetricKey
  height?: string | number
}

export const MetricHistogram = ({
  data,
  metricKey,
  height = '100%',
}: MetricHistogramProps) => {
  const metricInfo = METRICS.find((m) => m.key === metricKey) || METRICS[0]

  const histogramData = useMemo(() => {
    if (data.length === 0) return []

    const values = data
      .map((d) => d[`${metricKey}_lab`])
      .filter((v): v is number => typeof v === 'number' && v > 0)

    if (values.length === 0) return []

    const min = Math.min(...values)
    const max = Math.max(...values)
    const binCount = 15 // Increased resolution
    const range = max - min
    const step = range === 0 ? 1 : range / binCount

    const bins = Array.from({ length: binCount }, (_, i) => {
      const start = min + i * step
      const end = start + step
      return {
        name: `${start.toFixed(1)}-${end.toFixed(1)}`,
        count: 0,
        start,
        end,
      }
    })

    values.forEach((v) => {
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
      className="w-full h-full min-h-[200px]"
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={histogramData}
          margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
          barCategoryGap="15%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#333"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: '#71717a' }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
            label={{
              value: `Valor LAB (${metricInfo.unit})`,
              position: 'insideBottom',
              offset: -5,
              fill: '#52525b',
              fontSize: 10,
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#71717a' }}
            width={30}
          />
          <ChartTooltip
            cursor={{ fill: '#ffffff', opacity: 0.05 }}
            content={<ChartTooltipContent />}
          />
          <Bar
            dataKey="count"
            radius={[4, 4, 0, 0]}
            fill={metricInfo.color}
            fillOpacity={0.7}
            stroke={metricInfo.color}
            strokeWidth={1}
            strokeOpacity={0.9}
            animationDuration={1000}
          >
            {histogramData.map((entry, index) => (
              <Cell key={`cell-${index}`} fillOpacity={0.7} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
