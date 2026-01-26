import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { Company, Sample, AnalysisType } from '@/lib/types'
import { AnalysisRecord, METRICS } from '@/types/dashboard'
import { toast } from '@/hooks/use-toast'
import { api } from '@/services/api'

// Mapping from metric key (DB column prefix) to AnalysisType enum
const METRIC_TO_TYPE: Record<string, AnalysisType> = {
  acidity: 'ACIDEZ',
  moisture: 'UMIDADE',
  fco: 'FCO',
  protein: 'PROTEINA',
  phosphorus: 'FOSFORO',
  mineralMatter: 'MATERIA_MINERAL',
  peroxide: 'PEROXIDO',
  etherExtract: 'EXTRATO_ETEREO',
  proteinDigestibility: 'DIG_PROTEICA',
  calcium: 'CALCIO',
  sodium: 'SODIO',
}

interface DashboardState {
  companies: Company[]
  samples: Sample[]
  analysisRecords: AnalysisRecord[]
  selectedCompanyId: string
  selectedDateRange: { from: Date | undefined; to: Date | undefined }
  setSelectedCompanyId: (id: string) => void
  setDateRange: (range: {
    from: Date | undefined
    to: Date | undefined
  }) => void
  addSamples: (newSamples: Sample[]) => void
  refreshData: () => void
  isLoading: boolean
}

const DashboardContext = createContext<DashboardState | undefined>(undefined)

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [samples, setSamples] = useState<Sample[]>([])
  const [analysisRecords, setAnalysisRecords] = useState<AnalysisRecord[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [selectedDateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [fetchedCompanies, fetchedRecords] = await Promise.all([
        api.getCompanies(),
        api.getRecords(),
      ])

      const mappedCompanies = fetchedCompanies.map((c) => ({
        id: c.id,
        name: c.name,
      }))
      setCompanies(mappedCompanies)
      setAnalysisRecords(fetchedRecords)

      if (mappedCompanies.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(mappedCompanies[0].id)
      }

      // Convert AnalysisRecords to Samples for backward compatibility
      const newSamples: Sample[] = []
      fetchedRecords.forEach((record) => {
        METRICS.forEach((metric) => {
          const labVal = record[`${metric.key}_lab`]
          const nirVal = record[`${metric.key}_nir`]

          if (
            labVal !== undefined &&
            labVal !== null &&
            nirVal !== undefined &&
            nirVal !== null
          ) {
            newSamples.push({
              id: `${record.id}-${metric.key}`,
              companyId: record.company_id || '',
              date: record.created_at || new Date().toISOString(),
              analysisType: METRIC_TO_TYPE[metric.key],
              labValue: Number(labVal),
              nirValue: Number(nirVal),
            })
          }
        })
      })
      setSamples(newSamples)
    } catch (error) {
      console.error('Failed to load data', error)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível conectar ao servidor.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load only - Removed realtime subscriptions
  useEffect(() => {
    loadData()
  }, [])

  const refreshData = () => {
    loadData()
  }

  const addSamples = (newSamples: Sample[]) => {
    toast({
      title: 'Funcionalidade em atualização',
      description: 'Por favor, utilize a importação direta via banco de dados.',
    })
  }

  return React.createElement(
    DashboardContext.Provider,
    {
      value: {
        companies,
        samples,
        analysisRecords,
        selectedCompanyId,
        selectedDateRange,
        setSelectedCompanyId,
        setDateRange,
        addSamples,
        refreshData,
        isLoading,
      },
    },
    children,
  )
}

const useDashboardStore = () => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboardStore must be used within a DashboardProvider')
  }
  return context
}

export default useDashboardStore
