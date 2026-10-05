import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as ReturnType<typeof createClient>)

export type Template = {
  id: string
  name: string
  slug: string
  legal_text: string
  created_at: string
}

export type Project = {
  id: string
  name: string
  default_template_id: string
  status: 'active' | 'wrapped'
  created_at: string
  templates?: Template
  release_count?: number
}

export type Release = {
  id: string
  project_id: string
  template_id: string
  signer_name: string
  signer_email: string | null
  signer_phone: string | null
  signer_address: string | null
  signature_data: string
  emergency_contact_name: string | null
  emergency_contact_relationship: string | null
  emergency_contact_phone: string | null
  ip_address: string | null
  signed_at: string
  projects?: Project
  templates?: Template
}
