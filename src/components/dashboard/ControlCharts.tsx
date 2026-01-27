import { useState, useMemo, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import {
  Activity,
  ArrowUpRight,
  TrendingUp,
  Settings2,
  AlertCircle,
} from 'lucide-react'
import useDashboardStore from '@/stores/useDashboardStore'
import {
  METRICS,
  MATERIALS_OPTIONS,
  getMaterialDisplayName,
} from '@/types/dashboard'
import { calculateControlChartStats } from '@/lib/control-chart-utils'
import { cn } from '@/lib/utils'

export const ControlCharts = () => {
  const {
    analysisRecords,
    selectedMaterial: globalMaterial,
    companies,
  } = useDashboardStore()

  // Local state for filters
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [selectedMetric, setSelectedMetric] = useState<string>('protein')
  const [subgroupSize, setSubgroupSize] = useState<string>('5')

  // Visibility toggles
  const [showPoints, setShowPoints] = useState(true)
  const [showMean, setShowMean] = useState(true)
  const [showLimits, setShowLimits] = useState(true)

  // Sync with global material initially
  useEffect(() => {
    if (globalMaterial) {
      setSelectedMaterial(globalMaterial)
    } else if (MATERIALS_OPTIONS.length > 0 && !selectedMaterial) {
      setSelectedMaterial(MATERIALS_OPTIONS[0])
    }
  }, [globalMaterial])

  // Get filtered records for the selected material
  const filteredRecords = useMemo(() => {
    if (!analysisRecords) return []
    return analysisRecords.filter(
      (r) =>
        r.material &&
        selectedMaterial &&
        r.material.toLowerCase() === selectedMaterial.toLowerCase(),
    )
  }, [analysisRecords, selectedMaterial])

  // Calculate statistics
  const stats = useMemo(() => {
    return calculateControlChartStats(
      filteredRecords,
      selectedMetric,
      parseInt(subgroupSize),
    )
  }, [filteredRecords, selectedMetric, subgroupSize])

  const metricConfig = METRICS.find((m) => m.key === selectedMetric)
  const metricColor = metricConfig?.color || '#3b82f6'

  const chartConfig = {
    value: {
      label: 'Valor',
      color: metricColor,
    },
    mean: {
      label: 'Média',
      color: '#10b981', // green-500
    },
    ucl: {
      label: 'LSC',
      color: '#ef4444', // red-500
    },
    lcl: {
      label: 'LIC',
      color: '#ef4444', // red-500
    },
    range: {
      label: 'Amplitude',
      color: '#3b82f6', // blue-500
    },
  }

  // Common XAxis props
  const xAxisProps = {
    dataKey: 'label',
    tickLine: false,
    axisLine: false,
    tickMargin: 8,
    tick: { fill: '#71717a', fontSize: 10 },
    interval: 'preserveStartEnd' as const,
  }

  // Common YAxis props
  const yAxisProps = {
    tickLine: false,
    axisLine: false,
    tick: { fill: '#71717a', fontSize: 10 },
    width: 40,
  }

  if (!stats) {
    return (
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <CardTitle>Cartas de Controle</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="h-[400px] flex flex-col items-center justify-center text-zinc-500 gap-4">
          <AlertCircle className="h-10 w-10 opacity-50" />
          <p>
            Dados insuficientes para gerar as cartas de controle com os filtros
            selecionados.
          </p>
          <div className="flex gap-2">
            <Select
              value={selectedMaterial}
              onValueChange={setSelectedMaterial}
            >
              <SelectTrigger className="w-[200px] bg-zinc-900 border-zinc-700">
                <SelectValue placeholder="Selecione Material" />
              </SelectTrigger>
              <SelectContent>
                {MATERIALS_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {getMaterialDisplayName(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-[200px] bg-zinc-900 border-zinc-700">
                <SelectValue placeholder="Selecione Métrica" />
              </SelectTrigger>
              <SelectContent>
                {METRICS.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-zinc-800 bg-zinc-950 shadow-lg shadow-black/50">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-zinc-100">
              <Activity className="h-6 w-6 text-blue-500" />
              Cartas de Controle Estatístico
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Monitoramento de estabilidade (X-Barra e Amplitude) para{' '}
              <span className="text-zinc-100 font-medium">
                {getMaterialDisplayName(selectedMaterial)}
              </span>
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
              <Select
                value={selectedMaterial}
                onValueChange={setSelectedMaterial}
              >
                <SelectTrigger className="h-8 w-[160px] bg-transparent border-0 text-xs focus:ring-0">
                  <SelectValue placeholder="Material" />
                </SelectTrigger>
                <SelectContent>
                  {MATERIALS_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {getMaterialDisplayName(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="h-8 w-[140px] bg-transparent border-0 text-xs focus:ring-0">
                  <SelectValue placeholder="Parâmetro" />
                </SelectTrigger>
                <SelectContent>
                  {METRICS.map((m) => (
                    <SelectItem key={m.key} value={m.key}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
              <Settings2 className="h-3 w-3 text-zinc-500 ml-2" />
              <Select value={subgroupSize} onValueChange={setSubgroupSize}>
                <SelectTrigger className="h-8 w-[120px] bg-transparent border-0 text-xs focus:ring-0">
                  <SelectValue placeholder="Subgrupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Agrupar: 3</SelectItem>
                  <SelectItem value="5">Agrupar: 5</SelectItem>
                  <SelectItem value="7">Agrupar: 7</SelectItem>
                  <SelectItem value="10">Agrupar: 10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-2 pt-2 border-t border-zinc-900">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-points"
              checked={showPoints}
              onCheckedChange={(c) => setShowPoints(!!c)}
              className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <Label
              htmlFor="show-points"
              className="text-xs text-zinc-400 cursor-pointer"
            >
              Dados
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-mean"
              checked={showMean}
              onCheckedChange={(c) => setShowMean(!!c)}
              className="border-zinc-700 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
            />
            <Label
              htmlFor="show-mean"
              className="text-xs text-zinc-400 cursor-pointer"
            >
              Média (CL)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-limits"
              checked={showLimits}
              onCheckedChange={(c) => setShowLimits(!!c)}
              className="border-zinc-700 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
            />
            <Label
              htmlFor="show-limits"
              className="text-xs text-zinc-400 cursor-pointer"
            >
              Limites (LSC/LIC)
            </Label>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6">
        {/* X-Bar Chart */}
        <div className="h-[280px] w-full bg-black/20 rounded-lg p-2 border border-zinc-900">
          <div className="flex items-center justify-between mb-2 px-2">
            <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Carta de Médias (X-Barra)
            </h4>
            <div className="flex gap-4 text-xs font-mono">
              <span className="text-emerald-500">
                Média: {stats.xBar.mean.toFixed(2)}
              </span>
              <span className="text-red-400">
                LSC: {stats.xBar.ucl.toFixed(2)}
              </span>
              <span className="text-red-400">
                LIC: {stats.xBar.lcl.toFixed(2)}
              </span>
            </div>
          </div>
          <ChartContainer config={chartConfig} className="h-[240px] w-full">
            <ComposedChart
              data={stats.xBar.data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#333"
              />
              <XAxis {...xAxisProps} />
              <YAxis
                {...yAxisProps}
                domain={[
                  (dataMin: number) => Math.min(dataMin, stats.xBar.lcl) - 0.5,
                  (dataMax: number) => Math.max(dataMax, stats.xBar.ucl) + 0.5,
                ]}
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              {showLimits && (
                <>
                  <ReferenceLine
                    y={stats.xBar.ucl}
                    stroke="var(--color-ucl)"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                  />
                  <ReferenceLine
                    y={stats.xBar.lcl}
                    stroke="var(--color-lcl)"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                  />
                </>
              )}
              {showMean && (
                <ReferenceLine
                  y={stats.xBar.mean}
                  stroke="var(--color-mean)"
                  strokeDasharray="10 5" // Dash-dot
                  strokeWidth={1.5}
                />
              )}
              {showPoints && (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--color-value)', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              )}
            </ComposedChart>
          </ChartContainer>
        </div>

        {/* R Chart */}
        <div className="h-[280px] w-full bg-black/20 rounded-lg p-2 border border-zinc-900">
          <div className="flex items-center justify-between mb-2 px-2">
            <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-blue-500" />
              Carta de Amplitudes (R)
            </h4>
            <div className="flex gap-4 text-xs font-mono">
              <span className="text-emerald-500">
                Média: {stats.rChart.mean.toFixed(2)}
              </span>
              <span className="text-red-400">
                LSC: {stats.rChart.ucl.toFixed(2)}
              </span>
              <span className="text-red-400">
                LIC: {stats.rChart.lcl.toFixed(2)}
              </span>
            </div>
          </div>
          <ChartContainer config={chartConfig} className="h-[240px] w-full">
            <ComposedChart
              data={stats.rChart.data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#333"
              />
              <XAxis {...xAxisProps} />
              <YAxis
                {...yAxisProps}
                domain={[
                  0,
                  (dataMax: number) =>
                    Math.max(dataMax, stats.rChart.ucl) * 1.1,
                ]}
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              {showLimits && (
                <>
                  <ReferenceLine
                    y={stats.rChart.ucl}
                    stroke="var(--color-ucl)"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                  />
                  <ReferenceLine
                    y={stats.rChart.lcl}
                    stroke="var(--color-lcl)"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                  />
                </>
              )}
              {showMean && (
                <ReferenceLine
                  y={stats.rChart.mean}
                  stroke="var(--color-mean)"
                  strokeDasharray="10 5"
                  strokeWidth={1.5}
                />
              )}
              {showPoints && (
                <Line
                  type="monotone"
                  dataKey="range"
                  stroke="var(--color-range)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--color-range)', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              )}
            </ComposedChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
