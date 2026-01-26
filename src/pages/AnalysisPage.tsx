import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BarChart3, Loader2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MetricScatterChart } from '@/components/dashboard/MetricScatterChart'
import { MetricDistributionHistogram } from '@/components/dashboard/MetricDistributionHistogram'
import { ResidualHistogram } from '@/components/dashboard/ResidualHistogram'
import useDashboardStore from '@/stores/useDashboardStore'
import { METRICS } from '@/types/dashboard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AnalysisPage() {
  const { analysisRecords, isLoading, companies } = useDashboardStore()
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all')
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('scatter')

  const uniqueMaterials = useMemo(() => {
    return Array.from(
      new Set(analysisRecords.map((r) => r.material).filter(Boolean)),
    ).sort()
  }, [analysisRecords])

  const filteredRecords = useMemo(() => {
    return analysisRecords.filter((record) => {
      const matchCompany =
        selectedCompanyId === 'all' ||
        record.company ===
          companies.find((c) => c.id === selectedCompanyId)?.name ||
        record.company_id === selectedCompanyId
      const matchMaterial =
        selectedMaterial === 'all' || record.material === selectedMaterial
      return matchCompany && matchMaterial
    })
  }, [analysisRecords, selectedCompanyId, selectedMaterial, companies])

  const isResidueAnalysis = selectedMaterial === 'Resíduo'

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 pb-20">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white hover:bg-zinc-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2 font-display">
                <BarChart3 className="h-6 w-6 text-blue-500" />
                Análise Avançada
              </h1>
              <p className="text-zinc-400 text-sm">
                Comparação LAB vs ANL e Distribuição de Resíduos
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-zinc-500" />
              <div className="w-[200px]">
                <Select
                  value={selectedCompanyId}
                  onValueChange={setSelectedCompanyId}
                >
                  <SelectTrigger className="h-8 bg-zinc-950 border-zinc-800 text-xs">
                    <SelectValue placeholder="Todas as Empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Empresas</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="w-full sm:w-[200px]">
              <Select
                value={selectedMaterial}
                onValueChange={setSelectedMaterial}
              >
                <SelectTrigger className="h-8 bg-zinc-950 border-zinc-800 text-xs">
                  <SelectValue placeholder="Todos os Materiais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Materiais</SelectItem>
                  {uniqueMaterials.map((m) => (
                    <SelectItem key={m as string} value={m as string}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="bg-zinc-900 border border-zinc-800">
              <TabsTrigger value="scatter">
                {isResidueAnalysis
                  ? 'Distribuição (LAB vs ANL)'
                  : 'Correlação (LAB vs ANL)'}
              </TabsTrigger>
              <TabsTrigger value="residual">Histograma de Resíduos</TabsTrigger>
            </TabsList>

            <TabsContent value="scatter" className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-200">
                  {isResidueAnalysis
                    ? 'Distribuição de Frequência'
                    : 'Correlação LAB vs ANL'}
                </h2>
                <span className="text-xs text-zinc-500">
                  {filteredRecords.length} amostras filtradas
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {METRICS.map((metric) =>
                  isResidueAnalysis ? (
                    <MetricDistributionHistogram
                      key={metric.key}
                      title={metric.label}
                      data={filteredRecords}
                      metricKey={metric.key}
                      color={metric.color}
                      unit={metric.unit}
                    />
                  ) : (
                    <MetricScatterChart
                      key={metric.key}
                      title={metric.label.toUpperCase()}
                      data={filteredRecords}
                      metricKey={metric.key}
                      color={metric.color}
                      unit={metric.unit}
                    />
                  ),
                )}
              </div>
            </TabsContent>

            <TabsContent value="residual" className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-200">
                  Distribuição de Resíduos (Erro de Predição)
                </h2>
                <span className="text-xs text-zinc-500">
                  {filteredRecords.length} amostras filtradas
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {METRICS.map((metric) => (
                  <ResidualHistogram
                    key={metric.key}
                    data={filteredRecords}
                    metricKey={metric.key}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
