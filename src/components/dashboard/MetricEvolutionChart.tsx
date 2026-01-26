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
    return data
      .filter((r) => r.date)
      .map((r) => {
        const lab = r[`${metricKey}_lab`]
        const anl = r[`${metricKey}_anl`]
        return {
          date: r.date,
          lab: typeof lab === 'number' ? lab : null,
          anl: typeof anl === 'number' ? anl : null,
          timestamp: r.date ? new Date(r.date).getTime() : 0,
        }
      })
      .filter((d) => d.lab !== null || d.anl !== null)
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [data, metricKey])

  const chartConfig = {
    lab: {
      label: 'Laboratório',
      color: 'hsl(var(--primary))',
    },
    anl: {
      label: 'Análise',
      color: color,
    },
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Sem dados para exibir
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={30}
            tickFormatter={(value) => {
              if (!value) return ''
              const date = parseISO(value)
              return isValid(date)
                ? format(date, 'dd/MM', { locale: ptBR })
                : value
            }}
            style={{ fontSize: '10px' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={30}
            style={{ fontSize: '10px' }}
          />
          <Tooltip
            content={<ChartTooltipContent indicator="dot" />}
            labelFormatter={(value) => {
              if (!value) return ''
              const date = parseISO(value)
              return isValid(date)
                ? format(date, 'dd/MM/yyyy', { locale: ptBR })
                : value
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Line
            type="monotone"
            dataKey="lab"
            name="Laboratório"
            stroke="var(--color-lab)"
            strokeWidth={2}
            dot={false}
            connectNulls
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="anl"
            name="Análise"
            stroke="var(--color-anl)"
            strokeWidth={2}
            dot={false}
            connectNulls
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
