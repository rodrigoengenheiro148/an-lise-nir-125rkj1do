import { useState, useMemo } from 'react'
import {
  LayoutDashboard,
  Filter,
  BarChart2,
  Upload,
  AlertTriangle,
  RefreshCw,
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
import useDashboardStore from '@/stores/useDashboardStore'
import { METRICS, MATERIALS_OPTIONS } from '@/types/dashboard'
import { cn } from '@/lib/utils'
import { isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns'

export default function Index() {
  const {
    companies,
    analysisRecords,
    selectedCompanyId,
    selectedMaterial,
    selectedDateRange,
    setSelectedCompanyId,
    setSelectedMaterial,
    isLoading,
    refreshData,
    error,
  } = useDashboardStore()

  const [isImportOpen, setIsImportOpen] = useState(false)

  // Memoized filtered data to ensure visual stability and performance
  const filteredData = useMemo(() => {
    return analysisRecords.filter((record) => {
      const matchCompany =
        !selectedCompanyId || record.company_id === selectedCompanyId

      // Robust case-insensitive string comparison for material filter
      const matchMaterial =
        !selectedMaterial ||
        (record.material &&
          record.material.toLowerCase() === selectedMaterial.toLowerCase())

      // Date filter
      let matchDate = true
      if (selectedDateRange.from && record.date) {
        const recordDate = parseISO(record.date)
        const from = startOfDay(selectedDateRange.from)
        const to = selectedDateRange.to
          ? endOfDay(selectedDateRange.to)
          : endOfDay(selectedDateRange.from)

        matchDate = isWithinInterval(recordDate, { start: from, end: to })
      }

      return matchCompany && matchMaterial && matchDate
    })
  }, [analysisRecords, selectedCompanyId, selectedMaterial, selectedDateRange])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6 pb-20">
      <div className="max-w-[1920px] mx-auto space-y-6">
        <header className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 font-display tracking-tight text-white">
              <LayoutDashboard className="h-8 w-8 text-blue-500" />
              Painel de Controle
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Monitoramento em tempo real de indicadores de qualidade
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800 w-full md:w-auto">
              <Filter className="h-4 w-4 text-zinc-500 ml-2" />
              <Select
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
              >
                <SelectTrigger className="h-9 bg-transparent border-0 focus:ring-0 w-full md:w-[240px] text-sm">
                  <SelectValue placeholder="Selecione a Empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800 w-full md:w-auto">
              <BarChart2 className="h-4 w-4 text-zinc-500 ml-2" />
              <Select
                value={selectedMaterial}
                onValueChange={setSelectedMaterial}
              >
                <SelectTrigger className="h-9 bg-transparent border-0 focus:ring-0 w-full md:w-[240px] text-sm">
                  <SelectValue placeholder="Selecione o Material" />
                </SelectTrigger>
                <SelectContent>
                  {MATERIALS_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => setIsImportOpen(true)}
              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-900/20"
            >
              <Upload className="h-4 w-4" />
              Importar
            </Button>

            <ManagementMenu
              companies={companies}
              selectedCompanyId={selectedCompanyId}
              onDataChange={refreshData}
              defaultMaterial={selectedMaterial}
            />
          </div>
        </header>

        {error && (
          <div className="w-full bg-red-950/20 border border-red-900/50 p-4 rounded-lg flex items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
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
              className="border-red-900 text-red-300 hover:bg-red-950 hover:text-white gap-2"
            >
              <RefreshCw
                className={cn('h-4 w-4', isLoading && 'animate-spin')}
              />
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Industrial High-Density Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 auto-rows-fr">
          {METRICS.map((metric) => (
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
      </div>

      <ImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        defaultMaterial={selectedMaterial}
        onImportSuccess={() => {
          // Data refresh is handled by Realtime subscription in Store
          refreshData()
        }}
      />
    </div>
  )
}
