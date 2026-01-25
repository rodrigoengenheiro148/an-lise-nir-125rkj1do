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

      // Simple parsing assuming order or trying to match headers could be complex
      // For this user story, we'll implement a flexible parser that assumes tab or comma separation
      // And we expect the user to follow a rough template or we map by index if headers are missing
      // Let's assume headers are present in first row for better UX, or we default to a standard order

      // Heuristic: Check if first row looks like header
      let startIdx = 0
      const firstRow = rows[0].toLowerCase()
      if (firstRow.includes('acidez') || firstRow.includes('acidity')) {
        startIdx = 1 // Skip header
      }

      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i]
        // Split by tab (Excel copy paste) or comma (CSV) or semicolon
        const cols = row.split(/[\t,;]+/).map((s) => s.trim())

        if (cols.length < 3) continue // Skip malformed rows

        // Attempt to parse fields.
        // Expected format: Company, Date, Acidity, Moisture, FCO, Protein, Phos, MinMat, Perox, Ether, DigProt, Calc
        // Fallback: If date is missing, use today. If company is invalid, use Default.

        const companyName = cols[0]
        const isValidCompany = COMPANIES.includes(companyName as any)

        // This is a basic parser. In a real app we'd have a column mapper UI.
        const record: AnalysisRecord = {
          id: crypto.randomUUID(),
          company: isValidCompany ? (companyName as any) : COMPANIES[0],
          date: cols[1] || now.toISOString().split('T')[0],
          acidity: parseFloat(cols[2]?.replace(',', '.') || '0'),
          moisture: parseFloat(cols[3]?.replace(',', '.') || '0'),
          fco: parseFloat(cols[4]?.replace(',', '.') || '0'),
          protein: parseFloat(cols[5]?.replace(',', '.') || '0'),
          phosphorus: parseFloat(cols[6]?.replace(',', '.') || '0'),
          mineralMatter: parseFloat(cols[7]?.replace(',', '.') || '0'),
          peroxide: parseFloat(cols[8]?.replace(',', '.') || '0'),
          etherExtract: parseFloat(cols[9]?.replace(',', '.') || '0'),
          proteinDigestibility: parseFloat(cols[10]?.replace(',', '.') || '0'),
          calcium: parseFloat(cols[11]?.replace(',', '.') || '0'),
        }
        parsedRecords.push(record)
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

  const template =
    'Empresa\tData\tAcidez\tUmidade\tFCO\tProteína\tFósforo\tMat. Mineral\tPeróxido\tExt. Etéreo\tDig. Prot\tCálcio\nAgroCorp Alpha\t2023-01-01\t1.2\t12.5\t25.0\t35.0\t0.8\t5.0\t2.1\t8.5\t85.0\t1.5'

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Dados</DialogTitle>
          <DialogDescription>
            Copie e cole os dados do Excel aqui. Certifique-se de que a ordem
            das colunas corresponda ao padrão.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
            <FileSpreadsheet className="h-4 w-4" />
            <span>
              Ordem esperada: Empresa, Data, Acidez, Umidade, FCO, Proteína,
              Fósforo, Mat. Mineral, Peróxido, Ext. Etéreo, Dig. Proteica,
              Cálcio
            </span>
          </div>
          <Textarea
            placeholder={`Cole seus dados aqui...\nExemplo:\n${template}`}
            className="h-[200px] font-mono text-xs"
            value={dataInput}
            onChange={(e) => setDataInput(e.target.value)}
          />
          <div className="flex items-center gap-2 text-xs text-amber-600">
            <AlertCircle className="h-3 w-3" />
            <span>Valores decimais podem usar ponto ou vírgula.</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleImport}>Processar Dados</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
