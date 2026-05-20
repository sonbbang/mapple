import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
)

export interface Review {
  id: string
  place_id: string
  place_name: string
  rating: number
  comment: string | null
  revisit: boolean | null
  visited_at: string
}
