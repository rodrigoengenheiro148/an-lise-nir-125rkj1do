import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Maximize2 } from 'lucide-react'
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
  const [isOpen, setIsOpen] = useState(false)
  const isAcidity = metricKey === 'acidity'

  // Calculate stats based on created_at descending sort (default)
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Card
        className={cn(
          'flex flex-col border-zinc-800 bg-zinc-950/50',
          className,
        )}
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {unit}
              </span>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-zinc-500 hover:text-white -mr-1"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
            </div>
          </div>

          {/* Mini Summary Header */}
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div className="flex flex-col">
              <span className="text-zinc-500">LAB (Ref)</span>
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
          <div className="h-[200px] w-full px-4">
            <MetricEvolutionChart
              data={data}
              metricKey={metricKey}
              color={color}
              unit={unit}
            />
          </div>
        </CardContent>
      </Card>

      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex gap-4 items-baseline uppercase">
            <span>{title}</span>
            <span className="text-sm font-normal text-zinc-400 lowercase normal-case">
              Visualização Detalhada
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 w-full min-h-0 p-4">
          <MetricEvolutionChart
            data={data}
            metricKey={metricKey}
            color={color}
            unit={unit}
            height="100%"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
