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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle as DialogTitleComponent,
} from '@/components/ui/dialog'
import { Maximize2 } from 'lucide-react'
import { AnalysisRecord, MetricKey, METRICS } from '@/types/dashboard'
import { useMemo, useState } from 'react'

interface MetricHistogramProps {
  data: AnalysisRecord[]
  metricKey: MetricKey
}

export const MetricHistogram = ({ data, metricKey }: MetricHistogramProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const metricInfo = METRICS.find((m) => m.key === metricKey) || METRICS[0]

  const histogramData = useMemo(() => {
    if (data.length === 0) return []

    // Filtered to use only LAB data as requested
    const values = data
      .map((d) => Number(d[`${metricKey}_lab`] || 0))
      .filter((v) => v > 0) // Exclude zeros

    if (values.length === 0) return []

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

  const ChartRender = ({ height = '100%' }: { height?: string | number }) => (
    <ResponsiveContainer width="100%" height={height}>
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
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Card className="col-span-full md:col-span-1 border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md mt-6">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Distribuição de Frequência</CardTitle>
            <CardDescription className="text-zinc-400">
              Valores de Referência (LAB) - {metricInfo.label}
            </CardDescription>
          </div>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-500 hover:text-white"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ChartRender />
          </div>
        </CardContent>
      </Card>

      <DialogContent className="max-w-[80vw] h-[80vh] flex flex-col bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitleComponent>
            Distribuição Detalhada (LAB) - {metricInfo.label}
          </DialogTitleComponent>
        </DialogHeader>
        <div className="flex-1 w-full min-h-0">
          <ChartRender height="100%" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
