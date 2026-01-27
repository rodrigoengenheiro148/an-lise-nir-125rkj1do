import { supabase } from '@/lib/supabase/client'
import {
  AnalysisRecord,
  CompanyEntity,
  MATERIALS_OPTIONS,
} from '@/types/dashboard'

// Strict mapping ensuring all metrics are covered matching DB columns
// 'mineralMatter' maps to 'mineral_matter' in the database
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
  // Normalize material name to match options if possible
  let material = row.material
  if (material) {
    const lower = material.toLowerCase()
    const match = MATERIALS_OPTIONS.find((m) => m.toLowerCase() === lower)
    if (match) {
      material = match
    }
  }

  const record: AnalysisRecord = {
    id: row.id,
    company: company.name,
    company_id: row.company_id,
    company_logo: company.logo_url || undefined,
    date: row.date,
    created_at: row.created_at,
    material: material,
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
    id: record.id, // Include ID to allow upsert by ID
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
    let allRows: any[] = []
    let from = 0
    const step = 1000 // Supabase default max per request is usually 1000

    // Fetch all records using pagination to overcome default limits
    while (true) {
      const { data, error } = await supabase
        .from('analysis_records')
        .select('*, companies(name, logo_url)')
        .order('created_at', { ascending: false })
        .range(from, from + step - 1)

      if (error) {
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
      const comp = (row.companies as any) || { name: 'Unknown' }
      const record = transformRecordFromDB(row, comp)
      if (record.id) {
        uniqueRecordsMap.set(record.id, record)
      }
    })

    return Array.from(uniqueRecordsMap.values())
  },

  createRecord: async (
    record: Partial<AnalysisRecord> & { company_id: string },
  ) => {
    const fullRecord: AnalysisRecord = {
      id: crypto.randomUUID(), // Generate ID for new records
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

  exportMetricData: async (metricKey: string, companyId?: string) => {
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
  },
}
