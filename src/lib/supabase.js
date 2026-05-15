import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'

export const supabase =
  env.supabaseUrl && env.supabasePublishableKey
    ? createClient(env.supabaseUrl, env.supabasePublishableKey)
    : null

export const supabaseAdmin =
  env.supabaseUrl && env.supabaseServiceRoleKey
    ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null
