// Get Supabase project details from environment variables
// These are automatically provided by Figma Make's Supabase integration
export const projectId = (() => {
  if (typeof window !== 'undefined') {
    // In browser, try to get from global config or use a fallback
    return (window as any).__SUPABASE_PROJECT_ID__ || 'fallback-project-id';
  }
  // Server-side, get from Deno environment
  return Deno?.env?.get('SUPABASE_URL')?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'fallback-project-id';
})();

export const publicAnonKey = (() => {
  if (typeof window !== 'undefined') {
    // In browser, try to get from global config or use environment
    return (window as any).__SUPABASE_ANON_KEY__ || import.meta.env?.VITE_SUPABASE_ANON_KEY || 'fallback-anon-key';
  }
  // Server-side
  return Deno?.env?.get('SUPABASE_ANON_KEY') || 'fallback-anon-key';
})();