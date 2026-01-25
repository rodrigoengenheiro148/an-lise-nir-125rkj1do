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
}

const transformRecordFromDB = (
  row: any,
  company: { name: string; logo_url?: string | null },
): AnalysisRecord => {
  const record: AnalysisRecord = {
    id: row.id,
    company: company.name,
    company_id: row.company_id,
    company_logo: company.logo_url || undefined,
    date: row.date,
    material: row.material,
    submaterial: row.sub_material || row.submaterial || undefined,
  }

  Object.entries(KEY_MAPPING).forEach(([appKey, dbPrefix]) => {
    record[`${appKey}_lab`] = row[`${dbPrefix}_lab`] ?? 0
    record[`${appKey}_nir`] = row[`${dbPrefix}_nir`] ?? 0
    record[`${appKey}_anl`] = row[`${dbPrefix}_anl`] ?? 0
  })

  return record
}

const transformRecordToDB = (
  record: Partial<AnalysisRecord>,
  companyId: string,
) => {
  const dbRow: any = {
    company_id: companyId,
    date: record.date,
    material: record.material,
    sub_material: record.submaterial,
  }

  Object.entries(KEY_MAPPING).forEach(([appKey, dbPrefix]) => {
    // Helper to safely parse float
    const parseVal = (val: any) => {
      if (val === undefined || val === null || val === '') return null
      const num = parseFloat(String(val).replace(',', '.'))
      return isNaN(num) ? null : num
    }

    const lab = parseVal(record[`${appKey}_lab`])
    const nir = parseVal(record[`${appKey}_nir`])
    const anl = parseVal(record[`${appKey}_anl`])

    // Only add if not undefined (to allow partial updates if needed, though usually full record)
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
    if (error) throw error
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
    // Updated query to fetch logo_url
    const { data, error } = await supabase
      .from('analysis_records')
      .select('*, companies(name, logo_url)')
      .order('date', { ascending: false })

    if (error) throw error

    return (data || []).map((row) => {
      const comp = (row.companies as any) || { name: 'Unknown' }
      return transformRecordFromDB(row, comp)
    })
  },

  getUniqueMaterials: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('analysis_records')
      .select('material')

    if (error) throw error

    // Deduplicate and sort
    const unique = Array.from(
      new Set(data?.map((d) => d.material).filter(Boolean) as string[]),
    ).sort()
    return unique
  },

  saveRecords: async (records: AnalysisRecord[]) => {
    const companies = await api.getCompanies()
    const rowsToInsert = records
      .map((r) => {
        const company = companies.find((c) => c.name === r.company)
        if (!company) return null
        return transformRecordToDB(r, company.id)
      })
      .filter(Boolean)

    if (rowsToInsert.length === 0) return

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
    if (updates.date) dbUpdates.date = updates.date
    if (updates.material !== undefined) dbUpdates.material = updates.material
    if (updates.submaterial !== undefined)
      dbUpdates.sub_material = updates.submaterial
    if (updates.company_id) dbUpdates.company_id = updates.company_id

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

  subscribeToRecords: (callback: () => void) => {
    const subscription = supabase
      .channel('public:analysis_records')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'analysis_records' },
        callback,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  },
}
