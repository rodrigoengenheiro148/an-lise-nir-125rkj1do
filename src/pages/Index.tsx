import { useState, useMemo } from 'react'
import {
  LayoutDashboard,
  Filter,
  BarChart2,
  Upload,
  AlertTriangle,
  RefreshCw,
  Inbox,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { ImportDialog } from '@/components/dashboard/ImportDialog'
import { ManagementMenu } from '@/components/dashboard/ManagementMenu'
import { GlobalParetoChart } from '@/components/dashboard/GlobalParetoChart'
import { ControlCharts } from '@/components/dashboard/ControlCharts'
import { PasswordProtectionDialog } from '@/components/dashboard/PasswordProtectionDialog'
import useDashboardStore from '@/stores/useDashboardStore'
import { METRICS, getMaterialDisplayName } from '@/types/dashboard'
import { cn } from '@/lib/utils'
import {
  isWithinInterval,
  startOfDay,
  endOfDay,
  parseISO,
  isValid,
} from 'date-fns'

export default function Index() {
  const {
    companies,
    materials,
    analysisRecords,
    selectedCompanyId,
    selectedMaterial,
    selectedDateRange,
    setSelectedCompanyId,
    setSelectedMaterial,
    isLoading,
    refreshData,
    error,
    isAdminUnlocked,
  } = useDashboardStore()

  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)

  // Memoized filtered data to ensure visual stability and performance
  const filteredData = useMemo(() => {
    if (!analysisRecords) return []

    return analysisRecords.filter((record) => {
      if (!record) return false

      const matchCompany =
        !selectedCompanyId || record.company_id === selectedCompanyId

      // Robust case-insensitive string comparison for material filter
      const matchMaterial =
        !selectedMaterial ||
        selectedMaterial === 'all' ||
        (record.material &&
          record.material.toLowerCase() === selectedMaterial.toLowerCase())

      // Date filter - ensure robust parsing
      let matchDate = true
      if (selectedDateRange.from && record.date) {
        try {
          const recordDate = parseISO(record.date)
          if (isValid(recordDate)) {
            const from = startOfDay(selectedDateRange.from)
            const to = selectedDateRange.to
              ? endOfDay(selectedDateRange.to)
              : endOfDay(selectedDateRange.from)

            matchDate = isWithinInterval(recordDate, { start: from, end: to })
          } else {
            matchDate = false
          }
        } catch (e) {
          matchDate = false
        }
      }

      return matchCompany && matchMaterial && matchDate
    })
  }, [analysisRecords, selectedCompanyId, selectedMaterial, selectedDateRange])

  // Specific filtered data for Pareto chart (ignores material filter)
  const paretoFilteredData = useMemo(() => {
    if (!analysisRecords) return []

    return analysisRecords.filter((record) => {
      if (!record) return false

      const matchCompany =
        !selectedCompanyId || record.company_id === selectedCompanyId

      // Date filter - same logic as above
      let matchDate = true
      if (selectedDateRange.from && record.date) {
        try {
          const recordDate = parseISO(record.date)
          if (isValid(recordDate)) {
            const from = startOfDay(selectedDateRange.from)
            const to = selectedDateRange.to
              ? endOfDay(selectedDateRange.to)
              : endOfDay(selectedDateRange.from)

            matchDate = isWithinInterval(recordDate, { start: from, end: to })
          } else {
            matchDate = false
          }
        } catch (e) {
          matchDate = false
        }
      }

      return matchCompany && matchDate
    })
  }, [analysisRecords, selectedCompanyId, selectedDateRange])

  // Determine which metrics have data to display based on filtered records
  const visibleMetrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return []

    return METRICS.filter((metric) => {
      return filteredData.some((record) => {
        const lab = record[`${metric.key}_lab`]
        const anl = record[`${metric.key}_anl`]
        const nir = record[`${metric.key}_nir`]
        const hasValue = (val: any) =>
          val !== null && val !== undefined && val !== ''

        return hasValue(lab) || hasValue(anl) || hasValue(nir)
      })
    })
  }, [filteredData])

  const handleImportClick = () => {
    if (isAdminUnlocked) {
      setIsImportOpen(true)
    } else {
      setIsPasswordOpen(true)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-3 md:p-6 pb-20">
      <div className="max-w-[1920px] mx-auto space-y-6">
        <header className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div className="w-full xl:w-auto">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 font-display tracking-tight text-white">
              <LayoutDashboard className="h-7 w-7 md:h-8 md:w-8 text-blue-500" />
              Painel de Controle
            </h1>
            <p className="text-zinc-400 text-xs md:text-sm mt-1">
              Monitoramento em tempo real de indicadores de qualidade
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800 w-full md:w-auto">
              <Filter className="h-4 w-4 text-zinc-500 ml-2 shrink-0" />
              <Select
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
              >
                <SelectTrigger className="h-10 md:h-9 bg-transparent border-0 focus:ring-0 w-full md:w-[240px] text-sm">
                  <SelectValue placeholder="Selecione a Empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                      className="min-h-[44px]"
                    >
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800 w-full md:w-auto">
              <BarChart2 className="h-4 w-4 text-zinc-500 ml-2 shrink-0" />
              <Select
                value={selectedMaterial}
                onValueChange={setSelectedMaterial}
              >
                <SelectTrigger className="h-10 md:h-9 bg-transparent border-0 focus:ring-0 w-full md:w-[240px] text-sm">
                  <SelectValue placeholder="Selecione o Produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="all"
                    className="min-h-[44px] font-bold text-blue-400"
                  >
                    Todos os Produtos
                  </SelectItem>
                  {materials.map((m) => (
                    <SelectItem key={m} value={m} className="min-h-[44px]">
                      {getMaterialDisplayName(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex w-full md:w-auto gap-3">
              <Button
                onClick={handleImportClick}
                className="flex-1 md:flex-none h-11 md:h-10 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-900/20"
              >
                <Upload className="h-5 w-5 md:h-4 md:w-4" />
                Importar
              </Button>

              <ManagementMenu
                companies={companies}
                selectedCompanyId={selectedCompanyId}
                onDataChange={refreshData}
                defaultMaterial={
                  selectedMaterial !== 'all' ? selectedMaterial : undefined
                }
              />
            </div>
          </div>
        </header>

        {error && (
          <div className="w-full bg-red-950/20 border border-red-900/50 p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-red-200">
                  Erro de Conexão
                </span>
                <span className="text-sm text-red-300/80">{error}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              className="w-full md:w-auto border-red-900 text-red-300 hover:bg-red-950 hover:text-white gap-2 h-11 md:h-9"
            >
              <RefreshCw
                className={cn('h-4 w-4', isLoading && 'animate-spin')}
              />
              Tentar Novamente
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500 animate-fade-in">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
            <p className="text-sm">Carregando dados...</p>
          </div>
        ) : (
          <>
            {/* Global Pareto Chart */}
            {paretoFilteredData.length > 0 && (
              <div className="animate-fade-in">
                <GlobalParetoChart
                  data={paretoFilteredData}
                  className="border-zinc-800 bg-zinc-950 shadow-lg shadow-black/50"
                />
              </div>
            )}

            {/* Control Charts */}
            <div className="animate-fade-in">
              <ControlCharts />
            </div>

            {/* Industrial High-Density Grid */}
            {visibleMetrics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 auto-rows-fr animate-fade-in">
                {visibleMetrics.map((metric) => (
                  <div key={metric.key} className="h-[320px] min-h-[320px]">
                    <MetricCard
                      title={metric.label}
                      metricKey={metric.key}
                      color={metric.color}
                      unit={metric.unit}
                      data={filteredData}
                      className="h-full shadow-lg shadow-black/50 border-zinc-800/80 bg-zinc-950 hover:border-zinc-700 transition-colors"
                      selectedCompanyId={selectedCompanyId}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500 space-y-4 animate-fade-in">
                <div className="bg-zinc-900/50 p-6 rounded-full border border-zinc-800">
                  <Inbox className="h-10 w-10 opacity-50" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-semibold text-zinc-300">
                    Nenhum dado encontrado
                  </h3>
                  <p className="text-sm text-zinc-400 max-w-sm">
                    Não há registros de análise com métricas válidas para os
                    filtros selecionados.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <PasswordProtectionDialog
        open={isPasswordOpen}
        onOpenChange={setIsPasswordOpen}
        onSuccess={() => setIsImportOpen(true)}
        title="Acesso Restrito"
        description="Esta funcionalidade requer privilégios de administrador."
      />

      <ImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        defaultMaterial={
          selectedMaterial !== 'all' ? selectedMaterial : undefined
        }
        onImportSuccess={() => {
          refreshData()
        }}
      />
    </div>
  )
}
