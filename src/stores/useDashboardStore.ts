import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { Company, Sample, ANALYSIS_TYPES, AnalysisType } from '@/lib/types'
import { COMPANIES, INITIAL_SAMPLES } from '@/lib/mockData'
import { toast } from '@/hooks/use-toast'

interface DashboardState {
  companies: Company[]
  samples: Sample[]
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
  const [companies] = useState<Company[]>(COMPANIES)
  const [samples, setSamples] = useState<Sample[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    COMPANIES[0].id,
  )
  const [selectedDateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load initial data (Simulating Cloud Fetch)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const stored = localStorage.getItem('subpass_lab_data')
        if (stored) {
          setSamples(JSON.parse(stored))
        } else {
          setSamples(INITIAL_SAMPLES)
          localStorage.setItem(
            'subpass_lab_data',
            JSON.stringify(INITIAL_SAMPLES),
          )
        }
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
    loadData()
  }, [])

  const addSamples = (newSamples: Sample[]) => {
    setIsLoading(true)
    setTimeout(() => {
      const updatedSamples = [...samples, ...newSamples]
      setSamples(updatedSamples)
      localStorage.setItem('subpass_lab_data', JSON.stringify(updatedSamples))
      setIsLoading(false)
      toast({
        title: 'Dados Salvos',
        description: `${newSamples.length} amostras sincronizadas com sucesso.`,
      })
    }, 1000)
  }

  const refreshData = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 800)
  }

  return React.createElement(
    DashboardContext.Provider,
    {
      value: {
        companies,
        samples,
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
