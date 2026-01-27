import { supabase } from '@/lib/supabase/client'
import { AnalysisRecord, CompanyEntity } from '@/types/dashboard'

// Strict mapping ensuring all 13 metrics are covered matching DB columns
const KEY_MAPPING: Record<string, string> = {
  acidity: 'acidity',
  moisture: 'moisture',
  fco: 'fco',
  protein: 'protein',
  phosphorus: 'phosphorus',
  mineralMatter: 'mineral_matter',
  peroxide: 'peroxide',
  etherExtract: 'ether_extract',
  proteinDigestibility: 'protein_digestibility',
  calcium: 'calcium',
  sodium: 'sodium',
  iodine: 'iodine',
  impurity: 'impurity',
}

export const transformRecordFromDB = (
  row: any,
  company: { name: string; logo_url?: string | null },
): AnalysisRecord => {
  const record: AnalysisRecord = {
    id: row.id,
    company: company.name,
    company_id: row.company_id,
    company_logo: company.logo_url || undefined,
    date: row.date,
    created_at: row.created_at,
    material: row.material,
    submaterial: row.sub_material || row.submaterial || undefined,
  }

  // Map all metric columns from DB (snake_case) to App (camelCase)
  Object.entries(KEY_MAPPING).forEach(([appKey, dbPrefix]) => {
    record[`${appKey}_lab`] = row[`${dbPrefix}_lab`] ?? undefined
    record[`${appKey}_nir`] = row[`${dbPrefix}_nir`] ?? undefined
    record[`${appKey}_anl`] = row[`${dbPrefix}_anl`] ?? undefined
  })

  return record
}

const transformRecordToDB = (
  record: Partial<AnalysisRecord>,
  companyId: string,
) => {
  const dbRow: any = {
    company_id: companyId,
    date: record.date || null,
    material: record.material,
    sub_material: record.submaterial, // Maps app 'submaterial' to DB 'sub_material'
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

const deduplicateRecords = (records: AnalysisRecord[]): AnalysisRecord[] => {
  const map = new Map<string, AnalysisRecord>()

  records.forEach((record) => {
    // Create a unique key based on business logic unique constraints
    const companyId = record.company_id || ''
    const date = record.date || 'null'
    const material = record.material || ''
    const submaterial = record.submaterial || record.sub_material || ''

    // Normalize key to ensure consistent matching
    const key = `${companyId}|${date}|${material}|${submaterial}`.toLowerCase()

    if (map.has(key)) {
      const existing = map.get(key)!
      // Merge: overwrite existing fields with new non-null/non-empty values
      // This ensures we accumulate data from multiple partial records
      const merged = { ...existing }
      Object.keys(record).forEach((k) => {
        const val = record[k]
        // Only merge if value is present and not empty string
        // We explicitly check against undefined/null to allow 0 values
        if (val !== undefined && val !== null && val !== '') {
          merged[k] = val
        }
      })
      map.set(key, merged)
    } else {
      map.set(key, { ...record })
    }
  })

  return Array.from(map.values())
}

export const api = {
  getCompanies: async (): Promise<CompanyEntity[]> => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching companies:', error)
      throw error
    }
    return data || []
  },

  addCompany: async (name: string): Promise<CompanyEntity> => {
    const { data, error } = await supabase
      .from('companies')
      .insert({ name })
      .select()
      .single()
    if (error) throw error
    return data
  },

  getRecords: async (): Promise<AnalysisRecord[]> => {
    const { data, error } = await supabase
      .from('analysis_records')
      .select('*, companies(name, logo_url)')
      .order('created_at', { ascending: false })
      .limit(100000)

    if (error) {
      console.error('Error fetching records:', error)
      throw error
    }

    return (data || []).map((row) => {
      const comp = (row.companies as any) || { name: 'Unknown' }
      return transformRecordFromDB(row, comp)
    })
  },

  createRecord: async (
    record: Partial<AnalysisRecord> & { company_id: string },
  ) => {
    const fullRecord: AnalysisRecord = {
      id: '',
      company: '',
      ...record,
    }

    await api.saveRecords([fullRecord])
  },

  updateRecord: async (id: string, updates: Partial<AnalysisRecord>) => {
    const dbUpdates: any = {}

    if (updates.material !== undefined) dbUpdates.material = updates.material
    if (updates.submaterial !== undefined)
      dbUpdates.sub_material = updates.submaterial
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
  },

  deleteRecord: async (id: string) => {
    const { error } = await supabase
      .from('analysis_records')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  saveRecords: async (records: AnalysisRecord[]) => {
    if (records.length === 0) return

    // 1. Deduplicate records first to avoid "ON CONFLICT" errors within the same batch
    // and to merge data efficiently before sending to DB.
    const uniqueRecords = deduplicateRecords(records)

    // Process in chunks to avoid payload size limits
    const CHUNK_SIZE = 50

    for (let i = 0; i < uniqueRecords.length; i += CHUNK_SIZE) {
      const chunk = uniqueRecords.slice(i, i + CHUNK_SIZE)
      const validChunk = chunk.filter((r) => r.company_id)

      if (validChunk.length === 0) continue

      // Map to DB format
      const dbRecords = validChunk.map((r) =>
        transformRecordToDB(r, r.company_id!),
      )

      // 2. Call RPC to handle upsert logic on server side
      // This is safer and faster than client-side fetch+merge+upsert
      const { error } = await supabase.rpc('bulk_upsert_analysis_records', {
        records: dbRecords as any,
      })

      if (error) {
        console.error('Error saving chunk:', error)
        throw error
      }
    }
  },

  clearDatabase: async (
    companyId: string | null | undefined,
    password: string,
  ): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('clear-database', {
      body: { companyId, password },
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)
  },
}
