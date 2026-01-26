import { useMemo, useId } from 'react'
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
  const filterId = useId()
  const safeFilterId = filterId.replace(/:/g, '')

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

  const chartTitle = title ? `${title} - RESÍDUOS (LAB - NIR)` : 'RESÍDUOS'

  const chartConfig = {
    residue: {
      label: 'Resíduo',
      color: '#22d3ee', // Cyan-400
    },
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-400 min-h-[300px] border border-zinc-800 rounded-lg bg-zinc-900">
        Sem dados para exibir
      </div>
    )
  }

  // Determine domain for Y axis to be symmetric if possible or just auto
  const maxRes = Math.max(...chartData.map((d) => Math.abs(d.y)))
  const domainY = [-maxRes * 1.1, maxRes * 1.1]

  return (
    <div className="h-full w-full flex flex-col space-y-2">
      <div className="flex flex-col space-y-2 mb-2">
        <h4 className="text-lg font-bold text-zinc-200 uppercase tracking-wide text-center">
          {chartTitle}
        </h4>
        <div className="flex justify-center text-xs font-mono text-zinc-400 bg-zinc-950/30 py-1 rounded w-fit mx-auto px-4">
          N: {chartData.length}
        </div>
      </div>

      <div className="flex-1 min-h-[400px] bg-[#27272a] rounded-lg border border-zinc-700 p-4 shadow-xl">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <defs>
                <filter
                  id={`glow-residue-${safeFilterId}`}
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
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
                stroke="#52525b"
                strokeOpacity={0.4}
              />
              <XAxis
                type="number"
                dataKey="x"
                name="LAB"
                tickLine={{ stroke: '#71717a' }}
                axisLine={{ stroke: '#71717a' }}
                tick={{ fill: '#e4e4e7', fontSize: 11 }}
                domain={['auto', 'auto']}
                label={{
                  value: 'LAB',
                  position: 'insideBottom',
                  offset: -10,
                  fill: '#e4e4e7',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Resíduo"
                tickLine={{ stroke: '#71717a' }}
                axisLine={{ stroke: '#71717a' }}
                tick={{ fill: '#e4e4e7', fontSize: 11 }}
                domain={domainY}
                label={{
                  value: 'Resíduo (LAB - NIR)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#e4e4e7',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <ReferenceLine y={0} stroke="#a1a1aa" strokeDasharray="3 3" />
              <Tooltip
                cursor={{
                  stroke: '#a1a1aa',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl text-xs">
                        <div className="font-bold text-zinc-100 mb-2 border-b border-zinc-800 pb-1">
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
                style={{ filter: `url(#glow-residue-${safeFilterId})` }}
                stroke="#ffffff"
                strokeWidth={1}
                strokeOpacity={0.5}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}

export const ResidualScatter = ResidualChart
