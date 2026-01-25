import { useState, useEffect } from 'react'
import {
  AnalysisRecord,
  METRICS,
  CompanyEntity,
  MATERIALS_OPTIONS,
} from '@/types/dashboard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/services/api'
import { toast } from 'sonner'
import {
  Loader2,
  FlaskConical,
  Building2,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditRecordDialogProps {
  record: AnalysisRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  mode?: 'add' | 'edit'
}

export const EditRecordDialog = ({
  record,
  open,
  onOpenChange,
  onSuccess,
  mode = 'edit',
}: EditRecordDialogProps) => {
  const [formData, setFormData] = useState<Partial<AnalysisRecord>>({})
  const [companies, setCompanies] = useState<CompanyEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Load companies when dialog opens
  useEffect(() => {
    if (open) {
      const loadCompanies = async () => {
        setLoading(true)
        try {
          const data = await api.getCompanies()
          setCompanies(data)
        } catch (e) {
          console.error(e)
          toast.error('Erro ao carregar empresas.')
        } finally {
          setLoading(false)
        }
      }
      loadCompanies()
    }
  }, [open])

  // Initialize form
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && record) {
        setFormData({ ...record })
      } else if (mode === 'add') {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          material: '',
        })
      }
    }
  }, [open, record, mode])

  const handleChange = (key: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!formData.company_id && mode === 'add') {
      toast.error('Selecione uma empresa.')
      return
    }
    // Date is now automated for new records, but check if it's there for safety
    if (!formData.date) {
      toast.error('Erro interno: Data não definida.')
      return
    }
    if (!formData.material) {
      toast.error('Informe o material.')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'edit' && record) {
        await api.updateRecord(record.id, formData)
        toast.success('Registro atualizado com sucesso!')
      } else if (mode === 'add' && formData.company_id) {
        await api.createRecord(formData as AnalysisRecord)
        toast.success('Registro criado com sucesso!')
      }
      onSuccess()
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      toast.error(
        `Erro ao ${mode === 'edit' ? 'atualizar' : 'criar'} registro.`,
      )
    } finally {
      setSubmitting(false)
    }
  }

  const calculateResidue = (
    labVal: string | number | undefined,
    anlVal: string | number | undefined,
  ) => {
    const lab = Number(labVal || 0)
    const anl = Number(anlVal || 0)
    return (lab - anl).toFixed(2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-zinc-950 border-zinc-800 text-zinc-100 h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {mode === 'edit' ? (
                <div className="p-2 bg-blue-500/10 rounded-md text-blue-500">
                  <FlaskConical className="h-5 w-5" />
                </div>
              ) : (
                <div className="p-2 bg-emerald-500/10 rounded-md text-emerald-500">
                  <FlaskConical className="h-5 w-5" />
                </div>
              )}
              {mode === 'edit'
                ? 'Editar Registro de Análise'
                : 'Nova Entrada de Análise'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {mode === 'edit'
                ? 'Modifique os dados da amostra e os resultados analíticos.'
                : 'Cadastre uma nova amostra e insira os resultados das análises.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 w-full">
          <div className="p-6 space-y-8">
            {/* Context Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                Contexto da Amostra
                <div className="h-px bg-zinc-800 flex-1" />
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                    Empresa <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.company_id}
                    onValueChange={(val) => handleChange('company_id', val)}
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:ring-blue-500/20">
                      <SelectValue placeholder="Selecione a empresa..." />
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
                    <Package className="h-3.5 w-3.5 text-zinc-500" />
                    Material <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.material || ''}
                    onValueChange={(val) => handleChange('material', val)}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:ring-blue-500/20">
                      <SelectValue placeholder="Selecione o material..." />
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
              </div>
            </div>

            {/* Analysis Data Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                Dados Analíticos
                <div className="h-px bg-zinc-800 flex-1" />
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {METRICS.map((metric) => (
                  <div
                    key={metric.key}
                    className="bg-zinc-900/30 rounded-xl border border-zinc-800/50 p-4 hover:bg-zinc-900/50 hover:border-zinc-700 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800/50">
                      <span
                        className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                        style={{
                          color: metric.color,
                          backgroundColor: metric.color,
                        }}
                      />
                      <span className="font-semibold text-sm text-zinc-200">
                        {metric.label}
                      </span>
                      <span className="text-xs text-zinc-500 ml-auto font-mono">
                        {metric.unit}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {metric.key === 'acidity' ? (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                              LAB
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={formData[`${metric.key}_lab`] ?? ''}
                              onChange={(e) =>
                                handleChange(
                                  `${metric.key}_lab`,
                                  e.target.value,
                                )
                              }
                              className="bg-zinc-950 border-zinc-800 font-mono text-zinc-100 h-8 text-xs focus:border-zinc-600"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-blue-500/70 uppercase tracking-wider">
                              ANL
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={formData[`${metric.key}_anl`] ?? ''}
                              onChange={(e) =>
                                handleChange(
                                  `${metric.key}_anl`,
                                  e.target.value,
                                )
                              }
                              className="bg-zinc-950 border-zinc-800 font-mono text-blue-400 h-8 text-xs focus:border-blue-900"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                              Resíduo
                            </Label>
                            <div className="flex items-center justify-center h-8 bg-zinc-900/50 border border-zinc-800/50 rounded-md font-mono text-xs text-zinc-500">
                              {calculateResidue(
                                formData[`${metric.key}_lab`],
                                formData[`${metric.key}_anl`],
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                              NIR
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={formData[`${metric.key}_nir`] ?? ''}
                              onChange={(e) =>
                                handleChange(
                                  `${metric.key}_nir`,
                                  e.target.value,
                                )
                              }
                              className="bg-zinc-950 border-zinc-800 font-mono text-zinc-400 h-8 text-xs focus:border-zinc-600"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                              LAB
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={formData[`${metric.key}_lab`] ?? ''}
                              onChange={(e) =>
                                handleChange(
                                  `${metric.key}_lab`,
                                  e.target.value,
                                )
                              }
                              className="bg-zinc-950 border-zinc-800 font-mono text-zinc-100 h-8 text-xs focus:border-zinc-600"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-blue-500/70 uppercase tracking-wider">
                              ANL
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={formData[`${metric.key}_anl`] ?? ''}
                              onChange={(e) =>
                                handleChange(
                                  `${metric.key}_anl`,
                                  e.target.value,
                                )
                              }
                              className="bg-zinc-950 border-zinc-800 font-mono text-blue-400 h-8 text-xs focus:border-blue-900"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-end gap-3 z-10 flex-none shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.5)]">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={submitting}
            className={cn(
              'min-w-[140px] gap-2',
              mode === 'add'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-blue-600 hover:bg-blue-700',
            )}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <FlaskConical className="h-4 w-4" />
                {mode === 'add' ? 'Cadastrar Análise' : 'Salvar Alterações'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
