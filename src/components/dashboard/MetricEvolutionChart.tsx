import { useMemo } from 'react'
import {
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Scatter,
  ResponsiveContainer,
} from 'recharts'
import { AnalysisRecord, MetricKey } from '@/types/dashboard'
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
  const chartData = useMemo(() => {
    // Optimization: Only process needed fields
    const keyLab = `${metricKey}_lab`
    const keyAnl = `${metricKey}_anl`

    return data
      .map((item) => {
        const labRaw = item[keyLab]
        const anlRaw = item[keyAnl]

        // Strict type check to handle 0 values correctly
        const hasLab = typeof labRaw === 'number'
        const hasAnl = typeof anlRaw === 'number'

        // For correlation chart (LAB vs ANL), we need both values
        if (!hasLab || !hasAnl) return null

        return {
          id: item.id,
          lab: Number(labRaw),
          anl: Number(anlRaw),
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

  // Unique key to force re-render when data length or metric changes, preventing stuck charts
  const chartKey = `${metricKey}-${chartData.length}-${chartData[0]?.id || 'empty'}`

  return (
    <div className="w-full h-full min-h-[200px]" style={{ height }}>
      <ChartContainer config={chartConfig} className="w-full h-full">
        <ComposedChart
          key={chartKey}
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
            isAnimationActive={false} // Disable animation for reference line stability
          />

          <Scatter
            name="Amostras"
            dataKey="anl"
            fill="var(--color-anl)"
            fillOpacity={0.6}
            isAnimationActive={true}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  )
}
