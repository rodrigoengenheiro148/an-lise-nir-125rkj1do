import { useState, useEffect, useMemo } from 'react'
import { AnalysisRecord, STATIC_SUBMATERIALS } from '@/types/dashboard'
import { api } from '@/services/api'
import { DataManagementTable } from '@/components/dashboard/DataManagementTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Plus, Database, X } from 'lucide-react'
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

export default function DataManagementPage() {
  const [records, setRecords] = useState<AnalysisRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AnalysisRecord[]>([])
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>('')
  const [submaterialFilter, setSubmaterialFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [uniqueMaterials, setUniqueMaterials] = useState<string[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await api.getRecords()
      setRecords(data)
      const materials = await api.getUniqueMaterials()
      setUniqueMaterials(materials)
    } catch (e) {
      console.error(e)
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
          (r.date && r.date.includes(search)) ||
          r.material?.toLowerCase().includes(lowerSearch),
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

  return (
    <div className="container mx-auto p-6 space-y-8 text-zinc-100 min-h-screen pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-zinc-800 rounded-lg">
              <Database className="h-6 w-6 text-zinc-400" />
            </div>
            Gerenciamento de Dados
          </h1>
          <p className="text-zinc-400 mt-2 max-w-2xl">
            Central de controle para registros de análise laboratorial. Utilize
            os filtros para localizar amostras ou adicione novos resultados.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
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
            placeholder="Buscar por data (AAAA-MM-DD) ou material..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-950 border-zinc-800 focus:ring-zinc-700 h-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="w-full sm:w-[250px]">
            <CompanySelector
              selected={companyFilter}
              onSelect={setCompanyFilter}
              placeholder="Filtrar por Empresa"
            />
          </div>
          <div className="w-full sm:w-[250px] flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground hidden lg:inline whitespace-nowrap">
              Submaterial:
            </span>
            <div className="relative w-full">
              <Select
                value={submaterialFilter}
                onValueChange={setSubmaterialFilter}
              >
                <SelectTrigger className="w-full bg-background border-input">
                  <SelectValue placeholder="Filtrar por Submaterial" />
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

      <div className="space-y-4">
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
    </div>
  )
}
