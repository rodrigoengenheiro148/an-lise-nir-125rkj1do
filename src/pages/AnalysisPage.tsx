import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Save,
  RefreshCw,
} from 'lucide-react'
import { AnalysisRecord, METRICS, MetricKey } from '@/types/dashboard'
import { toast } from 'sonner'
import { calculateStats } from '@/lib/stats'
import { MetricStatsCard } from '@/components/dashboard/MetricStatsCard'
import { MetricScatterChart } from '@/components/dashboard/MetricScatterChart'
import { ResidualChart } from '@/components/dashboard/ResidualChart'
import { MetricHistogram } from '@/components/dashboard/MetricHistogram'
import { storageService } from '@/services/storage'

const AnalysisPage = () => {
  const [dataInput, setDataInput] = useState('')
  const [parsedRecords, setParsedRecords] = useState<AnalysisRecord[]>([])
  const [activeTab, setActiveTab] = useState('input')
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('protein')

  const handleParse = () => {
    if (!dataInput.trim()) {
      toast.error('Por favor, cole os dados do Excel.')
      return
    }

    try {
      const rows = dataInput.trim().split('\n')
      const records: AnalysisRecord[] = []
      const now = new Date()

      // Simple header detection or assume standard format
      // Format assumption: Company | Date | ... (Metric LAB | Metric NIR) pairs

      const headerRow = rows[0].toLowerCase()
      let startIdx = 0
      if (headerRow.includes('empresa') || headerRow.includes('company')) {
        startIdx = 1
      }

      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i]
        if (!row.trim()) continue

        const cols = row.split(/[\t,;]+/).map((s) => s.trim())
        if (cols.length < 3) continue

        const company = cols[0] || 'Unknown'
        const dateRaw = cols[1]
        const date =
          dateRaw && dateRaw.length > 5
            ? dateRaw
            : now.toISOString().split('T')[0]

        const record: any = {
          id: crypto.randomUUID(),
          company,
          date,
        }

        // Try to map metrics sequentially
        let colIdx = 2
        METRICS.forEach((metric) => {
          const lab = parseFloat(cols[colIdx]?.replace(',', '.') || '0')
          const nir = parseFloat(cols[colIdx + 1]?.replace(',', '.') || '0')

          record[`${metric.key}_lab`] = isNaN(lab) ? 0 : lab
          record[`${metric.key}_nir`] = isNaN(nir) ? 0 : nir

          colIdx += 2
        })

        records.push(record)
      }

      if (records.length > 0) {
        setParsedRecords(records)
        setActiveTab('analysis')
        toast.success(`${records.length} registros processados com sucesso!`)
      } else {
        toast.warning('Não foi possível identificar registros válidos.')
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro ao processar dados. Verifique o formato.')
    }
  }

  const handleSave = () => {
    if (parsedRecords.length === 0) return
    storageService.saveRecords(parsedRecords)
    toast.success('Dados salvos no banco de dados com sucesso!')
    // Optionally clear or redirect
    setDataInput('')
    setParsedRecords([])
    setActiveTab('input')
  }

  const statsSummary = useMemo(() => {
    return METRICS.map((metric) => {
      const points = parsedRecords
        .map((r) => ({
          x: Number(r[`${metric.key}_lab`]),
          y: Number(r[`${metric.key}_nir`]),
        }))
        .filter((p) => p.x > 0 && p.y > 0)

      return {
        metric,
        stats: calculateStats(points),
      }
    })
  }, [parsedRecords])

  return (
    <div className="container mx-auto p-6 space-y-6 text-zinc-100 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Importação e Análise Estatística
          </h1>
          <p className="text-zinc-400">
            Cole dados do Excel para gerar relatórios detalhados de performance
            (LAB vs ANL).
          </p>
        </div>
        {parsedRecords.length > 0 && (
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <Save className="h-4 w-4" />
            Salvar Dados
          </Button>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger
            value="input"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
          >
            <FileText className="h-4 w-4 mr-2" /> Dados Brutos
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            disabled={parsedRecords.length === 0}
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" /> Análise Estatística
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader>
              <CardTitle>Área de Transferência</CardTitle>
              <CardDescription className="text-zinc-400">
                Copie as células do Excel e cole abaixo. A ordem esperada das
                colunas é:
                <br />
                <code className="bg-zinc-800 px-1 rounded text-xs">
                  Empresa | Data |{' '}
                  {METRICS.map((m) => `${m.label} LAB | ${m.label} ANL`).join(
                    ' | ',
                  )}
                </code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                className="min-h-[300px] font-mono text-xs bg-black/50 border-zinc-700"
                placeholder="Cole aqui seus dados..."
                value={dataInput}
                onChange={(e) => setDataInput(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={handleParse} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Processar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-8 animate-fade-in">
          {/* Stats Grid */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-zinc-200">
              Resumo Estatístico Global
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {statsSummary.map(({ metric, stats }) => (
                <MetricStatsCard
                  key={metric.key}
                  title={metric.label}
                  stats={stats}
                  color={metric.color}
                />
              ))}
            </div>
          </div>

          {/* Detailed Visual Analysis */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Detalhamento Gráfico
                </h2>
                <p className="text-zinc-400 text-sm">
                  Selecione uma métrica para visualizar os gráficos de
                  dispersão, resíduos e histograma.
                </p>
              </div>
              <div className="flex gap-2">
                {METRICS.slice(0, 5).map((m) => (
                  <Button
                    key={m.key}
                    variant={selectedMetric === m.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedMetric(m.key)}
                    className={`text-xs ${selectedMetric === m.key ? 'bg-zinc-100 text-zinc-900' : 'bg-transparent text-zinc-400 border-zinc-700'}`}
                  >
                    {m.label}
                  </Button>
                ))}
                {/* ... simple pager for metrics could go here */}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 h-[350px]">
                <MetricScatterChart
                  title={`Dispersão: ${METRICS.find((m) => m.key === selectedMetric)?.label}`}
                  data={parsedRecords}
                  metricKey={selectedMetric}
                  color={
                    METRICS.find((m) => m.key === selectedMetric)?.color ||
                    '#fff'
                  }
                  unit={
                    METRICS.find((m) => m.key === selectedMetric)?.unit || ''
                  }
                />
              </div>
              <div className="lg:col-span-1 h-[350px]">
                <ResidualChart
                  data={parsedRecords}
                  metricKey={selectedMetric}
                />
              </div>
              <div className="lg:col-span-1 h-[350px]">
                <MetricHistogram
                  data={parsedRecords}
                  metricKey={selectedMetric}
                />
              </div>
            </div>
          </div>

          {/* Raw Data Preview */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm">
                Prévia dos Dados ({parsedRecords.length} registros)
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Empresa</TableHead>
                    <TableHead className="text-zinc-400">Data</TableHead>
                    {METRICS.slice(0, 5).map((m) => (
                      <TableHead
                        key={m.key}
                        className="text-zinc-400 text-center"
                        colSpan={2}
                      >
                        {m.label}
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    {METRICS.slice(0, 5).map((m) => (
                      <>
                        <TableHead
                          key={`${m.key}-lab`}
                          className="text-zinc-500 text-xs"
                        >
                          LAB
                        </TableHead>
                        <TableHead
                          key={`${m.key}-nir`}
                          className="text-zinc-500 text-xs"
                        >
                          ANL
                        </TableHead>
                      </>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRecords.slice(0, 5).map((row, i) => (
                    <TableRow
                      key={i}
                      className="border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <TableCell className="font-medium text-zinc-300">
                        {row.company}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {row.date}
                      </TableCell>
                      {METRICS.slice(0, 5).map((m) => (
                        <>
                          <TableCell
                            key={`${m.key}-l`}
                            className="text-zinc-400 font-mono"
                          >
                            {row[`${m.key}_lab`]}
                          </TableCell>
                          <TableCell
                            key={`${m.key}-n`}
                            className="text-blue-400 font-mono"
                          >
                            {row[`${m.key}_nir`]}
                          </TableCell>
                        </>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedRecords.length > 5 && (
                <div className="text-center text-xs text-zinc-500 mt-2">
                  ... e mais {parsedRecords.length - 5} registros
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AnalysisPage
