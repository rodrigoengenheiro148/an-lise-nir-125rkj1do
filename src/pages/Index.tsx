import { useState, useEffect, useMemo, useCallback } from 'react'
import { Company, AnalysisRecord, METRICS } from '@/types/dashboard'
import { api } from '@/services/api'
import { CompanySelector } from '@/components/dashboard/CompanySelector'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { DataManagementTable } from '@/components/dashboard/DataManagementTable'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Activity, TrendingUp, Cloud, X } from 'lucide-react'

const Index = () => {
  const [selectedCompany, setSelectedCompany] = useState<Company>('')
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [selectedSubmaterial, setSelectedSubmaterial] = useState<string>('')

  const [allRecords, setAllRecords] = useState<AnalysisRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AnalysisRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [records, companies] = await Promise.all([
        api.getRecords(),
        api.getCompanies(),
      ])
      setAllRecords(records)
      if (companies.length > 0 && !selectedCompany) {
        setSelectedCompany(companies[0].name)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [selectedCompany]) // Added selectedCompany dep though strictly not needed for logic inside, but nice for init

  useEffect(() => {
    fetchData()
    // Subscribe to realtime changes
    const unsubscribe = api.subscribeToRecords(fetchData)
    return () => unsubscribe()
  }, []) // Removed dependency on fetchData to avoid loop if not memoized properly, but added useCallback above

  // Extract unique materials and submaterials for the current company
  const { uniqueMaterials, uniqueSubmaterials } = useMemo(() => {
    const mats = new Set<string>()
    const subMats = new Set<string>()

    const scope = selectedCompany
      ? allRecords.filter((r) => r.company === selectedCompany)
      : allRecords

    scope.forEach((r) => {
      if (r.material) mats.add(r.material.trim().toUpperCase())
      if (r.submaterial) subMats.add(r.submaterial.trim().toUpperCase())
    })

    return {
      uniqueMaterials: Array.from(mats).sort(),
      uniqueSubmaterials: Array.from(subMats).sort(),
    }
  }, [allRecords, selectedCompany])

  useEffect(() => {
    if (selectedCompany) {
      let filtered = allRecords.filter((r) => r.company === selectedCompany)

      if (selectedMaterial) {
        filtered = filtered.filter(
          (r) => r.material?.trim().toUpperCase() === selectedMaterial,
        )
      }

      if (selectedSubmaterial) {
        filtered = filtered.filter(
          (r) => r.submaterial?.trim().toUpperCase() === selectedSubmaterial,
        )
      }

      // Records are already sorted by created_at desc from API
      setFilteredRecords(filtered)
    }
  }, [selectedCompany, selectedMaterial, selectedSubmaterial, allRecords])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh] bg-zinc-950 text-zinc-100">
        <div className="animate-pulse flex flex-col items-center">
          <Activity className="h-10 w-10 text-blue-500 mb-4" />
          <span className="text-lg font-medium">
            Sincronizando com Nuvem...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 selection:bg-blue-500/30">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/30 rounded-lg border border-blue-500/20">
              <TrendingUp className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Dashboard Analítico
              </h1>
              <p className="text-xs text-zinc-400">
                Monitoramento de Qualidade
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="text-zinc-950 w-full sm:w-auto">
              <CompanySelector
                selected={selectedCompany}
                onSelect={setSelectedCompany}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4 bg-zinc-900/30 p-4 rounded-lg border border-zinc-800/50">
          <span className="text-sm font-medium text-zinc-400">
            Filtros Avançados:
          </span>

          {/* Material Filter */}
          <div className="relative w-[200px]">
            <Select
              value={selectedMaterial}
              onValueChange={setSelectedMaterial}
            >
              <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9">
                <SelectValue placeholder="Material" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200 max-h-[300px]">
                {uniqueMaterials.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMaterial && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedMaterial('')
                }}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Submaterial Filter */}
          <div className="relative w-[200px]">
            <Select
              value={selectedSubmaterial}
              onValueChange={setSelectedSubmaterial}
            >
              <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9">
                <SelectValue placeholder="Submaterial" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                {uniqueSubmaterials.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSubmaterial && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedSubmaterial('')
                }}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Key Indicators Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col">
            <span className="text-xs text-zinc-500 uppercase font-mono">
              Amostras (Filtradas)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {filteredRecords.length}
              </span>
              <span className="text-xs text-blue-400">registros</span>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col">
            <span className="text-xs text-zinc-500 uppercase font-mono">
              Última Atividade
            </span>
            <span className="text-lg font-medium text-white">
              {filteredRecords[0]?.created_at
                ? new Date(filteredRecords[0].created_at).toLocaleDateString(
                    'pt-BR',
                    { day: '2-digit', month: '2-digit', year: '2-digit' },
                  )
                : '-'}
            </span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col justify-center">
            <span className="text-xs text-zinc-500 uppercase font-mono flex items-center gap-2">
              <Cloud className="h-3 w-3 text-green-500" /> Cloud Sync
            </span>
            <span className="text-sm font-medium text-green-400 mt-1">
              Conectado (Realtime)
            </span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col justify-center">
            <span className="text-xs text-zinc-500 uppercase font-mono">
              Empresa Ativa
            </span>
            <span className="text-sm font-medium text-blue-300 mt-1 truncate">
              {selectedCompany || 'Selecione...'}
            </span>
          </div>
        </div>

        {/* Metrics Grid Layout */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-200">
            <span className="h-4 w-1 bg-blue-500 rounded-full"></span>
            Dispersão por Parâmetro (LAB vs ANL)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {METRICS.map((metric) => (
              <MetricCard
                key={metric.key}
                title={metric.label}
                metricKey={metric.key}
                color={metric.color}
                unit={metric.unit}
                data={filteredRecords}
              />
            ))}
          </div>
        </div>

        {/* Detailed Data Table with Residues */}
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-200">
            <span className="h-4 w-1 bg-emerald-500 rounded-full"></span>
            Detalhamento de Análises e Resíduos
          </h2>
          <DataManagementTable
            records={filteredRecords}
            readOnly={false}
            onDataChange={fetchData}
          />
        </div>
      </main>
    </div>
  )
}

export default Index
