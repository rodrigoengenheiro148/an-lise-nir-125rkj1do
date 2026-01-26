import { useMemo, useState } from 'react'
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
import { calculateStats } from '@/lib/stats'
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Label,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

interface MetricScatterChartProps {
  title: string
  data: AnalysisRecord[]
  metricKey: MetricKey
  color: string
  unit: string
}

export const MetricScatterChart = ({
  title,
  data,
  metricKey,
  unit,
}: MetricScatterChartProps) => {
  const [isOpen, setIsOpen] = useState(false)

  // Calculate stats and prepare data
  const { points, stats, trendPoints } = useMemo(() => {
    const pts = data
      .map((item) => {
        const lab = Number(item[`${metricKey}_lab`])
        const anl = Number(item[`${metricKey}_anl`]) // Using ANL as Y axis per existing logic, could be NIR
        return {
          x: lab,
          y: anl,
          original: item,
        }
      })
      .filter((p) => !isNaN(p.x) && !isNaN(p.y) && p.x > 0 && p.y > 0)

    const statistics = calculateStats(pts)

    let trend: { x: number; y: number }[] = []
    if (statistics.n >= 2) {
      const minX = statistics.min
      const maxX = statistics.max
      trend = [
        { x: minX, y: statistics.slope * minX + statistics.intercept },
        { x: maxX, y: statistics.slope * maxX + statistics.intercept },
      ]
    }

    return { points: pts, stats: statistics, trendPoints: trend }
  }, [data, metricKey])

  const chartTitle = `${title} - LAB X NIR`

  const chartConfig = {
    points: {
      label: 'Amostra',
      color: '#22d3ee', // Cyan-400 for glowing effect
    },
    trend: {
      label: 'Tendência',
      color: '#0891b2', // Cyan-600
    },
  }

  const ChartRender = ({ height = '100%' }: { height?: string | number }) => {
    if (points.length === 0) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Sem dados para exibir
        </div>
      )
    }

    return (
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <defs>
              <filter id="glow" height="300%" width="300%" x="-100%" y="-100%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#333"
              strokeOpacity={0.4}
              vertical={true}
              horizontal={true}
            />
            <XAxis
              type="number"
              dataKey="x"
              name="LAB"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#71717a', fontSize: 10 }}
              domain={['auto', 'auto']}
              label={{
                value: `LAB (${unit})`,
                position: 'insideBottom',
                offset: -10,
                fill: '#71717a',
                fontSize: 10,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="NIR"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#71717a', fontSize: 10 }}
              domain={['auto', 'auto']}
              label={{
                value: `NIR (${unit})`,
                angle: -90,
                position: 'insideLeft',
                fill: '#71717a',
                fontSize: 10,
              }}
            />
            <Tooltip
              cursor={{
                stroke: '#ffffff',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const dataPoint = payload.find(
                    (p) => p.name === 'points',
                  )?.payload
                  if (!dataPoint) return null
                  return (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2 shadow-xl text-xs">
                      <div className="font-bold text-zinc-200 mb-1">
                        {dataPoint.original.company}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-400">
                        <span>LAB:</span>
                        <span className="text-right text-zinc-100 font-mono">
                          {dataPoint.x.toFixed(2)}
                        </span>
                        <span>NIR:</span>
                        <span className="text-right text-cyan-400 font-mono">
                          {dataPoint.y.toFixed(2)}
                        </span>
                        <span>Erro:</span>
                        <span className="text-right text-red-400 font-mono">
                          {(dataPoint.x - dataPoint.y).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Scatter
              name="points"
              data={points}
              fill="var(--color-points)"
              style={{ filter: 'url(#glow)' }}
            >
              {points.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="var(--color-points)" />
              ))}
            </Scatter>
            <Line
              name="trend"
              data={trendPoints}
              dataKey="y"
              stroke="var(--color-trend)"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Card className="flex flex-col h-full border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md group">
        <CardHeader className="p-4 pb-2 border-b border-zinc-800 flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-lg font-bold text-zinc-100 uppercase tracking-wide font-display">
              {chartTitle}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 font-mono mt-1">
              R²: {stats.r2.toFixed(3)} | Slope: {stats.slope.toFixed(3)} |
              Bias: {stats.bias.toFixed(3)}
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
          <ChartRender height="100%" />
        </CardContent>
      </Card>

      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitleComponent className="flex gap-4 items-baseline uppercase">
            <span>{chartTitle}</span>
            <span className="text-sm font-normal text-zinc-400 lowercase normal-case">
              R²: {stats.r2.toFixed(4)} | Slope: {stats.slope.toFixed(4)} |
              Intercept: {stats.intercept.toFixed(4)} | Bias:{' '}
              {stats.bias.toFixed(4)} | SEP: {stats.sep.toFixed(4)}
            </span>
          </DialogTitleComponent>
        </DialogHeader>
        <div className="flex-1 w-full min-h-0 p-4">
          <ChartRender height="100%" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
