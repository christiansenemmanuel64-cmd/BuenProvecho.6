// supabaseClient.js (módulo)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Reemplazá con los datos de TU proyecto (Project Settings > API Keys)
const SUPABASE_URL = 'https://pahxmvbewyehiupgchfn.supabase.co'; // sin /rest/v1/
const SUPABASE_KEY = 'sb_publishable_MQda_hOkXPnR-aUT0okviQ_vDPatuf-';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
