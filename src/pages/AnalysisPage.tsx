import { Link } from 'react-router-dom'
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MetricScatterChart } from '@/components/dashboard/MetricScatterChart'
import useDashboardStore from '@/stores/useDashboardStore'
import { METRICS } from '@/types/dashboard'

export default function AnalysisPage() {
  const { analysisRecords, isLoading } = useDashboardStore()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
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
          <h1 className="text-2xl font-bold flex items-center gap-2 font-display">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            Análise Avançada de Métricas (NIR vs LAB)
          </h1>
        </div>

        {isLoading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {METRICS.map((metric) => (
              <MetricScatterChart
                key={metric.key}
                title={metric.label.toUpperCase()}
                data={analysisRecords}
                metricKey={metric.key}
                color={metric.color}
                unit={metric.unit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
