import { createClient } from '@supabase/supabase-js';

// Substitua essas chaves pelas do seu projeto Supabase (Projeto -> Project Settings -> API)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'COLOQUE_SUA_URL_AQUI';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'COLOQUE_SUA_CHAVE_AQUI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
