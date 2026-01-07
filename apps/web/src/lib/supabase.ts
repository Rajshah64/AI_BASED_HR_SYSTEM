"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  throw new Error(
    `Missing Supabase environment variables: ${missing.join(", ")}\n` +
      `Please create a .env.local file in apps/web/ with:\n` +
      `NEXT_PUBLIC_SUPABASE_URL=your-url\n` +
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key\n` +
      `NEXT_PUBLIC_API_URL=http://localhost:4000`
  );
}

// Client-side Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "x-client-info": "hr-platform-web",
    },
  },
});
