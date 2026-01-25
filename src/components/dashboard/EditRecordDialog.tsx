import { useState, useEffect } from 'react'
import { AnalysisRecord, METRICS, CompanyEntity } from '@/types/dashboard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { api } from '@/services/api'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

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
    if (!formData.date) {
      toast.error('Selecione a data.')
      return
    }
    if (!formData.material) {
      toast.error('Informe o material/produto.')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'edit' && record) {
        await api.updateRecord(record.id, formData)
        toast.success('Registro atualizado com sucesso!')
      } else if (mode === 'add' && formData.company_id) {
        await api.createRecord(formData as AnalysisRecord) // company_id is checked above
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <DialogHeader>
            <DialogTitle>
              {mode === 'edit' ? 'Editar Análise' : 'Nova Análise'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {mode === 'edit'
                ? 'Atualize os dados da amostra abaixo.'
                : 'Preencha os dados para cadastrar uma nova amostra.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">
                  Empresa <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.company_id}
                  onValueChange={(val) => handleChange('company_id', val)}
                  disabled={
                    loading || (mode === 'edit' && !!record?.company_id)
                  } // Can disable edit if desired, but user story says update existing data. Usually company doesn't change, but let's allow it if needed or lock it.
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700">
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
                <Label className="text-zinc-300">
                  Data <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="bg-zinc-900 border-zinc-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">
                  Material / Produto <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.material || ''}
                  onChange={(e) => handleChange('material', e.target.value)}
                  placeholder="Ex: Farelo de Soja"
                  className="bg-zinc-900 border-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-800 pb-2">
                Resultados da Análise
              </h3>

              <div className="grid grid-cols-1 gap-6">
                {METRICS.map((metric) => (
                  <div
                    key={metric.key}
                    className="bg-zinc-900/30 p-4 rounded-lg border border-zinc-800/50"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: metric.color }}
                      ></span>
                      <h4 className="font-medium text-sm text-zinc-200">
                        {metric.label} ({metric.unit})
                      </h4>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-zinc-500 uppercase tracking-wider">
                          NIR
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData[`${metric.key}_nir`] ?? ''}
                          onChange={(e) =>
                            handleChange(`${metric.key}_nir`, e.target.value)
                          }
                          className="h-8 bg-zinc-950 border-zinc-700 font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-zinc-500 uppercase tracking-wider">
                          LAB
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData[`${metric.key}_lab`] ?? ''}
                          onChange={(e) =>
                            handleChange(`${metric.key}_lab`, e.target.value)
                          }
                          className="h-8 bg-zinc-950 border-zinc-700 font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-zinc-500 uppercase tracking-wider">
                          ANL
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData[`${metric.key}_anl`] ?? ''}
                          onChange={(e) =>
                            handleChange(`${metric.key}_anl`, e.target.value)
                          }
                          className="h-8 bg-zinc-950 border-zinc-700 font-mono text-sm text-blue-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-end gap-3">
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
            className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Salvar Dados'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
