import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from 'react'
import { Company, Sample } from '@/lib/types'
import { AnalysisRecord, MATERIALS_OPTIONS } from '@/types/dashboard'
import { toast } from 'sonner'
import { api, transformRecordFromDB } from '@/services/api'
import { supabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

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

      // If no company selected (and none persisted), select the first one
      if (mappedCompanies.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(mappedCompanies[0].id)
      }
    } catch (error) {
      console.error('Failed to load data', error)
      toast.error('Não foi possível conectar ao servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  // Realtime subscription
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_records',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as any
            const company = companies.find((c) => c.id === newRecord.company_id)
            if (company) {
              const transformed = transformRecordFromDB(newRecord, {
                name: company.name,
              })
              setAnalysisRecords((prev) => [transformed, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as any
            const company = companies.find(
              (c) => c.id === updatedRecord.company_id,
            )
            if (company) {
              const transformed = transformRecordFromDB(updatedRecord, {
                name: company.name,
              })
              setAnalysisRecords((prev) =>
                prev.map((r) => (r.id === transformed.id ? transformed : r)),
              )
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id
            setAnalysisRecords((prev) => prev.filter((r) => r.id !== deletedId))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companies])

  // Derive materials from analysisRecords for the selected company
  const materials = useMemo(() => {
    if (!selectedCompanyId) return []

    const companyRecords = analysisRecords.filter(
      (r) => r.company_id === selectedCompanyId,
    )
    const distinctMaterials = Array.from(
      new Set(companyRecords.map((r) => r.material).filter(Boolean)),
    ).sort() as string[]

    return distinctMaterials
  }, [analysisRecords, selectedCompanyId])

  // Handle Material Selection Logic
  useEffect(() => {
    const logic = async () => {
      if (!selectedCompanyId) {
        setSelectedMaterial('')
        return
      }

      setIsLoadingMaterials(true)
      try {
        // Robust Selection Logic based on current derived materials
        let nextMaterial = selectedMaterial

        if (selectedMaterial) {
          const existsInDb = materials.some(
            (m) => m.toLowerCase() === selectedMaterial.toLowerCase(),
          )
          if (!existsInDb && materials.length > 0) {
            // keep selection or not?
          }
        }

        if (!nextMaterial) {
          if (materials.length > 0) {
            const validMat = MATERIALS_OPTIONS.find((opt) =>
              materials.some(
                (dbMat) => dbMat.toLowerCase() === opt.toLowerCase(),
              ),
            )
            nextMaterial = validMat || materials[0]
          } else {
            nextMaterial = MATERIALS_OPTIONS[0]
          }
        }

        const normalized = MATERIALS_OPTIONS.find(
          (opt) => opt.toLowerCase() === nextMaterial.toLowerCase(),
        )
        if (normalized) {
          nextMaterial = normalized
        }

        setSelectedMaterial(nextMaterial)
      } finally {
        setIsLoadingMaterials(false)
      }
    }

    logic()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId, materials]) // Re-run when materials change (e.g. from realtime)

  // Initial load
  useEffect(() => {
    loadData()
  }, [])

  const refreshData = () => {
    loadData()
  }

  const addSamples = (newSamples: Sample[]) => {
    toast.info('Utilize a importação via banco de dados.')
  }

  const setMaterials = (mats: string[]) => {
    // No-op as materials are derived
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
