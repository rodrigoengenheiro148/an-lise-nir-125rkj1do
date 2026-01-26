import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { Company, Sample } from '@/lib/types'
import { AnalysisRecord } from '@/types/dashboard'
import { toast } from '@/hooks/use-toast'
import { api } from '@/services/api'

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

const STORAGE_KEYS = {
  COMPANY_ID: 'dashboard_selected_company_id',
  MATERIAL: 'dashboard_selected_material',
}

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [materials, setMaterials] = useState<string[]>([])
  const [samples, setSamples] = useState<Sample[]>([])
  const [analysisRecords, setAnalysisRecords] = useState<AnalysisRecord[]>([])

  // Initialize state from localStorage if available
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEYS.COMPANY_ID) || '',
  )
  const [selectedMaterial, setSelectedMaterialState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEYS.MATERIAL) || '',
  )

  const [selectedDateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false)

  const setSelectedCompanyId = (id: string) => {
    localStorage.setItem(STORAGE_KEYS.COMPANY_ID, id)
    setSelectedCompanyIdState(id)
  }

  const setSelectedMaterial = (material: string) => {
    localStorage.setItem(STORAGE_KEYS.MATERIAL, material)
    setSelectedMaterialState(material)
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const fetchedCompanies = await api.getCompanies()

      const mappedCompanies = fetchedCompanies.map((c) => ({
        id: c.id,
        name: c.name,
      }))
      setCompanies(mappedCompanies)

      // If no company selected (and none persisted), select the first one
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
          // Otherwise select the first one to ensure granular analysis
          if (selectedMaterial && mats.includes(selectedMaterial)) {
            // Keep current selection
          } else {
            setSelectedMaterial(mats[0])
          }
        } else {
          // If no materials available, clear selection
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
