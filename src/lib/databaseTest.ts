import { supabase } from "../lib/supabase";

export async function testDatabaseConnection() {
  try {
    console.log("Testing database connection...");

    // Test basic connection
    const { data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);

    if (error) {
      console.error("Database connection error:", error);
      return { success: false, error: error.message };
    }

    console.log("Database connection successful!");
    return { success: true, data };
  } catch (error) {
    console.error("Database test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Test user count specifically
export async function testUserCount() {
  try {
    console.log("Testing user count...");

    // Try to get user count from profiles table
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("User count error:", error);
      return { success: false, error: error.message, count: 0 };
    }

    console.log(`Found ${count} users in profiles table`);
    return { success: true, count: count || 0 };
  } catch (error) {
    console.error("User count test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      count: 0,
    };
  }
}
