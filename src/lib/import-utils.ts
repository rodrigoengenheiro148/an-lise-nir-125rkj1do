import { AnalysisRecord, METRICS } from '@/types/dashboard'

export interface ParseResult {
  records: AnalysisRecord[]
  errors: string[]
  validCount: number
  invalidCount: number
}

export interface HeaderMap {
  index: number
  field: 'material' | 'submaterial' | 'company' | string // string for metric keys like 'acidity_lab'
}

// Helper to normalize strings for comparison (remove accents, lowercase)
const normalize = (str: string) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const METRIC_SUFFIXES = ['lab', 'nir', 'anl']

export const parseImportData = (
  content: string,
  defaultCompany?: string,
  existingCompanies: { name: string; id: string }[] = [],
  targetMetric?: string, // The key of the selected metric (e.g., 'moisture') or 'auto'
): ParseResult => {
  const rows = content
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter((row) => row.length > 0)
  if (rows.length === 0)
    return {
      records: [],
      errors: ['Arquivo vazio.'],
      validCount: 0,
      invalidCount: 0,
    }

  // Detect separator (comma or tab or semicolon)
  const firstRow = rows[0]
  let separator = ','
  if (firstRow.includes('\t')) separator = '\t'
  else if (firstRow.includes(';')) separator = ';'

  const parseRow = (rowStr: string) => {
    // Basic CSV parser handling quotes
    const result = []
    let cell = ''
    let insideQuote = false
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i]
      if (char === '"') {
        insideQuote = !insideQuote
      } else if (char === separator && !insideQuote) {
        result.push(cell.trim())
        cell = ''
      } else {
        cell += char
      }
    }
    result.push(cell.trim())
    return result.map((c) => c.replace(/^"|"$/g, '').trim())
  }

  const headers = parseRow(rows[0])
  const headerMap: HeaderMap[] = []

  // Build Header Mapping
  headers.forEach((h, index) => {
    const norm = normalize(h)

    if (norm === 'material' || norm === 'produto' || norm === 'product') {
      headerMap.push({ index, field: 'material' })
      return
    }
    if (
      norm === 'submaterial' ||
      norm === 'sub-material' ||
      norm === 'sub material' ||
      norm === 'tipo'
    ) {
      headerMap.push({ index, field: 'submaterial' })
      return
    }
    if (norm === 'empresa' || norm === 'company' || norm === 'cliente') {
      headerMap.push({ index, field: 'company' })
      return
    }

    // Logic when a specific metric is targeted
    if (targetMetric && targetMetric !== 'auto') {
      // Check for suffixes to map to specific types (lab, nir, anl)
      for (const suffix of METRIC_SUFFIXES) {
        if (norm.includes(suffix)) {
          headerMap.push({ index, field: `${targetMetric}_${suffix}` })
          return
        }
      }

      // Check for generic value headers or the metric name itself, default to LAB
      const metricObj = METRICS.find((m) => m.key === targetMetric)
      const metricLabel = metricObj ? normalize(metricObj.label) : ''

      if (
        norm === 'valor' ||
        norm === 'resultado' ||
        norm === 'value' ||
        norm === 'result' ||
        norm === targetMetric.toLowerCase() ||
        (metricLabel && norm.includes(metricLabel))
      ) {
        headerMap.push({ index, field: `${targetMetric}_lab` })
        return
      }

      return
    }

    // Auto-detection logic (existing behavior)
    // Format expected: "Acidez LAB", "Moisture (NIR)", "Protein_ANL"
    for (const metric of METRICS) {
      const metricName = normalize(metric.label)
      const metricKey = normalize(metric.key)

      if (norm.includes(metricName) || norm.includes(metricKey)) {
        for (const suffix of METRIC_SUFFIXES) {
          if (norm.includes(suffix)) {
            headerMap.push({ index, field: `${metric.key}_${suffix}` })
            return
          }
        }
      }
    }
  })

  const records: AnalysisRecord[] = []
  const errors: string[] = []

  // Process Data Rows
  for (let i = 1; i < rows.length; i++) {
    const cols = parseRow(rows[i])
    if (cols.length < 2) continue // Skip empty or malformed lines

    const record: any = { id: crypto.randomUUID(), date: null }
    let hasError = false
    let rowErrorPrefix = `Linha ${i + 1}: `

    // Apply Mapping
    headerMap.forEach((map) => {
      if (cols[map.index] !== undefined) {
        const val = cols[map.index]
        if (map.field === 'company') {
          record.company = val
        } else if (map.field === 'material') {
          record.material = val
        } else if (map.field === 'submaterial') {
          record.submaterial = val
        } else {
          // Metric value
          // Handle various number formats (commas, spaces)
          const cleanVal = val.replace(/\s/g, '').replace(',', '.')
          const num = parseFloat(cleanVal)
          if (!isNaN(num)) {
            record[map.field] = num
          }
        }
      }
    })

    // Default values / Fallbacks
    if (!record.company && defaultCompany) {
      record.company = defaultCompany
    }

    if (!record.company) {
      errors.push(`${rowErrorPrefix}Empresa não identificada.`)
      hasError = true
    } else {
      // Validate if company exists in list (fuzzy match)
      const matched = existingCompanies.find(
        (c) =>
          normalize(c.name) === normalize(record.company) ||
          c.id === record.company,
      )
      if (!matched) {
        errors.push(
          `${rowErrorPrefix}Empresa '${record.company}' não encontrada no sistema.`,
        )
        hasError = true
      } else {
        record.company = matched.name // Normalize name
      }
    }

    if (!record.material) {
      record.material = 'Desconhecido'
    }

    if (!hasError) {
      records.push(record as AnalysisRecord)
    }
  }

  return {
    records,
    errors,
    validCount: records.length,
    invalidCount: errors.length,
  }
}
