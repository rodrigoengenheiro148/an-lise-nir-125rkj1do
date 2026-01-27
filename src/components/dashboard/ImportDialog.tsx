import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Upload,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Grid,
} from 'lucide-react'
import {
  CompanyEntity,
  METRICS,
  MATERIALS_OPTIONS,
  getMaterialDisplayName,
} from '@/types/dashboard'
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
import { calculateResidue, formatResidue } from '@/lib/calculations'

interface ImportDialogProps {
  onImportSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultMaterial?: string
}

export const ImportDialog = ({
  onImportSuccess,
  open,
  onOpenChange,
  defaultMaterial,
}: ImportDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined && onOpenChange !== undefined

  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen

  const [activeTab, setActiveTab] = useState('text')
  const [companies, setCompanies] = useState<CompanyEntity[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [selectedMetric, setSelectedMetric] = useState<string>('')
  const [selectedImportMaterial, setSelectedImportMaterial] =
    useState<string>('')

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
      setSelectedMetric('auto')
      if (defaultMaterial && MATERIALS_OPTIONS.includes(defaultMaterial)) {
        setSelectedImportMaterial(defaultMaterial)
      } else {
        setSelectedImportMaterial('')
      }
    }
  }, [isOpen, defaultMaterial])

  useEffect(() => {
    setParseResult(null)
  }, [selectedMetric, selectedImportMaterial])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setParseResult(null)
    }
  }

  const processImport = async () => {
    if (!selectedMetric) {
      toast.error('Selecione uma métrica ou modo de importação.')
      return
    }

    let content = ''

    if (activeTab === 'file') {
      if (!file) {
        toast.error('Selecione um arquivo.')
        return
      }
      try {
        content = await file.text()
      } catch (e) {
        toast.error(
          'Erro ao ler arquivo. Certifique-se que é um arquivo de texto válido (CSV).',
        )
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
        selectedImportMaterial,
      )
      setParseResult(result)
      setIsProcessing(false)
      if (result.validCount === 0 && result.errors.length > 0) {
        toast.error('Nenhum registro válido encontrado. Verifique os erros.')
      } else if (result.validCount > 0) {
        toast.success(`${result.validCount} registros identificados.`)
      }
    }, 100)
  }

  const confirmImport = async () => {
    if (!parseResult || parseResult.records.length === 0) return

    setIsProcessing(true)
    try {
      // Use the updated api.saveRecords which supports robust upsert logic
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
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Registros de Análise</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Importe múltiplos registros de uma vez. O sistema mesclará
            automaticamente dados novos com existentes com base na Data, Empresa
            e Material.
          </DialogDescription>
        </DialogHeader>

        {!parseResult ? (
          <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-none">
              <div className="space-y-2">
                <Label>Modo de Importação</Label>
                <Select
                  value={selectedMetric}
                  onValueChange={setSelectedMetric}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700">
                    <SelectValue placeholder="Selecione o Modo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[300px]">
                    <SelectItem value="auto">
                      <span className="font-bold">
                        Automático (Detectar cabeçalhos)
                      </span>
                    </SelectItem>
                    <SelectItem value="bulk_strict">
                      <span className="font-bold text-emerald-500">
                        Template Completo (Bulk Import)
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

            <div className="grid grid-cols-1 gap-4 flex-none">
              <div className="space-y-2">
                <Label>Material Padrão (Opcional)</Label>
                <Select
                  value={selectedImportMaterial}
                  onValueChange={setSelectedImportMaterial}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700">
                    <SelectValue placeholder="Utilizar material da linha ou selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[200px]">
                    <SelectItem value=" ">
                      <span className="text-zinc-500 italic">
                        Detectar do arquivo (Padrão)
                      </span>
                    </SelectItem>
                    {MATERIALS_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {getMaterialDisplayName(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-zinc-500 px-1">
                  Usado se o material não for especificado no arquivo.
                </p>
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden pt-2"
            >
              <TabsList className="grid w-full grid-cols-2 bg-zinc-900 flex-none">
                <TabsTrigger value="text" className="gap-2">
                  <Grid className="h-4 w-4" />
                  Planilha / Excel
                </TabsTrigger>
                <TabsTrigger value="file" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Arquivo CSV
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-4 pt-4 flex-none">
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

              <TabsContent value="text" className="flex-1 pt-2 overflow-hidden">
                <div className="flex flex-col h-full gap-2">
                  <Textarea
                    placeholder="Cole aqui as células copiadas do Excel (Ctrl+V)..."
                    className="flex-1 bg-zinc-900 border-zinc-800 font-mono text-xs resize-none"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                </div>
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
                      <div className="grid grid-cols-[80px_1fr_1fr_auto] gap-2 text-xs font-bold text-zinc-500 px-2 uppercase">
                        <span>Data</span>
                        <span>Empresa</span>
                        <span>Material</span>
                        <span className="text-right">Valores</span>
                      </div>
                      {parseResult.records.slice(0, 50).map((rec, i) => {
                        let valuesDisplay = '...'
                        if (
                          selectedMetric &&
                          selectedMetric !== 'auto' &&
                          selectedMetric !== 'bulk_strict'
                        ) {
                          const lab = rec[`${selectedMetric}_lab`] as
                            | number
                            | undefined
                          const anl = rec[`${selectedMetric}_anl`] as
                            | number
                            | undefined
                          const res = calculateResidue(lab, anl)
                          if (lab !== undefined || anl !== undefined) {
                            valuesDisplay = `${lab ?? '-'} | ${anl ?? '-'} | Res: ${formatResidue(res)}`
                          }
                        }

                        return (
                          <div
                            key={i}
                            className="grid grid-cols-[80px_1fr_1fr_auto] gap-2 text-xs p-2 bg-zinc-900/50 rounded border border-zinc-800/50 items-center hover:bg-zinc-800/50"
                          >
                            <span className="text-zinc-400 font-mono truncate">
                              {rec.date
                                ? rec.date.split('-').reverse().join('/')
                                : '-'}
                            </span>
                            <span className="truncate text-zinc-300 font-medium">
                              {rec.company}
                            </span>
                            <span className="truncate text-zinc-400">
                              {rec.material}
                            </span>
                            <span className="text-zinc-500 font-mono text-right">
                              {valuesDisplay}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 mt-auto pt-4 border-t border-zinc-800">
          {!parseResult ? (
            <>
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={processImport}
                disabled={isProcessing || !selectedMetric}
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
