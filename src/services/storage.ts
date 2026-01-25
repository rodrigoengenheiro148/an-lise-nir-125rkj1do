import { AnalysisRecord, COMPANIES, METRICS } from '@/types/dashboard'

const STORAGE_KEY = 'agricultural-dashboard-data-v1'

// Generate some mock data if empty
const generateMockData = (): AnalysisRecord[] => {
  const records: AnalysisRecord[] = []
  const baseDate = new Date()

  COMPANIES.forEach((company) => {
    for (let i = 0; i < 50; i++) {
      const date = new Date(baseDate)
      date.setDate(date.getDate() - i)

      records.push({
        id: crypto.randomUUID(),
        company,
        date: date.toISOString().split('T')[0],
        acidity: Number((Math.random() * 2 + 0.5).toFixed(2)),
        moisture: Number((Math.random() * 5 + 10).toFixed(2)),
        fco: Number((Math.random() * 10 + 20).toFixed(2)),
        protein: Number((Math.random() * 10 + 30).toFixed(2)),
        phosphorus: Number((Math.random() * 1 + 0.5).toFixed(2)),
        mineralMatter: Number((Math.random() * 3 + 4).toFixed(2)),
        peroxide: Number((Math.random() * 5).toFixed(2)),
        etherExtract: Number((Math.random() * 10 + 5).toFixed(2)),
        proteinDigestibility: Number((Math.random() * 10 + 80).toFixed(2)),
        calcium: Number((Math.random() * 2 + 1).toFixed(2)),
      })
    }
  })

  return records
}

// Mock Supabase Service using LocalStorage
// In a real implementation with the SDK available, this would use supabase.from('analysis_records').select('*')
export const storageService = {
  getRecords: (): AnalysisRecord[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        const mockData = generateMockData()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData))
        return mockData
      }
      return JSON.parse(stored)
    } catch (e) {
      console.error('Failed to load records', e)
      return []
    }
  },

  saveRecords: (records: AnalysisRecord[]) => {
    try {
      // Merge with existing or overwrite? For this demo, we'll append imported ones or just replace mock
      // Let's grab existing first to simulate a DB
      const existing = storageService.getRecords()
      const newDataset = [...existing, ...records]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDataset))
      return newDataset
    } catch (e) {
      console.error('Failed to save records', e)
      return []
    }
  },

  clearData: () => {
    localStorage.removeItem(STORAGE_KEY)
  },
}
