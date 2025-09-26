// Environment Variables Test
// Run this in browser console to check if env vars are loaded

console.log("=== Environment Variables Test ===");
console.log("VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
console.log(
  "VITE_SUPABASE_ANON_KEY:",
  import.meta.env.VITE_SUPABASE_ANON_KEY ? "Present" : "Missing"
);
console.log(
  "Key starts with:",
  import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + "..."
);

// Test Supabase client creation
if (
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY
) {
  console.log("✅ Environment variables are loaded");

  // Try to create a Supabase client
  import("./lib/supabase.js")
    .then(({ supabase }) => {
      console.log("✅ Supabase client created successfully");

      // Test a simple query
      supabase
        .from("profiles")
        .select("count")
        .limit(1)
        .then(({ data, error }) => {
          if (error) {
            console.log("❌ Database query failed:", error.message);
            console.log("Error details:", error);
          } else {
            console.log("✅ Database query successful!");
            console.log("Data:", data);
          }
        });
    })
    .catch((error) => {
      console.log("❌ Failed to create Supabase client:", error);
    });
} else {
  console.log("❌ Environment variables are missing");
}
