import { useMemo, useState } from 'react'
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

interface MetricEvolutionChartProps {
  data: AnalysisRecord[]
  metricKey: MetricKey
  color: string
  unit: string
}

export const MetricEvolutionChart = ({
  data,
  metricKey,
  color,
  unit,
}: MetricEvolutionChartProps) => {
  const [isOpen, setIsOpen] = useState(false)
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

  const ChartRender = ({ height = '100%' }: { height?: string | number }) => {
    if (chartData.length === 0) {
      return (
        <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500 min-h-[250px]">
          Sem dados para exibir
        </div>
      )
    }

    // Calculate domain for better visualization
    const maxVal = Math.max(...chartData.map((d) => Math.max(d.lab, d.anl)))
    const domainMax = Math.ceil(maxVal * 1.1)

    return (
      <ResponsiveContainer width="100%" height={height}>
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
              value: 'LAB',
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
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload
                return (
                  <div className="rounded border border-zinc-700 bg-zinc-900 p-2 shadow-xl z-50">
                    <p className="mb-1 text-xs font-semibold text-zinc-300">
                      {d.company}
                    </p>
                    <p className="text-[10px] text-zinc-400 mb-2 italic">
                      {d.material}
                    </p>
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex justify-between gap-4">
                        <span className="text-zinc-400">LAB:</span>
                        <span className="font-mono font-medium text-white">
                          {d.lab.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-zinc-400">ANL:</span>
                        <span
                          className="font-mono font-medium"
                          style={{ color }}
                        >
                          {d.anl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />

          {/* Reference Line Y = X */}
          <Line
            dataKey="lab"
            stroke="#52525b"
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
            fill={color}
            fillOpacity={0.6}
          />
        </ComposedChart>
      </ResponsiveContainer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Card className="flex flex-col h-full border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md group">
        <CardHeader className="p-4 pb-2 border-b border-zinc-800 flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-lg font-bold text-zinc-100 uppercase tracking-wide font-display">
              Evolução - {metricInfo.label}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 font-mono mt-1">
              Comparativo LAB vs ANL
            </CardDescription>
          </div>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-500 hover:text-white -mr-2"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </CardHeader>
        <CardContent className="flex-1 p-2 min-h-[300px] relative">
          <ChartRender />
        </CardContent>
      </Card>

      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitleComponent className="flex gap-4 items-baseline uppercase">
            <span>Evolução Detalhada - {metricInfo.label}</span>
          </DialogTitleComponent>
        </DialogHeader>
        <div className="flex-1 w-full min-h-0">
          <ChartRender height="100%" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
