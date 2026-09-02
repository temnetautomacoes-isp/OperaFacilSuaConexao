import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ajeakvcgzcmpifnwhenl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqZWFrdmNnemNtcGlmbndoZW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MDM0MTQsImV4cCI6MjEwMzM3OTQxNH0.ZuybKKzljOnb2h2bIyqypMRTgH--tekGOzYcuwdMQ9A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
