// Supabase client configuration
// This file will be used once you set up your database

import { createClient } from "@supabase/supabase-js";

// Check if environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️  Supabase credentials not found in environment variables.\n" +
      "The app will continue using mock data from JSON files.\n" +
      "To connect to a real database:\n" +
      "1. Create a Supabase account at https://supabase.com\n" +
      "2. Copy .env.local.example to .env.local\n" +
      "3. Add your Supabase credentials\n" +
      "4. Restart the dev server"
  );
}

// Create Supabase client (will be undefined if credentials not set)
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

// Helper to check if database is connected
export const isDatabaseConnected = () => {
  return supabase !== null;
};

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  if (!supabase) {
    console.log("❌ No database connection - using mock data");
    return false;
  }

  try {
    const { data, error } = await supabase
      .from("places")
      .select("count")
      .limit(1);

    if (error) {
      console.error("❌ Database connection error:", error.message);
      return false;
    }

    console.log("✅ Database connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

// Export types for TypeScript
export type SupabaseClient = typeof supabase;
