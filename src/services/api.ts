import { supabase } from '@/lib/supabase/client'
import { AnalysisRecord, CompanyEntity } from '@/types/dashboard'
import { MOCK_COMPANIES, MOCK_RECORDS } from '@/lib/mockData'

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

    // Fallback to mock data if empty or error (reverting to stable state)
    if (error || !data || data.length === 0) {
      console.warn(
        'Using Mock Data for Companies due to empty DB or error',
        error,
      )
      return MOCK_COMPANIES
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

    if (error || !data || data.length === 0) {
      // Return mock records if no data found
      return MOCK_RECORDS
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

    if (material) {
      query = query.eq('material', material)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(10000)

    // Fallback to mock data if empty
    if ((!data || data.length === 0) && !error) {
      const mockRecs = MOCK_RECORDS.filter(
        (r) =>
          r.company_id === companyId && (!material || r.material === material),
      )
      if (mockRecs.length > 0) return mockRecs
    }

    if (error) throw error

    return (data || []).map((row) => {
      const comp = (row.companies as any) || { name: 'Unknown' }
      return transformRecordFromDB(row, comp)
    })
  },

  getMaterialsByCompany: async (companyId: string): Promise<string[]> => {
    // Check mock data first if using mock company
    if (companyId.startsWith('mock-')) {
      const materials = MOCK_RECORDS.filter(
        (r) => r.company_id === companyId,
      ).map((r) => r.material!)
      return Array.from(new Set(materials)).sort()
    }

    const { data, error } = await supabase
      .from('analysis_records')
      .select('material')
      .eq('company_id', companyId)
      .not('material', 'is', null)
      .limit(5000)

    if (error) throw error

    const materials = data?.map((d) => d.material).filter(Boolean) as string[]
    return Array.from(new Set(materials)).sort()
  },

  getUniqueMaterials: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('analysis_records')
      .select('material')
      .limit(10000)

    if (error) throw error

    return Array.from(
      new Set(data?.map((d) => d.material).filter(Boolean) as string[]),
    ).sort()
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

  deleteCompanyRecords: async (companyId: string) => {
    const { error } = await supabase
      .from('analysis_records')
      .delete()
      .eq('company_id', companyId)

    if (error) throw error
  },

  deleteAllRecords: async () => {
    const { error } = await supabase
      .from('analysis_records')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) throw error
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
