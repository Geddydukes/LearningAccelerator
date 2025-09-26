// Test script to run in browser console
// Copy and paste this into your browser console when on the auth page

console.log("Testing Supabase connection...");

// Test 1: Check if Supabase client is available
if (typeof window !== "undefined" && window.supabase) {
  console.log("✅ Supabase client found");
} else {
  console.log("❌ Supabase client not found");
}

// Test 2: Try to import and test
import("./lib/supabase.js")
  .then(({ supabase }) => {
    console.log("✅ Supabase module imported");

    // Test 3: Try a simple query
    supabase
      .from("profiles")
      .select("count")
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.log("❌ Database query failed:", error);
        } else {
          console.log("✅ Database query successful:", data);
        }
      });
  })
  .catch((error) => {
    console.log("❌ Failed to import Supabase:", error);
  });
