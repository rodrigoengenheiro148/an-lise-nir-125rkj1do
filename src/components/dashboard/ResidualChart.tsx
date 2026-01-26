import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  Line,
  ReferenceLine,
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
import { calculateStats } from '@/lib/stats'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'

interface ResidualScatterProps {
  data: AnalysisRecord[]
  metricKey: MetricKey
  height?: string | number
}

export const ResidualScatter = ({
  data,
  metricKey,
  height = '100%',
}: ResidualScatterProps) => {
  const metricInfo = METRICS.find((m) => m.key === metricKey) || METRICS[0]
  const cyanColor = '#22d3ee'

  const chartData = useMemo(() => {
    return data
      .map((item) => {
        const lab = Number(item[`${metricKey}_lab`] || 0)
        const anl = Number(item[`${metricKey}_anl`] || 0)
        return {
          lab,
          anl,
          residual: lab - anl,
          company: item.company,
          date: item.created_at,
        }
      })
      .filter((d) => d.lab > 0 && d.anl > 0)
  }, [data, metricKey])

  const stats = useMemo(() => {
    const points = chartData.map((d) => ({ x: d.lab, y: d.residual }))
    return calculateStats(points)
  }, [chartData])

  const trendLine = useMemo(() => {
    if (chartData.length < 2) return []
    const minX = Math.min(...chartData.map((d) => d.lab))
    const maxX = Math.max(...chartData.map((d) => d.lab))

    // Extend slightly
    const padding = (maxX - minX) * 0.05
    const x1 = Math.max(0, minX - padding)
    const x2 = maxX + padding

    const y1 = stats.slope * x1 + stats.intercept
    const y2 = stats.slope * x2 + stats.intercept

    return [
      { lab: x1, residual: y1 },
      { lab: x2, residual: y2 },
    ]
  }, [chartData, stats])

  const chartConfig = {
    residual: {
      label: 'Resíduo',
      color: cyanColor,
    },
    trend: {
      label: 'Tendência',
      color: cyanColor,
    },
  } satisfies ChartConfig

  return (
    <ChartContainer
      config={chartConfig}
      className="w-full h-full min-h-[250px]"
    >
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#333"
            vertical={true}
            horizontal={true}
          />
          <XAxis
            type="number"
            dataKey="lab"
            name="LAB"
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: 'Valor de Referência (LAB)',
              position: 'bottom',
              fill: '#71717a',
              fontSize: 11,
              offset: 0,
            }}
            domain={['auto', 'auto']}
          />
          <YAxis
            type="number"
            dataKey="residual"
            name="Resíduo"
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: 'Resíduo (LAB - ANL)',
              angle: -90,
              position: 'insideLeft',
              fill: '#71717a',
              fontSize: 11,
            }}
          />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
          <ChartTooltip
            cursor={{ strokeDasharray: '3 3', stroke: '#555' }}
            content={<ChartTooltipContent />}
          />
          <Line
            data={trendLine}
            dataKey="residual"
            stroke={cyanColor}
            strokeWidth={2}
            dot={false}
            activeDot={false}
            type="monotone"
            name="Tendência Linear"
            animationDuration={1000}
            strokeOpacity={0.6}
          />
          <Scatter
            name="Amostras"
            data={chartData}
            fill={cyanColor}
            shape="circle"
            className="glow-point"
            fillOpacity={0.8}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

interface ResidualChartProps {
  data: AnalysisRecord[]
  metricKey: MetricKey
}

export const ResidualChart = ({ data, metricKey }: ResidualChartProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const metricInfo = METRICS.find((m) => m.key === metricKey) || METRICS[0]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Card className="col-span-full md:col-span-2 border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md group">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-bold text-zinc-100 uppercase tracking-wide font-display">
              Resíduos (LAB - ANL)
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 font-mono mt-1">
              Dispersão de erros para {metricInfo.label}
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
          <div className="h-[250px] w-full bg-zinc-950/50 rounded-lg p-2 border border-zinc-900/50">
            <ResidualScatter data={data} metricKey={metricKey} />
          </div>
        </CardContent>
      </Card>

      <DialogContent className="max-w-[80vw] h-[80vh] flex flex-col bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitleComponent className="uppercase tracking-wide">
            Análise de Resíduos - {metricInfo.label}
          </DialogTitleComponent>
        </DialogHeader>
        <div className="flex-1 w-full min-h-0">
          <ResidualScatter data={data} metricKey={metricKey} height="100%" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
