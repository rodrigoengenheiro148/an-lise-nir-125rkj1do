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
  ChartConfig,
} from '@/components/ui/chart'
import { calculateStats } from '@/lib/stats'

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
  const filterId = `glow-${metricKey}`

  const chartData = useMemo(() => {
    return data
      .map((item) => {
        const labRaw = item[`${metricKey}_lab`]
        const anlRaw = item[`${metricKey}_anl`]

        const lab = typeof labRaw === 'number' ? labRaw : Number(labRaw)
        const anl = typeof anlRaw === 'number' ? anlRaw : Number(anlRaw)

        // Filter out invalid data points
        if (isNaN(lab) || isNaN(anl) || lab <= 0 || anl <= 0) {
          return null
        }

        return {
          id: item.id,
          lab, // Reference (X)
          anl, // Predicted (Y)
          company: item.company,
          material: item.material,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }, [data, metricKey])

  const stats = useMemo(() => {
    const points = chartData.map((d) => ({ x: d.lab, y: d.anl }))
    return calculateStats(points)
  }, [chartData])

  const trendLine = useMemo(() => {
    if (chartData.length < 2) return []
    const minX = Math.min(...chartData.map((d) => d.lab))
    const maxX = Math.max(...chartData.map((d) => d.lab))

    // Add a small buffer to the trend line
    const buffer = (maxX - minX) * 0.05
    const x1 = Math.max(0, minX - buffer)
    const x2 = maxX + buffer

    // y = mx + b
    const y1 = stats.slope * x1 + stats.intercept
    const y2 = stats.slope * x2 + stats.intercept

    return [
      { lab: x1, anl: y1 },
      { lab: x2, anl: y2 },
    ]
  }, [chartData, stats])

  const chartConfig = {
    anl: {
      label: 'ANL',
      color: color,
    },
    lab: {
      label: 'LAB',
      color: '#a1a1aa', // zinc-400
    },
  } satisfies ChartConfig

  if (chartData.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500 min-h-[200px]">
        Sem dados para exibir
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[200px]" style={{ height }}>
      <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <filter
                id={filterId}
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              type="number"
              dataKey="lab"
              name="LAB"
              stroke="#666"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              label={{
                value: 'LAB (Ref)',
                position: 'bottom',
                offset: 0,
                fill: '#666',
                fontSize: 10,
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
              width={30}
              domain={['auto', 'auto']}
              label={{
                value: 'ANL',
                angle: -90,
                position: 'insideLeft',
                fill: '#666',
                fontSize: 10,
              }}
            />
            <ChartTooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Line
              data={trendLine}
              dataKey="anl"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={false}
              type="monotone"
              animationDuration={1000}
              name="Tendência"
            />
            <Scatter
              data={chartData}
              name="Amostras"
              fill={color}
              shape="circle"
              style={{ filter: `url(#${filterId})` }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
