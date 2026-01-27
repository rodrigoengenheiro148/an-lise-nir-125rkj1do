import { useState, useMemo } from 'react'
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
  TrendingUp,
} from 'lucide-react'
import { AnalysisRecord, MetricKey } from '@/types/dashboard'
import { MetricScatterChart } from './MetricScatterChart'
import { MetricHistogram } from './MetricHistogram'
import { ResidualScatter } from './ResidualChart'
import { MetricEvolutionChart } from './MetricEvolutionChart'
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
  selectedCompanyId?: string
}

export const MetricCard = ({
  title,
  metricKey,
  color,
  unit,
  data,
  className,
  selectedCompanyId,
}: MetricCardProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Calculate averages for residue (and potential future use)
  const { avgLab, avgAnl, avgResidual } = useMemo(() => {
    if (data.length === 0) {
      return { avgLab: null, avgAnl: null, avgResidual: null }
    }

    let sumLab = 0
    let countLab = 0
    let sumAnl = 0
    let countAnl = 0

    data.forEach((r) => {
      const lab = r[`${metricKey}_lab`]
      const anl = r[`${metricKey}_anl`]

      if (lab !== undefined && lab !== null && lab !== '') {
        const val = Number(lab)
        if (!isNaN(val)) {
          sumLab += val
          countLab++
        }
      }

      if (anl !== undefined && anl !== null && anl !== '') {
        const val = Number(anl)
        if (!isNaN(val)) {
          sumAnl += val
          countAnl++
        }
      }
    })

    const finalAvgLab = countLab > 0 ? sumLab / countLab : null
    const finalAvgAnl = countAnl > 0 ? sumAnl / countAnl : null
    const finalAvgRes = calculateResidue(finalAvgLab, finalAvgAnl)

    return {
      avgLab: finalAvgLab,
      avgAnl: finalAvgAnl,
      avgResidual: finalAvgRes,
    }
  }, [data, metricKey])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Card
          className={cn('flex flex-col border-zinc-800 bg-black', className)}
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-zinc-100">
                <span
                  className="h-4 w-1 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {title}
              </CardTitle>
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md">
                  {unit}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-500 hover:text-blue-400 hover:bg-zinc-900"
                  onClick={() => setIsAddDialogOpen(true)}
                  title="Adicionar Dados"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-900"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
              </div>
            </div>

            {/* Simplified stats display focused only on Residue */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 font-medium uppercase text-[10px] tracking-wider">
                Resíduo:
              </span>
              <span
                className={cn(
                  'font-mono font-bold text-sm',
                  avgResidual !== null ? 'text-red-500' : 'text-zinc-600',
                )}
              >
                {avgResidual !== null ? avgResidual.toFixed(2) : '-'}
              </span>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 pb-2 relative flex flex-col">
            {data.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px] z-10">
                <span className="text-sm text-zinc-500 font-medium">
                  Sem dados para exibir
                </span>
              </div>
            )}
            {/* Chart takes available space to focus on trends */}
            <div className="flex-1 w-full px-2 min-h-0">
              <MetricScatterChart
                data={data}
                metricKey={metricKey}
                color={color}
                unit={unit}
                compact={true}
              />
            </div>
          </CardContent>
        </Card>

        <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col bg-black border-zinc-800 text-zinc-100">
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
              <TabsList className="grid w-full grid-cols-4 bg-zinc-900 mb-4 border border-zinc-800">
                <TabsTrigger
                  value="correlation"
                  className="flex items-center gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                >
                  <Activity className="h-4 w-4" /> Correlação
                </TabsTrigger>
                <TabsTrigger
                  value="evolution"
                  className="flex items-center gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                >
                  <TrendingUp className="h-4 w-4" /> Evolução
                </TabsTrigger>
                <TabsTrigger
                  value="histogram"
                  className="flex items-center gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                >
                  <BarChart2 className="h-4 w-4" /> Histograma (LAB)
                </TabsTrigger>
                <TabsTrigger
                  value="residuals"
                  className="flex items-center gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                >
                  <ScatterChart className="h-4 w-4" /> Dispersão Resíduos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="correlation" className="flex-1 min-h-0">
                <MetricScatterChart
                  data={data}
                  metricKey={metricKey}
                  color={color}
                  unit={unit}
                  title={title}
                />
              </TabsContent>

              <TabsContent value="evolution" className="flex-1 min-h-0">
                <MetricEvolutionChart
                  data={data}
                  metricKey={metricKey}
                  color={color}
                  unit={unit}
                />
              </TabsContent>

              <TabsContent value="histogram" className="flex-1 min-h-0">
                <MetricHistogram
                  data={data}
                  metricKey={metricKey}
                  color={color}
                />
              </TabsContent>

              <TabsContent value="residuals" className="flex-1 min-h-0">
                <ResidualScatter
                  data={data}
                  metricKey={metricKey}
                  unit={unit}
                  title={title}
                />
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
        defaultCompanyId={selectedCompanyId}
      />
    </>
  )
}
