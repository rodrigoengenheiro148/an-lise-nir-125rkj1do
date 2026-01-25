import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'npm:xlsx'
import { corsHeaders } from '../_shared/cors.ts'

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { companyId, metricKey } = await req.json()

    if (!metricKey) {
      throw new Error('Metric Key is required')
    }

    const dbPrefix = KEY_MAPPING[metricKey]
    if (!dbPrefix) {
      throw new Error(`Invalid metric key: ${metricKey}`)
    }

    // Initialize Supabase Client
    // Using service role to ensure we can read all data for export
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const colLab = `${dbPrefix}_lab`
    const colAnl = `${dbPrefix}_anl`

    let query = supabase
      .from('analysis_records')
      .select(
        `date, material, sub_material, submaterial, companies!inner(name), ${colLab}, ${colAnl}`,
      )
      // Filter to include rows where at least one of the values is present for the requested metric
      .or(`${colLab}.neq.null,${colAnl}.neq.null`)
      .order('date', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) throw error

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ error: 'No data found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Format Data for Excel: Strict ordering
    // 1. LAB
    // 2. ANL
    // 3. Data da Análise
    // 4. Empresa
    // 5. Material
    // 6. Submaterial

    const header = [
      'LAB',
      'ANL',
      'Data da Análise',
      'Empresa',
      'Material',
      'Submaterial',
    ]

    const rows = data.map((record: any) => {
      // Handle company name from join
      const companyName = record.companies?.name || ''
      // Handle submaterial (check both fields)
      const sub = record.sub_material || record.submaterial || ''

      return [
        record[colLab] ?? '', // LAB
        record[colAnl] ?? '', // ANL
        record.date ?? '', // Date
        companyName, // Company
        record.material ?? '', // Material
        sub, // Submaterial
      ]
    })

    const aoa = [header, ...rows]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    XLSX.utils.book_append_sheet(wb, ws, 'Dados')

    // write with type 'buffer' returns Uint8Array in Deno
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new Response(buf, {
      headers: {
        ...corsHeaders,
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="analysis_export.xlsx"`,
      },
    })
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
