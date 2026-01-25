import { useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Area,
} from 'recharts'
import { AnalysisRecord, MetricKey } from '@/types/dashboard'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
  const isAcidity = metricKey === 'acidity'

  const chartData = useMemo(() => {
    return data
      .map((item) => {
        const lab = Number(item[`${metricKey}_lab`] || 0)
        const anl = Number(item[`${metricKey}_anl`] || 0)
        const nir = Number(item[`${metricKey}_nir`] || 0)

        // For acidity, we want residuals (LAB - ANL)
        const residual = isAcidity ? lab - anl : 0

        return {
          date: item.date,
          lab,
          anl,
          nir,
          residual,
          // Format date for display
          formattedDate: item.date
            ? format(new Date(item.date), 'dd/MM', { locale: ptBR })
            : '',
          fullDate: item.date
            ? format(new Date(item.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
            : '',
        }
      })
      .reverse() // Recharts renders left-to-right, so we want oldest to newest (assuming data comes newest first)
  }, [data, metricKey, isAcidity])

  if (chartData.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
        Sem dados para exibir
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient
            id={`gradient-${metricKey}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          {isAcidity && (
            <linearGradient id="gradient-residual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          )}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
        <XAxis
          dataKey="formattedDate"
          stroke="#666"
          fontSize={10}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#666"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          unit={unit}
          width={30}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded border border-zinc-700 bg-zinc-900 p-2 shadow-xl">
                  <p className="mb-2 text-xs font-semibold text-zinc-300">
                    {payload[0].payload.fullDate}
                  </p>
                  <div className="flex flex-col gap-1">
                    {payload.map((entry: any) => (
                      <div
                        key={entry.name}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-zinc-400">{entry.name}:</span>
                        <span className="font-mono font-medium text-zinc-100">
                          {Number(entry.value).toFixed(2)} {unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '10px' }}
          iconType="circle"
          iconSize={8}
          className="text-xs"
        />

        {/* LAB - Reference - Always present */}
        <Line
          type="monotone"
          dataKey="lab"
          name="LAB"
          stroke="#fff"
          strokeWidth={2}
          dot={{ r: 2, fill: '#fff' }}
          activeDot={{ r: 4 }}
        />

        {/* NIR - Present for non-acidity */}
        {!isAcidity && (
          <Line
            type="monotone"
            dataKey="nir"
            name="NIR"
            stroke={color}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 4 }}
            opacity={0.7}
          />
        )}

        {/* ANL - Always present */}
        <Line
          type="monotone"
          dataKey="anl"
          name="ANL"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 2, fill: color }}
          activeDot={{ r: 4 }}
        />

        {/* Residuals - Only for Acidity */}
        {isAcidity && (
          <Area
            type="monotone"
            dataKey="residual"
            name="Resíduos (L-A)"
            stroke="#f43f5e"
            fill="url(#gradient-residual)"
            strokeWidth={1}
            dot={false}
            opacity={0.6}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
