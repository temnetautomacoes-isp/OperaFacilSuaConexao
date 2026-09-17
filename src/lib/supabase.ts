import { createClient } from '@supabase/supabase-js';

// URL e chave oficial do projeto TemNet / OperaFácil
const supabaseUrl = 'https://ajeakvcgzcmpifnwhenl.supabase.co';

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqZWFrdmNnemNtcGlmbndoZW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MDM0MTQsImV4cCI6MjEwMzM3OTQxNH0.ZuybKKzljOnb2h2bIyqypMRTgH--tekGOzYcuwdMQ9A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

