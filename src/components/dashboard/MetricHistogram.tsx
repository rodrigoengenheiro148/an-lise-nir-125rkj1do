import { useMemo } from 'react'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { AnalysisRecord, MetricKey } from '@/types/dashboard'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface MetricHistogramProps {
  data: AnalysisRecord[]
  metricKey: MetricKey
  color?: string
}

export const MetricHistogram = ({
  data,
  metricKey,
  color = 'hsl(var(--primary))',
}: MetricHistogramProps) => {
  const histogramData = useMemo(() => {
    const values = data
      .map((r) => r[`${metricKey}_lab`])
      .filter((v): v is number => typeof v === 'number')

    if (values.length === 0) return []

    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const bins = 10
    const binSize = range / bins

    // Determine precision based on bin size to avoid duplicate labels
    const precision =
      binSize < 1 && binSize > 0 ? Math.ceil(-Math.log10(binSize)) + 1 : 1
    const safePrecision = Math.min(Math.max(precision, 1), 5)

    const buckets = Array.from({ length: bins }, (_, i) => ({
      id: `bin-${i}`, // Unique identifier for Recharts key
      binStart: min + i * binSize,
      binEnd: min + (i + 1) * binSize,
      count: 0,
      label: `${(min + i * binSize).toFixed(safePrecision)} - ${(
        min +
        (i + 1) * binSize
      ).toFixed(safePrecision)}`,
    }))

    values.forEach((v) => {
      const bucketIndex = Math.min(Math.floor((v - min) / binSize), bins - 1)
      if (buckets[bucketIndex]) {
        buckets[bucketIndex].count++
      }
    })

    // Sort bars from highest frequency to lowest (Pareto-like)
    return buckets.sort((a, b) => b.count - a.count)
  }, [data, metricKey])

  const chartConfig: ChartConfig = {
    count: {
      label: 'Frequência',
      color: color,
    },
  }

  if (histogramData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Sem dados para exibir
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={histogramData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
          <XAxis
            dataKey="id"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            style={{ fontSize: '10px' }}
            tickFormatter={(value) => {
              const bucket = histogramData.find((b) => b.id === value)
              return bucket ? bucket.label : ''
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            style={{ fontSize: '10px' }}
            width={30}
          />
          <Tooltip
            content={<ChartTooltipContent hideLabel={false} />}
            labelFormatter={(value, payload) => {
              if (payload && payload.length > 0 && payload[0].payload) {
                return payload[0].payload.label
              }
              const bucket = histogramData.find((b) => b.id === value)
              return bucket ? bucket.label : value
            }}
          />
          <Bar
            dataKey="count"
            fill={color}
            fillOpacity={0.6}
            radius={[4, 4, 0, 0]}
            name="Frequência"
            barSize={32}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            name="Tendência"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
