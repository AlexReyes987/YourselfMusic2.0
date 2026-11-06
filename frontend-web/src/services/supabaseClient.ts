import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfktwdarosdodquclcyi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNma3R3ZGFyb3Nkb2RxdWNsY3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2ODQzNzQsImV4cCI6MjEwNjI2MDM3NH0.1gI_M0lCIgjL6roDhO_n3yUK0phGWFQMYg0mF9ZMtYY';

export const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export default supabaseAdmin;

