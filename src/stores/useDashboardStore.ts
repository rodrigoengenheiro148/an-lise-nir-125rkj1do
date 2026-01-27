import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useMemo,
} from 'react'
import { Sample } from '@/lib/types'
import {
  AnalysisRecord,
  MATERIALS_OPTIONS,
  CompanyEntity,
} from '@/types/dashboard'
import { toast } from 'sonner'
import { api, transformRecordFromDB } from '@/services/api'
import { supabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface DashboardState {
  companies: CompanyEntity[]
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
  const [companies, setCompanies] = useState<CompanyEntity[]>([])
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

  // Use a ref to access the latest companies list inside the realtime callback
  // without triggering a re-subscription loop
  const companiesRef = useRef<CompanyEntity[]>([])
  useEffect(() => {
    companiesRef.current = companies
  }, [companies])

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

      setCompanies(fetchedCompanies)
      setAnalysisRecords(fetchedRecords)

      // If no company selected (and none persisted), select the first one
      if (fetchedCompanies.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(fetchedCompanies[0].id)
      }
    } catch (error) {
      console.error('Failed to load data', error)
      toast.error('Não foi possível conectar ao servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  // Realtime subscription setup
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('dashboard-realtime')
      // Subscribe to Companies table changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'companies',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCompany = payload.new as CompanyEntity
            setCompanies((prev) =>
              [...prev, newCompany].sort((a, b) =>
                a.name.localeCompare(b.name),
              ),
            )
          } else if (payload.eventType === 'UPDATE') {
            const updatedCompany = payload.new as CompanyEntity
            setCompanies((prev) =>
              prev.map((c) =>
                c.id === updatedCompany.id ? updatedCompany : c,
              ),
            )
            // Update company name/logo in existing records if company details change
            setAnalysisRecords((prev) =>
              prev.map((r) => {
                if (r.company_id === updatedCompany.id) {
                  return {
                    ...r,
                    company: updatedCompany.name,
                    company_logo: updatedCompany.logo_url || undefined,
                  }
                }
                return r
              }),
            )
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id
            setCompanies((prev) => prev.filter((c) => c.id !== deletedId))
          }
        },
      )
      // Subscribe to Analysis Records table changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_records',
        },
        (payload) => {
          // Use the ref to get the current companies list without dependency injection
          const currentCompanies = companiesRef.current

          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as any
            const company = currentCompanies.find(
              (c) => c.id === newRecord.company_id,
            )
            if (company) {
              const transformed = transformRecordFromDB(newRecord, {
                name: company.name,
                logo_url: company.logo_url,
              })
              setAnalysisRecords((prev) => [transformed, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as any
            const company = currentCompanies.find(
              (c) => c.id === updatedRecord.company_id,
            )
            if (company) {
              const transformed = transformRecordFromDB(updatedRecord, {
                name: company.name,
                logo_url: company.logo_url,
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
  }, []) // Empty dependency array ensures subscription happens once

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
  }, [selectedCompanyId, materials])

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
