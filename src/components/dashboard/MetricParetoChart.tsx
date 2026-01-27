import { useMemo } from 'react'
import {
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  AnalysisRecord,
  MetricKey,
  getMaterialDisplayName,
} from '@/types/dashboard'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

interface MetricParetoChartProps {
  data: AnalysisRecord[]
  metricKey: MetricKey
  color: string
}

export const MetricParetoChart = ({
  data,
  metricKey,
  color,
}: MetricParetoChartProps) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // 1. Group data
    const groupedData = new Map<string, number>()

    // Check if we have multiple materials. If only one material (e.g. filtered), use submaterial.
    const uniqueMaterials = new Set(data.map((r) => r.material).filter(Boolean))
    const useSubmaterial = uniqueMaterials.size <= 1

    data.forEach((record) => {
      // Only count records that have data for this metric
      const hasData =
        (record[`${metricKey}_lab`] !== undefined &&
          record[`${metricKey}_lab`] !== null) ||
        (record[`${metricKey}_anl`] !== undefined &&
          record[`${metricKey}_anl`] !== null) ||
        (record[`${metricKey}_nir`] !== undefined &&
          record[`${metricKey}_nir`] !== null)

      if (hasData) {
        let key = useSubmaterial
          ? record.submaterial || 'N/A'
          : record.material || 'N/A'

        // Normalize Material Name
        if (!useSubmaterial && key !== 'N/A') {
          key = getMaterialDisplayName(key)
        }

        groupedData.set(key, (groupedData.get(key) || 0) + 1)
      }
    })

    // 2. Convert to array and sort descending
    const sorted = Array.from(groupedData.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // 3. Calculate Cumulative Percentage
    const total = sorted.reduce((sum, item) => sum + item.count, 0)
    let cumulative = 0

    return sorted.map((item) => {
      cumulative += item.count
      return {
        ...item,
        cumulativePercentage: Math.round((cumulative / total) * 100),
      }
    })
  }, [data, metricKey])

  const chartConfig = {
    count: {
      label: 'Frequência',
      color: color,
    },
    cumulativePercentage: {
      label: 'Acumulado (%)',
      color: 'hsl(var(--primary))',
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
          Análise de Pareto (80/20)
        </h4>
        <div className="text-[10px] text-zinc-500">Frequência de análises</div>
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
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#71717a', fontSize: 10 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />

              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#71717a', fontSize: 10 }}
                label={{
                  value: 'Frequência',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#52525b',
                  fontSize: 10,
                }}
              />

              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#71717a', fontSize: 10 }}
                unit="%"
                domain={[0, 100]}
              />

              <Tooltip
                content={<ChartTooltipContent />}
                cursor={{ fill: '#ffffff10' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

              <Bar
                yAxisId="left"
                dataKey="count"
                name="Frequência"
                fill={color}
                radius={[4, 4, 0, 0]}
                barSize={40}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} />
                ))}
              </Bar>

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulativePercentage"
                name="Acumulado (%)"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, fill: 'hsl(var(--primary))' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
