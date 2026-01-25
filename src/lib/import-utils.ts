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

  // Strategy Determination
  let useStrictMetricMapping = false
  let dataStartIndex = 1
  let headerMap: HeaderMap[] = []

  // Check if we should use strict mapping (Data Mode) vs Header Mode
  if (targetMetric && targetMetric !== 'auto') {
    const headers = parseRow(firstRow)
    const knownHeaders = [
      'material',
      'submaterial',
      'sub-material',
      'produto',
      'empresa',
      'company',
      'cliente',
      'lab',
      'anl',
      'nir',
      'valor',
      'resultado',
      'value',
      'result',
      ...METRICS.map((m) => normalize(m.label)),
    ]

    // Check matches
    const matches = headers.filter((h) => {
      const norm = normalize(h)
      return knownHeaders.some((kh) => norm.includes(kh))
    }).length

    // Check numbers in first row
    const hasNumbers = headers.some((h) => {
      const val = h.replace(',', '.')
      return !isNaN(parseFloat(val)) && val.trim() !== ''
    })

    // Heuristic: If we don't find enough known headers OR if we find numbers (suggesting data), treat as raw data
    // Requiring at least 2 header matches to be confident, unless row 0 has no numbers and at least 1 match
    if (matches < 2 && hasNumbers) {
      useStrictMetricMapping = true
      dataStartIndex = 0
    } else if (matches === 0) {
      // If absolutely no header matches, assume data
      useStrictMetricMapping = true
      dataStartIndex = 0
    }
  }

  if (!useStrictMetricMapping) {
    const headers = parseRow(rows[0])

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
        for (const suffix of METRIC_SUFFIXES) {
          if (norm.includes(suffix)) {
            headerMap.push({ index, field: `${targetMetric}_${suffix}` })
            return
          }
        }
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

      // Auto-detection logic
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
  }

  const records: AnalysisRecord[] = []
  const errors: string[] = []

  // Process Data Rows
  for (let i = dataStartIndex; i < rows.length; i++) {
    const cols = parseRow(rows[i])
    if (cols.length === 0) continue

    // Check if empty row
    if (cols.length === 1 && cols[0] === '') continue

    const record: any = { id: crypto.randomUUID(), date: null }
    let hasError = false
    let rowErrorPrefix = `Linha ${i + 1}: `

    if (useStrictMetricMapping && targetMetric) {
      // Robust strict mapping logic to prevent shifting
      let currentCols = cols

      // Handle space-separated single column issue if applicable
      if (
        currentCols.length === 1 &&
        separator === ',' &&
        currentCols[0].trim().includes(' ')
      ) {
        currentCols = currentCols[0].split(/\s+/)
      }

      // Identify column types
      const colTypes = currentCols.map((col) => {
        if (!col || col.trim() === '') return 'empty'
        const cleanVal = col.replace(/\s/g, '').replace(',', '.')
        const num = parseFloat(cleanVal)
        return !isNaN(num) ? 'number' : 'string'
      })

      const numbers: number[] = []
      let foundMaterial = ''

      // Heuristic for column mapping based on structure
      // Expected patterns:
      // 1. [String, Number, Number] -> Material, Lab, Anl
      // 2. [Number, Number] -> Lab, Anl
      // 3. [Number, Number, Number] -> ID, Lab, Anl (Take last two)
      // 4. [String, String, Number, Number] -> Material, Submaterial, Lab, Anl

      const numericValues = currentCols
        .map((col) => {
          const cleanVal = col.replace(/\s/g, '').replace(',', '.')
          return parseFloat(cleanVal)
        })
        .filter((n) => !isNaN(n))

      if (numericValues.length >= 2) {
        // If we have at least 2 numbers, assume the LAST two are Lab and Anl (or Lab and Nir depending on request, but standard is Lab/Anl)
        // However, if we only have 2 numbers total, they are Lab and Anl.
        // If we have 3 numbers (e.g. ID, Lab, Anl), take last 2.

        // Take the first available numbers for measurement to align with typical left-to-right reading if explicit structure isn't clear
        // But the "ID" issue requires us to be careful.

        // Let's refine:
        // If col[0] is string -> Material.
        // If col[0] is number and col[1] is number and col[2] is number -> likely ID, Lab, Anl.
        // If col[0] is number and col[1] is number and total cols is 2 -> Lab, Anl.

        if (numericValues.length === 2) {
          record[`${targetMetric}_lab`] = numericValues[0]
          record[`${targetMetric}_anl`] = numericValues[1]
          // Find material in string columns
          const stringColIndex = colTypes.indexOf('string')
          if (stringColIndex !== -1) {
            foundMaterial = currentCols[stringColIndex]
          }
        } else if (numericValues.length > 2) {
          // Assume the first number is an ID if it looks like an integer and small?
          // Safer to take the first two numbers found after any strings, OR simply map strictly:
          // To prevent shifting, we must be consistent.

          // If pattern is Num, Num, Num... assume first is ID.
          // If pattern is Str, Num, Num... assume Mat, Lab, Anl.

          if (colTypes[0] === 'string') {
            foundMaterial = currentCols[0]
            // Find next numbers
            const nextNums = currentCols
              .slice(1)
              .map((c) => parseFloat(c.replace(',', '.')))
              .filter((n) => !isNaN(n))
            if (nextNums.length >= 2) {
              record[`${targetMetric}_lab`] = nextNums[0]
              record[`${targetMetric}_anl`] = nextNums[1]
            }
          } else {
            // First col is number. Assume ID.
            // Take 2nd and 3rd numbers.
            record[`${targetMetric}_lab`] = numericValues[1]
            record[`${targetMetric}_anl`] = numericValues[2]
          }
        } else {
          // Fallback
          record[`${targetMetric}_lab`] = numericValues[0]
          record[`${targetMetric}_anl`] = numericValues[1]
        }
      } else {
        errors.push(
          `${rowErrorPrefix}É necessário dois valores numéricos (LAB e ANL). Encontrado: ${numericValues.length}`,
        )
        hasError = true
      }

      if (!foundMaterial && colTypes[0] === 'string') {
        foundMaterial = currentCols[0]
      }

      record.material = foundMaterial // Might be empty, defaults to Desconhecido later
      record.company = defaultCompany // Strict mode heavily relies on default company
    } else {
      // Standard Header Mapping
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
            const cleanVal = val.replace(/\s/g, '').replace(',', '.')
            const num = parseFloat(cleanVal)
            if (!isNaN(num)) {
              record[map.field] = num
            }
          }
        }
      })

      if (!record.company && defaultCompany) {
        record.company = defaultCompany
      }
    }

    // Common Post-Processing and Validation
    if (!record.company) {
      errors.push(`${rowErrorPrefix}Empresa não identificada.`)
      hasError = true
    } else {
      // Validate if company exists in list
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
        record.company = matched.name
        record.company_id = matched.id
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
