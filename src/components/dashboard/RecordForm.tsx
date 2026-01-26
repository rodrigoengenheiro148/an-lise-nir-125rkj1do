import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CompanyEntity,
  MATERIALS_OPTIONS,
  METRICS,
  STATIC_SUBMATERIALS,
  AnalysisRecord,
} from '@/types/dashboard'
import { Building2, Calendar, Package, Tag } from 'lucide-react'
import { calculateResidue, formatResidue } from '@/lib/calculations'
import { cn } from '@/lib/utils'

interface RecordFormProps {
  formData: Partial<AnalysisRecord>
  onChange: (key: string, value: string | number) => void
  companies: CompanyEntity[]
  loading?: boolean
}

export const RecordForm = ({
  formData,
  onChange,
  companies,
  loading = false,
}: RecordFormProps) => {
  return (
    <div className="space-y-8 p-6">
      {/* Context Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          Contexto da Amostra
          <div className="h-px bg-zinc-800 flex-1" />
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="text-zinc-300 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-zinc-500" />
              Empresa <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.company_id}
              onValueChange={(val) => onChange('company_id', val)}
              disabled={loading}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:ring-blue-500/20">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-zinc-500" />
              Data
            </Label>
            <Input
              type="date"
              value={formData.date || ''}
              onChange={(e) => onChange('date', e.target.value)}
              className="bg-zinc-900 border-zinc-700 focus:ring-blue-500/20 text-zinc-100"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300 flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-zinc-500" />
              Material <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.material || ''}
              onValueChange={(val) => onChange('material', val)}
              disabled={loading}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:ring-blue-500/20">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[200px]">
                {MATERIALS_OPTIONS.map((material) => (
                  <SelectItem key={material} value={material}>
                    {material}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300 flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-zinc-500" />
              Submaterial
            </Label>
            <Select
              value={formData.submaterial || ''}
              onValueChange={(val) => onChange('submaterial', val)}
              disabled={loading}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:ring-blue-500/20">
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[200px]">
                {STATIC_SUBMATERIALS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Analysis Data Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          Dados Analíticos
          <div className="h-px bg-zinc-800 flex-1" />
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {METRICS.map((metric) => (
            <div
              key={metric.key}
              className="bg-zinc-900/30 rounded-xl border border-zinc-800/50 p-4 hover:bg-zinc-900/50 hover:border-zinc-700 transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800/50">
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                  style={{ color: metric.color, backgroundColor: metric.color }}
                />
                <span className="font-semibold text-sm text-zinc-200">
                  {metric.label}
                </span>
                <span className="text-xs text-zinc-500 ml-auto font-mono">
                  {metric.unit}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'lab', label: 'LAB', color: 'text-zinc-300' },
                  { key: 'nir', label: 'NIR', color: 'text-purple-400/70' },
                  { key: 'anl', label: 'ANL', color: 'text-blue-400/70' },
                ].map((type) => (
                  <div key={type.key} className="space-y-1">
                    <Label
                      className={`text-[10px] font-bold ${type.color} uppercase`}
                    >
                      {type.label}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="-"
                      value={formData[`${metric.key}_${type.key}`] ?? ''}
                      onChange={(e) =>
                        onChange(`${metric.key}_${type.key}`, e.target.value)
                      }
                      className="bg-zinc-950 border-zinc-800 font-mono text-zinc-100 h-8 text-xs px-2 focus:border-zinc-600"
                      disabled={loading}
                    />
                  </div>
                ))}

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-zinc-600 uppercase">
                    RES
                  </Label>
                  <div
                    className={cn(
                      'flex items-center justify-center h-8 bg-zinc-900/50 border border-zinc-800/50 rounded-md font-mono text-xs',
                      calculateResidue(
                        formData[`${metric.key}_lab`],
                        formData[`${metric.key}_anl`],
                      ) === null
                        ? 'text-zinc-500'
                        : 'text-zinc-300',
                    )}
                  >
                    {formatResidue(
                      calculateResidue(
                        formData[`${metric.key}_lab`],
                        formData[`${metric.key}_anl`],
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
