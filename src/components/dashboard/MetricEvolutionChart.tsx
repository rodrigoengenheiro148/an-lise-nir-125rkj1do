import { useMemo } from 'react'
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
import { AnalysisRecord, MetricKey } from '@/types/dashboard'

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
  const chartData = useMemo(() => {
    return data
      .map((item) => {
        const lab = Number(item[`${metricKey}_lab`] || 0)
        const anl = Number(item[`${metricKey}_anl`] || 0)

        // We filter out 0 values for better visualization in scatter
        if (lab === 0 && anl === 0) return null

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

  if (chartData.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
        Sem dados para exibir
      </div>
    )
  }

  // Calculate domain for better visualization
  const maxVal = Math.max(...chartData.map((d) => Math.max(d.lab, d.anl)))
  const domainMax = Math.ceil(maxVal * 1.1)

  return (
    <ResponsiveContainer width="100%" height="100%">
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
                <div className="rounded border border-zinc-700 bg-zinc-900 p-2 shadow-xl">
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
                      <span className="font-mono font-medium" style={{ color }}>
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

        <Scatter name="Amostras" dataKey="anl" fill={color} fillOpacity={0.6} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
