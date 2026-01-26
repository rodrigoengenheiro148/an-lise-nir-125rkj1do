import {
  AnalysisRecord,
  METRICS,
  CompanyEntity,
  MATERIALS_OPTIONS,
} from '@/types/dashboard'
import { subDays, format } from 'date-fns'

export const MOCK_COMPANIES: CompanyEntity[] = [
  { id: 'mock-1', name: 'Brasmix', created_at: new Date().toISOString() },
  {
    id: 'mock-2',
    name: 'Mar Reciclagem',
    created_at: new Date().toISOString(),
  },
  { id: 'mock-3', name: 'Farinorte', created_at: new Date().toISOString() },
  { id: 'mock-4', name: 'Juina', created_at: new Date().toISOString() },
]

const generateMockRecords = (): AnalysisRecord[] => {
  const records: AnalysisRecord[] = []
  const today = new Date()

  MOCK_COMPANIES.forEach((company) => {
    MATERIALS_OPTIONS.forEach((material) => {
      // Generate 15 records per material per company
      for (let i = 0; i < 15; i++) {
        const date = subDays(today, i)
        const record: AnalysisRecord = {
          id: `${company.id}-${material}-${i}`,
          company: company.name,
          company_id: company.id,
          material: material,
          date: format(date, 'yyyy-MM-dd'),
          created_at: date.toISOString(),
        }

        METRICS.forEach((metric) => {
          // Generate realistic values with some noise
          const base = Math.random() * 50 + 10
          const error = (Math.random() - 0.5) * 2 // +/- 1

          record[`${metric.key}_lab`] = parseFloat(base.toFixed(2))
          record[`${metric.key}_anl`] = parseFloat((base + error).toFixed(2))
          // NIR often close to ANL or LAB
          record[`${metric.key}_nir`] = parseFloat(
            (base + error * 0.8).toFixed(2),
          )
        })

        records.push(record)
      }
    })
  })

  return records.sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime()
    const dateB = new Date(b.date || 0).getTime()
    return dateB - dateA
  })
}

export const MOCK_RECORDS = generateMockRecords()

// For backward compatibility if imported elsewhere
export const INITIAL_SAMPLES = []
