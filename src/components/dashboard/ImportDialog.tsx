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

      let startIdx = 0
      const firstRow = rows[0].toLowerCase()
      // Skip header if it looks like a header
      if (firstRow.includes('empresa') || firstRow.includes('company')) {
        startIdx = 1
      }

      const materialIdx = firstRow
        .split(/[\t,;]+/)
        .findIndex(
          (h) => h.trim().includes('material') || h.trim().includes('produto'),
        )

      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i]
        if (!row.trim()) continue

        const cols = row.split(/[\t,;]+/).map((s) => s.trim())

        if (cols.length < 5) continue

        const companyName = cols[0]
        const dateStr = cols[1]

        let material: string | undefined = undefined
        // If material column was identified in header
        if (materialIdx >= 0 && cols[materialIdx]) {
          material = cols[materialIdx]
        }
        // Heuristic: if no header scan, but cols count > metrics * 3 + 2, maybe col 2 is material?
        // Let's stick to standard format for now: Company | Date | Material (optional) | Metrics...
        // If Material is not present in header, we assume standard layout: Company | Date | [Material?] | LAB | NIR | ANL...

        // Let's rely on standard order if header parsing fails or is ambiguous.

        const record: any = {
          id: crypto.randomUUID(),
          company: companyName,
          date:
            dateStr && dateStr.length > 5
              ? dateStr
              : now.toISOString().split('T')[0],
          material,
        }

        // Start reading metrics after metadata
        // If material was read from column 2, then metrics start at 3.
        // If material was not found or is column 2, we need to be careful.
        // Standard expected: Company | Date | Material | ...Metrics (LAB, NIR, ANL)...
        let colIdx = 2
        if (materialIdx === 2 || cols.length > METRICS.length * 3 + 2) {
          if (!material) record.material = cols[2]
          colIdx = 3
        }

        METRICS.forEach((metric) => {
          // Parse LAB
          const labVal = cols[colIdx]?.replace(',', '.') || '0'
          record[`${metric.key}_lab`] = parseFloat(labVal)

          // Parse NIR
          const nirVal = cols[colIdx + 1]?.replace(',', '.') || '0'
          record[`${metric.key}_nir`] = parseFloat(nirVal)

          // Parse ANL
          const anlVal = cols[colIdx + 2]?.replace(',', '.') || '0'
          record[`${metric.key}_anl`] = parseFloat(anlVal)

          colIdx += 3
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
      toast.success(`${parsedRecords.length} registros importados e salvos!`)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao processar os dados. Verifique o formato.')
    }
  }

  const templateHeaders =
    'Empresa\tData\tMaterial\tAcidez_LAB\tAcidez_NIR\tAcidez_ANL\tUmidade_LAB\tUmidade_NIR\tUmidade_ANL...'

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
          <DialogTitle>Importar Dados (LAB, NIR, ANL)</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Copie e cole os dados do Excel. O formato esperado é:
            <br />
            <strong>Empresa</strong>, <strong>Data</strong>,{' '}
            <strong>Material</strong> (Opcional), seguido de trios{' '}
            <strong>LAB</strong>, <strong>NIR</strong>, <strong>ANL</strong>{' '}
            para cada métrica.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 p-2 rounded border border-zinc-800 overflow-x-auto whitespace-nowrap">
            <FileSpreadsheet className="h-4 w-4 shrink-0" />
            <span className="font-mono">{templateHeaders}</span>
          </div>
          <Textarea
            placeholder={`Exemplo:\nEmpresa A\t2023-10-01\tSoja\t1.5\t1.4\t1.45\t12.0\t11.9\t12.1...`}
            className="h-[300px] font-mono text-xs bg-zinc-900 border-zinc-800 text-zinc-300 focus-visible:ring-zinc-700"
            value={dataInput}
            onChange={(e) => setDataInput(e.target.value)}
          />
          <div className="flex items-center gap-2 text-xs text-amber-500">
            <AlertCircle className="h-3 w-3" />
            <span>
              Certifique-se de que os valores decimais estão corretos e as
              colunas seguem a ordem exata.
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
