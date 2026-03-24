import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { companyId, password, material } = await req.json()

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

    let query = supabaseClient.from('analysis_records').delete()

    if (companyId && companyId !== 'all') {
      // Delete specific company records
      query = query.eq('company_id', companyId)
      
      // If a specific material is provided, filter by it
      if (material) {
        query = query.ilike('material', material)
      }
    } else {
      // Delete ALL records if companyId is not provided or explicitly 'all'
      // We use a filter that matches everything (id not equals nil UUID) to satisfy delete requirements
      query = query.neq('id', '00000000-0000-0000-0000-000000000000')
    }

    const { error } = await query

    if (error) throw error

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
