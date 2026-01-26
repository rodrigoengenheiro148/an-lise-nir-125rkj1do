import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MetricKey,
  METRICS,
  CompanyEntity,
  MATERIALS_OPTIONS,
  AnalysisRecord,
  getMaterialDisplayName,
} from '@/types/dashboard'
import { api } from '@/services/api'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface MetricDataDialogProps {
  metricKey: MetricKey
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  defaultCompanyId?: string
  defaultMaterial?: string
}

export const MetricDataDialog = ({
  metricKey,
  open,
  onOpenChange,
  onSuccess,
  defaultCompanyId,
  defaultMaterial,
}: MetricDataDialogProps) => {
  const metric = METRICS.find((m) => m.key === metricKey)
  const [companies, setCompanies] = useState<CompanyEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    company_id: '',
    material: '',
    date: new Date().toISOString().split('T')[0],
    lab: '',
    anl: '',
    nir: '',
  })

  useEffect(() => {
    if (open) {
      setFormData({
        company_id: defaultCompanyId || '',
        material: defaultMaterial || '',
        date: new Date().toISOString().split('T')[0],
        lab: '',
        anl: '',
        nir: '',
      })
      api.getCompanies().then(setCompanies).catch(console.error)
    }
  }, [open, defaultCompanyId, defaultMaterial])

  const handleSave = async () => {
    if (!formData.company_id) {
      toast.error('Selecione uma empresa.')
      return
    }
    if (!formData.material) {
      toast.error('Selecione um material.')
      return
    }
    if (!formData.date) {
      toast.error('Informe a data.')
      return
    }

    setSubmitting(true)
    try {
      const record: Partial<AnalysisRecord> & { company_id: string } = {
        company_id: formData.company_id,
        material: formData.material,
        date: formData.date,
      }

      // Add dynamic metric values
      if (formData.lab) record[`${metricKey}_lab`] = parseFloat(formData.lab)
      if (formData.anl) record[`${metricKey}_anl`] = parseFloat(formData.anl)
      if (formData.nir) record[`${metricKey}_nir`] = parseFloat(formData.nir)

      await api.createRecord(record)
      toast.success('Dados adicionados com sucesso!')
      onSuccess()
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      toast.error('Erro ao salvar dados.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>
            Adicionar Dados:{' '}
            <span style={{ color: metric?.color }}>{metric?.label}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Empresa</Label>
            <Select
              value={formData.company_id}
              onValueChange={(val) =>
                setFormData((prev) => ({ ...prev, company_id: val }))
              }
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

          <div className="grid gap-2">
            <Label>Material</Label>
            <Select
              value={formData.material}
              onValueChange={(val) =>
                setFormData((prev) => ({ ...prev, material: val }))
              }
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-700">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                {MATERIALS_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {getMaterialDisplayName(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
              className="bg-zinc-900 border-zinc-700 text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800">
            <div className="space-y-1">
              <Label className="text-xs font-mono text-zinc-400">
                LAB ({metric?.unit})
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.lab}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lab: e.target.value }))
                }
                className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono text-blue-400">
                ANL ({metric?.unit})
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.anl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, anl: e.target.value }))
                }
                className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono text-purple-400">
                NIR ({metric?.unit})
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.nir}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nir: e.target.value }))
                }
                className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
