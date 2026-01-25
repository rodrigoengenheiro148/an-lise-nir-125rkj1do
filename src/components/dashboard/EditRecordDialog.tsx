import { useState } from 'react'
import { AnalysisRecord, METRICS } from '@/types/dashboard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/services/api'
import { toast } from 'sonner'

interface EditRecordDialogProps {
  record: AnalysisRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const EditRecordDialog = ({
  record,
  open,
  onOpenChange,
  onSuccess,
}: EditRecordDialogProps) => {
  const [formData, setFormData] = useState<Partial<AnalysisRecord>>({})

  // Initialize form when record changes
  if (record && (!formData.id || formData.id !== record.id)) {
    setFormData(record)
  }

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!record) return
    try {
      await api.updateRecord(record.id, formData)
      toast.success('Registro atualizado com sucesso!')
      onSuccess()
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      toast.error('Erro ao atualizar registro.')
    }
  }

  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Editar Registro - {record.company} ({record.date})
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="grid gap-6 p-1">
            <div className="space-y-2">
              <Label>Material / Produto</Label>
              <Input
                value={formData.material || ''}
                onChange={(e) => handleChange('material', e.target.value)}
                placeholder="Ex: Farelo de Soja"
                className="bg-zinc-900 border-zinc-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {METRICS.map((metric) => (
                <div
                  key={metric.key}
                  className="space-y-4 border border-zinc-800 p-4 rounded-lg bg-zinc-900/30"
                >
                  <h4 className="font-semibold text-sm text-blue-400 border-b border-zinc-800 pb-2 mb-2">
                    {metric.label} ({metric.unit})
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-zinc-500">NIR</Label>
                      <Input
                        value={String(formData[`${metric.key}_nir`] ?? '')}
                        onChange={(e) =>
                          handleChange(`${metric.key}_nir`, e.target.value)
                        }
                        className="h-8 bg-zinc-950 border-zinc-700 font-mono"
                        type="number"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-zinc-500">LAB</Label>
                      <Input
                        value={String(formData[`${metric.key}_lab`] ?? '')}
                        onChange={(e) =>
                          handleChange(`${metric.key}_lab`, e.target.value)
                        }
                        className="h-8 bg-zinc-950 border-zinc-700 font-mono"
                        type="number"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-zinc-500">ANL</Label>
                      <Input
                        value={String(formData[`${metric.key}_anl`] ?? '')}
                        onChange={(e) =>
                          handleChange(`${metric.key}_anl`, e.target.value)
                        }
                        className="h-8 bg-zinc-950 border-zinc-700 font-mono"
                        type="number"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-4 pt-4 border-t border-zinc-800">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-zinc-400"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
