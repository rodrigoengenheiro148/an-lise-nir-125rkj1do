import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { AnalysisRecord, MetricKey } from '@/types/dashboard'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { calculateSimpleMovingAverage } from '@/lib/calculations'
import { AnalysisDetailTooltip } from './AnalysisDetailTooltip'

interface MetricEvolutionChartProps {
  data: AnalysisRecord[]
  metricKey: MetricKey
  color: string
  unit: string
  height?: string | number
}

export const MetricEvolutionChart = ({
  data,
  metricKey,
  color,
  unit,
  height = '100%',
}: MetricEvolutionChartProps) => {
  const chartData = useMemo(() => {
    if (!data) return []
    // Sort data by date ascending for proper line chart and MA calculation
    const sorted = [...data]
      .filter((r) => r.date || r.created_at)
      .sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || 0).getTime()
        const dateB = new Date(b.date || b.created_at || 0).getTime()
        return dateA - dateB
      })

    const processed = sorted
      .map((r) => {
        const labRaw = r[`${metricKey}_lab`]
        const anlRaw = r[`${metricKey}_anl`]
        const nirRaw = r[`${metricKey}_nir`]

        // Fallback to created_at if date is missing
        const dateStr = r.date || r.created_at?.split('T')[0]

        // Safe conversion
        const lab = typeof labRaw === 'number' && !isNaN(labRaw) ? labRaw : null
        const anl =
          typeof anlRaw === 'number' && !isNaN(anlRaw)
            ? anlRaw
            : typeof nirRaw === 'number' && !isNaN(nirRaw)
              ? nirRaw
              : null

        return {
          ...r, // Include original record for tooltip
          dateDisplay: dateStr,
          lab,
          anl,
          timestamp: dateStr ? new Date(dateStr).getTime() : 0,
        }
      })
      .filter(
        (d) =>
          (d.lab !== null || d.anl !== null) &&
          d.dateDisplay &&
          !isNaN(d.timestamp),
      )

    // Calculate Moving Average for ANL (NIR) as it is the high-frequency metric
    const anlValues = processed.map((d) => d.anl)
    const maValues = calculateSimpleMovingAverage(anlValues, 5) // 5-point moving average

    return processed.map((d, i) => ({
      ...d,
      ma: maValues[i],
    }))
  }, [data, metricKey])

  const chartConfig = {
    lab: {
      label: 'LAB (REF)',
      color: 'hsl(var(--primary))',
    },
    anl: {
      label: 'ANL (NIR)',
      color: color,
    },
    ma: {
      label: 'Média Móvel (5)',
      color: '#f59e0b', // Amber-500
    },
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500 min-h-[300px] border border-zinc-800 rounded-lg bg-black">
        Sem dados para exibir
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-black rounded-lg border border-zinc-800 p-2 sm:p-4 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
          Evolução Temporal & Média Móvel
        </h4>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Média
          Móvel (5 pts)
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#333"
                strokeOpacity={0.6}
              />
              <XAxis
                dataKey="dateDisplay"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={30}
                tickFormatter={(value) => {
                  if (!value) return ''
                  try {
                    const date = parseISO(value)
                    return isValid(date)
                      ? format(date, 'dd/MM', { locale: ptBR })
                      : value
                  } catch {
                    return value
                  }
                }}
                style={{ fontSize: '10px', fill: '#71717a' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={35}
                style={{ fontSize: '10px', fill: '#71717a' }}
                domain={['auto', 'auto']}
              />

              <Tooltip
                content={
                  <AnalysisDetailTooltip highlightMetricKey={metricKey} />
                }
                cursor={{ stroke: '#52525b', strokeDasharray: '4 4' }}
              />

              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

              {/* Moving Average Line - Rendered first to be behind dots if overlapping */}
              <Line
                type="monotone"
                dataKey="ma"
                name="Média Móvel"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
                connectNulls
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="lab"
                name="LAB (REF)"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: 'hsl(var(--primary))',
                  strokeWidth: 0,
                  fillOpacity: 0.7,
                }}
                activeDot={{ r: 5 }}
                connectNulls
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="anl"
                name="ANL (NIR)"
                stroke={color}
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: color,
                  strokeWidth: 0,
                  fillOpacity: 0.7,
                }}
                activeDot={{ r: 5 }}
                connectNulls
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
