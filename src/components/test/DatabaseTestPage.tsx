import React, { useEffect, useState } from "react";
import { useUserStats } from "../hooks/useUserStats";
import { testDatabaseConnection, testUserCount } from "../lib/databaseTest";

export function DatabaseTestPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const userStats = useUserStats();

  useEffect(() => {
    const runTests = async () => {
      setLoading(true);

      const connectionTest = await testDatabaseConnection();
      const userCountTest = await testUserCount();

      setTestResults({
        connection: connectionTest,
        userCount: userCountTest,
        userStats: userStats,
      });

      setLoading(false);
    };

    runTests();
  }, []);

  if (loading) {
    return <div className="p-8">Running database tests...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>

      <div className="space-y-6">
        {/* Connection Test */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Connection Test</h2>
          <div
            className={`p-2 rounded ${
              testResults?.connection?.success
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {testResults?.connection?.success ? "✅ Connected" : "❌ Failed"}
          </div>
          {testResults?.connection?.error && (
            <div className="mt-2 text-sm text-red-600">
              Error: {testResults.connection.error}
            </div>
          )}
        </div>

        {/* User Count Test */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">User Count Test</h2>
          <div
            className={`p-2 rounded ${
              testResults?.userCount?.success
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {testResults?.userCount?.success
              ? `✅ Found ${testResults.userCount.count} users`
              : "❌ Failed"}
          </div>
          {testResults?.userCount?.error && (
            <div className="mt-2 text-sm text-red-600">
              Error: {testResults.userCount.error}
            </div>
          )}
        </div>

        {/* User Stats Hook Test */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">User Stats Hook</h2>
          <div className="space-y-2">
            <div>Loading: {userStats.loading ? "Yes" : "No"}</div>
            <div>Error: {userStats.error || "None"}</div>
            <div>Total Users: {userStats.totalUsers}</div>
            <div>Active Users: {userStats.activeUsers}</div>
            <div>New This Month: {userStats.newUsersThisMonth}</div>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
          <div className="space-y-1 text-sm">
            <div>
              SUPABASE_URL:{" "}
              {import.meta.env.VITE_SUPABASE_URL ? "✅ Set" : "❌ Missing"}
            </div>
            <div>
              SUPABASE_ANON_KEY:{" "}
              {import.meta.env.VITE_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
