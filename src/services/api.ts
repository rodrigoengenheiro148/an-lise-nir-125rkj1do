import { supabase } from '@/lib/supabase/client'
import { AnalysisRecord, CompanyEntity } from '@/types/dashboard'

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

  // Only include defined metrics to avoid overwriting with nulls if using upsert/update (though this is mostly used for insert)
  Object.entries(KEY_MAPPING).forEach(([appKey, dbPrefix]) => {
    const parseVal = (val: any) => {
      if (val === undefined || val === null || val === '') return null
      const num = parseFloat(String(val).replace(',', '.'))
      return isNaN(num) ? null : num
    }

    const lab = parseVal(record[`${appKey}_lab`])
    const nir = parseVal(record[`${appKey}_nir`])
    const anl = parseVal(record[`${appKey}_anl`])

    if (lab !== undefined && lab !== null) dbRow[`${dbPrefix}_lab`] = lab
    if (nir !== undefined && nir !== null) dbRow[`${dbPrefix}_nir`] = nir
    if (anl !== undefined && anl !== null) dbRow[`${dbPrefix}_anl`] = anl
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
    // Robust Fetching: Selecting all necessary fields explicitly to ensure data integrity
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

  getCompanyRecords: async (
    companyId: string,
    material?: string,
  ): Promise<AnalysisRecord[]> => {
    let query = supabase
      .from('analysis_records')
      .select('*, companies(name, logo_url)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100000)

    if (material) {
      query = query.ilike('material', material)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching company records:', error)
      throw error
    }

    return (data || []).map((row) => {
      const comp = (row.companies as any) || { name: 'Unknown' }
      return transformRecordFromDB(row, comp)
    })
  },

  saveRecords: async (records: AnalysisRecord[]) => {
    const companies = await api.getCompanies()

    const rowsToInsert = records
      .map((r) => {
        const company = companies.find(
          (c) => c.name === r.company || c.id === r.company_id,
        )
        if (!company) return null
        // Ensure we pass a new ID if not present, though usually insert handles it.
        // If the record has an ID, we might want to preserve it or let DB gen it.
        // For imports, we treat them as new records to avoid accidental overwrites of existing unrelated data.
        return transformRecordToDB(r, company.id)
      })
      .filter(Boolean)

    if (rowsToInsert.length === 0) return

    // Chunking inserts to avoid payload size limits and network timeouts
    const CHUNK_SIZE = 500 // Reduced chunk size for better stability
    for (let i = 0; i < rowsToInsert.length; i += CHUNK_SIZE) {
      const chunk = rowsToInsert.slice(i, i + CHUNK_SIZE)
      const { error } = await supabase.from('analysis_records').insert(chunk)
      if (error) {
        console.error('Error saving chunk:', error)
        throw error
      }
    }
  },

  createRecord: async (
    record: Partial<AnalysisRecord> & { company_id: string },
  ) => {
    const dbRow = transformRecordToDB(record, record.company_id)
    const { error } = await supabase.from('analysis_records').insert(dbRow)
    if (error) throw error
  },

  updateRecord: async (id: string, updates: Partial<AnalysisRecord>) => {
    const dbUpdates: any = {}

    // Explicitly handle meta fields
    if (updates.material !== undefined) dbUpdates.material = updates.material
    if (updates.submaterial !== undefined)
      dbUpdates.sub_material = updates.submaterial
    if (updates.company_id) dbUpdates.company_id = updates.company_id
    if (updates.date !== undefined) dbUpdates.date = updates.date

    // Robust Patching: Only update fields that are explicitly present in the updates object.
    // This prevents overwriting existing data with nulls or defaults.
    Object.entries(KEY_MAPPING).forEach(([appKey, dbPrefix]) => {
      const types = ['lab', 'nir', 'anl']
      types.forEach((type) => {
        const key = `${appKey}_${type}`
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
          const val = updates[key]
          // If explicitly set to empty string or null, we set DB value to null.
          // Otherwise parse number.
          if (val === undefined) return // Should not happen with hasOwnProperty check but safe to keep

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

  clearDatabase: async (companyId: string, password: string): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('clear-database', {
      body: { companyId, password },
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)
  },
}
