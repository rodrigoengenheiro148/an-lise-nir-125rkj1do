import { useMemo, useId } from 'react'
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
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { AnalysisRecord, MetricKey } from '@/types/dashboard'
import { calculateStats } from '@/lib/stats'
import { cn } from '@/lib/utils'

interface MetricScatterChartProps {
  data: AnalysisRecord[]
  metricKey: MetricKey
  color: string
  unit: string
  title?: string
  compact?: boolean
}

export const MetricScatterChart = ({
  data,
  metricKey,
  color,
  unit,
  title,
  compact = false,
}: MetricScatterChartProps) => {
  const filterId = useId()
  const safeFilterId = filterId.replace(/:/g, '')

  // Calculate stats and prepare data for Scatter Plot
  const { points, stats, trendPoints } = useMemo(() => {
    const pts = data
      .map((item) => {
        const lab = Number(item[`${metricKey}_lab`])
        const anl = Number(item[`${metricKey}_anl`])
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

  const chartTitle = title ? `${title} - LAB X ANL` : 'LAB X ANL'

  const chartConfig = {
    points: {
      label: 'Amostra',
      color: color,
    },
    trend: {
      label: 'Tendência',
      color: color,
    },
  }

  if (points.length === 0) {
    return (
      <div
        className={cn(
          'flex h-full items-center justify-center text-sm text-muted-foreground',
          !compact &&
            'min-h-[300px] border border-zinc-800 rounded-lg bg-zinc-950/50',
        )}
      >
        Sem dados para exibir
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col',
        compact ? 'h-full w-full' : 'h-full w-full space-y-2',
      )}
    >
      {!compact && (
        <div className="flex items-center justify-between px-2">
          <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
            {chartTitle}
          </h4>
          <div className="flex gap-4 text-xs font-mono text-zinc-400">
            <span>R²: {stats.r2.toFixed(3)}</span>
            <span>Slope: {stats.slope.toFixed(3)}</span>
            <span>Bias: {stats.bias.toFixed(3)}</span>
          </div>
        </div>
      )}

      <div
        className={cn(
          'flex-1',
          compact
            ? 'min-h-0'
            : 'min-h-[300px] bg-zinc-950/50 rounded-lg border border-zinc-800 p-4',
        )}
      >
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              margin={{
                top: 10,
                right: compact ? 10 : 30,
                bottom: compact ? 0 : 20,
                left: compact ? -20 : 10,
              }}
            >
              <defs>
                <filter
                  id={`glow-${safeFilterId}`}
                  height="300%"
                  width="300%"
                  x="-100%"
                  y="-100%"
                >
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
                strokeOpacity={0.5}
                vertical={true}
                horizontal={true}
              />
              <XAxis
                type="number"
                dataKey="x"
                name="LAB"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#a1a1aa', fontSize: 10 }}
                domain={['auto', 'auto']}
                label={{
                  value: `LAB (${unit})`,
                  position: 'insideBottom',
                  offset: compact ? -5 : -10,
                  fill: '#a1a1aa',
                  fontSize: 10,
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="ANL"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#a1a1aa', fontSize: 10 }}
                domain={['auto', 'auto']}
                label={{
                  value: `ANL (${unit})`,
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#a1a1aa',
                  fontSize: 10,
                  offset: compact ? 10 : 0,
                }}
              />
              <Tooltip
                cursor={{
                  stroke: '#52525b',
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
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 shadow-xl text-xs z-50">
                        <div className="font-bold text-zinc-100 mb-2">
                          {dataPoint.original.company}
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-zinc-400">
                          <span>Data:</span>
                          <span className="text-right text-zinc-300">
                            {dataPoint.original.date
                              ? new Date(
                                  dataPoint.original.date,
                                ).toLocaleDateString()
                              : '-'}
                          </span>
                          <span>LAB (Ref):</span>
                          <span className="text-right text-zinc-100 font-mono font-medium">
                            {dataPoint.x.toFixed(2)}
                          </span>
                          <span>ANL/NIR:</span>
                          <span
                            className="text-right font-mono font-medium"
                            style={{ color: color }}
                          >
                            {dataPoint.y.toFixed(2)}
                          </span>
                          <span>Resíduo:</span>
                          <span
                            className={cn(
                              'text-right font-mono',
                              dataPoint.x - dataPoint.y > 0
                                ? 'text-green-400'
                                : 'text-red-400',
                            )}
                          >
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
                shape="circle"
                style={{ filter: `url(#glow-${safeFilterId})` }}
              >
                {points.map((entry, index) => (
                  <Cell
                    key={entry.original.id || `cell-${index}`}
                    fill="var(--color-points)"
                  />
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
      </div>
    </div>
  )
}
