import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Company,
  AnalysisRecord,
  METRICS,
  CompanyEntity,
} from '@/types/dashboard'
import { api } from '@/services/api'
import { CompanySelector } from '@/components/dashboard/CompanySelector'
import { MaterialSelector } from '@/components/dashboard/MaterialSelector'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { EditRecordDialog } from '@/components/dashboard/EditRecordDialog'
import { ManagementMenu } from '@/components/dashboard/ManagementMenu'
import { Activity, TrendingUp, Cloud, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const Index = () => {
  const [selectedCompany, setSelectedCompany] = useState<Company>('')
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [companies, setCompanies] = useState<CompanyEntity[]>([])
  const [allRecords, setAllRecords] = useState<AnalysisRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AnalysisRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [records, comps] = await Promise.all([
        api.getRecords(),
        api.getCompanies(),
      ])
      setAllRecords(records)
      setCompanies(comps)

      if (
        comps.length > 0 &&
        (!selectedCompany || !comps.find((c) => c.name === selectedCompany))
      ) {
        setSelectedCompany(comps[0].name)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [selectedCompany])

  useEffect(() => {
    fetchData()
    const unsubscribe = api.subscribeToRecords(fetchData)
    return () => unsubscribe()
  }, [])

  const availableMaterials = useMemo(() => {
    if (!selectedCompany) return []
    const companyRecords = allRecords.filter(
      (r) => r.company === selectedCompany,
    )
    return Array.from(
      new Set(
        companyRecords.map((r) => r.material).filter(Boolean) as string[],
      ),
    ).sort()
  }, [selectedCompany, allRecords])

  useEffect(() => {
    if (availableMaterials.length > 0) {
      if (!selectedMaterial || !availableMaterials.includes(selectedMaterial)) {
        setSelectedMaterial(availableMaterials[0])
      }
    } else {
      setSelectedMaterial('')
    }
  }, [availableMaterials, selectedMaterial])

  useEffect(() => {
    if (selectedCompany) {
      let filtered = allRecords.filter((r) => r.company === selectedCompany)

      if (selectedMaterial) {
        filtered = filtered.filter((r) => r.material === selectedMaterial)
      } else {
        filtered = []
      }

      setFilteredRecords(filtered)
    } else {
      setFilteredRecords([])
    }
  }, [selectedCompany, selectedMaterial, allRecords, availableMaterials])

  const selectedCompanyId = companies.find(
    (c) => c.name === selectedCompany,
  )?.id

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

          <div className="flex flex-col xl:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto text-zinc-950">
              <div className="w-full sm:w-[250px]">
                <CompanySelector
                  selected={selectedCompany}
                  onSelect={setSelectedCompany}
                />
              </div>
              <div className="w-full sm:w-[250px]">
                <MaterialSelector
                  selected={selectedMaterial}
                  onSelect={setSelectedMaterial}
                  materials={availableMaterials}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ManagementMenu
                selectedCompanyId={selectedCompanyId}
                companies={companies}
                onDataChange={fetchData}
              />

              <Button
                onClick={() => setIsAddRecordOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Adicionar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col">
            <span className="text-xs text-zinc-500 uppercase font-mono">
              Amostras (Total)
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
      </main>

      <EditRecordDialog
        open={isAddRecordOpen}
        onOpenChange={setIsAddRecordOpen}
        record={null}
        mode="add"
        onSuccess={fetchData}
      />
    </div>
  )
}

export default Index
