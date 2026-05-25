const INVALID_SUPABASE_HOSTS = ['vercel.app', 'itfood.in']
const DEFAULT_SUPABASE_URL = 'https://yczzrgowkbaolkcmudvx.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_UiFLTQw38cUsMU6tchu04w_zEHxf6uG'

function isInvalidSupabaseProjectUrl(value: string) {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(value)
  } catch {
    return true
  }

  const hostname = parsedUrl.hostname.toLowerCase()
  return INVALID_SUPABASE_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))
}

function getValidSupabaseUrl(value: string | undefined) {
  if (!value || isInvalidSupabaseProjectUrl(value)) {
    console.warn(
      `Using default Supabase project URL. In Vercel, set VITE_SUPABASE_URL to ${DEFAULT_SUPABASE_URL}.`,
    )
    return DEFAULT_SUPABASE_URL
  }

  return value
}

export function getSupabaseConfig() {
  const supabaseUrl = getValidSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('Using default Supabase anon key. In Vercel, set VITE_SUPABASE_ANON_KEY explicitly.')
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  }
}
