import { useState, useEffect } from 'react'
import {
  Company,
  AnalysisRecord,
  COMPANIES,
  METRICS,
  MetricKey,
} from '@/types/dashboard'
import { storageService } from '@/services/storage'
import { CompanySelector } from '@/components/dashboard/CompanySelector'
import { ImportDialog } from '@/components/dashboard/ImportDialog'
import { MetricScatterChart } from '@/components/dashboard/MetricScatterChart'
import { MetricHistogram } from '@/components/dashboard/MetricHistogram'
import { ResidualChart } from '@/components/dashboard/ResidualChart'
import { Button } from '@/components/ui/button'
import { Save, Activity, Database, TrendingUp, Cloud } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const Index = () => {
  const [selectedCompany, setSelectedCompany] = useState<Company>(COMPANIES[0])
  const [allRecords, setAllRecords] = useState<AnalysisRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AnalysisRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [detailedMetric, setDetailedMetric] = useState<MetricKey>('protein')

  // Load data on mount
  useEffect(() => {
    const data = storageService.getRecords()
    setAllRecords(data)
    setLoading(false)
  }, [])

  // Filter when company or records change
  useEffect(() => {
    const filtered = allRecords.filter((r) => r.company === selectedCompany)
    // Sort by date ascending
    filtered.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    setFilteredRecords(filtered)
  }, [selectedCompany, allRecords])

  const handleImport = (newRecords: AnalysisRecord[]) => {
    const updated = storageService.saveRecords(newRecords)
    setAllRecords(updated)
  }

  const handleReset = () => {
    if (
      confirm(
        'Tem certeza que deseja limpar todos os dados e restaurar os dados de exemplo?',
      )
    ) {
      storageService.clearData()
      const data = storageService.getRecords()
      setAllRecords(data)
      toast.success('Dados resetados com sucesso.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-100">
        <div className="animate-pulse flex flex-col items-center">
          <Activity className="h-10 w-10 text-blue-500 mb-4" />
          <span className="text-lg font-medium">Carregando Análise NIR...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 selection:bg-blue-500/30">
      {/* Header Section */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/30 rounded-lg border border-blue-500/20">
              <TrendingUp className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Análise NIR
              </h1>
              <p className="text-xs text-zinc-400">
                Monitoramento Laboratorial e Espectral
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="text-zinc-950 dark">
              <CompanySelector
                selected={selectedCompany}
                onSelect={setSelectedCompany}
              />
            </div>
            <div className="flex items-center gap-2">
              <ImportDialog onImport={handleImport} />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                title="Resetar Dados"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col">
            <span className="text-xs text-zinc-500 uppercase font-mono">
              Amostras (Empresa)
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
              Última Análise
            </span>
            <span className="text-lg font-medium text-white">
              {filteredRecords[filteredRecords.length - 1]?.date || '-'}
            </span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col justify-center">
            <span className="text-xs text-zinc-500 uppercase font-mono flex items-center gap-2">
              <Cloud className="h-3 w-3" /> Status Cloud
            </span>
            <span className="text-sm font-medium text-green-400 mt-1">
              Sincronizado (Simulated)
            </span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col justify-center">
            <span className="text-xs text-zinc-500 uppercase font-mono">
              Empresa Ativa
            </span>
            <span className="text-sm font-medium text-blue-300 mt-1 truncate">
              {selectedCompany}
            </span>
          </div>
        </div>

        {/* Charts Grid - All Metrics */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-200">
            <span className="h-4 w-1 bg-blue-500 rounded-full"></span>
            Comparativo Geral: LAB vs ANL
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {METRICS.map((metric) => (
              <div key={metric.key} className="h-[300px]">
                <MetricScatterChart
                  title={metric.label}
                  data={filteredRecords}
                  metricKey={metric.key}
                  color={metric.color}
                  unit={metric.unit}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Analysis Section */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2 text-white">
                <span className="bg-blue-600 h-6 w-1 rounded-full block"></span>
                Análise Estatística Detalhada
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                Distribuição de frequência e análise de resíduos (LAB - ANL)
              </p>
            </div>
            <div className="w-[240px] text-zinc-950">
              <Select
                value={detailedMetric}
                onValueChange={(v) => setDetailedMetric(v as MetricKey)}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  <SelectValue placeholder="Selecione a métrica" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                  {METRICS.map((m) => (
                    <SelectItem
                      key={m.key}
                      value={m.key}
                      className="focus:bg-zinc-800 focus:text-zinc-100"
                    >
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricHistogram
              data={filteredRecords}
              metricKey={detailedMetric}
            />
            <ResidualChart data={filteredRecords} metricKey={detailedMetric} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default Index
