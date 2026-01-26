import { useMemo } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { AnalysisRecord, MetricKey } from '@/types/dashboard'
import { ChartContainer } from '@/components/ui/chart'

interface ResidualChartProps {
  data: AnalysisRecord[]
  metricKey: MetricKey
}

export const ResidualChart = ({ data, metricKey }: ResidualChartProps) => {
  const chartData = useMemo(() => {
    return data
      .map((r) => {
        const lab = Number(r[`${metricKey}_lab`])
        const anl = Number(r[`${metricKey}_anl`])

        if (isNaN(lab) || isNaN(anl) || lab <= 0 || anl <= 0) return null

        const residue = lab - anl

        return {
          x: lab,
          y: residue,
          original: r,
        }
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)
  }, [data, metricKey])

  const chartConfig = {
    residue: {
      label: 'Resíduo',
      color: '#ef4444', // Red-500
    },
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground min-h-[200px]">
        Sem dados para exibir
      </div>
    )
  }

  return (
    <div className="h-full w-full min-h-[300px] bg-zinc-950/50 rounded-lg border border-zinc-800 p-2">
      <div className="mb-2 px-2">
        <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          {metricKey.toUpperCase()} - Residual (Lab vs Erro)
        </h4>
      </div>
      <ChartContainer
        config={chartConfig}
        className="h-[calc(100%-24px)] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <defs>
              <filter
                id="glow-residue"
                height="300%"
                width="300%"
                x="-100%"
                y="-100%"
              >
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              type="number"
              dataKey="x"
              name="LAB"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              style={{ fontSize: '10px', fill: '#71717a' }}
              label={{
                value: 'LAB',
                position: 'insideBottom',
                offset: -10,
                fill: '#52525b',
                fontSize: 10,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Resíduo"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              style={{ fontSize: '10px', fill: '#71717a' }}
              label={{
                value: 'Resíduo (Lab - Anl)',
                angle: -90,
                position: 'insideLeft',
                fill: '#52525b',
                fontSize: 10,
              }}
            />
            <ReferenceLine
              y={0}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
            />
            <Tooltip
              cursor={{
                stroke: '#ffffff',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2 shadow-xl text-xs">
                      <div className="font-bold text-zinc-200 mb-1">
                        {data.original.company}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-400">
                        <span>LAB:</span>
                        <span className="text-right text-zinc-100 font-mono">
                          {data.x.toFixed(2)}
                        </span>
                        <span>Erro:</span>
                        <span
                          className={`text-right font-mono ${data.y >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {data.y > 0 ? '+' : ''}
                          {data.y.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Scatter
              name="Resíduo"
              data={chartData}
              fill="var(--color-residue)"
              style={{ filter: 'url(#glow-residue)' }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}

export const ResidualScatter = ResidualChart
