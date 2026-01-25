import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { AnalysisRecord, MetricKey, METRICS } from '@/types/dashboard'
import { useMemo, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MetricHistogramProps {
  data: AnalysisRecord[]
}

export const MetricHistogram = ({ data }: MetricHistogramProps) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('protein')

  const metricInfo = METRICS.find((m) => m.key === selectedMetric) || METRICS[0]

  const histogramData = useMemo(() => {
    if (data.length === 0) return []

    const values = data.map((d) => d[selectedMetric])
    const min = Math.min(...values)
    const max = Math.max(...values)

    // Create bins
    const binCount = 10
    const range = max - min
    const step = range / binCount || 1 // avoid division by zero

    const bins = Array.from({ length: binCount }, (_, i) => {
      const start = min + i * step
      const end = start + step
      return {
        range: `${start.toFixed(1)} - ${end.toFixed(1)}`,
        count: 0,
        start,
        end,
      }
    })

    values.forEach((v) => {
      // Find bin
      const bin =
        bins.find((b) => v >= b.start && v < b.end) || bins[bins.length - 1]
      if (bin) bin.count++
    })

    return bins
  }, [data, selectedMetric])

  const config = {
    count: {
      label: 'Frequência',
      color: metricInfo.color,
    },
  }

  return (
    <Card className="col-span-full mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Distribuição de Frequência</CardTitle>
          <CardDescription>
            Análise detalhada da distribuição para {metricInfo.label}
          </CardDescription>
        </div>
        <div className="w-[200px]">
          <Select
            value={selectedMetric}
            onValueChange={(v) => setSelectedMetric(v as MetricKey)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a métrica" />
            </SelectTrigger>
            <SelectContent>
              {METRICS.map((m) => (
                <SelectItem key={m.key} value={m.key}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ChartContainer config={config} className="h-full w-full">
            <BarChart
              data={histogramData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="range"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {histogramData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={metricInfo.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
