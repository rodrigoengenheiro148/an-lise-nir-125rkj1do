import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  AnalysisRecord,
  MetricKey,
  METRICS,
  getMaterialDisplayName,
} from '@/types/dashboard'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface RecordDetailSheetProps {
  record: AnalysisRecord | null
  isOpen: boolean
  onClose: () => void
  highlightMetricKey?: MetricKey
}

export function RecordDetailSheet({
  record,
  isOpen,
  onClose,
  highlightMetricKey,
}: RecordDetailSheetProps) {
  if (!record) return null

  // Filter metrics that have at least one value present in the record
  const metricsWithData = METRICS.filter((m) => {
    const lab = record[`${m.key}_lab`]
    const nir = record[`${m.key}_nir`]
    const anl = record[`${m.key}_anl`]
    return (
      (lab !== undefined && lab !== null) ||
      (nir !== undefined && nir !== null) ||
      (anl !== undefined && anl !== null)
    )
  }).sort((a, b) => {
    // Highlighted metric first
    if (a.key === highlightMetricKey) return -1
    if (b.key === highlightMetricKey) return 1
    return 0
  })

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl bg-zinc-950 border-l border-zinc-800 text-zinc-100 overflow-hidden flex flex-col p-0">
        <SheetHeader className="p-6 pb-2 space-y-4 border-b border-zinc-900 bg-zinc-950 z-10">
          <div className="flex flex-col gap-1">
            <SheetTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              Detalhes da Análise
              <Badge variant="outline" className="ml-auto font-mono text-xs">
                ID: {record.id.slice(0, 8)}
              </Badge>
            </SheetTitle>
            <SheetDescription className="text-zinc-400">
              Dados completos do registro selecionado.
            </SheetDescription>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                Empresa
              </span>
              <span className="font-semibold text-zinc-200 truncate">
                {record.company}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                Data
              </span>
              <span className="font-mono text-zinc-200">
                {record.date
                  ? format(new Date(record.date), 'dd/MM/yyyy', {
                      locale: ptBR,
                    })
                  : 'N/A'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                Material
              </span>
              <span className="font-medium text-zinc-200 truncate">
                {getMaterialDisplayName(record.material || '')}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                Sub-material
              </span>
              <span className="text-zinc-400 truncate">
                {record.submaterial || '-'}
              </span>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 w-full p-6 pt-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                Parâmetros Analíticos
                <span className="text-xs font-normal text-zinc-500">
                  ({metricsWithData.length} encontrados)
                </span>
              </h4>
              <div className="rounded-md border border-zinc-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-900/50">
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400 w-[140px]">
                        Parâmetro
                      </TableHead>
                      <TableHead className="text-right text-zinc-400">
                        LAB
                      </TableHead>
                      <TableHead className="text-right text-zinc-400">
                        NIR (ANL)
                      </TableHead>
                      <TableHead className="text-right text-zinc-400">
                        Resíduo
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metricsWithData.map((metric) => {
                      const lab = record[`${metric.key}_lab`] as
                        | number
                        | undefined
                      const anl = record[`${metric.key}_anl`] as
                        | number
                        | undefined

                      // Calculate residue (Lab - Anl)
                      let residue: number | null = null
                      if (
                        lab !== undefined &&
                        lab !== null &&
                        anl !== undefined &&
                        anl !== null
                      ) {
                        residue = Number(lab) - Number(anl)
                      }

                      const isHighlighted = metric.key === highlightMetricKey

                      return (
                        <TableRow
                          key={metric.key}
                          className={cn(
                            'border-zinc-800',
                            isHighlighted
                              ? 'bg-zinc-900/80 hover:bg-zinc-900'
                              : 'hover:bg-zinc-900/30',
                          )}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: metric.color }}
                              />
                              <span
                                className={cn(
                                  isHighlighted
                                    ? 'text-white font-bold'
                                    : 'text-zinc-300',
                                )}
                              >
                                {metric.label}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-zinc-300">
                            {lab !== undefined && lab !== null
                              ? `${Number(lab).toFixed(2)}`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-zinc-300">
                            {anl !== undefined && anl !== null
                              ? `${Number(anl).toFixed(2)}`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {residue !== null ? (
                              <span
                                className={cn(
                                  Math.abs(residue) > 1
                                    ? 'text-red-400 font-bold'
                                    : 'text-zinc-500',
                                )}
                              >
                                {residue > 0 ? '+' : ''}
                                {residue.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-zinc-700">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {record.company_logo && (
              <div className="pt-4 flex justify-center">
                <img
                  src={record.company_logo}
                  alt={record.company}
                  className="h-16 w-auto opacity-50 grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
