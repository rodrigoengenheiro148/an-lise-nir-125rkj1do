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
import {
  Maximize2,
  BarChart2,
  Activity,
  Plus,
  ScatterChart,
} from 'lucide-react'
import { AnalysisRecord, MetricKey } from '@/types/dashboard'
import { MetricEvolutionChart } from './MetricEvolutionChart'
import { MetricHistogram } from './MetricHistogram'
import { ResidualScatter } from './ResidualChart'
import { MetricDataDialog } from './MetricDataDialog'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { calculateResidue } from '@/lib/calculations'

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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Calculate stats based on created_at descending sort (default)
  const latestRecord = data.length > 0 ? data[0] : null

  // Safely extract values, handling nulls/undefined
  const getVal = (key: string) => {
    if (!latestRecord) return null
    const val = latestRecord[key]
    return typeof val === 'number' ? val : null
  }

  const latestLab = getVal(`${metricKey}_lab`)
  const latestAnl = getVal(`${metricKey}_anl`)

  const latestResidual = calculateResidue(latestLab, latestAnl)

  return (
    <>
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
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 mr-1">
                  {unit}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-zinc-500 hover:text-blue-400"
                  onClick={() => setIsAddDialogOpen(true)}
                  title="Adicionar Dados"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-500 hover:text-white"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div className="flex flex-col">
                <span className="text-zinc-500">LAB (Ref)</span>
                <span className="font-mono font-medium text-zinc-200">
                  {latestLab !== null ? latestLab.toFixed(2) : '-'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-500">ANL</span>
                <span
                  className="font-mono font-medium"
                  style={{ color: color }}
                >
                  {latestAnl !== null ? latestAnl.toFixed(2) : '-'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-500">Resíduo</span>
                <span
                  className={cn(
                    'font-mono font-medium',
                    latestResidual !== null
                      ? Math.abs(latestResidual) > 0.5
                        ? 'text-red-400'
                        : 'text-green-400'
                      : 'text-zinc-400',
                  )}
                >
                  {latestResidual !== null ? latestResidual.toFixed(2) : '-'}
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
            <Tabs
              defaultValue="correlation"
              className="w-full h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-3 bg-zinc-900 mb-4 border border-zinc-800">
                <TabsTrigger
                  value="correlation"
                  className="flex items-center gap-2"
                >
                  <Activity className="h-4 w-4" /> Correlação
                </TabsTrigger>
                <TabsTrigger
                  value="histogram"
                  className="flex items-center gap-2"
                >
                  <BarChart2 className="h-4 w-4" /> Histograma (LAB)
                </TabsTrigger>
                <TabsTrigger
                  value="residuals"
                  className="flex items-center gap-2"
                >
                  <ScatterChart className="h-4 w-4" /> Dispersão Resíduos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="correlation" className="flex-1 min-h-0">
                <MetricEvolutionChart
                  data={data}
                  metricKey={metricKey}
                  color={color}
                  unit={unit}
                  height="100%"
                />
              </TabsContent>

              <TabsContent value="histogram" className="flex-1 min-h-0">
                <MetricHistogram data={data} metricKey={metricKey} />
              </TabsContent>

              <TabsContent value="residuals" className="flex-1 min-h-0">
                <ResidualScatter data={data} metricKey={metricKey} />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <MetricDataDialog
        metricKey={metricKey}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {}}
      />
    </>
  )
}
