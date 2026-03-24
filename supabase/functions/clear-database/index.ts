import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
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
  fat: 'fat',
  proteinDigestibility: 'protein_digestibility',
  calcium: 'calcium',
  sodium: 'sodium',
  iodine: 'iodine',
  impurity: 'impurity',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { companyId, password, material, metricKey } = await req.json()

    // Server-side validation of the password
    if (password !== '16071997') {
      return new Response(JSON.stringify({ error: 'Senha incorreta.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    if (metricKey) {
      // Clear a specific parameter (metric) for the company
      const dbPrefix = KEY_MAPPING[metricKey]
      if (!dbPrefix) throw new Error('Invalid metric key')

      let query = supabaseClient.from('analysis_records').update({
        [`${dbPrefix}_lab`]: null,
        [`${dbPrefix}_nir`]: null,
        [`${dbPrefix}_anl`]: null,
      })

      if (companyId && companyId !== 'all') {
        query = query.eq('company_id', companyId)
      } else {
        query = query.neq('id', '00000000-0000-0000-0000-000000000000')
      }

      if (material && material !== 'all') {
        query = query.ilike('material', material)
      }

      const { error } = await query
      if (error) throw error

    } else {
      // Standard deletion of rows
      let query = supabaseClient.from('analysis_records').delete()

      if (companyId && companyId !== 'all') {
        query = query.eq('company_id', companyId)
        
        if (material && material !== 'all') {
          query = query.ilike('material', material)
        }
      } else {
        // Delete ALL records
        query = query.neq('id', '00000000-0000-0000-0000-000000000000')
      }

      const { error } = await query
      if (error) throw error
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
