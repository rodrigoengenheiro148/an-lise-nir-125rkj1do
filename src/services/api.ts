import { supabase } from '@/lib/supabase/client'
import { AnalysisRecord, CompanyEntity, MetricKey } from '@/types/dashboard'

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
  companyName: string,
): AnalysisRecord => {
  const record: AnalysisRecord = {
    id: row.id,
    company: companyName,
    company_id: row.company_id,
    date: row.date,
    material: row.material,
  }

  Object.entries(KEY_MAPPING).forEach(([appKey, dbPrefix]) => {
    record[`${appKey}_lab`] = row[`${dbPrefix}_lab`] ?? 0
    record[`${appKey}_nir`] = row[`${dbPrefix}_nir`] ?? 0
    record[`${appKey}_anl`] = row[`${dbPrefix}_anl`] ?? 0
  })

  return record
}

const transformRecordToDB = (record: AnalysisRecord, companyId: string) => {
  const dbRow: any = {
    company_id: companyId,
    date: record.date,
    material: record.material,
  }

  Object.entries(KEY_MAPPING).forEach(([appKey, dbPrefix]) => {
    dbRow[`${dbPrefix}_lab`] = parseFloat(String(record[`${appKey}_lab`] || 0))
    dbRow[`${dbPrefix}_nir`] = parseFloat(String(record[`${appKey}_nir`] || 0))
    dbRow[`${dbPrefix}_anl`] = parseFloat(String(record[`${appKey}_anl`] || 0))
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
    const { data, error } = await supabase
      .from('analysis_records')
      .select('*, companies(name)')
      .order('date', { ascending: false })

    if (error) throw error

    return (data || []).map((row) =>
      transformRecordFromDB(row, (row.companies as any)?.name || 'Unknown'),
    )
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

  updateRecord: async (id: string, updates: Partial<AnalysisRecord>) => {
    const dbUpdates: any = {}
    if (updates.date) dbUpdates.date = updates.date
    if (updates.material !== undefined) dbUpdates.material = updates.material

    Object.keys(updates).forEach((key) => {
      if (
        key.endsWith('_lab') ||
        key.endsWith('_nir') ||
        key.endsWith('_anl')
      ) {
        const metricKey = key
          .replace('_lab', '')
          .replace('_nir', '')
          .replace('_anl', '')
        const type = key.endsWith('_lab')
          ? 'lab'
          : key.endsWith('_nir')
            ? 'nir'
            : 'anl'
        const dbPrefix = KEY_MAPPING[metricKey]
        if (dbPrefix) {
          dbUpdates[`${dbPrefix}_${type}`] = parseFloat(String(updates[key]))
        }
      }
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
