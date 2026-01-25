import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { AnalysisRecord, MetricKey } from '@/types/dashboard'

interface MetricScatterChartProps {
  title: string
  data: AnalysisRecord[]
  metricKey: MetricKey
  color: string
  unit: string
}

export const MetricScatterChart = ({
  title,
  data,
  metricKey,
  color,
  unit,
}: MetricScatterChartProps) => {
  // Transform data for chart
  const chartData = data.map((item, index) => ({
    index: index, // Using index for simplified scatter X-axis or convert date to timestamp
    date: item.date,
    value: item[metricKey],
  }))

  const config = {
    [metricKey]: {
      label: title,
      color: color,
    },
  }

  return (
    <Card className="flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}{' '}
          <span className="text-xs normal-case opacity-70">({unit})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-0 min-h-[150px]">
        <ChartContainer config={config} className="h-full w-full aspect-auto">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="date"
              tick={false}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="number"
              dataKey="value"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <ChartTooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  className="w-[150px]"
                  labelFormatter={(_, payload) => {
                    return payload[0]?.payload?.date || '-'
                  }}
                />
              }
            />
            <Scatter
              name={title}
              data={chartData}
              fill={color}
              line={{ stroke: color, strokeWidth: 1 }}
              shape="circle"
            />
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
