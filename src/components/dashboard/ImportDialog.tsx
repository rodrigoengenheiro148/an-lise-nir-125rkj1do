import { useState, useEffect, useRef } from 'react'
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
import {
  Upload,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { CompanyEntity, METRICS } from '@/types/dashboard'
import { toast } from 'sonner'
import { api } from '@/services/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { parseImportData, ParseResult } from '@/lib/import-utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ImportDialogProps {
  onImportSuccess?: () => void
}

export const ImportDialog = ({ onImportSuccess }: ImportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('file')
  const [companies, setCompanies] = useState<CompanyEntity[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [selectedMetric, setSelectedMetric] = useState<string>('')

  const [textInput, setTextInput] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      api.getCompanies().then(setCompanies).catch(console.error)
      setParseResult(null)
      setTextInput('')
      setFile(null)
      setIsProcessing(false)
      setSelectedMetric('') // Reset metric selection
    }
  }, [isOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setParseResult(null) // Reset previous results
    }
  }

  const processImport = async () => {
    if (!selectedMetric) {
      toast.error('Selecione uma métrica alvo.')
      return
    }

    let content = ''

    if (activeTab === 'file') {
      if (!file) {
        toast.error('Selecione um arquivo CSV.')
        return
      }
      try {
        content = await file.text()
      } catch (e) {
        toast.error('Erro ao ler arquivo.')
        return
      }
    } else {
      content = textInput
      if (!content.trim()) {
        toast.error('Cole os dados para importar.')
        return
      }
    }

    setIsProcessing(true)

    const defaultCompany = companies.find(
      (c) => c.id === selectedCompanyId,
    )?.name

    setTimeout(() => {
      const result = parseImportData(
        content,
        defaultCompany,
        companies,
        selectedMetric,
      )
      setParseResult(result)
      setIsProcessing(false)
      if (result.validCount === 0 && result.errors.length > 0) {
        toast.error('Nenhum registro válido encontrado. Verifique os erros.')
      } else if (result.validCount > 0) {
        const metricName =
          selectedMetric === 'auto'
            ? 'Automaticamente'
            : METRICS.find((m) => m.key === selectedMetric)?.label
        toast.success(
          `${result.validCount} registros identificados. (Métrica: ${metricName})`,
        )
      }
    }, 100)
  }

  const confirmImport = async () => {
    if (!parseResult || parseResult.records.length === 0) return

    setIsProcessing(true)
    try {
      await api.saveRecords(parseResult.records)
      toast.success(
        `${parseResult.records.length} registros importados com sucesso!`,
      )
      if (onImportSuccess) onImportSuccess()
      setIsOpen(false)
    } catch (e) {
      console.error(e)
      toast.error('Erro ao salvar registros no banco de dados.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Upload className="h-4 w-4" />
          Importar Dados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Registros de Análise</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Carregue um arquivo CSV ou cole dados do Excel. Selecione a métrica
            alvo para mapear os dados corretamente.
          </DialogDescription>
        </DialogHeader>

        {!parseResult ? (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Métrica Alvo (Obrigatório)</Label>
                <Select
                  value={selectedMetric}
                  onValueChange={setSelectedMetric}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700">
                    <SelectValue placeholder="Selecione a Métrica..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[300px]">
                    <SelectItem value="auto">
                      <span className="font-bold">
                        Automático (Detectar cabeçalhos)
                      </span>
                    </SelectItem>
                    {METRICS.map((m) => (
                      <SelectItem key={m.key} value={m.key}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Empresa Padrão (Opcional)</Label>
                <Select
                  value={selectedCompanyId}
                  onValueChange={setSelectedCompanyId}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700">
                    <SelectValue placeholder="Selecione caso faltem dados..." />
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
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-zinc-900">
                <TabsTrigger value="file">Arquivo CSV</TabsTrigger>
                <TabsTrigger value="text">Colar Texto / Excel</TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-4 pt-4">
                <div
                  className="border-2 border-dashed border-zinc-800 rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900/50 hover:border-zinc-700 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {file ? (
                    <div className="flex flex-col items-center gap-2 text-emerald-500">
                      <FileSpreadsheet className="h-10 w-10" />
                      <span className="font-medium">{file.name}</span>
                      <span className="text-xs text-zinc-500">
                        Clique para alterar
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                      <Upload className="h-10 w-10" />
                      <span className="font-medium">
                        Clique para selecionar CSV
                      </span>
                      <span className="text-xs">
                        Suporta .csv (Separado por vírgula ou ponto-e-vírgula)
                      </span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-4 pt-4">
                <Textarea
                  placeholder="Cole aqui as células copiadas do Excel..."
                  className="min-h-[200px] bg-zinc-900 border-zinc-800 font-mono text-xs"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden py-4 flex flex-col gap-4">
            <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-md border border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-emerald-500">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-bold">{parseResult.validCount}</span>
                  <span className="text-sm">Válidos</span>
                </div>
                {parseResult.invalidCount > 0 && (
                  <div className="flex items-center gap-2 text-red-500">
                    <XCircle className="h-5 w-5" />
                    <span className="font-bold">
                      {parseResult.invalidCount}
                    </span>
                    <span className="text-sm">Erros</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setParseResult(null)}
                className="text-zinc-400"
              >
                Voltar
              </Button>
            </div>

            <ScrollArea className="flex-1 border border-zinc-800 rounded-md bg-zinc-900/20">
              <div className="p-4 space-y-4">
                {parseResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-red-400 sticky top-0 bg-zinc-950/90 py-1">
                      Erros Encontrados:
                    </h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {parseResult.errors.map((err, i) => (
                        <li key={i} className="text-xs text-red-300 font-mono">
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {parseResult.records.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-emerald-400 sticky top-0 bg-zinc-950/90 py-1">
                      Pré-visualização (Primeiros 50):
                    </h4>
                    <div className="grid gap-1">
                      {parseResult.records.slice(0, 50).map((rec, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs p-2 bg-zinc-900/50 rounded border border-zinc-800/50 items-center"
                        >
                          <span className="truncate text-zinc-300 font-medium">
                            {rec.company}
                          </span>
                          <span className="truncate text-zinc-400">
                            {rec.material}
                          </span>
                          {/* Preview mapped value for selected metric */}
                          {selectedMetric && selectedMetric !== 'auto' && (
                            <span className="text-zinc-500 font-mono">
                              {rec[`${selectedMetric}_lab`] !== undefined
                                ? `LAB: ${rec[`${selectedMetric}_lab`]}`
                                : ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {!parseResult ? (
            <>
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={processImport}
                disabled={isProcessing || !selectedMetric}
                title={
                  !selectedMetric
                    ? 'Selecione uma métrica alvo para continuar'
                    : ''
                }
              >
                {isProcessing ? 'Processando...' : 'Processar Dados'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={confirmImport}
                disabled={isProcessing || parseResult.records.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isProcessing ? 'Salvando...' : 'Confirmar Importação'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
