import { useState, useEffect } from 'react'
import { Company, AnalysisRecord, METRICS } from '@/types/dashboard'
import { api } from '@/services/api'
import { CompanySelector } from '@/components/dashboard/CompanySelector'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Button } from '@/components/ui/button'
import { Activity, TrendingUp, Cloud, Table as TableIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

const Index = () => {
  const [selectedCompany, setSelectedCompany] = useState<Company>('')
  const [allRecords, setAllRecords] = useState<AnalysisRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AnalysisRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
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
    }

    fetchData()

    // Subscribe to realtime changes
    const unsubscribe = api.subscribeToRecords(fetchData)

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (selectedCompany) {
      const filtered = allRecords.filter((r) => r.company === selectedCompany)
      // Sort by date descending for list/summary, but charts handle their own sorting if needed
      // (MetricEvolutionChart reverses it for display)
      filtered.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      setFilteredRecords(filtered)
    }
  }, [selectedCompany, allRecords])

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
            <Link to="/management">
              <Button
                variant="outline"
                size="sm"
                className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-700"
              >
                <TableIcon className="mr-2 h-4 w-4" />
                Gerenciar Dados
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* Key Indicators Row */}
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
              {filteredRecords[0]?.date
                ? new Date(filteredRecords[0].date).toLocaleDateString('pt-BR')
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
            Evolução por Parâmetro
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {/* Special placement for Acidity if desired, but mapping preserves order in constants */}
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
    </div>
  )
}

export default Index
