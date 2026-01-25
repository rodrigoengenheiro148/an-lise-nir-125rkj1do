import { AnalysisRecord, DEFAULT_COMPANIES, METRICS } from '@/types/dashboard'

const STORAGE_KEY = 'analise-nir-dashboard-v3'
const COMPANIES_KEY = 'analise-nir-companies-v1'

const randomGaussian = (mean: number, stdev: number) => {
  const u = 1 - Math.random()
  const v = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return z * stdev + mean
}

const generateMockData = (companies: string[]): AnalysisRecord[] => {
  const records: AnalysisRecord[] = []
  const baseDate = new Date()

  companies.forEach((company) => {
    const count = 30 + Math.floor(Math.random() * 20)

    for (let i = 0; i < count; i++) {
      const date = new Date(baseDate)
      date.setDate(date.getDate() - i)

      const record: any = {
        id: crypto.randomUUID(),
        company,
        date: date.toISOString().split('T')[0],
      }

      // Helper to gen Lab vs NIR pairs
      const genPair = (mean: number, dev: number) => {
        const lab = Math.max(0.1, randomGaussian(mean, dev))
        const error = randomGaussian(0, dev * 0.1)
        const nir = lab + error + (Math.random() > 0.5 ? 0.05 : -0.05)
        return {
          lab: Number(lab.toFixed(2)),
          nir: Number(nir.toFixed(2)),
        }
      }

      // Generate based on METRICS
      METRICS.forEach((m) => {
        let mean = 10,
          dev = 2
        if (m.key === 'protein') {
          mean = 35
          dev = 4
        }
        if (m.key === 'moisture') {
          mean = 12
          dev = 1.5
        }
        if (m.key === 'calcium') {
          mean = 1.5
          dev = 0.4
        }

        const pair = genPair(mean, dev)
        record[`${m.key}_lab`] = pair.lab
        record[`${m.key}_nir`] = pair.nir
      })

      records.push(record)
    }
  })

  return records
}

export const storageService = {
  getCompanies: (): string[] => {
    try {
      const stored = localStorage.getItem(COMPANIES_KEY)
      if (!stored) {
        localStorage.setItem(COMPANIES_KEY, JSON.stringify(DEFAULT_COMPANIES))
        return DEFAULT_COMPANIES
      }
      return JSON.parse(stored)
    } catch (e) {
      return DEFAULT_COMPANIES
    }
  },

  addCompany: (name: string): string[] => {
    const companies = storageService.getCompanies()
    if (!companies.includes(name)) {
      const newCompanies = [...companies, name]
      localStorage.setItem(COMPANIES_KEY, JSON.stringify(newCompanies))
      return newCompanies
    }
    return companies
  },

  getRecords: (): AnalysisRecord[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        const companies = storageService.getCompanies()
        const mockData = generateMockData(companies)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData))
        return mockData
      }
      return JSON.parse(stored)
    } catch (e) {
      console.error('Failed to load records from storage', e)
      return []
    }
  },

  saveRecords: (records: AnalysisRecord[]) => {
    try {
      const existing = storageService.getRecords()
      const newDataset = [...existing, ...records]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDataset))
      return newDataset
    } catch (e) {
      console.error('Failed to save records to storage', e)
      return []
    }
  },

  clearData: () => {
    localStorage.removeItem(STORAGE_KEY)
    // Optionally reset companies or keep them
  },
}
