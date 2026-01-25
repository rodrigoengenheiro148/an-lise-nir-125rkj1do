import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { AnalysisRecord, COMPANIES, METRICS } from '@/types/dashboard'
import { toast } from 'sonner'

interface ImportDialogProps {
  onImport: (records: AnalysisRecord[]) => void
}

export const ImportDialog = ({ onImport }: ImportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [dataInput, setDataInput] = useState('')

  const handleImport = () => {
    if (!dataInput.trim()) {
      toast.error('Por favor, insira os dados para importar.')
      return
    }

    try {
      const rows = dataInput.trim().split('\n')
      const parsedRecords: AnalysisRecord[] = []
      const now = new Date()

      // Skip header if present
      let startIdx = 0
      const firstRow = rows[0].toLowerCase()
      if (firstRow.includes('empresa') || firstRow.includes('company')) {
        startIdx = 1
      }

      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i]
        const cols = row.split(/[\t,;]+/).map((s) => s.trim())

        if (cols.length < 5) continue

        const companyName = cols[0]
        const isValidCompany = COMPANIES.includes(companyName as any)
        const dateStr = cols[1]

        // Format: Company, Date, Acidity_LAB, Acidity_NIR, Moisture_LAB, Moisture_NIR...
        const record: any = {
          id: crypto.randomUUID(),
          company: isValidCompany ? (companyName as any) : COMPANIES[0],
          date:
            dateStr && dateStr.length > 5
              ? dateStr
              : now.toISOString().split('T')[0],
        }

        // Parse pairs dynamically based on METRICS order
        // Current template order matches METRICS array
        let colIdx = 2
        METRICS.forEach((metric) => {
          // Parse LAB
          const labVal = cols[colIdx]?.replace(',', '.') || '0'
          record[`${metric.key}_lab`] = parseFloat(labVal)

          // Parse NIR
          const nirVal = cols[colIdx + 1]?.replace(',', '.') || '0'
          record[`${metric.key}_nir`] = parseFloat(nirVal)

          colIdx += 2
        })

        parsedRecords.push(record as AnalysisRecord)
      }

      if (parsedRecords.length === 0) {
        toast.warning('Nenhum registro válido encontrado.')
        return
      }

      onImport(parsedRecords)
      setIsOpen(false)
      setDataInput('')
      toast.success(`${parsedRecords.length} registros importados com sucesso!`)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao processar os dados. Verifique o formato.')
    }
  }

  const templateHeaders =
    'Empresa\tData\tAcidez_LAB\tAcidez_NIR\tUmidade_LAB\tUmidade_NIR\tFCO_LAB\tFCO_NIR\tProteína_LAB\tProteína_NIR\t...'

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border-zinc-700"
        >
          <Upload className="h-4 w-4" />
          Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>Importar Dados LAB vs NIR</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Copie e cole os dados do Excel. O formato deve ser Empresa, Data,
            seguido de pares LAB e NIR para cada métrica na ordem padrão.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 p-2 rounded border border-zinc-800 overflow-x-auto whitespace-nowrap">
            <FileSpreadsheet className="h-4 w-4 shrink-0" />
            <span className="font-mono">{templateHeaders}</span>
          </div>
          <Textarea
            placeholder="Cole seus dados aqui..."
            className="h-[300px] font-mono text-xs bg-zinc-900 border-zinc-800 text-zinc-300 focus-visible:ring-zinc-700"
            value={dataInput}
            onChange={(e) => setDataInput(e.target.value)}
          />
          <div className="flex items-center gap-2 text-xs text-amber-500">
            <AlertCircle className="h-3 w-3" />
            <span>
              Certifique-se de que os valores decimais estão corretos.
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="text-zinc-400 hover:text-zinc-100"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Processar Dados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
