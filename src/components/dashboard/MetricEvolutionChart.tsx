import { useMemo } from 'react'
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts'
import { AnalysisRecord, MetricKey } from '@/types/dashboard'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { calculateResidue } from '@/lib/calculations'
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

        // Strict type check to handle 0 values correctly
        const hasLab = typeof labRaw === 'number'
        const hasAnl = typeof anlRaw === 'number'

        if (!hasLab || !hasAnl) return null

        const residue = calculateResidue(labRaw, anlRaw) // LAB - ANL

        return {
          id: item.id,
          date: item.date
            ? new Date(item.date)
            : new Date(item.created_at || new Date()),
          residue,
          company: item.company,
          material: item.material,
        }
      })
      .filter((item) => item !== null && item.residue !== null)
      .sort((a, b) => a!.date.getTime() - b!.date.getTime()) as any[]
  }, [data, metricKey])

  const chartConfig = {
    residue: {
      label: 'Resíduo',
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

  // Calculate domain for Y axis centered on 0 if possible
  const residuals = chartData.map((d) => d.residue)
  const minRes = Math.min(...residuals)
  const maxRes = Math.max(...residuals)
  const absMax = Math.max(Math.abs(minRes), Math.abs(maxRes))
  // Add some padding
  const domainY = [-absMax * 1.2, absMax * 1.2]

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
          />
          <YAxis
            dataKey="residue"
            unit={unit}
            stroke="#666"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={30}
            domain={domainY}
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

          <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />

          <Line
            type="monotone"
            dataKey="residue"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }}
            animationDuration={1000}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
