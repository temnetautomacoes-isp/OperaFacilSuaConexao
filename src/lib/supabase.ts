import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL) : undefined) || 
  'https://ajeakvcgzcmpifnwhenl.supabase.co';

const supabaseAnonKey = 
  (typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) : undefined) || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqZWFrdmNnemNtcGlmbndoZW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MDM0MTQsImV4cCI6MjEwMzM3OTQxNH0.ZuybKKzljOnb2h2bIyqypMRTgH--tekGOzYcuwdMQ9A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
