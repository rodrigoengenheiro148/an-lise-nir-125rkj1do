import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
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

    if (!companyId || !metricKey) {
      throw new Error('Company ID and Metric Key are required')
    }

    const dbPrefix = KEY_MAPPING[metricKey]
    if (!dbPrefix) {
      throw new Error(`Invalid metric key: ${metricKey}`)
    }

    // Initialize Supabase Client
    // Using service role to ensure we can read all data for export,
    // assuming the frontend request is authenticated and authorized to ask for this export.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const colLab = `${dbPrefix}_lab`
    const colAnl = `${dbPrefix}_anl`

    const { data, error } = await supabase
      .from('analysis_records')
      .select(`id, ${colLab}, ${colAnl}`)
      .eq('company_id', companyId)
      // Filter to include rows where at least one of the values is present
      .or(`${colLab}.neq.null,${colAnl}.neq.null`)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Format Data for Excel: "LAB" and "ANL" columns
    const aoa = [['LAB', 'ANL']]

    data.forEach((row: any) => {
      aoa.push([
        row[colLab] ?? '', // Value or empty string
        row[colAnl] ?? '',
      ])
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    XLSX.utils.book_append_sheet(wb, ws, 'Dados')

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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
