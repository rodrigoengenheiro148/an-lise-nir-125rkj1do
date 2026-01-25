import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
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
  const [isOpen, setIsOpen] = useState(false)
  const metricInfo = METRICS.find((m) => m.key === metricKey) || METRICS[0]

  const histogramData = useMemo(() => {
    if (data.length === 0) return []

    // Calculate Residuals: LAB - ANL
    // Filter out records where either LAB or ANL is missing or zero (assuming 0 might be invalid, or at least consistent with other charts)
    const residuals = data
      .map((d) => {
        const lab = Number(d[`${metricKey}_lab`])
        const anl = Number(d[`${metricKey}_anl`])
        if (lab === 0 || anl === 0 || isNaN(lab) || isNaN(anl)) return null
        return lab - anl
      })
      .filter((v): v is number => v !== null)

    if (residuals.length === 0) return []

    const min = Math.min(...residuals)
    const max = Math.max(...residuals)
    const binCount = 15
    const range = max - min
    // Avoid division by zero if all residuals are same
    const step = range === 0 ? 1 : range / binCount

    // Create bins centered around 0 if possible, or just standard min-max
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
      // Find bin
      const bin =
        bins.find((b) => v >= b.start && v < b.end) || bins[bins.length - 1]
      // Edge case for max value inclusive
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

  const ChartRender = ({ height = '100%' }: { height?: string | number }) => (
    <ChartContainer config={chartConfig} className={`w-full min-h-[300px]`}>
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
          label={{
            value: 'Frequência',
            angle: -90,
            position: 'insideLeft',
            fill: '#666',
            fontSize: 10,
          }}
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
                entry.mid < 0
                  ? '#ef4444'
                  : entry.mid > 0
                    ? '#10b981'
                    : metricInfo.color
              } // Red for negative, Green for positive, or just metric color
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Card className="flex flex-col h-full border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md group">
        <CardHeader className="p-4 pb-2 border-b border-zinc-800 flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-lg font-bold text-zinc-100 uppercase tracking-wide font-display">
              Resíduos - {metricInfo.label}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 font-mono mt-1">
              Distribuição de Erros (LAB - ANL)
            </CardDescription>
          </div>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-500 hover:text-white -mr-2"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </CardHeader>
        <CardContent className="flex-1 p-2 min-h-[300px] relative">
          <ChartRender />
        </CardContent>
      </Card>

      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitleComponent>
            Distribuição de Resíduos (LAB - ANL) - {metricInfo.label}
          </DialogTitleComponent>
        </DialogHeader>
        <div className="flex-1 w-full min-h-0">
          <ChartRender height="100%" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
