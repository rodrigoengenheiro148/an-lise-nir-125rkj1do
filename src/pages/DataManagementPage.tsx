import { useState, useEffect, useMemo } from 'react'
import { AnalysisRecord, STATIC_SUBMATERIALS } from '@/types/dashboard'
import { api } from '@/services/api'
import { DataManagementTable } from '@/components/dashboard/DataManagementTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Plus, Database, X, Printer, Trash2 } from 'lucide-react'
import { CompanySelector } from '@/components/dashboard/CompanySelector'
import { EditRecordDialog } from '@/components/dashboard/EditRecordDialog'
import { ImportDialog } from '@/components/dashboard/ImportDialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { printElement } from '@/lib/export-utils'
import { toast } from 'sonner'
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

export default function DataManagementPage() {
  const [records, setRecords] = useState<AnalysisRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AnalysisRecord[]>([])
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>('')
  const [submaterialFilter, setSubmaterialFilter] = useState<string>('')
  // Removed targetMetric state as table is now comprehensive
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [uniqueMaterials, setUniqueMaterials] = useState<string[]>([])
  const [isDeleteAllAlertOpen, setIsDeleteAllAlertOpen] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await api.getRecords()
      setRecords(data)
      const materials = await api.getUniqueMaterials()
      setUniqueMaterials(materials)
    } catch (e) {
      console.error(e)
      toast.error('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const unsubscribe = api.subscribeToRecords(fetchData)
    return () => unsubscribe()
  }, [])

  const filterOptions = useMemo(() => {
    // Deduplicate static and unique materials
    return Array.from(
      new Set([...STATIC_SUBMATERIALS, ...uniqueMaterials]),
    ).sort()
  }, [uniqueMaterials])

  useEffect(() => {
    let res = records
    if (search) {
      const lowerSearch = search.toLowerCase()
      res = res.filter(
        (r) =>
          r.material?.toLowerCase().includes(lowerSearch) ||
          r.submaterial?.toLowerCase().includes(lowerSearch),
      )
    }
    if (companyFilter) {
      res = res.filter((r) => r.company === companyFilter)
    }
    if (submaterialFilter) {
      res = res.filter((r) => r.submaterial === submaterialFilter)
    }
    setFilteredRecords(res)
  }, [search, companyFilter, submaterialFilter, records])

  const handleExport = () => {
    const success = printElement(
      'report-content',
      'Relatório de Análises Completo',
    )
    if (!success) {
      toast.error('Erro ao gerar relatório. Tente novamente.')
    }
  }

  const handleDeleteAll = async () => {
    setIsDeletingAll(true)
    try {
      await api.deleteAllRecords()
      toast.success('Todos os registros foram excluídos com sucesso.')
      fetchData()
    } catch (e) {
      console.error(e)
      toast.error('Erro ao excluir todos os registros.')
    } finally {
      setIsDeletingAll(false)
      setIsDeleteAllAlertOpen(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8 text-zinc-100 min-h-screen pb-20 max-w-[1920px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-zinc-800 rounded-lg">
              <Database className="h-6 w-6 text-zinc-400" />
            </div>
            Gerenciamento de Dados
          </h1>
          <p className="text-zinc-400 mt-2 max-w-2xl">
            Visão unificada de todos os parâmetros analíticos. Edite valores
            diretamente na tabela (LAB/ANL) ou utilize os filtros para localizar
            registros.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <Button
            variant="destructive"
            onClick={() => setIsDeleteAllAlertOpen(true)}
            className="gap-2 shadow-lg shadow-red-900/20 transition-all hover:scale-105"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Apagar Tudo</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2 bg-zinc-900/50 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          <ImportDialog onImportSuccess={fetchData} />
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 gap-2 shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Nova Análise
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 bg-zinc-900/30 p-1 rounded-xl border border-zinc-800/50">
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          <Input
            placeholder="Buscar por material..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-950 border-zinc-800 focus:ring-zinc-700 h-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Target metric selector removed as requested for unified view */}
          <div className="w-full sm:w-[200px]">
            <CompanySelector
              selected={companyFilter}
              onSelect={setCompanyFilter}
              placeholder="Filtrar Empresa"
            />
          </div>
          <div className="w-full sm:w-[200px] flex items-center gap-2">
            <div className="relative w-full">
              <Select
                value={submaterialFilter}
                onValueChange={setSubmaterialFilter}
              >
                <SelectTrigger className="w-full bg-background border-input">
                  <SelectValue placeholder="Filtrar Submaterial" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {submaterialFilter && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSubmaterialFilter('')
                  }}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div id="report-content" className="space-y-4">
        <div className="flex items-center justify-between text-sm text-zinc-400 px-1">
          <span>
            Mostrando <strong>{filteredRecords.length}</strong> registros
          </span>
          {loading && (
            <span className="flex items-center gap-2 animate-pulse text-blue-400">
              Atualizando dados...
            </span>
          )}
        </div>

        {loading && records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 space-y-4 bg-zinc-900/20 rounded-xl border border-zinc-800 border-dashed">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
            <p>Carregando registros...</p>
          </div>
        ) : (
          <DataManagementTable
            records={filteredRecords}
            onDataChange={fetchData}
          />
        )}
      </div>

      <EditRecordDialog
        mode="add"
        record={null}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchData}
      />

      <AlertDialog
        open={isDeleteAllAlertOpen}
        onOpenChange={setIsDeleteAllAlertOpen}
      >
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">
              CUIDADO: Apagar TODOS os dados?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta ação é <strong className="text-red-400">irreversível</strong>
              . Isso excluirá permanentemente <strong>TODOS</strong> os
              registros de análise do banco de dados. Você terá que importar
              tudo novamente se confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
              className="bg-red-600 hover:bg-red-700 text-white border-red-800"
            >
              {isDeletingAll ? 'Apagando...' : 'Sim, Apagar Tudo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
