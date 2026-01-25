import { AnalysisRecord, COMPANIES } from '@/types/dashboard'

const STORAGE_KEY = 'analise-nir-dashboard-v2'

const randomGaussian = (mean: number, stdev: number) => {
  const u = 1 - Math.random()
  const v = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return z * stdev + mean
}

const generateMockData = (): AnalysisRecord[] => {
  const records: AnalysisRecord[] = []
  const baseDate = new Date()

  COMPANIES.forEach((company) => {
    // Generate 30-50 samples per company
    const count = 30 + Math.floor(Math.random() * 20)

    for (let i = 0; i < count; i++) {
      const date = new Date(baseDate)
      date.setDate(date.getDate() - i)

      // Helper to gen Lab vs NIR pairs with high correlation
      const genPair = (mean: number, dev: number, r2: number = 0.95) => {
        const lab = Math.max(0.1, randomGaussian(mean, dev))
        const error = randomGaussian(0, dev * 0.1) // Noise
        const nir = lab + error + (Math.random() > 0.5 ? 0.05 : -0.05) // Slight bias
        return {
          lab: Number(lab.toFixed(2)),
          nir: Number(nir.toFixed(2)),
        }
      }

      const acidity = genPair(1.5, 0.5)
      const moisture = genPair(12.0, 1.5)
      const fco = genPair(25.0, 5.0)
      const protein = genPair(35.0, 4.0)
      const phosphorus = genPair(0.8, 0.2)
      const mineralMatter = genPair(5.0, 1.0)
      const peroxide = genPair(2.5, 1.0)
      const etherExtract = genPair(9.0, 2.0)
      const proteinDigestibility = genPair(85.0, 5.0)
      const calcium = genPair(1.5, 0.4)
      const sodium = genPair(0.3, 0.1)

      records.push({
        id: crypto.randomUUID(),
        company,
        date: date.toISOString().split('T')[0],
        acidity_lab: acidity.lab,
        acidity_nir: acidity.nir,
        moisture_lab: moisture.lab,
        moisture_nir: moisture.nir,
        fco_lab: fco.lab,
        fco_nir: fco.nir,
        protein_lab: protein.lab,
        protein_nir: protein.nir,
        phosphorus_lab: phosphorus.lab,
        phosphorus_nir: phosphorus.nir,
        mineralMatter_lab: mineralMatter.lab,
        mineralMatter_nir: mineralMatter.nir,
        peroxide_lab: peroxide.lab,
        peroxide_nir: peroxide.nir,
        etherExtract_lab: etherExtract.lab,
        etherExtract_nir: etherExtract.nir,
        proteinDigestibility_lab: proteinDigestibility.lab,
        proteinDigestibility_nir: proteinDigestibility.nir,
        calcium_lab: calcium.lab,
        calcium_nir: calcium.nir,
        sodium_lab: sodium.lab,
        sodium_nir: sodium.nir,
      })
    }
  })

  return records
}

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
