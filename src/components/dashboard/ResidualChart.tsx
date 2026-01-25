import { useMemo, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle as DialogTitleComponent,
} from '@/components/ui/dialog'
import { Maximize2 } from 'lucide-react'
import { AnalysisRecord, MetricKey, METRICS } from '@/types/dashboard'

interface ResidualChartProps {
  data: AnalysisRecord[]
  metricKey: MetricKey
}

export const ResidualChart = ({ data, metricKey }: ResidualChartProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const metricInfo = METRICS.find((m) => m.key === metricKey) || METRICS[0]

  const chartData = useMemo(() => {
    return data
      .map((item) => {
        const lab = Number(item[`${metricKey}_lab`] || 0)
        const anl = Number(item[`${metricKey}_anl`] || 0)
        return {
          x: lab,
          residual: lab - anl, // Specific request: LAB - ANL
          company: item.company,
        }
      })
      .filter((d) => d.x > 0)
  }, [data, metricKey])

  const ChartRender = ({ height = '100%' }: { height?: string | number }) => (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
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
            value: 'Resíduo (LAB - ANL)',
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
                    <span className="text-zinc-400">Diff (L-A):</span>
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
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Card className="col-span-full md:col-span-2 border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md mt-6">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Análise de Resíduos (LAB - ANL)</CardTitle>
            <CardDescription className="text-zinc-400">
              Distribuição dos erros de predição ANL para {metricInfo.label}
            </CardDescription>
          </div>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-500 hover:text-white"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ChartRender />
          </div>
        </CardContent>
      </Card>

      <DialogContent className="max-w-[80vw] h-[80vh] flex flex-col bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitleComponent>
            Resíduos Detalhados (LAB - ANL) - {metricInfo.label}
          </DialogTitleComponent>
        </DialogHeader>
        <div className="flex-1 w-full min-h-0">
          <ChartRender height="100%" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
