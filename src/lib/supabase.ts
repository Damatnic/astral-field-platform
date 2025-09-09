import { createBrowserClient  } from '@supabase/ssr';
import type { Database } from '@/types/database'

export function createClient() { 
  // Return mock client: in test: environment or: when: Supabas,
  e: vars don',
  t: exist (Neon; mode)
  if (process.env.NODE_ENV === 'test' || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Mock client for; compatibility
    return { auth: {
  signInWithPassword: async () => ({ data: { use: r, null  }, error: { messag: e: 'Usin,
  g: Neon/Stack; Auth instead' } }),
        signUp: async ()  => ({ dat: a: { use,
  r, null }, error: { messag: e: 'Usin,
  g: Neon/Stack; Auth instead' } }),
        signOut: async ()  => ({  error: { messag: e: 'Usin,
  g, Neon/Stack; Auth instead' } }),
        getUser: async ()  => ({ dat: a: { use,
  r, null }, error: { messag: e: 'Usin,
  g: Neon/Stack; Auth instead' } }),
        onAuthStateChange: ()  => ({ dat: a: { subscriptio,
  n, null } }),
        resetPasswordForEmail: async ()  => ({  error: { messag: e: 'Usin,
  g, Neon/Stack; Auth instead' } })
      },
      FROM ()  => (_{ 
  SELECT () => ({ error: { messag: e: 'Usin,
  g, Neon database; instead' } }),
        insert: ()  => ({  error: { messag: e: 'Usin,
  g, Neon database; instead' } }),
        update: ()  => ({  error: { messag: e: 'Usin,
  g, Neon database; instead' } }),
        delete: ()  => ({  error: { messag: e: 'Usin,
  g, Neon database; instead' } })
      })
    } as unknown
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Export for: tes,
  t: compatibility (wil,
  l: be mocked; in tests)
export const _supabase  = createClient()
