import { supabase } from '@/lib/supabase/client'
import {
  AnalysisRecord,
  CompanyEntity,
  MATERIALS_OPTIONS,
} from '@/types/dashboard'

export const createAbortError = (message = 'The operation was aborted') => {
  if (typeof DOMException !== 'undefined') {
    return new DOMException(message, 'AbortError')
  }
  const error = new Error(message)
  error.name = 'AbortError'
  return error
}

export const isAbortError = (error: any) => {
  if (!error) return false

  // Standard AbortError checks
  if (error.name === 'AbortError') return true
  if (
    error instanceof DOMException &&
    (error.name === 'AbortError' || error.code === 20)
  )
    return true

  // Check for custom codes
  if (
    error.code === 'ABORT_ERR' ||
    error.code === 'AbortError' ||
    error.code === 20 ||
    error.code === '20'
  )
    return true

  // Check for string messages or error objects with messages
  const msg = error.message
    ? String(error.message).toLowerCase()
    : typeof error === 'string'
      ? error.toLowerCase()
      : ''

  return (
    msg.includes('abort') ||
    msg.includes('cancel') ||
    msg.includes('signal is aborted') ||
    msg.includes('user aborted') ||
    msg.includes('http n/a') ||
    msg.includes('load failed') ||
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('the operation was aborted') ||
    msg.includes('without reason') // Explicitly handle "signal is aborted without reason"
  )
}

// Helper for exponential backoff retry with robust abort handling
const retryOperation = async <T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000,
  signal?: AbortSignal,
): Promise<T> => {
  // Check signal before starting the operation
  if (signal?.aborted) {
    // If we have a specific string reason, preserve it. Otherwise use generic message to avoid "without reason" noise.
    const reason = typeof signal.reason === 'string' ? signal.reason : undefined
    throw createAbortError(reason)
  }

  try {
    return await operation()
  } catch (error: any) {
    // Check if the error is an abort error or if the signal was aborted during the operation
    if (isAbortError(error) || signal?.aborted) {
      // If it's already an abort error, throw it directly to preserve details
      if (isAbortError(error)) throw error

      const reason =
        typeof signal?.reason === 'string' ? signal.reason : undefined
      throw createAbortError(reason)
    }

    if (retries <= 0) throw error

    // Wait with exponential backoff, handling abort during wait
    await new Promise((resolve, reject) => {
      // Immediate check
      if (signal?.aborted) {
        const reason =
          typeof signal.reason === 'string' ? signal.reason : undefined
        return reject(createAbortError(reason))
      }

      const onAbort = () => {
        clearTimeout(timeoutId)
        signal?.removeEventListener('abort', onAbort)
        const reason =
          typeof signal?.reason === 'string' ? signal.reason : undefined
        reject(createAbortError(reason))
      }

      const timeoutId = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort)
        resolve(null)
      }, delay)

      signal?.addEventListener('abort', onAbort)
    })

    return retryOperation(operation, retries - 1, delay * 2, signal)
  }
}

// Strict mapping ensuring all metrics are covered matching DB columns
const KEY_MAPPING: Record<string, string> = {
  acidity: 'acidity',
  moisture: 'moisture',
  fco: 'fco',
  protein: 'protein',
  phosphorus: 'phosphorus',
  mineralMatter: 'mineral_matter',
  peroxide: 'peroxide',
  etherExtract: 'ether_extract',
  fat: 'fat',
  proteinDigestibility: 'protein_digestibility',
  calcium: 'calcium',
  sodium: 'sodium',
  iodine: 'iodine',
  impurity: 'impurity',
}

// Safely extract company data whether it comes as an object (single) or array (one-to-many join result)
const extractCompanyData = (
  joinedData: any,
): { name: string; logo_url?: string | null } => {
  if (!joinedData) return { name: 'Unknown' }
  if (Array.isArray(joinedData)) {
    return joinedData.length > 0 ? joinedData[0] : { name: 'Unknown' }
  }
  return joinedData
}

export const transformRecordFromDB = (
  row: any,
  company: { name: string; logo_url?: string | null } | null,
): AnalysisRecord => {
  // Normalize material name to match options if possible
  let material = row.material
  if (material && typeof material === 'string') {
    const lower = material.toLowerCase()
    const match = MATERIALS_OPTIONS.find((m) => m.toLowerCase() === lower)
    if (match) {
      material = match
    }
  } else {
    material = undefined
  }

  // Handle both possible column names for submaterial safely
  const submaterial = row.sub_material || row.submaterial || undefined

  const record: AnalysisRecord = {
    id: row.id,
    company: company?.name || 'Unknown',
    company_id: row.company_id,
    company_logo: company?.logo_url || undefined,
    date: row.date,
    created_at: row.created_at,
    material: material,
    submaterial: submaterial,
  }

  // Map all metric columns from DB (snake_case) to App (camelCase)
  // Ensure we safely handle nulls and convert to number or undefined
  Object.entries(KEY_MAPPING).forEach(([appKey, dbPrefix]) => {
    const lab = row[`${dbPrefix}_lab`]
    const nir = row[`${dbPrefix}_nir`]
    const anl = row[`${dbPrefix}_anl`]

    // Check strict null/undefined. We preserve 0 values.
    record[`${appKey}_lab`] =
      lab !== null && lab !== undefined && lab !== '' ? Number(lab) : undefined
    record[`${appKey}_nir`] =
      nir !== null && nir !== undefined && nir !== '' ? Number(nir) : undefined
    record[`${appKey}_anl`] =
      anl !== null && anl !== undefined && anl !== '' ? Number(anl) : undefined
  })

  return record
}

const transformRecordToDB = (
  record: Partial<AnalysisRecord>,
  companyId: string,
) => {
  const dbRow: any = {
    id: record.id, // Include ID to allow upsert by ID
    company_id: companyId,
    date: record.date || null,
    material: record.material,
    sub_material: record.submaterial, // Maps app 'submaterial' to DB 'sub_material'
    submaterial: record.submaterial, // Also map to 'submaterial' for consistency
  }

  // Parse and map values for DB insertion
  Object.entries(KEY_MAPPING).forEach(([appKey, dbPrefix]) => {
    const parseVal = (val: any) => {
      if (val === undefined || val === null || val === '') return null
      const num = parseFloat(String(val).replace(',', '.'))
      return isNaN(num) ? null : num
    }

    const lab = parseVal(record[`${appKey}_lab`])
    const nir = parseVal(record[`${appKey}_nir`])
    const anl = parseVal(record[`${appKey}_anl`])

    if (lab !== null) dbRow[`${dbPrefix}_lab`] = lab
    if (nir !== null) dbRow[`${dbPrefix}_nir`] = nir
    if (anl !== null) dbRow[`${dbPrefix}_anl`] = anl
  })

  return dbRow
}

export const api = {
  getCompanies: async (signal?: AbortSignal): Promise<CompanyEntity[]> => {
    return retryOperation(
      async () => {
        let query = supabase.from('companies').select('*').order('name')

        if (signal) {
          query = query.abortSignal(signal)
        }

        const { data, error } = await query

        if (error) {
          // Check if error is an abort error or if signal is aborted
          if (isAbortError(error) || signal?.aborted) {
            // Use signal reason if available
            const reason =
              typeof signal?.reason === 'string' ? signal.reason : undefined
            throw createAbortError(reason)
          }
          console.error('Error fetching companies:', error)
          throw error
        }
        return (data as CompanyEntity[]) || []
      },
      3,
      1000,
      signal,
    )
  },

  createCompany: async (name: string): Promise<CompanyEntity> => {
    return retryOperation(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario não autenticado')

      const { data, error } = await supabase
        .from('companies')
        .insert({ name, owner_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data as CompanyEntity
    })
  },

  getRecords: async (signal?: AbortSignal): Promise<AnalysisRecord[]> => {
    return retryOperation(
      async () => {
        let allRows: any[] = []
        let from = 0
        const step = 1000 // Supabase default max per request is usually 1000

        // Fetch all records using pagination to overcome default limits
        while (true) {
          // Check signal explicitly before starting new request
          if (signal?.aborted) {
            const reason =
              typeof signal.reason === 'string' ? signal.reason : undefined
            throw createAbortError(reason)
          }

          // Join with companies to get names. RLS on companies will filter this implicitly if set up correctly,
          // but usually RLS on analysis_records handles the row visibility.
          // We rely on RLS policies to only show records the user has access to.
          let query = supabase
            .from('analysis_records')
            .select('*, companies(name, logo_url)')
            .order('created_at', { ascending: false })
            .range(from, from + step - 1)

          if (signal) {
            query = query.abortSignal(signal)
          }

          const { data, error } = await query

          if (error) {
            if (isAbortError(error) || signal?.aborted) {
              const reason =
                typeof signal?.reason === 'string' ? signal.reason : undefined
              throw createAbortError(reason)
            }
            console.error('Error fetching records:', error)
            throw error
          }

          if (!data || data.length === 0) break

          allRows = [...allRows, ...data]

          // If we got fewer records than the step, we've reached the end
          if (data.length < step) break

          from += step
        }

        // Deduplicate records by ID to ensure data integrity from pagination shifts
        const uniqueRecordsMap = new Map<string, AnalysisRecord>()

        allRows.forEach((row) => {
          // Safely extract company info, handling potential array response from join
          const comp = extractCompanyData(row.companies)

          try {
            const record = transformRecordFromDB(row, comp)
            if (record.id) {
              uniqueRecordsMap.set(record.id, record)
            }
          } catch (e) {
            console.warn('Failed to transform record:', row.id, e)
            // Skip malformed records instead of crashing
          }
        })

        return Array.from(uniqueRecordsMap.values())
      },
      3,
      1000,
      signal,
    )
  },

  createRecord: async (
    record: Partial<AnalysisRecord> & { company_id: string },
  ) => {
    return retryOperation(async () => {
      const fullRecord: AnalysisRecord = {
        id: crypto.randomUUID(), // Generate ID for new records
        company: '',
        ...record,
      }

      await api.saveRecords([fullRecord])
    })
  },

  updateRecord: async (id: string, updates: Partial<AnalysisRecord>) => {
    return retryOperation(async () => {
      const dbUpdates: any = {}

      if (updates.material !== undefined) dbUpdates.material = updates.material
      if (updates.submaterial !== undefined) {
        dbUpdates.sub_material = updates.submaterial
        dbUpdates.submaterial = updates.submaterial
      }
      if (updates.company_id) dbUpdates.company_id = updates.company_id
      if (updates.date !== undefined) dbUpdates.date = updates.date

      Object.entries(KEY_MAPPING).forEach(([appKey, dbPrefix]) => {
        const types = ['lab', 'nir', 'anl']
        types.forEach((type) => {
          const key = `${appKey}_${type}`
          if (Object.prototype.hasOwnProperty.call(updates, key)) {
            const val = updates[key]

            if (val === undefined) return

            if (val === '' || val === null) {
              dbUpdates[`${dbPrefix}_${type}`] = null
            } else {
              const parsed = parseFloat(String(val).replace(',', '.'))
              dbUpdates[`${dbPrefix}_${type}`] = isNaN(parsed) ? null : parsed
            }
          }
        })
      })

      if (Object.keys(dbUpdates).length === 0) return

      const { error } = await supabase
        .from('analysis_records')
        .update(dbUpdates)
        .eq('id', id)

      if (error) throw error
    })
  },

  deleteRecord: async (id: string) => {
    return retryOperation(async () => {
      const { error } = await supabase
        .from('analysis_records')
        .delete()
        .eq('id', id)
      if (error) throw error
    })
  },

  saveRecords: async (records: AnalysisRecord[]) => {
    if (records.length === 0) return

    return retryOperation(async () => {
      // Process in chunks to avoid payload size limits
      const CHUNK_SIZE = 50

      for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE)
        const validChunk = chunk.filter((r) => r.company_id)

        if (validChunk.length === 0) continue

        // Map to DB format
        const dbRecords = validChunk.map((r) =>
          transformRecordToDB(r, r.company_id!),
        )

        // Call RPC to handle upsert logic on server side
        const { error } = await supabase.rpc('bulk_upsert_analysis_records', {
          records: dbRecords as any,
        })

        if (error) {
          if (isAbortError(error)) {
            throw error
          }
          console.error('Error saving chunk:', error)
          throw error
        }
      }
    })
  },

  clearDatabase: async (
    companyId: string | null | undefined,
    password: string,
    material?: string,
  ): Promise<void> => {
    return retryOperation(async () => {
      const { data, error } = await supabase.functions.invoke(
        'clear-database',
        {
          body: { companyId, password, material },
        },
      )

      if (error) throw error
      if (data?.error) throw new Error(data.error)
    })
  },

  exportMetricData: async (metricKey: string, companyId?: string) => {
    return retryOperation(async () => {
      const { data, error } = await supabase.functions.invoke(
        'export-metric-data',
        {
          body: { metricKey, companyId },
        },
      )

      if (error) throw error

      // Check if the response is an application level error (JSON)
      if (data && !(data instanceof Blob) && data.error) {
        throw new Error(data.error)
      }

      // Ensure we handle the blob correctly
      const blob =
        data instanceof Blob
          ? data
          : new Blob([data as any], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-${metricKey}-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    })
  },
}
