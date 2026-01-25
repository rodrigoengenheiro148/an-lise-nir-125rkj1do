import { useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Scatter,
} from 'recharts'
import { AnalysisRecord, MetricKey, METRICS } from '@/types/dashboard'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

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
  const metricInfo = METRICS.find((m) => m.key === metricKey) || METRICS[0]

  const chartData = useMemo(() => {
    return data
      .map((item) => {
        const lab = Number(item[`${metricKey}_lab`] || 0)
        const anl = Number(item[`${metricKey}_anl`] || 0)

        // Filter out cases where both are 0, or missing
        if (!lab && !anl) return null

        return {
          id: item.id,
          lab,
          anl,
          company: item.company,
          material: item.material,
        }
      })
      .filter((item) => item !== null) as any[]
  }, [data, metricKey])

  const chartConfig = {
    lab: {
      label: 'LAB',
      color: '#52525b', // Zinc-600
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

  // Calculate domain for better visualization
  const maxVal = Math.max(...chartData.map((d) => Math.max(d.lab, d.anl)))
  const domainMax = Math.ceil(maxVal * 1.1)

  return (
    <ChartContainer
      config={chartConfig}
      className="w-full h-full min-h-[200px]"
    >
      <ComposedChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          type="number"
          dataKey="lab"
          name="LAB"
          unit={unit}
          stroke="#666"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          domain={[0, domainMax]}
          label={{
            value: 'LAB (Ref)',
            position: 'bottom',
            offset: -5,
            fontSize: 10,
            fill: '#666',
          }}
        />
        <YAxis
          type="number"
          dataKey="anl"
          name="ANL"
          unit={unit}
          stroke="#666"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          domain={[0, domainMax]}
          width={30}
          label={{
            value: 'ANL',
            angle: -90,
            position: 'insideLeft',
            fontSize: 10,
            fill: '#666',
          }}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={<ChartTooltipContent indicator="dot" />}
        />

        {/* Reference Line Y = X */}
        <Line
          dataKey="lab"
          stroke="var(--color-lab)"
          strokeDasharray="3 3"
          strokeWidth={1}
          dot={false}
          activeDot={false}
          legendType="none"
          name="Referência"
        />

        <Scatter
          name="Amostras"
          dataKey="anl"
          fill="var(--color-anl)"
          fillOpacity={0.6}
        />
      </ComposedChart>
    </ChartContainer>
  )
}
