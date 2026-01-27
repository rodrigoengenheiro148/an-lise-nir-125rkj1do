import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
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
    return data
      .map((r) => {
        const labRaw = r[`${metricKey}_lab`]
        const anlRaw = r[`${metricKey}_anl`]

        // Fallback to created_at if date is missing
        const dateStr = r.date || r.created_at?.split('T')[0]

        // Safe conversion
        const lab = typeof labRaw === 'number' && !isNaN(labRaw) ? labRaw : null
        const anl = typeof anlRaw === 'number' && !isNaN(anlRaw) ? anlRaw : null

        return {
          date: dateStr,
          lab,
          anl,
          timestamp: dateStr ? new Date(dateStr).getTime() : 0,
        }
      })
      .filter(
        (d) =>
          (d.lab !== null || d.anl !== null) && d.date && !isNaN(d.timestamp),
      )
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [data, metricKey])

  const chartConfig = {
    lab: {
      label: 'LAB (REF)',
      color: 'hsl(var(--primary))',
    },
    anl: {
      label: 'ANL',
      color: color,
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
    <div className="h-full w-full bg-black rounded-lg border border-zinc-800 p-2 sm:p-4 shadow-sm">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
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
              dataKey="date"
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
              content={<ChartTooltipContent indicator="dot" />}
              labelFormatter={(value) => {
                if (!value) return ''
                try {
                  const date = parseISO(value)
                  return isValid(date)
                    ? format(date, 'dd/MM/yyyy', { locale: ptBR })
                    : value
                } catch {
                  return value
                }
              }}
              cursor={{ stroke: '#52525b', strokeDasharray: '4 4' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
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
              name="ANL"
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
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
