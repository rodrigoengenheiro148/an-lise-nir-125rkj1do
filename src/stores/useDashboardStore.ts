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
import { api, transformRecordFromDB, isAbortError } from '@/services/api'
import { supabase } from '@/lib/supabase/client'
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
  isAdminUnlocked: boolean
  unlockAdmin: () => void
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
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false)

  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEYS.COMPANY_ID) || '',
  )
  const [selectedMaterial, setSelectedMaterialState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEYS.MATERIAL) || 'all',
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

  const abortControllerRef = useRef<AbortController | null>(null)
  const isMounted = useRef(true)

  const companiesRef = useRef<CompanyEntity[]>([])
  useEffect(() => {
    companiesRef.current = companies
  }, [companies])

  const pendingUpdates = useRef<
    { type: 'INSERT' | 'UPDATE' | 'DELETE'; payload: any }[]
  >([])

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('Component unmounted')
      }
    }
  }, [])

  const setSelectedCompanyId = (id: string) => {
    localStorage.setItem(STORAGE_KEYS.COMPANY_ID, id)
    setSelectedCompanyIdState(id)
  }

  const setSelectedMaterial = (material: string) => {
    localStorage.setItem(STORAGE_KEYS.MATERIAL, material)
    setSelectedMaterialState(material)
  }

  const unlockAdmin = () => {
    setIsAdminUnlocked(true)
  }

  const loadData = async (forceLoadingState = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('Cancelled by new request')
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    if (
      forceLoadingState ||
      (companies.length === 0 && analysisRecords.length === 0)
    ) {
      setIsLoading(true)
    }

    try {
      const companiesData = await api.getCompanies(controller.signal)

      if (controller.signal.aborted || !isMounted.current) return

      setCompanies(companiesData)
      companiesRef.current = companiesData

      const recordsData = await api.getRecords(controller.signal)

      if (controller.signal.aborted || !isMounted.current) return

      setAnalysisRecords(recordsData)
      setError(null)

      if (companiesData.length > 0) {
        const isValidCompany = companiesData.some(
          (c) => c.id === selectedCompanyId,
        )

        if (!selectedCompanyId || !isValidCompany) {
          setSelectedCompanyId(companiesData[0].id)
        }
      } else {
        setSelectedCompanyId('')
      }
    } catch (err: any) {
      if (
        isAbortError(err) ||
        controller.signal.aborted ||
        !isMounted.current
      ) {
        return
      }

      console.error('Unexpected error loading data', err)
      setError('Falha na conexão. Tentando restabelecer acesso ao servidor...')
      toast.error('Não foi possível carregar os dados. Verifique sua conexão.')
    } finally {
      if (abortControllerRef.current === controller && isMounted.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    const handleOnline = () => {
      toast.success('Conexão restabelecida. Atualizando dados...')
      loadData(false)
    }
    window.addEventListener('online', handleOnline)

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'companies',
        },
        (payload) => {
          if (!isMounted.current) return
          if (payload.eventType === 'INSERT') {
            const newCompany = payload.new as CompanyEntity
            setCompanies((prev) => {
              if (prev.some((c) => c.id === newCompany.id)) return prev
              return [...prev, newCompany].sort((a, b) =>
                a.name.localeCompare(b.name),
              )
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedCompany = payload.new as CompanyEntity
            setCompanies((prev) =>
              prev.map((c) =>
                c.id === updatedCompany.id ? updatedCompany : c,
              ),
            )
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_records',
        },
        (payload) => {
          if (!isMounted.current) return
          pendingUpdates.current.push({
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            payload: payload.eventType === 'DELETE' ? payload.old : payload.new,
          })
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime channel error, attempting to reconnect...')
        }
      })

    const interval = setInterval(() => {
      if (!isMounted.current) return
      if (pendingUpdates.current.length === 0) return

      const updates = [...pendingUpdates.current]
      pendingUpdates.current = []

      setAnalysisRecords((prevRecords) => {
        let nextRecords = [...prevRecords]
        const currentCompanies = companiesRef.current

        updates.forEach((update) => {
          if (update.type === 'INSERT') {
            const newRecord = update.payload
            if (nextRecords.some((r) => r.id === newRecord.id)) return

            const company = currentCompanies.find(
              (c) => c.id === newRecord.company_id,
            )

            try {
              const transformed = transformRecordFromDB(newRecord, {
                name: company?.name || 'Carregando...',
                logo_url: company?.logo_url,
              })
              nextRecords.unshift(transformed)
            } catch (e) {
              console.warn('Skipping malformed realtime insert record', e)
            }
          } else if (update.type === 'UPDATE') {
            const updatedRecord = update.payload
            const company = currentCompanies.find(
              (c) => c.id === updatedRecord.company_id,
            )
            try {
              const transformed = transformRecordFromDB(updatedRecord, {
                name: company?.name || 'Carregando...',
                logo_url: company?.logo_url,
              })

              const idx = nextRecords.findIndex((r) => r.id === transformed.id)
              if (idx !== -1) {
                nextRecords[idx] = transformed
              } else {
                nextRecords.unshift(transformed)
              }
            } catch (e) {
              console.warn('Skipping malformed realtime update record', e)
            }
          } else if (update.type === 'DELETE') {
            const deletedId = update.payload.id
            nextRecords = nextRecords.filter((r) => r.id !== deletedId)
          }
        })

        return nextRecords.sort((a, b) => {
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          )
        })
      })
    }, 500)

    return () => {
      window.removeEventListener('online', handleOnline)
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const materials = useMemo(() => {
    // Unify all static materials with dynamic ones from the database
    const distinctMaterials = Array.from(
      new Set(analysisRecords.map((r) => r.material).filter(Boolean)),
    ).map((m) => String(m).toLowerCase())

    const allMaterials = Array.from(
      new Set([
        ...MATERIALS_OPTIONS.map((m) => m.toLowerCase()),
        ...distinctMaterials,
      ]),
    ).sort()

    return allMaterials
  }, [analysisRecords])

  useEffect(() => {
    const logic = async () => {
      if (!selectedCompanyId || !isMounted.current) return

      let nextMaterial = selectedMaterial

      if (!nextMaterial) {
        nextMaterial = 'all'
      }
      if (nextMaterial !== selectedMaterial) {
        setSelectedMaterial(nextMaterial)
      }
    }
    logic()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId])

  useEffect(() => {
    loadData()
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('Component unmounted')
      }
    }
  }, [user?.id])

  const refreshData = () => {
    loadData(false)
  }

  const addSamples = (newSamples: Sample[]) => {
    toast.info('Utilize a importação via banco de dados.')
  }

  const setMaterials = (mats: string[]) => {
    // No-op
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
        isAdminUnlocked,
        unlockAdmin,
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
