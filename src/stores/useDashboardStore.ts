import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { Company, Sample } from '@/lib/types'
import { AnalysisRecord, MATERIALS_OPTIONS } from '@/types/dashboard'
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

        // Robust Selection Logic:
        // 1. Try to find the currently selected material in the fetched materials (case-insensitive)
        // 2. Or, try to find it in the static options
        // 3. Default to the first static option if all else fails

        let nextMaterial = selectedMaterial

        // If we have a selection, check if it's still valid or if we should switch
        if (selectedMaterial) {
          const existsInDb = mats.some(
            (m) => m.toLowerCase() === selectedMaterial.toLowerCase(),
          )
          if (!existsInDb && mats.length > 0) {
            // If current selection is NOT in DB, but DB has other materials, maybe switch?
            // However, user might want to add new data for 'selectedMaterial'.
            // So we don't force switch unless it's completely invalid.
            // Actually, keeping the selection is fine as long as it is in MATERIALS_OPTIONS
          }
        }

        // If no selection, or if we want to ensure a valid default
        if (!nextMaterial) {
          if (mats.length > 0) {
            // Prefer a material that exists in DB and is also in OPTIONS (to normalize casing)
            const validMat = MATERIALS_OPTIONS.find((opt) =>
              mats.some((dbMat) => dbMat.toLowerCase() === opt.toLowerCase()),
            )
            nextMaterial = validMat || mats[0] // fallback to raw DB value if no match
          } else {
            nextMaterial = MATERIALS_OPTIONS[0]
          }
        }

        // Ensure normalization to lowercase if it matches an option
        const normalized = MATERIALS_OPTIONS.find(
          (opt) => opt.toLowerCase() === nextMaterial.toLowerCase(),
        )
        if (normalized) {
          nextMaterial = normalized
        }

        setSelectedMaterial(nextMaterial)
      } catch (error) {
        console.error('Error fetching materials:', error)
        setMaterials([])
        setSelectedMaterial(MATERIALS_OPTIONS[0])
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
