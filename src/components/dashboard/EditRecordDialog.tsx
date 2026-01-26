import { useState, useEffect } from 'react'
import { AnalysisRecord, METRICS, CompanyEntity } from '@/types/dashboard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { api } from '@/services/api'
import { toast } from 'sonner'
import { Loader2, FlaskConical, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RecordForm } from './RecordForm'

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
  const [initialData, setInitialData] = useState<Partial<AnalysisRecord>>({})
  const [companies, setCompanies] = useState<CompanyEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (open) {
      const loadData = async () => {
        setLoading(true)
        try {
          const companiesData = await api.getCompanies()
          setCompanies(companiesData)
        } catch (e) {
          console.error(e)
          toast.error('Erro ao carregar dados.')
        } finally {
          setLoading(false)
        }
      }
      loadData()
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setShowDeleteConfirm(false)
      if (mode === 'edit' && record) {
        setFormData({ ...record })
        setInitialData({ ...record })
      } else if (mode === 'add') {
        const initial = { material: '', submaterial: '', date: null }
        setFormData(initial)
        setInitialData(initial)
      }
    }
  }, [open, record, mode])

  const handleChange = (key: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!formData.company_id) {
      toast.error('Selecione uma empresa.')
      return
    }
    if (!formData.material) {
      toast.error('Informe o material.')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'edit' && record) {
        const updates: Partial<AnalysisRecord> = {}
        if (formData.material !== initialData.material)
          updates.material = formData.material
        if (formData.submaterial !== initialData.submaterial)
          updates.submaterial = formData.submaterial
        if (formData.company_id !== initialData.company_id)
          updates.company_id = formData.company_id
        if (formData.date !== initialData.date) updates.date = formData.date

        METRICS.forEach((m) => {
          const keyLab = `${m.key}_lab`
          const keyAnl = `${m.key}_anl`
          const keyNir = `${m.key}_nir`
          if (formData[keyLab] !== initialData[keyLab])
            updates[keyLab] = formData[keyLab]
          if (formData[keyAnl] !== initialData[keyAnl])
            updates[keyAnl] = formData[keyAnl]
          if (formData[keyNir] !== initialData[keyNir])
            updates[keyNir] = formData[keyNir]
        })

        if (Object.keys(updates).length > 0) {
          await api.updateRecord(record.id, updates)
          toast.success('Registro atualizado!')
        }
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

  const handleDelete = async () => {
    if (!record) return
    setSubmitting(true)
    try {
      await api.deleteRecord(record.id)
      toast.success('Registro excluído!')
      onSuccess()
      onOpenChange(false)
    } catch (e) {
      toast.error('Erro ao excluir registro.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl bg-zinc-950 border-zinc-800 text-zinc-100 h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex-none">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div
                  className={`p-2 rounded-md ${mode === 'edit' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}
                >
                  <FlaskConical className="h-5 w-5" />
                </div>
                {mode === 'edit'
                  ? 'Editar Registro de Análise'
                  : 'Nova Entrada de Análise'}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                {mode === 'edit'
                  ? 'Modifique os dados da amostra e os resultados.'
                  : 'Cadastre uma nova amostra e insira os resultados.'}
              </DialogDescription>
            </DialogHeader>
          </div>
          <ScrollArea className="flex-1 w-full">
            <RecordForm
              formData={formData}
              onChange={handleChange}
              companies={companies}
              loading={loading}
            />
          </ScrollArea>
          <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-between gap-3 flex-none shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.5)]">
            {mode === 'edit' ? (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={submitting}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 gap-2"
              >
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
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
                    <FlaskConical className="h-4 w-4" />{' '}
                    {mode === 'add' ? 'Cadastrar' : 'Salvar'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
