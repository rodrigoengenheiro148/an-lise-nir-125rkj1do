import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AnalysisRecord,
  METRICS,
  getMaterialDisplayName,
} from '@/types/dashboard'
import { calculateResidue } from '@/lib/calculations'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface AnalysisDetailTooltipProps {
  active?: boolean
  payload?: any[]
  highlightMetricKey?: string
}

export function AnalysisDetailTooltip({
  active,
  payload,
  highlightMetricKey,
}: AnalysisDetailTooltipProps) {
  if (!active || !payload || !payload.length) return null

  // STRICT CHECK: Only show tooltip if the payload contains data from the 'points' Scatter
  // We use the name 'points' as defined in the Scatter component
  const pointData = payload.find((p: any) => p.name === 'points')

  if (!pointData || !pointData.payload || !pointData.payload.original)
    return null

  const record = pointData.payload.original as AnalysisRecord

  // Filter metrics that have data
  const metricsWithData = METRICS.filter((m) => {
    // Check if any value exists for this metric
    const lab = record[`${m.key}_lab`]
    const nir = record[`${m.key}_nir`]
    const anl = record[`${m.key}_anl`]

    // Helper to check for valid value (not null/undefined)
    const isValid = (v: any) => v !== undefined && v !== null && v !== ''

    return isValid(lab) || isValid(nir) || isValid(anl)
  }).sort((a, b) => {
    // Sort logic: Highlighted metric first, then others
    if (highlightMetricKey && a.key === highlightMetricKey) return -1
    if (highlightMetricKey && b.key === highlightMetricKey) return 1
    // Keep original order for the rest
    return 0
  })

  return (
    <div className="w-[340px] bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden ring-1 ring-zinc-800/50 z-50">
      <div className="p-3 border-b border-zinc-900 bg-zinc-950">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-zinc-100 text-sm">
            Detalhes da Análise
          </h3>
          <Badge
            variant="outline"
            className="font-mono text-[10px] h-5 border-zinc-800 text-zinc-500 px-1.5"
          >
            ID: {record.id.slice(0, 6)}
          </Badge>
        </div>
        <p className="text-[10px] text-zinc-400 mb-3">
          Dados completos do registro selecionado.
        </p>

        <div className="grid grid-cols-2 gap-2 text-[10px] bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
          <div>
            <span className="block text-zinc-500 font-medium uppercase tracking-wider mb-0.5 scale-90 origin-left">
              Empresa
            </span>
            <span className="font-semibold text-zinc-200 truncate block">
              {record.company}
            </span>
          </div>
          <div>
            <span className="block text-zinc-500 font-medium uppercase tracking-wider mb-0.5 scale-90 origin-left">
              Data
            </span>
            <span className="font-mono text-zinc-200 block">
              {record.date
                ? format(new Date(record.date), 'dd/MM/yyyy', { locale: ptBR })
                : 'N/A'}
            </span>
          </div>
          <div>
            <span className="block text-zinc-500 font-medium uppercase tracking-wider mb-0.5 scale-90 origin-left">
              Material
            </span>
            <span className="text-zinc-200 truncate block">
              {getMaterialDisplayName(record.material || '')}
            </span>
          </div>
          <div>
            <span className="block text-zinc-500 font-medium uppercase tracking-wider mb-0.5 scale-90 origin-left">
              Sub-material
            </span>
            <span className="text-zinc-400 truncate block">
              {record.submaterial || '-'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-zinc-950">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-[10px] font-semibold text-zinc-300">
            Parâmetros Analíticos
          </h4>
          <span className="text-[10px] text-zinc-500">
            {metricsWithData.length} encontrados
          </span>
        </div>

        <div className="border border-zinc-800 rounded overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-[10px]">
            <thead className="bg-zinc-900/50 sticky top-0 z-10">
              <tr className="border-b border-zinc-800">
                <th className="px-2 py-1.5 text-left font-medium text-zinc-400">
                  Parâmetro
                </th>
                <th className="px-2 py-1.5 text-right font-medium text-zinc-400">
                  LAB
                </th>
                <th className="px-2 py-1.5 text-right font-medium text-zinc-400">
                  NIR (ANL)
                </th>
                <th className="px-2 py-1.5 text-right font-medium text-zinc-400">
                  Resíduo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 bg-zinc-950">
              {metricsWithData.map((metric) => {
                const lab = record[`${metric.key}_lab`] as number | undefined
                const anl = record[`${metric.key}_anl`] as number | undefined
                const nir = record[`${metric.key}_nir`] as number | undefined

                // Prioritize ANL, then NIR as display value
                const displayVal = anl ?? nir
                const residue = calculateResidue(lab, displayVal)
                const isHighlighted = highlightMetricKey === metric.key

                return (
                  <tr
                    key={metric.key}
                    className={cn(
                      'hover:bg-zinc-900/30 transition-colors',
                      isHighlighted && 'bg-zinc-900/60',
                    )}
                  >
                    <td className="px-2 py-1.5 font-medium text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: metric.color }}
                        />
                        <span>{metric.label}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-zinc-400">
                      {lab !== undefined && lab !== null ? lab.toFixed(2) : '-'}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-zinc-400">
                      {displayVal !== undefined && displayVal !== null
                        ? displayVal.toFixed(2)
                        : '-'}
                    </td>
                    <td
                      className={cn(
                        'px-2 py-1.5 text-right font-mono font-medium',
                        residue !== null && Math.abs(residue) > 1
                          ? 'text-red-400'
                          : 'text-zinc-500',
                      )}
                    >
                      {residue !== null ? residue.toFixed(2) : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
