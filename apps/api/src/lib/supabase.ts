import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env from root directory (hr-platform/.env)
// This works whether running from apps/api or from root
const rootEnvPath = resolve(process.cwd(), ".env");
const apiEnvPath = resolve(process.cwd(), "apps/api/.env");
const parentEnvPath = resolve(process.cwd(), "../.env");

// Try loading from multiple locations
let result = config({ path: rootEnvPath });
if (result.error) {
  result = config({ path: apiEnvPath });
}
if (result.error) {
  result = config({ path: parentEnvPath });
}
if (result.error) {
  result = config(); // Fallback to default behavior
}

if (!result.error && result.parsed) {
  console.log(`✓ Loaded .env file`);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error("SUPABASE_URL:", supabaseUrl ? "✓ Set" : "✗ Missing");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceRoleKey ? "✓ Set" : "✗ Missing");
  console.error("\nPlease create a .env file in one of these locations:");
  console.error("  1. hr-platform/.env (recommended)");
  console.error("  2. hr-platform/apps/api/.env");
  throw new Error("Missing Supabase environment variables");
}

// Server-side Supabase client with service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Client for verifying JWTs from requests
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
