import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Line,
  ComposedChart,
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { calculateStats, generateRegressionPoints } from '@/lib/stats'

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
  color,
  unit,
}: MetricScatterChartProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const chartData = useMemo(() => {
    return data.map((item) => ({
      x: item[`${metricKey}_lab` as keyof AnalysisRecord] as number,
      y: item[`${metricKey}_nir` as keyof AnalysisRecord] as number,
      date: item.date,
      company: item.company,
      material: item.material,
    }))
  }, [data, metricKey])

  const stats = useMemo(() => calculateStats(chartData), [chartData])
  const regressionLine = useMemo(
    () => generateRegressionPoints(chartData, stats.slope, stats.intercept),
    [chartData, stats],
  )

  const identityLine = useMemo(() => {
    if (chartData.length === 0) return []
    const min = Math.min(stats.min, 0)
    const max = stats.max * 1.1 // Add some padding
    return [
      { x: min, y: min },
      { x: max, y: max },
    ]
  }, [stats])

  const ChartRender = ({ height = '100%' }: { height?: string | number }) => (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          type="number"
          dataKey="x"
          name="LAB"
          unit={unit}
          tick={{ fill: '#666', fontSize: 10 }}
          label={{
            value: 'LAB',
            position: 'bottom',
            fill: '#666',
            fontSize: 10,
          }}
          domain={['auto', 'auto']}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="ANL"
          unit={unit}
          tick={{ fill: '#666', fontSize: 10 }}
          label={{
            value: 'ANL (NIR)',
            angle: -90,
            position: 'insideLeft',
            fill: '#666',
            fontSize: 10,
          }}
          domain={['auto', 'auto']}
        />
        <RechartsTooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const d = payload[0].payload
              return (
                <div className="bg-zinc-900 border border-zinc-700 p-2 rounded text-xs text-zinc-200 shadow-xl">
                  <p className="font-bold mb-1">{d.company}</p>
                  {d.material && (
                    <p className="text-zinc-400 mb-1 italic">{d.material}</p>
                  )}
                  <p>{d.date}</p>
                  <div className="grid grid-cols-2 gap-x-2 mt-1">
                    <span className="text-zinc-400">LAB:</span>
                    <span className="text-right font-mono">
                      {Number(d.x).toFixed(2)}
                    </span>
                    <span className="text-zinc-400">ANL:</span>
                    <span className="text-right font-mono">
                      {Number(d.y).toFixed(2)}
                    </span>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        {/* Identity Line (y=x) */}
        <Line
          data={identityLine}
          dataKey="y"
          stroke="#52525b"
          strokeWidth={1}
          strokeDasharray="5 5"
          dot={false}
          activeDot={false}
          type="monotone"
          name="Identity (y=x)"
        />
        {/* Regression Line */}
        <Line
          data={regressionLine}
          dataKey="y"
          stroke="#ffffff"
          strokeWidth={2}
          strokeOpacity={0.5}
          dot={false}
          activeDot={false}
          type="monotone"
          name="Regression"
        />
        <Scatter
          name="Samples"
          data={chartData}
          fill={color}
          shape="circle"
          className="glow-point opacity-80"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Card className="flex flex-col h-full border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md group">
        <CardHeader className="p-4 pb-2 border-b border-zinc-800 flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
              {title}
              <span className="ml-1 text-xs font-normal text-zinc-500 normal-case">
                LAB vs ANL ({unit})
              </span>
            </CardTitle>
            <div className="flex gap-4 text-[10px] text-zinc-400 font-mono mt-1">
              <span>R²: {stats.r2.toFixed(3)}</span>
              <span>SEP: {stats.sep.toFixed(3)}</span>
            </div>
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
        <CardContent className="flex-1 p-2 min-h-[200px] relative">
          <ChartRender />
        </CardContent>
      </Card>

      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitleComponent className="flex gap-4 items-baseline">
            <span>{title} - Detalhes</span>
            <span className="text-sm font-normal text-zinc-400 font-mono">
              R²: {stats.r2.toFixed(4)} | SEP: {stats.sep.toFixed(4)} | Bias:{' '}
              {stats.bias.toFixed(4)} | Slope: {stats.slope.toFixed(4)}
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
