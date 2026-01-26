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
  unit?: string
  title?: string
}

export const ResidualChart = ({
  data,
  metricKey,
  unit = '%',
  title,
}: ResidualChartProps) => {
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

  const chartTitle = title ? `${title} - RESÍDUOS (LAB - ANL)` : 'RESÍDUOS'

  const chartConfig = {
    residue: {
      label: 'Resíduo',
      color: '#22d3ee', // Consistent with scatter plot (Cyan-400)
    },
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground min-h-[300px] border border-zinc-800 rounded-lg bg-zinc-950/50">
        Sem dados para exibir
      </div>
    )
  }

  // Determine domain for Y axis to be symmetric if possible or just auto
  const maxRes = Math.max(...chartData.map((d) => Math.abs(d.y)))
  const domainY = [-maxRes * 1.1, maxRes * 1.1]

  return (
    <div className="h-full w-full flex flex-col space-y-2">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
          {chartTitle}
        </h4>
        <div className="text-xs font-mono text-zinc-400">
          N: {chartData.length}
        </div>
      </div>

      <div className="flex-1 min-h-[300px] bg-zinc-950/50 rounded-lg border border-zinc-800 p-4">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
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
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#333"
                strokeOpacity={0.5}
              />
              <XAxis
                type="number"
                dataKey="x"
                name="LAB"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#a1a1aa', fontSize: 10 }}
                domain={['auto', 'auto']}
                label={{
                  value: `LAB (${unit})`,
                  position: 'insideBottom',
                  offset: -10,
                  fill: '#a1a1aa',
                  fontSize: 10,
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Resíduo"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#a1a1aa', fontSize: 10 }}
                domain={domainY}
                label={{
                  value: 'Resíduo (Lab - Nir)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#a1a1aa',
                  fontSize: 10,
                }}
              />
              <ReferenceLine y={0} stroke="#52525b" strokeDasharray="3 3" />
              <Tooltip
                cursor={{
                  stroke: '#52525b',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 shadow-xl text-xs">
                        <div className="font-bold text-zinc-100 mb-2">
                          {data.original.company}
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-zinc-400">
                          <span>Data:</span>
                          <span className="text-right text-zinc-300">
                            {data.original.date
                              ? new Date(
                                  data.original.date,
                                ).toLocaleDateString()
                              : '-'}
                          </span>
                          <span>LAB:</span>
                          <span className="text-right text-zinc-100 font-mono font-medium">
                            {data.x.toFixed(2)}
                          </span>
                          <span>Resíduo:</span>
                          <span
                            className={`text-right font-mono font-medium ${data.y >= 0 ? 'text-green-400' : 'text-red-400'}`}
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
    </div>
  )
}

export const ResidualScatter = ResidualChart
