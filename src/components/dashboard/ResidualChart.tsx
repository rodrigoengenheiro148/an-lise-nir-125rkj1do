import { useMemo } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { AnalysisRecord, MetricKey } from '@/types/dashboard'
import { calculateResidue } from '@/lib/calculations'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { format, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ResidualChartProps {
  data: AnalysisRecord[]
  metricKey: MetricKey
}

export const ResidualChart = ({ data, metricKey }: ResidualChartProps) => {
  const scatterData = useMemo(() => {
    return data
      .filter((r) => r.date)
      .map((r) => {
        const lab = r[`${metricKey}_lab`]
        const anl = r[`${metricKey}_anl`]
        const residue = calculateResidue(lab, anl)
        return {
          date: r.date,
          residue,
          timestamp: r.date ? new Date(r.date).getTime() : 0,
        }
      })
      .filter((d) => d.residue !== null)
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [data, metricKey])

  const chartConfig = {
    residue: {
      label: 'Resíduo (Lab - Anl)',
      color: 'hsl(var(--destructive))',
    },
  }

  if (scatterData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Sem dados para exibir
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) => {
              const date = new Date(value)
              return isValid(date)
                ? format(date, 'dd/MM', { locale: ptBR })
                : ''
            }}
            type="number"
            domain={['dataMin', 'dataMax']}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            style={{ fontSize: '10px' }}
          />
          <YAxis
            dataKey="residue"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            width={30}
            style={{ fontSize: '10px' }}
          />
          <ReferenceLine
            y={0}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
          />
          <Tooltip
            content={<ChartTooltipContent />}
            labelFormatter={(value) => {
              const date = new Date(value)
              return isValid(date)
                ? format(date, 'dd/MM/yyyy', { locale: ptBR })
                : ''
            }}
          />
          <Scatter
            name="Resíduo"
            data={scatterData}
            fill="var(--color-residue)"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export const ResidualScatter = ResidualChart
