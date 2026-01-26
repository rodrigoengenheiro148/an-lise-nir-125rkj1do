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
  materials: string[]
  samples: Sample[]
  analysisRecords: AnalysisRecord[]
  selectedCompanyId: string
  selectedMaterial: string
  selectedDateRange: { from: Date | undefined; to: Date | undefined }
  setSelectedCompanyId: (id: string) => void
  setSelectedMaterial: (material: string) => void
  setMaterials: (materials: string[]) => void
  setDateRange: (range: {
    from: Date | undefined
    to: Date | undefined
  }) => void
  addSamples: (newSamples: Sample[]) => void
  refreshData: () => void
  isLoading: boolean
  isLoadingMaterials: boolean
}

const DashboardContext = createContext<DashboardState | undefined>(undefined)

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [materials, setMaterials] = useState<string[]>([])
  const [samples, setSamples] = useState<Sample[]>([])
  const [analysisRecords, setAnalysisRecords] = useState<AnalysisRecord[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [selectedDateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      // We only fetch companies here initially. Records are fetched based on filters in the page or explicitly refreshed.
      // However, to maintain backward compatibility with current implementation if it expects some initial data:
      const fetchedCompanies = await api.getCompanies()

      const mappedCompanies = fetchedCompanies.map((c) => ({
        id: c.id,
        name: c.name,
      }))
      setCompanies(mappedCompanies)

      if (mappedCompanies.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(mappedCompanies[0].id)
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

  // Fetch materials when company changes
  useEffect(() => {
    const fetchMaterials = async () => {
      if (!selectedCompanyId) {
        setMaterials([])
        setSelectedMaterial('')
        return
      }

      setIsLoadingMaterials(true)
      try {
        const mats = await api.getCompanyMaterials(selectedCompanyId)
        setMaterials(mats)

        // Smart Default Selection
        if (mats.length > 0) {
          // If previously selected material is in the new list, keep it
          // Otherwise select the first one
          if (selectedMaterial && mats.includes(selectedMaterial)) {
            // Keep current selection
          } else {
            setSelectedMaterial(mats[0])
          }
        } else {
          setSelectedMaterial('')
        }
      } catch (error) {
        console.error('Error fetching materials:', error)
        setMaterials([])
        setSelectedMaterial('')
      } finally {
        setIsLoadingMaterials(false)
      }
    }

    fetchMaterials()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId])

  // Initial load
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
        materials,
        samples,
        analysisRecords,
        selectedCompanyId,
        selectedMaterial,
        selectedDateRange,
        setSelectedCompanyId,
        setSelectedMaterial,
        setMaterials,
        setDateRange,
        addSamples,
        refreshData,
        isLoading,
        isLoadingMaterials,
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
