import { corsHeaders } from '@supabase/supabase-js/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Check if VAPID keys already exist
    const { data: existing } = await supabase
      .from('vapid_keys')
      .select('public_key')
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ publicKey: existing.public_key, message: 'VAPID keys already exist' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate new VAPID keys
    const vapidKeys = webpush.generateVAPIDKeys()

    const { error } = await supabase
      .from('vapid_keys')
      .insert({
        public_key: vapidKeys.publicKey,
        private_key: vapidKeys.privateKey,
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ publicKey: vapidKeys.publicKey, message: 'VAPID keys generated' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
