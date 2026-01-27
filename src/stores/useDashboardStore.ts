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

  // Realtime Update Buffers
  const pendingUpdates = useRef<
    { type: 'INSERT' | 'UPDATE' | 'DELETE'; payload: any }[]
  >([])

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
    if (forceLoadingState || companies.length === 0) {
      setIsLoading(true)
    }

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
        setError('Falha ao atualizar empresas. Verifique sua conexão.')
      }

      if (recordsResult.status === 'fulfilled') {
        fetchedRecords = recordsResult.value
        setAnalysisRecords(fetchedRecords)
      } else {
        console.error('Failed to load records', recordsResult.reason)
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
            // Update company name/logo in existing records
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
      // Subscribe to Analysis Records table changes with Buffering
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_records',
        },
        (payload) => {
          // Push to buffer instead of processing immediately
          pendingUpdates.current.push({
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            payload: payload.eventType === 'DELETE' ? payload.old : payload.new,
          })
        },
      )
      .subscribe()

    // Process buffered updates every 500ms
    const interval = setInterval(() => {
      if (pendingUpdates.current.length === 0) return

      const updates = [...pendingUpdates.current]
      pendingUpdates.current = [] // Clear buffer

      setAnalysisRecords((prevRecords) => {
        let nextRecords = [...prevRecords]
        const companies = companiesRef.current

        updates.forEach((update) => {
          if (update.type === 'INSERT') {
            const newRecord = update.payload

            // Synchronized check to avoid duplicates from manual refresh
            if (nextRecords.some((r) => r.id === newRecord.id)) return

            const company = companies.find((c) => c.id === newRecord.company_id)

            if (company) {
              const transformed = transformRecordFromDB(newRecord, {
                name: company.name,
                logo_url: company.logo_url,
              })
              nextRecords.push(transformed)
            } else {
              // If company not found (rare race condition), we might skip or try to fetch.
              // For bulk performance, we skip fetching per-record.
              // The periodic refresh or company subscription will handle it eventually.
            }
          } else if (update.type === 'UPDATE') {
            const updatedRecord = update.payload
            const company = companies.find(
              (c) => c.id === updatedRecord.company_id,
            )
            if (company) {
              const transformed = transformRecordFromDB(updatedRecord, {
                name: company.name,
                logo_url: company.logo_url,
              })
              const idx = nextRecords.findIndex((r) => r.id === transformed.id)
              if (idx !== -1) {
                nextRecords[idx] = transformed
              }
            }
          } else if (update.type === 'DELETE') {
            const deletedId = update.payload.id
            nextRecords = nextRecords.filter((r) => r.id !== deletedId)
          }
        })

        // No need to sort here if we want max performance, index view sorts it.
        // But keeping it somewhat sorted helps debugging.
        // We'll let Index.tsx handle sorting for display.
        return nextRecords
      })
    }, 500)

    return () => {
      clearInterval(interval)
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
  useEffect(() => {
    const logic = async () => {
      if (!selectedCompanyId) return

      let nextMaterial = selectedMaterial

      if (!nextMaterial) {
        if (materials.length > 0) {
          nextMaterial = materials[0]
        } else {
          nextMaterial = MATERIALS_OPTIONS[0]
        }
      }

      if (nextMaterial !== selectedMaterial) {
        setSelectedMaterial(nextMaterial)
      }
    }

    logic()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId, materials.length])

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
