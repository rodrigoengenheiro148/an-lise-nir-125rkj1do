import { useMemo } from 'react'
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
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalysisRecord, MetricKey } from '@/types/dashboard'
import { calculateStats, generateRegressionPoints } from '@/lib/stats'
import { cn } from '@/lib/utils'

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
  const chartData = useMemo(() => {
    return data.map((item) => ({
      x: item[`${metricKey}_lab` as keyof AnalysisRecord] as number,
      y: item[`${metricKey}_nir` as keyof AnalysisRecord] as number,
      date: item.date,
      company: item.company,
    }))
  }, [data, metricKey])

  const stats = useMemo(() => calculateStats(chartData), [chartData])
  const regressionLine = useMemo(
    () => generateRegressionPoints(chartData, stats.slope, stats.intercept),
    [chartData, stats],
  )

  return (
    <Card className="flex flex-col h-full border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md">
      <CardHeader className="p-4 pb-2 border-b border-zinc-800">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
            {title}
            <span className="ml-1 text-xs font-normal text-zinc-500 normal-case">
              LAB vs NIR ({unit})
            </span>
          </CardTitle>
        </div>
        <div className="flex gap-4 text-[10px] text-zinc-400 font-mono mt-1">
          <span>R²: {stats.r2.toFixed(3)}</span>
          <span>SEP: {stats.sep.toFixed(3)}</span>
          <span>Bias: {stats.bias.toFixed(3)}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-2 min-h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
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
              name="NIR"
              unit={unit}
              tick={{ fill: '#666', fontSize: 10 }}
              label={{
                value: 'NIR',
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
                      <p>{d.date}</p>
                      <div className="grid grid-cols-2 gap-x-2 mt-1">
                        <span className="text-zinc-400">LAB:</span>
                        <span className="text-right font-mono">
                          {Number(d.x).toFixed(2)}
                        </span>
                        <span className="text-zinc-400">NIR:</span>
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
            <Scatter
              name="Samples"
              data={chartData}
              fill={color}
              shape="circle"
              className="glow-point opacity-80"
            />
            <Line
              data={regressionLine}
              dataKey="y"
              stroke="#ffffff"
              strokeWidth={2}
              strokeOpacity={0.3}
              dot={false}
              activeDot={false}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
