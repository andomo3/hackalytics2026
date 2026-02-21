import { createClient } from '@supabase/supabase-js'

// Get environment variables safely for browser environment
const getEnvVar = (name: string) => {
  // Try different ways to access environment variables in browser
  if (typeof window !== 'undefined') {
    // Browser environment - check for Vite or other bundler env vars
    return (import.meta as any)?.env?.[name] || (window as any)?.[name];
  }
  // Server environment (if available)
  return (typeof Deno !== 'undefined' ? Deno.env.get(name) : 
          typeof process !== 'undefined' ? process.env[name] : undefined);
};

// Fallback values for demo mode
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 
                   getEnvVar('SUPABASE_URL') || 
                   'https://demo-project.supabase.co'
                   
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 
                       getEnvVar('SUPABASE_ANON_KEY') || 
                       'demo-anon-key'

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey.substring(0, 10) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Extract project ID from URL for API calls
export const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'demo-project'
export const publicAnonKey = supabaseAnonKey