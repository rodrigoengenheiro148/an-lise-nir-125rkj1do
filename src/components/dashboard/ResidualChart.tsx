import { useMemo } from 'react'
import {
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { AnalysisRecord, MetricKey, METRICS } from '@/types/dashboard'

interface ResidualChartProps {
  data: AnalysisRecord[]
  metricKey: MetricKey
}

export const ResidualChart = ({ data, metricKey }: ResidualChartProps) => {
  const metricInfo = METRICS.find((m) => m.key === metricKey) || METRICS[0]

  const chartData = useMemo(() => {
    return data.map((item) => {
      const lab = item[`${metricKey}_lab` as keyof AnalysisRecord] as number
      const nir = item[`${metricKey}_nir` as keyof AnalysisRecord] as number
      return {
        x: lab,
        residual: lab - nir,
        company: item.company,
        date: item.date,
      }
    })
  }, [data, metricKey])

  return (
    <Card className="col-span-full md:col-span-2 border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md mt-6">
      <CardHeader>
        <CardTitle>Análise de Resíduos (LAB - NIR)</CardTitle>
        <CardDescription className="text-zinc-400">
          Distribuição dos erros de predição para {metricInfo.label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#333"
                vertical={false}
              />
              <XAxis
                type="number"
                dataKey="x"
                name="LAB"
                tick={{ fill: '#888', fontSize: 12 }}
                label={{
                  value: 'Valor de Referência (LAB)',
                  position: 'bottom',
                  fill: '#888',
                  fontSize: 12,
                }}
              />
              <YAxis
                type="number"
                dataKey="residual"
                name="Residual"
                tick={{ fill: '#888', fontSize: 12 }}
                label={{
                  value: 'Resíduo (LAB - NIR)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#888',
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                y={0}
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <RechartsTooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload
                    return (
                      <div className="bg-zinc-900 border border-zinc-700 p-2 rounded text-xs text-zinc-200">
                        <p className="font-bold">{d.company}</p>
                        <div className="grid grid-cols-2 gap-x-2 mt-1">
                          <span className="text-zinc-400">LAB:</span>
                          <span className="font-mono text-right">
                            {d.x.toFixed(2)}
                          </span>
                          <span className="text-zinc-400">Diff:</span>
                          <span
                            className={`font-mono text-right ${d.residual > 0 ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {d.residual > 0 ? '+' : ''}
                            {d.residual.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Scatter
                data={chartData}
                fill={metricInfo.color}
                shape="circle"
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
