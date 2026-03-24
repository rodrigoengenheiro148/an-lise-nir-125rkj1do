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

      const updatePayload = {
        [`${dbPrefix}_lab`]: null,
        [`${dbPrefix}_nir`]: null,
        [`${dbPrefix}_anl`]: null,
      }

      // Explicit branching to ensure the query builder applies filters safely and correctly
      if (companyId && companyId !== 'all') {
        if (material && material !== 'all') {
          const { error } = await supabaseClient
            .from('analysis_records')
            .update(updatePayload)
            .eq('company_id', companyId)
            .eq('material', material)
          if (error) throw error
        } else {
          const { error } = await supabaseClient
            .from('analysis_records')
            .update(updatePayload)
            .eq('company_id', companyId)
          if (error) throw error
        }
      } else {
        const { error } = await supabaseClient
          .from('analysis_records')
          .update(updatePayload)
          .neq('id', '00000000-0000-0000-0000-000000000000')
        if (error) throw error
      }
    } else {
      // Standard deletion of rows - explicit branching for safety
      if (companyId && companyId !== 'all') {
        if (material && material !== 'all') {
          // EXPLICIT ISOLATED DELETE: Only delete the exact specified material for the company
          const { error } = await supabaseClient
            .from('analysis_records')
            .delete()
            .eq('company_id', companyId)
            .eq('material', material)
          if (error) throw error
        } else {
          // Delete entire company
          const { error } = await supabaseClient
            .from('analysis_records')
            .delete()
            .eq('company_id', companyId)
          if (error) throw error
        }
      } else {
        // Delete ALL records
        const { error } = await supabaseClient
          .from('analysis_records')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
        if (error) throw error
      }
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
