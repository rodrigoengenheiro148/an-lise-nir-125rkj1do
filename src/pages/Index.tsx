import { useState, useEffect } from 'react'
import { Company, AnalysisRecord, COMPANIES, METRICS } from '@/types/dashboard'
import { storageService } from '@/services/storage'
import { CompanySelector } from '@/components/dashboard/CompanySelector'
import { ImportDialog } from '@/components/dashboard/ImportDialog'
import { MetricScatterChart } from '@/components/dashboard/MetricScatterChart'
import { MetricHistogram } from '@/components/dashboard/MetricHistogram'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Save } from 'lucide-react'
import { toast } from 'sonner'

const Index = () => {
  const [selectedCompany, setSelectedCompany] = useState<Company>(COMPANIES[0])
  const [allRecords, setAllRecords] = useState<AnalysisRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AnalysisRecord[]>([])
  const [loading, setLoading] = useState(true)

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
      <div className="flex items-center justify-center h-screen">
        Carregando dashboard...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header Section */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Análise Agrícola
              </h1>
              <p className="text-xs text-muted-foreground">
                Dashboard de Controle de Qualidade
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <CompanySelector
              selected={selectedCompany}
              onSelect={setSelectedCompany}
            />
            <div className="flex items-center gap-2">
              <ImportDialog onImport={handleImport} />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                title="Resetar Dados"
              >
                <Save className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* KPI Summary - Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Just showing a count for context */}
          <div className="bg-card border rounded-lg p-4 shadow-sm flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground uppercase">
              Registros
            </span>
            <span className="text-2xl font-bold">{filteredRecords.length}</span>
          </div>
          <div className="bg-card border rounded-lg p-4 shadow-sm flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground uppercase">
              Última Atualização
            </span>
            <span className="text-sm font-medium">
              {filteredRecords[filteredRecords.length - 1]?.date || '-'}
            </span>
          </div>
        </div>

        {/* Charts Grid - 10 Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {METRICS.map((metric) => (
            <div key={metric.key} className="h-[280px]">
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

        {/* Detailed Analysis Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <span className="bg-primary h-6 w-1 rounded-full block"></span>
            Análise Estatística Detalhada
          </h2>
          <MetricHistogram data={filteredRecords} />
        </div>
      </main>
    </div>
  )
}

export default Index
