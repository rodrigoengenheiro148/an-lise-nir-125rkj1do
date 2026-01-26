import { useMemo } from 'react'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend } from 'recharts'
import { AnalysisRecord, MetricKey } from '@/types/dashboard'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { format } from 'date-fns'
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
    const keyLab = `${metricKey}_lab`
    const keyAnl = `${metricKey}_anl`

    return data
      .map((item) => {
        const labRaw = item[keyLab]
        const anlRaw = item[keyAnl]

        // Map data points even if one is missing to show available data
        return {
          id: item.id,
          date: item.date
            ? new Date(item.date)
            : new Date(item.created_at || new Date()),
          lab: typeof labRaw === 'number' ? labRaw : null,
          anl: typeof anlRaw === 'number' ? anlRaw : null,
          company: item.company,
          material: item.material,
        }
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [data, metricKey])

  const chartConfig = {
    lab: {
      label: 'LAB',
      color: '#a1a1aa', // zinc-400
    },
    anl: {
      label: 'ANL',
      color: color,
    },
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500 min-h-[200px]">
        Sem dados para exibir
      </div>
    )
  }

  const chartKey = `${metricKey}-${chartData.length}-${chartData[0]?.id || 'empty'}`

  return (
    <div className="w-full h-full min-h-[200px]" style={{ height }}>
      <ChartContainer config={chartConfig} className="w-full h-full">
        <LineChart
          key={chartKey}
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(date, 'dd/MM')}
            stroke="#666"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <YAxis
            unit={unit}
            stroke="#666"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={30}
            domain={['auto', 'auto']}
          />
          <ChartTooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    return format(payload[0].payload.date, "dd 'de' MMMM", {
                      locale: ptBR,
                    })
                  }
                  return label
                }}
              />
            }
          />
          <Legend verticalAlign="top" height={36} />
          <Line
            type="monotone"
            dataKey="lab"
            stroke="var(--color-lab)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            animationDuration={1000}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="anl"
            stroke="var(--color-anl)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            animationDuration={1000}
            connectNulls
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
