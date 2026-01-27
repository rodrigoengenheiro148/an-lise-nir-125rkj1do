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
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      // Use Promise.allSettled to ensure we get as much data as possible even if one fails
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
        setError('Falha ao carregar empresas.')
      }

      if (recordsResult.status === 'fulfilled') {
        fetchedRecords = recordsResult.value
        setAnalysisRecords(fetchedRecords)
      } else {
        console.error('Failed to load records', recordsResult.reason)
        // If companies loaded, we might not want to block entirely, but records are crucial
        if (!error) setError('Falha ao carregar registros.')
      }

      // Check for persistence validity
      if (fetchedCompanies.length > 0) {
        // If selected company is invalid (deleted or stale), reset to first available
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
        // No companies exist at all
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
            // Also remove from selection if current
            if (selectedCompanyId === deletedId) {
              // We rely on the companies state update to trigger re-selection or user action
              // But better to clear it or let the effect handle it
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
            } else {
              // Fetch company if not found locally (e.g. race condition)
              api.getCompanies().then((refreshedCompanies) => {
                setCompanies(refreshedCompanies)
                const freshCompany = refreshedCompanies.find(
                  (c) => c.id === newRecord.company_id,
                )
                if (freshCompany) {
                  const transformed = transformRecordFromDB(newRecord, {
                    name: freshCompany.name,
                    logo_url: freshCompany.logo_url,
                  })
                  setAnalysisRecords((prev) => [transformed, ...prev])
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

  // Handle Material Selection Logic
  useEffect(() => {
    const logic = async () => {
      // If no company is selected, we can't really determine materials
      if (!selectedCompanyId) {
        // Only clear if we have no companies at all, otherwise keep it
        // in case it's just a transient state, but here we can't do much
        return
      }

      setIsLoadingMaterials(true)
      try {
        let nextMaterial = selectedMaterial

        // Logic to prevent "Empty Dashboard" syndrome:
        // If the selected material is NOT present in the current company's data,
        // we should switch to the first available material for this company.
        // This prevents the user from seeing 0 records just because they switched companies.

        if (materials.length > 0) {
          const existsInDb = materials.some(
            (m) => m.toLowerCase() === (selectedMaterial || '').toLowerCase(),
          )

          if (!existsInDb) {
            // Current selection is invalid for this company, switch to first available
            // Check if any standard material is available to prioritize standard ordering
            const validStandard = MATERIALS_OPTIONS.find((opt) =>
              materials.some((m) => m.toLowerCase() === opt.toLowerCase()),
            )

            nextMaterial = validStandard || materials[0]
          } else {
            // Current selection is valid, ensure casing matches option or DB
            const normalized = materials.find(
              (m) => m.toLowerCase() === selectedMaterial.toLowerCase(),
            )
            if (normalized) nextMaterial = normalized
          }
        } else {
          // No materials for this company (no records).
          // We can keep the selectedMaterial or reset to default.
          // Keeping it allows user to "add" a record for this material easily.
          if (!nextMaterial) nextMaterial = MATERIALS_OPTIONS[0]
        }

        if (nextMaterial !== selectedMaterial) {
          setSelectedMaterial(nextMaterial)
        }
      } finally {
        setIsLoadingMaterials(false)
      }
    }

    logic()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId, materials])

  // Load data when user is authenticated
  useEffect(() => {
    if (user) {
      loadData()
    } else {
      // Clear data on logout
      setCompanies([])
      setAnalysisRecords([])
      setError(null)
    }
  }, [user])

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
