import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '../../shared/supabaseConfig';

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
