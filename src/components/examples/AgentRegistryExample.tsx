import React from 'react';
import { AGENTS, CORE_AGENTS, PREMIUM_AGENTS, isPremium, AgentId } from '../../lib/agents/registry';

/**
 * Example component demonstrating how to use the Agent Registry
 * This shows the power of having a single source of truth for all agents
 */
export const AgentRegistryExample: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Agent Registry Example</h1>
      
      {/* Core Agents */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">🔒 Core Agents ({CORE_AGENTS.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CORE_AGENTS.map(agentId => {
            const agent = AGENTS[agentId];
            return (
              <div key={agentId} className="p-4 border rounded-lg bg-blue-50">
                <h3 className="font-medium text-blue-900">{agent.title}</h3>
                <p className="text-sm text-blue-700 mt-1">{agent.description}</p>
                <div className="mt-2 text-xs text-blue-600">
                  <span className="inline-block px-2 py-1 bg-blue-100 rounded mr-2">
                    {agent.mode}
                  </span>
                  <span className="inline-block px-2 py-1 bg-blue-100 rounded">
                    {agent.persistsTo}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Premium Agents */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">💎 Premium Agents ({PREMIUM_AGENTS.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PREMIUM_AGENTS.map(agentId => {
            const agent = AGENTS[agentId];
            return (
              <div key={agentId} className="p-4 border rounded-lg bg-purple-50">
                <h3 className="font-medium text-purple-900">{agent.title}</h3>
                <p className="text-sm text-purple-700 mt-1">{agent.description}</p>
                <div className="mt-2 text-xs text-purple-600">
                  <span className="inline-block px-2 py-1 bg-purple-100 rounded mr-2">
                    {agent.mode}
                  </span>
                  <span className="inline-block px-2 py-1 bg-purple-100 rounded">
                    {agent.persistsTo}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage Examples */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">📚 Usage Examples</h2>
        
        <div className="space-y-2">
          <h3 className="font-medium">Premium Gating</h3>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono">
            {`if (isPremium('career_match') && user.tier !== 'enterprise') {
  // Show paywall
}`}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Dynamic Navigation</h3>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono">
            {`const menuItems = [...CORE_AGENTS, ...PREMIUM_AGENTS]
  .map(id => ({
    id,
    title: AGENTS[id].title,
    route: AGENTS[id].route,
    icon: AGENTS[id].icon
  }));`}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Agent Metadata</h3>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono">
            {`const agent = AGENTS['clo'];
console.log(agent.promptPath); // "prompts/base/clo_v3.yml"
console.log(agent.rateLimitPerMin); // 4
console.log(agent.color); // "indigo"`}
          </div>
        </div>
      </div>

      {/* All Agents Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">📊 All Agents Table</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-3 py-2 text-left">ID</th>
                <th className="border px-3 py-2 text-left">Title</th>
                <th className="border px-3 py-2 text-left">Entitlement</th>
                <th className="border px-3 py-2 text-left">Mode</th>
                <th className="border px-3 py-2 text-left">Route</th>
                <th className="border px-3 py-2 text-left">Display Order</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(AGENTS)
                .sort(([,a], [,b]) => a.displayOrder - b.displayOrder)
                .map(([id, agent]) => (
                  <tr key={id} className="hover:bg-gray-50">
                    <td className="border px-3 py-2 font-mono text-sm">{id}</td>
                    <td className="border px-3 py-2">{agent.title}</td>
                    <td className="border px-3 py-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                        agent.entitlement === 'premium' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {agent.entitlement}
                      </span>
                    </td>
                    <td className="border px-3 py-2">
                      <span className="inline-block px-2 py-1 rounded text-xs bg-gray-100">
                        {agent.mode}
                      </span>
                    </td>
                    <td className="border px-3 py-2 text-sm">{agent.route}</td>
                    <td className="border px-3 py-2 text-center">{agent.displayOrder}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
