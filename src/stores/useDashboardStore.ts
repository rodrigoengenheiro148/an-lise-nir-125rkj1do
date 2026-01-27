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
import { useAuth } from '@/components/AuthProvider'

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
  error: string | null
}

const DashboardContext = createContext<DashboardState | undefined>(undefined)

const STORAGE_KEYS = {
  COMPANY_ID: 'dashboard_selected_company_id',
  MATERIAL: 'dashboard_selected_material',
}

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<CompanyEntity[]>([])
  const [samples, setSamples] = useState<Sample[]>([])
  const [analysisRecords, setAnalysisRecords] = useState<AnalysisRecord[]>([])
  const [error, setError] = useState<string | null>(null)

  // Initialize state from localStorage if available (only for UI preferences)
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

  // Initialize loading as true to prevent flash of empty state on first load
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false)

  // Use a ref to access the latest companies list inside the realtime callback
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

  const loadData = async (forceLoadingState = false) => {
    if (!user) return

    // Persistent Data Fetching: Only show loading state if we have no data or if forced.
    // This allows background refreshes without UI flickering.
    if (forceLoadingState || companies.length === 0) {
      setIsLoading(true)
    }

    // We do NOT clear error here immediately to avoid jumping layout,
    // but we will clear it on success.

    try {
      const [companiesResult, recordsResult] = await Promise.allSettled([
        api.getCompanies(),
        api.getRecords(),
      ])

      let fetchedCompanies: CompanyEntity[] = []
      let fetchedRecords: AnalysisRecord[] = []

      if (companiesResult.status === 'fulfilled') {
        fetchedCompanies = companiesResult.value
        setCompanies(fetchedCompanies)
      } else {
        console.error('Failed to load companies', companiesResult.reason)
        // Keep old companies if fetch fails, but set error
        setError('Falha ao atualizar empresas. Verifique sua conexão.')
      }

      if (recordsResult.status === 'fulfilled') {
        fetchedRecords = recordsResult.value
        setAnalysisRecords(fetchedRecords)
      } else {
        console.error('Failed to load records', recordsResult.reason)
        // Keep old records if fetch fails
        if (!error)
          setError(
            'Falha ao atualizar registros. Dados exibidos podem estar desatualizados.',
          )
      }

      if (
        companiesResult.status === 'fulfilled' &&
        recordsResult.status === 'fulfilled'
      ) {
        setError(null)
      }

      // Check for persistence validity
      if (fetchedCompanies.length > 0) {
        const isValidCompany = fetchedCompanies.some(
          (c) => c.id === selectedCompanyId,
        )

        if (!selectedCompanyId || !isValidCompany) {
          setSelectedCompanyId(fetchedCompanies[0].id)
        }
      } else if (
        fetchedCompanies.length === 0 &&
        companiesResult.status === 'fulfilled'
      ) {
        // Only clear selection if we confidently know there are no companies
        setSelectedCompanyId('')
      }
    } catch (err) {
      console.error('Unexpected error loading data', err)
      setError('Erro inesperado de conexão.')
      toast.error('Não foi possível conectar ao servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  // Realtime subscription setup
  useEffect(() => {
    if (!user) return

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
            if (selectedCompanyId === deletedId) {
              setSelectedCompanyId('')
            }
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
          const currentCompanies = companiesRef.current

          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as any

            // Helper to transform and add record
            const addRecordToState = (
              company: CompanyEntity,
              recordData: any,
            ) => {
              const transformed = transformRecordFromDB(recordData, {
                name: company.name,
                logo_url: company.logo_url,
              })

              setAnalysisRecords((prev) => {
                // Synchronized Chart Updates:
                // Check if record already exists (e.g. from manual refresh happening simultaneously)
                if (prev.some((r) => r.id === transformed.id)) {
                  return prev
                }
                return [transformed, ...prev]
              })
            }

            const company = currentCompanies.find(
              (c) => c.id === newRecord.company_id,
            )

            if (company) {
              addRecordToState(company, newRecord)
            } else {
              // Fetch company if not found locally (e.g. new company + new record race)
              api.getCompanies().then((refreshedCompanies) => {
                setCompanies(refreshedCompanies)
                const freshCompany = refreshedCompanies.find(
                  (c) => c.id === newRecord.company_id,
                )
                if (freshCompany) {
                  addRecordToState(freshCompany, newRecord)
                }
              })
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
  }, [user, selectedCompanyId])

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

  // Material-Specific State Management
  // Ensure we don't automatically switch materials unless necessary,
  // keeping the view stable (fixed) even if data is empty for the selected material.
  useEffect(() => {
    const logic = async () => {
      if (!selectedCompanyId) return

      let nextMaterial = selectedMaterial

      // Only force a default if the current selection is completely empty
      if (!nextMaterial) {
        if (materials.length > 0) {
          nextMaterial = materials[0]
        } else {
          nextMaterial = MATERIALS_OPTIONS[0]
        }
      }

      // We removed the logic that forced switching if `!existsInDb`.
      // This allows the user to stay on a material even if it has no records yet.

      if (nextMaterial !== selectedMaterial) {
        setSelectedMaterial(nextMaterial)
      }
    }

    logic()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId, materials.length])
  // We only depend on length changes or company changes to re-evaluate default,
  // not every material list change to prevent jitter.

  // Load data when user is authenticated
  useEffect(() => {
    if (user) {
      loadData()
    } else {
      setCompanies([])
      setAnalysisRecords([])
      setError(null)
    }
  }, [user])

  const refreshData = () => {
    // Silent refresh to avoid UI flickering
    loadData(false)
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
        error,
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
