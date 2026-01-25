import { useState, useEffect } from 'react'
import { AnalysisRecord } from '@/types/dashboard'
import { api } from '@/services/api'
import { DataManagementTable } from '@/components/dashboard/DataManagementTable'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { CompanySelector } from '@/components/dashboard/CompanySelector'

export default function DataManagementPage() {
  const [records, setRecords] = useState<AnalysisRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AnalysisRecord[]>([])
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const data = await api.getRecords()
        setRecords(data)
        setFilteredRecords(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    fetch()

    const unsubscribe = api.subscribeToRecords(fetch)
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let res = records
    if (search) {
      res = res.filter((r) => r.date.includes(search))
    }
    if (companyFilter) {
      res = res.filter((r) => r.company === companyFilter)
    }
    setFilteredRecords(res)
  }, [search, companyFilter, records])

  return (
    <div className="container mx-auto p-6 space-y-6 text-zinc-100 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gerenciamento de Dados
          </h1>
          <p className="text-zinc-400">
            Visualize, edite e remova registros de análise.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Buscar por data (YYYY-MM-DD)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-950 border-zinc-800"
          />
        </div>
        <div className="w-full md:w-[300px]">
          <CompanySelector
            selected={companyFilter}
            onSelect={setCompanyFilter}
            placeholder="Filtrar por Empresa"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-500">
          Carregando dados...
        </div>
      ) : (
        <DataManagementTable records={filteredRecords} />
      )}
    </div>
  )
}
