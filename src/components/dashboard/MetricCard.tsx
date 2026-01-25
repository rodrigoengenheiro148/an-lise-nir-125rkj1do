import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalysisRecord, MetricKey } from '@/types/dashboard'
import { MetricEvolutionChart } from './MetricEvolutionChart'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  metricKey: MetricKey
  color: string
  unit: string
  data: AnalysisRecord[]
  className?: string
}

export const MetricCard = ({
  title,
  metricKey,
  color,
  unit,
  data,
  className,
}: MetricCardProps) => {
  const isAcidity = metricKey === 'acidity'

  // Calculate latest values for header summary
  const latestRecord = data.length > 0 ? data[0] : null
  const latestLab = latestRecord
    ? Number(latestRecord[`${metricKey}_lab`] || 0)
    : 0
  const latestAnl = latestRecord
    ? Number(latestRecord[`${metricKey}_anl`] || 0)
    : 0
  const latestNir = latestRecord
    ? Number(latestRecord[`${metricKey}_nir`] || 0)
    : 0
  const latestResidual = latestLab - latestAnl

  return (
    <Card
      className={cn('flex flex-col border-zinc-800 bg-zinc-950/50', className)}
    >
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-100">
            <span
              className="h-3 w-1 rounded-full"
              style={{ backgroundColor: color }}
            />
            {title}
          </CardTitle>
          <span className="text-xs font-medium text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            {unit}
          </span>
        </div>

        {/* Mini Summary Header */}
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          <div className="flex flex-col">
            <span className="text-zinc-500">LAB</span>
            <span className="font-mono font-medium text-zinc-200">
              {latestRecord ? latestLab.toFixed(2) : '-'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-500">ANL</span>
            <span className="font-mono font-medium" style={{ color: color }}>
              {latestRecord ? latestAnl.toFixed(2) : '-'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-500">
              {isAcidity ? 'Resíd.' : 'NIR'}
            </span>
            <span
              className={cn(
                'font-mono font-medium',
                isAcidity
                  ? Math.abs(latestResidual) > 0.5
                    ? 'text-red-400'
                    : 'text-green-400'
                  : 'text-zinc-400',
              )}
            >
              {latestRecord
                ? isAcidity
                  ? latestResidual.toFixed(2)
                  : latestNir.toFixed(2)
                : '-'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 pb-4">
        <div className="h-[200px] w-full px-2">
          <MetricEvolutionChart
            data={data}
            metricKey={metricKey}
            color={color}
            unit={unit}
          />
        </div>
      </CardContent>
    </Card>
  )
}
