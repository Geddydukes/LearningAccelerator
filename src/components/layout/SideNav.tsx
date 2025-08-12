import React from 'react';
import { NavLink } from 'react-router-dom';
import { PATHS } from '../../routes/paths';
import { 
  Home, 
  BookOpen, 
  MessageSquare, 
  Brain, 
  Briefcase, 
  FileText, 
  Settings 
} from 'lucide-react';

const LEARN_ITEMS = [
  { to: PATHS.home, label: "Home", icon: Home },
  { to: PATHS.moduleCurrent, label: "Module", icon: BookOpen },
  { to: PATHS.socratic, label: "Socratic", icon: MessageSquare },
  { to: PATHS.ta, label: "TA Tasks", icon: Brain },
];

const CAREER_ITEMS = [
  { to: PATHS.career, label: "Career Hub", icon: Briefcase },
  { to: PATHS.portfolio, label: "Portfolio", icon: FileText },
];

export function SideNav() {
  return (
    <nav className="w-64 min-h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Learning Accelerator</h1>
      </div>
      
      {/* Learn Group */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Learn
        </h2>
        <ul className="space-y-2">
          {LEARN_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
      
      {/* Career Group */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Career
        </h2>
        <ul className="space-y-2">
          {CAREER_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
      
      {/* Settings */}
      <div className="mt-auto">
        <NavLink
          to={PATHS.settings}
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`
          }
        >
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </NavLink>
      </div>
    </nav>
  );
} 