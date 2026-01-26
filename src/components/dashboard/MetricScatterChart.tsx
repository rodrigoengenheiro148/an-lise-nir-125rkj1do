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

  const chartTitle = title ? `${title} - LAB X NIR` : 'LAB X NIR'

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
          'flex h-full items-center justify-center text-sm text-zinc-400',
          !compact &&
            'min-h-[300px] border border-zinc-800 rounded-lg bg-zinc-900',
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
        <div className="flex flex-col space-y-2 mb-2">
          <h4 className="text-lg font-bold text-zinc-200 uppercase tracking-wide text-center">
            {chartTitle}
          </h4>
          <div className="flex justify-center gap-6 text-xs font-mono text-zinc-400 bg-zinc-950/30 py-1 rounded">
            <span>R²: {stats.r2.toFixed(3)}</span>
            <span>Slope: {stats.slope.toFixed(3)}</span>
            <span>Bias: {stats.bias.toFixed(3)}</span>
            <span>SEP: {stats.sep.toFixed(3)}</span>
          </div>
        </div>
      )}

      <div
        className={cn(
          'flex-1',
          compact
            ? 'min-h-0'
            : 'min-h-[400px] bg-[#27272a] rounded-lg border border-zinc-700 p-4 shadow-xl',
        )}
      >
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              margin={{
                top: 20,
                right: 30,
                bottom: 20,
                left: 10,
              }}
            >
              <defs>
                <filter
                  id={`glow-${safeFilterId}`}
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
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
                stroke="#52525b"
                strokeOpacity={0.4}
                vertical={true}
                horizontal={true}
              />
              <XAxis
                type="number"
                dataKey="x"
                name="LAB"
                tickLine={{ stroke: '#71717a' }}
                axisLine={{ stroke: '#71717a' }}
                tick={{ fill: '#e4e4e7', fontSize: 11 }}
                domain={['auto', 'auto']}
                label={{
                  value: 'LAB',
                  position: 'insideBottom',
                  offset: -10,
                  fill: '#e4e4e7',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="NIR"
                tickLine={{ stroke: '#71717a' }}
                axisLine={{ stroke: '#71717a' }}
                tick={{ fill: '#e4e4e7', fontSize: 11 }}
                domain={['auto', 'auto']}
                label={{
                  value: 'NIR',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#e4e4e7',
                  fontSize: 12,
                  fontWeight: 600,
                  offset: 0,
                }}
              />
              <Tooltip
                cursor={{
                  stroke: '#a1a1aa',
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
                      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl text-xs z-50">
                        <div className="font-bold text-zinc-100 mb-2 border-b border-zinc-800 pb-1">
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
                          <span>NIR (Pred):</span>
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
                stroke="#ffffff"
                strokeWidth={1}
                strokeOpacity={0.5}
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
                strokeWidth={2.5}
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
