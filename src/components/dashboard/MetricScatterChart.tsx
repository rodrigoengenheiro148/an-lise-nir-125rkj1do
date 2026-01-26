import { useMemo, useState } from 'react'
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
import { AnalysisRecord, MetricKey } from '@/types/dashboard'
import { calculateStats } from '@/lib/stats'
import { MetricEvolutionChart } from './MetricEvolutionChart'

interface MetricScatterChartProps {
  title: string
  data: AnalysisRecord[]
  metricKey: MetricKey
  color: string
  unit: string
}

export const MetricScatterChart = ({
  title,
  data,
  metricKey,
  color,
  unit,
}: MetricScatterChartProps) => {
  const [isOpen, setIsOpen] = useState(false)

  // Calculate stats for the header display
  const stats = useMemo(() => {
    const points = data
      .map((item) => {
        const lab = Number(item[`${metricKey}_lab`] || 0)
        const anl = Number(item[`${metricKey}_anl`] || 0)
        return { x: lab, y: anl }
      })
      .filter((p) => p.x > 0 && p.y > 0)

    return calculateStats(points)
  }, [data, metricKey])

  const chartTitle = `${title} - LAB X ANL`

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Card className="flex flex-col h-full border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md group">
        <CardHeader className="p-4 pb-2 border-b border-zinc-800 flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-lg font-bold text-zinc-100 uppercase tracking-wide font-display">
              {chartTitle}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 font-mono mt-1">
              R²: {stats.r2.toFixed(3)} | Slope: {stats.slope.toFixed(3)} |
              Bias: {stats.bias.toFixed(3)}
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
        <CardContent className="flex-1 p-2 min-h-[300px] relative bg-zinc-950/50">
          <MetricEvolutionChart
            data={data}
            metricKey={metricKey}
            color={color}
            unit={unit}
            height="100%"
          />
        </CardContent>
      </Card>

      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitleComponent className="flex gap-4 items-baseline uppercase">
            <span>{chartTitle}</span>
            <span className="text-sm font-normal text-zinc-400 lowercase normal-case">
              R²: {stats.r2.toFixed(4)} | Slope: {stats.slope.toFixed(4)} |
              Bias: {stats.bias.toFixed(4)} | SEP: {stats.sep.toFixed(4)}
            </span>
          </DialogTitleComponent>
        </DialogHeader>
        <div className="flex-1 w-full min-h-0">
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
