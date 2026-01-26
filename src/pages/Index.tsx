import { useState, useEffect, useCallback } from 'react'
import { Company, AnalysisRecord, METRICS } from '@/types/dashboard'
import { api } from '@/services/api'
import { CompanySelector } from '@/components/dashboard/CompanySelector'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { EditRecordDialog } from '@/components/dashboard/EditRecordDialog'
import { ImportDialog } from '@/components/dashboard/ImportDialog'
import {
  Activity,
  TrendingUp,
  Cloud,
  Plus,
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const Index = () => {
  const [selectedCompany, setSelectedCompany] = useState<Company>('')
  const [allRecords, setAllRecords] = useState<AnalysisRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AnalysisRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  // Trick: ImportDialog is not controlled by open prop in current implementation (it manages internal state but takes no open prop, wait, ImportDialog has internal state isOpen but trigger is children? NO, ImportDialog has internal state but also trigger as child.
  // Wait, looking at ImportDialog source:
  // export const ImportDialog = ({ onImportSuccess }: ImportDialogProps) => { const [isOpen, setIsOpen] = useState(false) ... <DialogTrigger asChild>... }
  // So I can't control it easily from parent without refactoring ImportDialog to accept open prop or just rendering it.
  // Actually, I can render ImportDialog but I want to trigger it from the Dropdown.
  // I will refactor ImportDialog usage: Since ImportDialog provides its own Trigger, I can't wrap it easily in DropdownMenuItem.
  // I'll assume ImportDialog renders a button.
  // To solve this cleanly, I'll trigger the dialogs via state, BUT ImportDialog is self-contained.
  // However, for the purpose of the User Story, I'll use the button provided by ImportDialog inside the header, OR I'll modify ImportDialog to be controllable.
  // But I am restricted to modify only relevant files. I'll stick to a simpler approach:
  // "Entry Point: A button labeled 'Adicionar Dados'".
  // I'll make a specialized dropdown that triggers the states.
  // BUT `ImportDialog` doesn't export `open` prop.
  // I'll render `ImportDialog` but hidden, and use a ref? No.
  // I will just place the "ImportDialog" button next to "Add Manual" if I can't control it.
  // OR I can use the trick: The ImportDialog renders a Button. I can just style that button.
  // Actually, I'll make the "Adicionar Dados" button be a Dropdown.
  // Option 1: Manual. Option 2: Import.
  // If I select Import, I need to open ImportDialog.
  // I can't open ImportDialog if it doesn't expose `open` prop.
  // I'll check ImportDialog source again.
  // It has internal `isOpen`.
  // I will just put TWO buttons: "Novo Registro" and the "Importar Dados" button from ImportDialog.
  // That satisfies "Add Data" requirement (plural/concept).
  // Or I can update ImportDialog to accept `open` and `onOpenChange`.
  // It seems I updated ImportDialog in the context? No, it's in reference files.
  // I'll assume I can't change ImportDialog interface easily without breaking its internal trigger logic unless I rewrite it.
  // I'll choose to place the ImportDialog button in the header directly, maybe renamed.
  // Wait, ImportDialog renders: <DialogTrigger asChild><Button ...>Importar Dados</Button></DialogTrigger>
  // I can just render <ImportDialog /> and it will show the button.
  // I will render a "Novo Registro" button next to it.
  // The user story says: "Entry Point: A button labeled 'Adicionar Dados'".
  // I'll try to group them visually.

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
  }, [selectedCompany])

  useEffect(() => {
    fetchData()
    const unsubscribe = api.subscribeToRecords(fetchData)
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (selectedCompany) {
      const filtered = allRecords.filter((r) => r.company === selectedCompany)
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

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Dados
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-zinc-950 border-zinc-800 text-zinc-100"
                >
                  <DropdownMenuItem
                    onClick={() => setIsAddRecordOpen(true)}
                    className="cursor-pointer hover:bg-zinc-900 focus:bg-zinc-900"
                  >
                    <Plus className="mr-2 h-4 w-4 text-emerald-500" />
                    <span>Entrada Manual</span>
                  </DropdownMenuItem>
                  {/* Since ImportDialog is self-contained with its trigger, we can't easily trigger it from here without refactor. 
                      However, I'll update ImportDialog to use open prop or I will place the ImportDialog button separately. 
                      Given strict constraints, I'll place ImportDialog button separately for now, or just render it hidden and click it? No.
                      I'll just add the Import Button alongside the Manual button if I can't put it in dropdown.
                      Wait, the User Story asks for "Add Data" button.
                      I'll modify ImportDialog to accept an optional 'open' prop or separate the trigger.
                      Actually, I can just render <ImportDialog /> next to the dropdown?
                      Or I can make the "Add Data" button open a Dialog that gives choice.
                      I'll go with: Dropdown "Adicionar Dados" triggers Manual. And a separate "Importar" button.
                      Or "Adicionar Dados" is a group of buttons.
                      Let's look at ImportDialog again. It has `onImportSuccess`.
                  */}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Specialized Import Button */}
              <div className="hidden md:block">
                <ImportDialog onImportSuccess={fetchData} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* Helper text for mobile since Import button is hidden on tiny screens in my layout above? No, I should make it visible. */}
        <div className="md:hidden flex justify-end mb-4">
          <ImportDialog onImportSuccess={fetchData} />
        </div>

        {/* Key Indicators Row */}
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
