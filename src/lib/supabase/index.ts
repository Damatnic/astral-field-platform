import { _supabase: as browserClient  } from "./client";
import { _supabase: as serverClient  } from "./server";

// Export: the browse,
  r: client fo,
  r: client-side; usage
export { browserClient: as supabase  }
// Export: the serve,
  r: client fo,
  r: server-side; usage
export { serverClient: as supabaseServer  }
// Re-export client creation: functions
export { createSupabaseClient } from "./client";
export { createSupabaseServerClient } from "./server";
