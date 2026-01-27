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

// Exported for use in Store for Realtime updates
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

  Object.entries(KEY_MAPPING).forEach(([appKey, dbPrefix]) => {
    const parseVal = (val: any) => {
      if (val === undefined || val === null || val === '') return null
      const num = parseFloat(String(val).replace(',', '.'))
      return isNaN(num) ? null : num
    }

    const lab = parseVal(record[`${appKey}_lab`])
    const nir = parseVal(record[`${appKey}_nir`])
    const anl = parseVal(record[`${appKey}_anl`])

    if (lab !== undefined) dbRow[`${dbPrefix}_lab`] = lab
    if (nir !== undefined) dbRow[`${dbPrefix}_nir`] = nir
    if (anl !== undefined) dbRow[`${dbPrefix}_anl`] = anl
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

  getCompanyRecords: async (
    companyId: string,
    material?: string,
  ): Promise<AnalysisRecord[]> => {
    let query = supabase
      .from('analysis_records')
      .select('*, companies(name, logo_url)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(10000)

    if (material) {
      // Use ilike for case-insensitive matching
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

  getCompanyMaterials: async (companyId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from('analysis_records')
      .select('material')
      .eq('company_id', companyId)
      .limit(10000)

    if (error) {
      console.error('Error fetching company materials:', error)
      return []
    }

    return Array.from(
      new Set(data?.map((d) => d.material).filter(Boolean) as string[]),
    ).sort()
  },

  saveRecords: async (records: AnalysisRecord[]) => {
    // This function can handle bulk inserts
    // We need to fetch companies to map names to IDs if needed
    const companies = await api.getCompanies()

    // Filter and map records to DB format
    const rowsToInsert = records
      .map((r) => {
        const company = companies.find(
          (c) => c.name === r.company || c.id === r.company_id,
        )
        if (!company) return null
        return transformRecordToDB(r, company.id)
      })
      .filter(Boolean)

    if (rowsToInsert.length === 0) return

    // Insert in chunks to avoid payload limits if necessary,
    // but for now simple insert is fine for reasonable batches
    const { error } = await supabase
      .from('analysis_records')
      .insert(rowsToInsert)

    if (error) throw error
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
    if (updates.material !== undefined) dbUpdates.material = updates.material
    if (updates.submaterial !== undefined)
      dbUpdates.sub_material = updates.submaterial
    if (updates.company_id) dbUpdates.company_id = updates.company_id
    if (updates.date !== undefined) dbUpdates.date = updates.date

    Object.entries(KEY_MAPPING).forEach(([appKey, dbPrefix]) => {
      const types = ['lab', 'nir', 'anl']
      types.forEach((type) => {
        const val = updates[`${appKey}_${type}`]
        if (val !== undefined) {
          const parsed =
            val === '' ? null : parseFloat(String(val).replace(',', '.'))
          dbUpdates[`${dbPrefix}_${type}`] = isNaN(parsed as number)
            ? null
            : parsed
        }
      })
    })

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
    // Strictly uses the edge function to verify password securely
    const { data, error } = await supabase.functions.invoke('clear-database', {
      body: { companyId, password },
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)
  },

  exportMetricData: async (
    metricKey: string,
    companyId?: string,
  ): Promise<Blob> => {
    const { data, error } = await supabase.functions.invoke(
      'export-metric-data',
      {
        body: { companyId, metricKey },
        responseType: 'blob',
      },
    )

    if (error) throw error
    return data
  },
}
