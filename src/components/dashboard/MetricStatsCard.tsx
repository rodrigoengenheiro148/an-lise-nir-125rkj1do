import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsResult } from '@/lib/stats'

interface MetricStatsCardProps {
  title: string
  stats: StatsResult
  color: string
}

export const MetricStatsCard = ({
  title,
  stats,
  color,
}: MetricStatsCardProps) => {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 text-zinc-100 overflow-hidden">
      <CardHeader className="py-3 px-4 border-b border-zinc-800 bg-zinc-900/80">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <p className="text-zinc-500">R² (Correlação)</p>
          <p className="font-mono text-lg font-semibold">
            {stats.r2.toFixed(4)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-zinc-500">Bias (Viés)</p>
          <p
            className={`font-mono text-lg font-semibold ${Math.abs(stats.bias) > 0.5 ? 'text-red-400' : 'text-green-400'}`}
          >
            {stats.bias.toFixed(4)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-zinc-500">SEP (Desvio Res.)</p>
          <p className="font-mono text-base">{stats.sep.toFixed(4)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-zinc-500">Slope (Inclinação)</p>
          <p className="font-mono text-base">{stats.slope.toFixed(4)}</p>
        </div>
        <div className="col-span-2 pt-2 border-t border-zinc-800 flex justify-between items-center">
          <span className="text-zinc-500">Amostras (n)</span>
          <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-white">
            {stats.n}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
