import { Company, Sample, ANALYSIS_TYPES } from './types'

export const COMPANIES: Company[] = [
  { id: 'c1', name: 'Empresa Alpha' },
  { id: 'c2', name: 'Agro Beta Ltda' },
  { id: 'c3', name: 'Cereais Delta' },
  { id: 'c4', name: 'Fazenda Omega' },
  { id: 'c5', name: 'Nutri Epsilon' },
  { id: 'c6', name: 'Grãos Zeta' },
]

function randomGaussian(mean: number, stdev: number) {
  const u = 1 - Math.random()
  const v = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return z * stdev + mean
}

export const generateMockSamples = (): Sample[] => {
  const samples: Sample[] = []
  const startDate = new Date('2025-01-01')

  COMPANIES.forEach((company) => {
    ANALYSIS_TYPES.forEach((type) => {
      // Define ranges based on analysis type to be realistic
      let baseMean = 10
      let baseVar = 2
      let correlation = 0.95 + Math.random() * 0.04 // High correlation for NIR

      switch (type) {
        case 'UMIDADE':
          baseMean = 12
          baseVar = 1.5
          break
        case 'PROTEINA':
          baseMean = 25
          baseVar = 4
          break
        case 'ACIDEZ':
          baseMean = 1.5
          baseVar = 0.5
          break
        case 'EXTRATO_ETEREO':
          baseMean = 18
          baseVar = 3
          break
        default:
          baseMean = 5
          baseVar = 2
          break
      }

      const count = 20 + Math.floor(Math.random() * 30) // 20-50 samples

      for (let i = 0; i < count; i++) {
        const labVal = Math.max(0, randomGaussian(baseMean, baseVar))
        // Simulate NIR value with some error but correlated
        const error = randomGaussian(0, baseVar * 0.05)
        const nirVal = Math.max(
          0,
          labVal * correlation + error + (Math.random() * 0.5 - 0.25),
        ) // Slight bias

        samples.push({
          id: `${company.id}-${type}-${i}`,
          companyId: company.id,
          date: new Date(startDate.getTime() + i * 86400000).toISOString(),
          analysisType: type,
          labValue: parseFloat(labVal.toFixed(2)),
          nirValue: parseFloat(nirVal.toFixed(2)),
        })
      }
    })
  })
  return samples
}

export const INITIAL_SAMPLES = generateMockSamples()
