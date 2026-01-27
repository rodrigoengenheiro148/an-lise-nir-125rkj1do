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
    sub_material: record.submaterial,
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
    const { data, error } = await supabase
      .from('analysis_records')
      .select('*, companies(name, logo_url)')
      .order('created_at', { ascending: false })
      .limit(10000)

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
    // For single record creation, we also use saveRecords to ensure proper upsert/merge logic
    // But since createRecord signature is partial, we wrap it in array
    // However, original usage might expect simple insert.
    // Let's forward to saveRecords for robust handling.

    // Note: transformRecordToDB is called inside saveRecords loop for each item
    // But here we might have a partial object.

    // We construct the full record object as best as we can
    const fullRecord: AnalysisRecord = {
      id: '', // Placeholder
      company: '', // Placeholder, not used for saving
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

    // Transform records to DB format (snake_case columns)
    // We filter out records that don't have company_id
    const validRecords = records.filter((r) => r.company_id)

    const dbRecords = validRecords.map((r) =>
      transformRecordToDB(r, r.company_id!),
    )

    // Process in chunks to avoid hitting payload limits or timeouts
    const CHUNK_SIZE = 200
    for (let i = 0; i < dbRecords.length; i += CHUNK_SIZE) {
      const chunk = dbRecords.slice(i, i + CHUNK_SIZE)

      const { error } = await supabase.rpc('bulk_upsert_analysis_records', {
        records: chunk,
      })

      if (error) {
        console.error('Error saving records:', error)
        throw error
      }
    }
  },

  clearDatabase: async (companyId: string, password: string): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('clear-database', {
      body: { companyId, password },
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)
  },
}
