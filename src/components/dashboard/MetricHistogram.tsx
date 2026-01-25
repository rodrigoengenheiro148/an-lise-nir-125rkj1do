import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { AnalysisRecord, MetricKey, METRICS } from '@/types/dashboard'
import { useMemo } from 'react'

interface MetricHistogramProps {
  data: AnalysisRecord[]
  metricKey: MetricKey
}

export const MetricHistogram = ({ data, metricKey }: MetricHistogramProps) => {
  const metricInfo = METRICS.find((m) => m.key === metricKey) || METRICS[0]

  const histogramData = useMemo(() => {
    if (data.length === 0) return []

    // Combine both LAB and NIR values for distribution
    const values = data.flatMap((d) => [
      d[`${metricKey}_lab` as keyof AnalysisRecord] as number,
      // d[`${metricKey}_nir` as keyof AnalysisRecord] as number // Usually histograms are for the reference or the population
    ])
    // Just using LAB for now to show population distribution, or could handle both.
    // Let's stick to LAB (Reference) distribution as it represents the "Truth".

    const min = Math.min(...values)
    const max = Math.max(...values)
    const binCount = 15
    const range = max - min
    const step = range / binCount || 1

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
      if (bin) bin.count++
    })

    return bins
  }, [data, metricKey])

  return (
    <Card className="col-span-full md:col-span-1 border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md mt-6">
      <CardHeader>
        <CardTitle>Distribuição de Frequência (LAB)</CardTitle>
        <CardDescription className="text-zinc-400">
          Histograma de valores reais para {metricInfo.label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={histogramData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#333"
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#888' }}
                interval={1}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#888' }}
              />
              <RechartsTooltip
                cursor={{ fill: '#333', opacity: 0.4 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload
                    return (
                      <div className="bg-zinc-900 border border-zinc-700 p-2 rounded text-xs text-zinc-200">
                        <p>Intervalo: {d.name}</p>
                        <p>Contagem: {d.count}</p>
                      </div>
                    )
                  }
                  return null
                }}
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
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
