import { AnalysisRecord, METRICS, BULK_IMPORT_ORDER } from '@/types/dashboard'
import { parse, isValid, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface ParseResult {
  records: AnalysisRecord[]
  errors: string[]
  validCount: number
  invalidCount: number
}

export interface HeaderMap {
  index: number
  field: 'material' | 'submaterial' | 'company' | 'date' | string // string for metric keys like 'acidity_lab'
}

// Helper to normalize strings for comparison (remove accents, lowercase)
const normalize = (str: string) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

// Removed 'nir' to stop mapping it automatically
const METRIC_SUFFIXES = ['lab', 'anl', 'nir']

export const parseImportData = (
  content: string,
  defaultCompany?: string,
  existingCompanies: { name: string; id: string }[] = [],
  targetMetric?: string, // The key of the selected metric, 'auto', or 'bulk_strict'
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
  let isBulkStrict = targetMetric === 'bulk_strict'
  let dataStartIndex = 1
  let headerMap: HeaderMap[] = []

  // Check if we should use strict mapping (Data Mode) vs Header Mode
  if (isBulkStrict) {
    // Bulk Strict Mode: Assumes specific column order
    // Order: Date, Material, SubMaterial, then Metrics (ANL, LAB, NIR)
    dataStartIndex = 0
    // Try to detect if first row is header
    const firstCols = parseRow(firstRow)
    const normFirst = normalize(firstCols[0])
    if (
      normFirst === 'data' ||
      normFirst === 'date' ||
      normFirst.includes('material')
    ) {
      dataStartIndex = 1
    }
  } else if (targetMetric && targetMetric !== 'auto') {
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
      'valor',
      'resultado',
      'value',
      'result',
      'data',
      'date',
      'data da analise',
      ...METRICS.flatMap((m) => [
        normalize(m.label),
        normalize(m.key),
        ...(m.aliases?.map(normalize) || []),
      ]),
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
    if (matches < 2 && hasNumbers) {
      useStrictMetricMapping = true
      dataStartIndex = 0
    } else if (matches === 0) {
      // If absolutely no header matches, assume data
      useStrictMetricMapping = true
      dataStartIndex = 0
    }
  }

  if (!useStrictMetricMapping && !isBulkStrict) {
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
      if (
        norm === 'data' ||
        norm === 'date' ||
        norm === 'data da analise' ||
        norm === 'data analise'
      ) {
        headerMap.push({ index, field: 'date' })
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
        const metricAliases = metricObj?.aliases?.map(normalize) || []

        if (
          norm === 'valor' ||
          norm === 'resultado' ||
          norm === 'value' ||
          norm === 'result' ||
          norm === targetMetric.toLowerCase() ||
          (metricLabel && norm.includes(metricLabel)) ||
          metricAliases.some((a) => norm.includes(a))
        ) {
          headerMap.push({ index, field: `${targetMetric}_lab` })
          return
        }
        return
      }

      // Auto-detection logic (All metrics or 'auto')
      for (const metric of METRICS) {
        const metricName = normalize(metric.label)
        const metricKey = normalize(metric.key)
        const aliases = metric.aliases?.map(normalize) || []

        const isMatch =
          norm.includes(metricName) ||
          norm.includes(metricKey) ||
          aliases.some((a) => norm.includes(a))

        if (isMatch) {
          for (const suffix of METRIC_SUFFIXES) {
            if (norm.includes(suffix)) {
              headerMap.push({ index, field: `${metric.key}_${suffix}` })
              return
            }
          }
          // Fallback if matched name but no suffix - assume lab if no conflicting suffix found
          headerMap.push({ index, field: `${metric.key}_lab` })
          return
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

    if (isBulkStrict) {
      // Strict Order: Date, Material, SubMaterial
      // Then Metrics: Acidity, Calcium, EtherExtract, FCO, MineralMatter, Moisture, Peroxide, Phosphorus, Protein, ProteinDigestibility, Sodium
      // Each Metric: ANL, LAB, NIR

      let colIdx = 0
      const getCol = () => {
        const val = cols[colIdx]
        colIdx++
        return val
      }

      // Date
      const dateStr = getCol()
      if (dateStr) {
        let parsedDate: Date | null = null
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date())
        } else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
          parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date(), {
            locale: ptBR,
          })
        }
        if (parsedDate && isValid(parsedDate)) {
          record.date = format(parsedDate, 'yyyy-MM-dd')
        }
      }

      // Material & SubMaterial
      record.material = getCol()
      record.submaterial = getCol()

      // Metrics
      BULK_IMPORT_ORDER.forEach((metricKey) => {
        const anl = getCol()
        const lab = getCol()
        const nir = getCol()

        const parseNum = (v: string | undefined) => {
          if (!v) return undefined
          const clean = v.replace(/\s/g, '').replace(',', '.')
          const n = parseFloat(clean)
          return isNaN(n) ? undefined : n
        }

        if (anl) record[`${metricKey}_anl`] = parseNum(anl)
        if (lab) record[`${metricKey}_lab`] = parseNum(lab)
        if (nir) record[`${metricKey}_nir`] = parseNum(nir)
      })

      record.company = defaultCompany
    } else if (useStrictMetricMapping && targetMetric) {
      // Robust strict mapping logic (Single Metric)
      let currentCols = cols
      if (
        currentCols.length === 1 &&
        separator === ',' &&
        currentCols[0].trim().includes(' ')
      ) {
        currentCols = currentCols[0].split(/\s+/)
      }

      const colTypes = currentCols.map((col) => {
        if (!col || col.trim() === '') return 'empty'
        const cleanVal = col.replace(/\s/g, '').replace(',', '.')
        const num = parseFloat(cleanVal)
        return !isNaN(num) ? 'number' : 'string'
      })

      const numericValues = currentCols
        .map((col) => {
          const cleanVal = col.replace(/\s/g, '').replace(',', '.')
          return parseFloat(cleanVal)
        })
        .filter((n) => !isNaN(n))

      if (numericValues.length >= 2) {
        // Strict mapping: 1st number = LAB, 2nd number = ANL
        record[`${targetMetric}_lab`] = numericValues[0]
        record[`${targetMetric}_anl`] = numericValues[1]

        // Find material in string columns if available
        const stringColIndex = colTypes.indexOf('string')
        if (stringColIndex !== -1) {
          record.material = currentCols[stringColIndex]
        }
      } else {
        errors.push(
          `${rowErrorPrefix}É necessário pelo menos dois valores numéricos (LAB e ANL).`,
        )
        hasError = true
      }
      record.company = defaultCompany
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
          } else if (map.field === 'date') {
            const dateStr = val.trim()
            let parsedDate: Date | null = null
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date())
            } else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
              parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date(), {
                locale: ptBR,
              })
            }
            if (parsedDate && isValid(parsedDate)) {
              record.date = format(parsedDate, 'yyyy-MM-dd')
            }
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
