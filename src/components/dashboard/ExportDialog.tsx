import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Download, Loader2 } from 'lucide-react'
import { CompanyEntity, METRICS } from '@/types/dashboard'
import { api } from '@/services/api'
import { toast } from 'sonner'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: CompanyEntity[]
  defaultCompanyId?: string
}

export const ExportDialog = ({
  open,
  onOpenChange,
  companies,
  defaultCompanyId,
}: ExportDialogProps) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all')
  const [selectedMetric, setSelectedMetric] = useState<string>('')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedCompanyId(defaultCompanyId || 'all')
      setSelectedMetric('')
    }
  }, [open, defaultCompanyId])

  const handleExport = async () => {
    if (!selectedMetric) {
      toast.error('Selecione uma métrica para exportar.')
      return
    }

    setIsExporting(true)
    try {
      const companyId =
        selectedCompanyId === 'all' ? undefined : selectedCompanyId
      await api.exportMetricData(selectedMetric, companyId)

      toast.success('Download iniciado com sucesso!')
      onOpenChange(false)
    } catch (error: any) {
      console.error(error)
      const msg = error.message || 'Erro ao exportar dados.'
      toast.error(msg)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Dados de Análise</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Selecione a métrica e a empresa (opcional) para baixar os dados em
            formato Excel (.xlsx).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Métrica</Label>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="bg-zinc-900 border-zinc-700">
                <SelectValue placeholder="Selecione a métrica..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[300px]">
                {METRICS.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Empresa (Opcional)</Label>
            <Select
              value={selectedCompanyId}
              onValueChange={setSelectedCompanyId}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-700">
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-zinc-400 hover:text-white"
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || !selectedMetric}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? 'Gerando Arquivo...' : 'Baixar Excel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
