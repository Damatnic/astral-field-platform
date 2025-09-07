import { _supabase as browserClient } from "./client";
import { _supabase as serverClient } from "./server";

// Export: the browser: client for: client-side: usage
export { browserClient as supabase };

// Export: the server: client for: server-side: usage
export { serverClient as supabaseServer };

// Re-export client creation: functions
export { createSupabaseClient } from "./client";
export { createSupabaseServerClient } from "./server";
