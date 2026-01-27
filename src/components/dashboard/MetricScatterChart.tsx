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

// Improved Tooltip Component to support mobile tap and desktop hover
// Strictly filters payload to ensure only point data is displayed
const CustomTooltip = ({ active, payload, unit, color }: any) => {
  if (!active || !payload || !payload.length) return null

  // STRICT CHECK: Only show tooltip if the payload contains data from the 'points' Scatter
  // This effectively prevents the tooltip from showing when hovering *only* the Trend Line
  // because the Line component is configured with tooltipType="none"
  const pointPayload = payload.find((p: any) => p.name === 'points')

  if (pointPayload && pointPayload.payload && pointPayload.payload.original) {
    const dataPoint = pointPayload.payload
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 shadow-xl text-xs z-50 ring-1 ring-zinc-800/50 min-w-[200px]">
        <div className="font-bold text-zinc-100 mb-2 border-b border-zinc-900 pb-1 flex justify-between items-center">
          <span className="truncate max-w-[150px]">
            {dataPoint.original.company}
          </span>
          <span className="text-[10px] text-zinc-500 font-normal">Amostra</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-zinc-400">
          <span>Data:</span>
          <span className="text-right text-zinc-300">
            {dataPoint.original.date
              ? new Date(dataPoint.original.date).toLocaleDateString()
              : '-'}
          </span>
          <span>LAB (Ref):</span>
          <span className="text-right text-zinc-100 font-mono font-medium">
            {dataPoint.x.toFixed(2)} {unit}
          </span>
          <span>NIR (Pred):</span>
          <span
            className="text-right font-mono font-medium"
            style={{ color: color }}
          >
            {dataPoint.y.toFixed(2)} {unit}
          </span>
          <span>Resíduo:</span>
          <span
            className={cn('text-right font-mono font-bold', 'text-red-500')}
          >
            {(dataPoint.x - dataPoint.y).toFixed(2)}
          </span>
        </div>
      </div>
    )
  }

  return null
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

      // Generate multiple points for the trend line to allow smooth rendering
      const steps = 50
      const stepSize = (maxX - minX) / (steps - 1)

      trend = Array.from({ length: steps }).map((_, i) => {
        const x = minX + i * stepSize
        const y = statistics.slope * x + statistics.intercept
        return { x, y }
      })
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
          'flex h-full items-center justify-center text-sm text-zinc-500',
          !compact &&
            'min-h-[300px] border border-zinc-800 rounded-lg bg-black',
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
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] sm:text-xs font-mono text-zinc-400 bg-zinc-900/50 py-1 rounded border border-zinc-800 px-2">
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
            : 'min-h-[300px] sm:min-h-[400px] bg-black rounded-lg border border-zinc-800 p-2 sm:p-4 shadow-sm',
        )}
      >
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              margin={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 0,
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
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#333"
                strokeOpacity={0.6}
                vertical={true}
                horizontal={true}
              />
              <XAxis
                type="number"
                dataKey="x"
                name="LAB"
                tickLine={{ stroke: '#52525b' }}
                axisLine={{ stroke: '#52525b' }}
                tick={{ fill: '#71717a', fontSize: 10 }}
                domain={['auto', 'auto']}
                label={{
                  value: 'LAB',
                  position: 'insideBottom',
                  offset: -10,
                  fill: '#a1a1aa',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="NIR"
                tickLine={{ stroke: '#52525b' }}
                axisLine={{ stroke: '#52525b' }}
                tick={{ fill: '#71717a', fontSize: 10 }}
                domain={['auto', 'auto']}
                label={{
                  value: 'NIR',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#a1a1aa',
                  fontSize: 10,
                  fontWeight: 600,
                  offset: 0,
                }}
              />
              <Tooltip
                cursor={false} // Clean look, prevents scan lines across empty space
                content={(props) => (
                  <CustomTooltip {...props} unit={unit} color={color} />
                )}
              />

              {/* Trend Line rendered BEFORE Scatter so points are on top */}
              {/* tooltipType="none" is CRITICAL to prevent trend line from showing in tooltip */}
              <Line
                name="trend"
                data={trendPoints}
                dataKey="y"
                stroke="var(--color-trend)"
                strokeWidth={2}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                tooltipType="none"
              />

              <Scatter
                name="points"
                data={points}
                fill="var(--color-points)"
                shape="circle"
                style={{ filter: `url(#glow-${safeFilterId})` }}
                strokeWidth={0}
                isAnimationActive={false} // Smoother updates for realtime
              >
                {points.map((entry, index) => (
                  <Cell
                    key={entry.original.id || `cell-${index}`}
                    fill={color}
                  />
                ))}
              </Scatter>
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
