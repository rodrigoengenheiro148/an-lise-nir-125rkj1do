import { useState, useEffect, useCallback } from 'react'
import {
  AnalysisRecord,
  METRICS,
  CompanyEntity,
  getMaterialDisplayName,
  MATERIALS_OPTIONS,
} from '@/types/dashboard'
import { api } from '@/services/api'
import { CompanySelector } from '@/components/dashboard/CompanySelector'
import { MaterialSelector } from '@/components/dashboard/MaterialSelector'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { EditRecordDialog } from '@/components/dashboard/EditRecordDialog'
import { ManagementMenu } from '@/components/dashboard/ManagementMenu'
import { Activity, TrendingUp, Cloud, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useDashboardStore from '@/stores/useDashboardStore'

const Index = () => {
  const {
    selectedCompanyId,
    setSelectedCompanyId,
    selectedMaterial,
    setSelectedMaterial,
    companies: storeCompanies,
    isLoading: isStoreLoading,
    isLoadingMaterials,
    refreshData,
  } = useDashboardStore()

  // Local state for filtered records to avoid storing massive data in context if not needed globally yet
  const [filteredRecords, setFilteredRecords] = useState<AnalysisRecord[]>([])
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false)

  // Fetch filtered records when Company or Material changes
  const fetchRecords = useCallback(async () => {
    if (!selectedCompanyId) {
      setFilteredRecords([])
      return
    }

    setIsLoadingRecords(true)

    try {
      const records = await api.getCompanyRecords(
        selectedCompanyId,
        selectedMaterial,
      )
      setFilteredRecords(records)
    } catch (error) {
      console.error(error)
      setFilteredRecords([])
    } finally {
      setIsLoadingRecords(false)
    }
  }, [selectedCompanyId, selectedMaterial])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const handleCompanyAdded = (newCompany: any) => {
    // Refresh store data to include new company
    refreshData()
    setSelectedCompanyId(newCompany.id)
  }

  // Refresh data when changes occur
  const handleDataChange = useCallback(async () => {
    fetchRecords()
    // Also trigger a refresh of store data if needed, but fetchRecords handles the view
  }, [fetchRecords])

  if (isStoreLoading && storeCompanies.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh] bg-zinc-950 text-zinc-100">
        <div className="animate-pulse flex flex-col items-center">
          <Activity className="h-10 w-10 text-blue-500 mb-4" />
          <span className="text-lg font-medium">Carregando Dados...</span>
        </div>
      </div>
    )
  }

  // Convert store companies to CompanyEntity type expected by selector
  const companiesForSelector: CompanyEntity[] = storeCompanies.map((c) => ({
    id: c.id,
    name: c.name,
    created_at: new Date().toISOString(), // Placeholder as store types might differ slightly
  }))

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
                  selectedCompanyId={selectedCompanyId}
                  companies={companiesForSelector}
                  onSelect={(id) => {
                    setSelectedCompanyId(id)
                  }}
                  onCompanyAdded={handleCompanyAdded}
                  isLoading={isStoreLoading}
                />
              </div>
              <div className="w-full sm:w-[250px]">
                <MaterialSelector
                  selectedMaterial={selectedMaterial}
                  materials={MATERIALS_OPTIONS}
                  onSelect={setSelectedMaterial}
                  isLoading={isLoadingMaterials}
                  disabled={!selectedCompanyId}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ManagementMenu
                selectedCompanyId={selectedCompanyId}
                companies={companiesForSelector}
                onDataChange={handleDataChange}
                defaultMaterial={selectedMaterial}
              />

              <Button
                onClick={() => setIsAddRecordOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                disabled={!selectedCompanyId}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Adicionar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              <Cloud className="h-3 w-3 text-zinc-500" /> Status
            </span>
            <span className="text-sm font-medium text-zinc-300 mt-1">
              Modo Clássico (No Sync)
            </span>
          </div>
        </div>

        {isLoadingRecords ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse flex flex-col items-center">
              <Activity className="h-8 w-8 text-blue-500 mb-4 animate-spin" />
              <span className="text-sm text-zinc-400">Carregando dados...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-200">
                <span className="h-4 w-1 bg-blue-500 rounded-full"></span>
                Dispersão por Parâmetro (LAB vs ANL)
                {selectedMaterial && (
                  <span className="text-sm font-normal text-zinc-500 ml-2">
                    - {getMaterialDisplayName(selectedMaterial)}
                  </span>
                )}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {METRICS.map((metric) => (
                <MetricCard
                  key={metric.key}
                  title={metric.label}
                  metricKey={metric.key}
                  color={metric.color}
                  unit={metric.unit}
                  data={filteredRecords}
                  selectedCompanyId={selectedCompanyId}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <EditRecordDialog
        open={isAddRecordOpen}
        onOpenChange={setIsAddRecordOpen}
        record={null}
        mode="add"
        onSuccess={handleDataChange}
        defaultCompanyId={selectedCompanyId}
        defaultMaterial={selectedMaterial}
      />
    </div>
  )
}

export default Index
