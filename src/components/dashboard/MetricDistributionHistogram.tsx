import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
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
import { AnalysisRecord, MetricKey } from '@/types/dashboard'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface MetricDistributionHistogramProps {
  data: AnalysisRecord[]
  metricKey: MetricKey
  title: string
  color: string
  unit: string
}

export const MetricDistributionHistogram = ({
  data,
  metricKey,
  title,
  color,
  unit,
}: MetricDistributionHistogramProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const histogramData = useMemo(() => {
    if (data.length === 0) return []

    const validData = data.filter((d) => {
      const lab = Number(d[`${metricKey}_lab`] || 0)
      const anl = Number(d[`${metricKey}_anl`] || 0)
      return lab > 0 || anl > 0
    })

    if (validData.length === 0) return []

    const allValues = validData
      .flatMap((d) => [
        Number(d[`${metricKey}_lab`] || 0),
        Number(d[`${metricKey}_anl`] || 0),
      ])
      .filter((v) => v > 0)

    const min = Math.min(...allValues)
    const max = Math.max(...allValues)
    const binCount = 12
    const range = max - min
    const step = range / binCount || 1

    const bins = Array.from({ length: binCount }, (_, i) => {
      const start = min + i * step
      const end = start + step
      return {
        name: `${start.toFixed(1)} - ${end.toFixed(1)}`,
        labCount: 0,
        anlCount: 0,
        start,
        end,
      }
    })

    validData.forEach((d) => {
      const lab = Number(d[`${metricKey}_lab`] || 0)
      const anl = Number(d[`${metricKey}_anl`] || 0)

      if (lab > 0) {
        const bin =
          bins.find((b) => lab >= b.start && lab < b.end) ||
          bins[bins.length - 1]
        if (bin) bin.labCount++
      }
      if (anl > 0) {
        const bin =
          bins.find((b) => anl >= b.start && anl < b.end) ||
          bins[bins.length - 1]
        if (bin) bin.anlCount++
      }
    })

    // Sort by sum of counts
    bins.sort((a, b) => b.labCount + b.anlCount - (a.labCount + a.anlCount))

    return bins
  }, [data, metricKey])

  const chartConfig = {
    labCount: {
      label: 'LAB (Ref)',
      color: '#71717a', // Zinc-500
    },
    anlCount: {
      label: 'ANL',
      color: color,
    },
  }

  const ChartRender = ({ height = '100%' }: { height?: string | number }) => (
    <ChartContainer config={chartConfig} className={`w-full min-h-[300px]`}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={histogramData}
          margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
          barGap={2}
          barCategoryGap="20%"
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
            height={70}
            label={{
              value: `${title} (${unit})`,
              position: 'insideBottom',
              offset: -10,
              fill: '#52525b',
              fontSize: 10,
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#71717a' }}
            label={{
              value: 'Frequência',
              angle: -90,
              position: 'insideLeft',
              fill: '#52525b',
              fontSize: 10,
            }}
            width={35}
          />
          <ChartTooltip
            cursor={{ fill: '#ffffff', opacity: 0.05 }}
            content={<ChartTooltipContent indicator="dashed" />}
          />
          <Legend
            verticalAlign="top"
            height={36}
            content={({ payload }) => (
              <div className="flex items-center justify-center gap-4 text-xs">
                {payload?.map((entry: any, index: number) => (
                  <div
                    key={`item-${index}`}
                    className="flex items-center gap-2"
                  >
                    <span
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-zinc-400 font-medium">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          />
          <Bar
            dataKey="labCount"
            fill="var(--color-labCount)"
            radius={[4, 4, 0, 0]}
            fillOpacity={0.8}
            stroke="var(--color-labCount)"
            strokeWidth={1}
          />
          <Bar
            dataKey="anlCount"
            fill="var(--color-anlCount)"
            radius={[4, 4, 0, 0]}
            fillOpacity={0.8}
            stroke="var(--color-anlCount)"
            strokeWidth={1}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Card className="flex flex-col h-full border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md group">
        <CardHeader className="p-4 pb-2 border-b border-zinc-800 flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-lg font-bold text-zinc-100 uppercase tracking-wide font-display">
              Distribuição - {title}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 font-mono mt-1">
              Frequência de valores LAB vs ANL
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
        <CardContent className="flex-1 p-2 min-h-[300px] relative bg-zinc-950/50">
          <ChartRender />
        </CardContent>
      </Card>

      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitleComponent className="uppercase tracking-wide">
            Distribuição Detalhada - {title}
          </DialogTitleComponent>
        </DialogHeader>
        <div className="flex-1 w-full min-h-0">
          <ChartRender height="100%" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
