import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip,
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
}

export const MetricHistogram = ({ data, metricKey }: MetricHistogramProps) => {
  const metricInfo = METRICS.find((m) => m.key === metricKey) || METRICS[0]

  const histogramData = useMemo(() => {
    if (data.length === 0) return []

    // Filtered to use only LAB data as requested
    // Ensure we handle 0 values correctly if they are valid
    const values = data
      .map((d) => d[`${metricKey}_lab`])
      .filter((v): v is number => typeof v === 'number')

    if (values.length === 0) return []

    const min = Math.min(...values)
    const max = Math.max(...values)
    const binCount = 15
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
      // Handle the exact max case which matches nothing strictly < end except last bin
      if (v === max) {
        bins[bins.length - 1].count++
      } else if (bin) {
        bin.count++
      }
    })

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
          height={60}
          label={{
            value: `Valor LAB (${metricInfo.unit})`,
            position: 'insideBottom',
            offset: -5,
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
              fill={metricInfo.color}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
