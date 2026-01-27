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
import { AnalysisRecord, getMaterialDisplayName } from '@/types/dashboard'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { BarChart2 } from 'lucide-react'

interface GlobalParetoChartProps {
  data: AnalysisRecord[]
  className?: string
}

export const GlobalParetoChart = ({
  data,
  className,
}: GlobalParetoChartProps) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // 1. Group data by material
    const groupedData = new Map<string, number>()

    data.forEach((record) => {
      // Use material field. If empty, skip
      const materialRaw = record.material
      if (!materialRaw) return

      const key = getMaterialDisplayName(materialRaw)
      groupedData.set(key, (groupedData.get(key) || 0) + 1)
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
  }, [data])

  const chartConfig = {
    count: {
      label: 'Registros',
      color: '#3b82f6', // blue-500
    },
    cumulativePercentage: {
      label: 'Acumulado (%)',
      color: '#ef4444', // red-500
    },
  }

  if (chartData.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-zinc-100">
              <BarChart2 className="h-5 w-5 text-blue-500" />
              Pareto de Materiais
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs sm:text-sm">
              Distribuição de frequência e impacto acumulado de todos os
              materiais analisados.
            </CardDescription>
          </div>
          <div className="text-xs text-zinc-500 font-mono bg-zinc-900 border border-zinc-800 px-2 py-1 rounded whitespace-nowrap">
            Total: {data.length} registros
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] sm:h-[350px] w-full min-h-0">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
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
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />

                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  label={{
                    value: 'Registros',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#52525b',
                    fontSize: 10,
                    offset: 10,
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
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />

                <Bar
                  yAxisId="left"
                  dataKey="count"
                  name="Registros"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                  barSize={60}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill="var(--color-count)"
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulativePercentage"
                  name="Acumulado (%)"
                  stroke="var(--color-cumulativePercentage)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--color-cumulativePercentage)' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
