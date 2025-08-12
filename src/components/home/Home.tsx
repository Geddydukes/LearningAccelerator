import React from 'react';
import { Dashboard } from '../dashboard/Dashboard';

export default function Home() {
  console.log('Home component rendering - DRAMATIC TEST');
  return (
    <div className="p-8 bg-red-500 text-white rounded-lg shadow-lg border-4 border-yellow-400">
      <h1 className="text-3xl font-bold mb-4">
        🔥 RED HOME COMPONENT TEST! 🔥
      </h1>
      <p className="text-xl mb-4">
        If you see this RED background with YELLOW border, the nested routing is working!
      </p>
      <div className="bg-yellow-400 text-black p-4 rounded-lg mt-6">
        <p className="font-bold text-lg">🎯 NESTED ROUTING SUCCESS! 🎯</p>
        <p>This proves /home → UnifiedHome → Home is working correctly!</p>
      </div>
    </div>
  );
} 