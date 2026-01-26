import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Scatter,
  ComposedChart,
  Line,
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
import { calculateStats } from '@/lib/stats'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'

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
  color, // kept for compatibility but overridden by standardized style
  unit,
}: MetricScatterChartProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const standardizedColor = '#22d3ee' // Cyan-400 for standardized look

  const chartData = useMemo(() => {
    return data
      .map((item) => {
        const lab = Number(item[`${metricKey}_lab`] || 0)
        const anl = Number(item[`${metricKey}_anl`] || 0)
        return {
          lab, // X
          anl, // Y
          company: item.company,
          material: item.material,
          date: item.created_at,
        }
      })
      .filter((d) => d.lab > 0 && d.anl > 0) // Filter invalid points
  }, [data, metricKey])

  const stats = useMemo(() => {
    // Stats calculation expects x (Reference/LAB) and y (Predicted/ANL)
    const points = chartData.map((d) => ({ x: d.lab, y: d.anl }))
    return calculateStats(points)
  }, [chartData])

  const trendLine = useMemo(() => {
    if (chartData.length < 2) return []
    const minX = Math.min(...chartData.map((d) => d.lab))
    const maxX = Math.max(...chartData.map((d) => d.lab))

    // Extend slightly beyond min/max for better visual coverage
    const x1 = minX
    const x2 = maxX

    // Calculate y = mx + b (Linear Regression)
    const y1 = stats.slope * x1 + stats.intercept
    const y2 = stats.slope * x2 + stats.intercept

    return [
      { lab: x1, anl: y1 },
      { lab: x2, anl: y2 },
    ]
  }, [chartData, stats])

  const chartConfig = {
    anl: {
      label: 'ANL',
      color: standardizedColor,
    },
    lab: {
      label: 'LAB',
      color: '#a1a1aa', // Zinc-400
    },
    trend: {
      label: 'Tendência',
      color: standardizedColor,
    },
  } satisfies ChartConfig

  const ChartRender = ({ height = '100%' }: { height?: string | number }) => (
    <ChartContainer config={chartConfig} className={`w-full min-h-[300px]`}>
      <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
          unit={unit}
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#888', fontSize: 10 }}
          label={{
            value: 'LAB (Ref)',
            position: 'bottom',
            fill: '#a1a1aa',
            fontSize: 12,
            offset: 0,
            fontWeight: 500,
          }}
          domain={['auto', 'auto']}
        />
        <YAxis
          type="number"
          dataKey="anl"
          name="ANL"
          unit={unit}
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#888', fontSize: 10 }}
          label={{
            value: 'ANL',
            angle: -90,
            position: 'insideLeft',
            fill: '#a1a1aa',
            fontSize: 12,
            fontWeight: 500,
          }}
          domain={['auto', 'auto']}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: '3 3', stroke: '#555' }}
          content={<ChartTooltipContent indicator="dot" />}
        />

        {/* Linear Regression Trend Line */}
        <Line
          data={trendLine}
          dataKey="anl"
          stroke={standardizedColor}
          strokeWidth={2}
          dot={false}
          activeDot={false}
          type="monotone"
          name="Tendência (Regressão)"
          animationDuration={1000}
        />

        {/* ANL vs LAB Points */}
        <Scatter
          name="Amostras"
          data={chartData}
          fill={standardizedColor}
          shape="circle"
          className="glow-point"
        />
      </ComposedChart>
    </ChartContainer>
  )

  const chartTitle = `${title} - LAB X ANL`

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
          <ChartRender />
        </CardContent>
      </Card>

      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitleComponent className="flex gap-4 items-baseline uppercase">
            <span>{chartTitle}</span>
            <span className="text-sm font-normal text-zinc-400 lowercase normal-case">
              R²: {stats.r2.toFixed(4)} | Slope: {stats.slope.toFixed(4)} |
              Bias: {stats.bias.toFixed(4)} | SEP: {stats.sep.toFixed(4)}
            </span>
          </DialogTitleComponent>
        </DialogHeader>
        <div className="flex-1 w-full min-h-0">
          <ChartRender height="100%" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
