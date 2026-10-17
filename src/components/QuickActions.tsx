/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, PlusCircle, Bell, HelpCircle } from 'lucide-react';

interface QuickActionsProps {
  onSelectAction: (command: string) => void;
  disabled?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onSelectAction, disabled = false }) => {
  const actions = [
    {
      title: 'Plan my day',
      command: 'Plan my day based on my top priorities',
      icon: Calendar,
    },
    {
      title: 'Add a task',
      command: 'Add finish machine learning assignment to my tasks with high priority',
      icon: PlusCircle,
    },
    {
      title: 'Set a reminder',
      command: 'Remind me to study for my exam at 7 PM',
      icon: Bell,
    },
    {
      title: 'Ask a question',
      command: 'What are the top 3 productivity habits of high-performing engineers?',
      icon: HelpCircle,
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto px-4 mt-2 flex-shrink-0">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.title}
              type="button"
              disabled={disabled}
              onClick={() => onSelectAction(act.command)}
              className={`group flex items-center gap-2 p-2 rounded-xl bg-[#0e1622] hover:bg-[#131f30] border border-slate-800 hover:border-[#00CAFF]/60 transition-all text-left ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className="p-1 rounded-md bg-[#0b1118] text-[#00CAFF] group-hover:bg-[#00CAFF]/20 transition-colors flex-shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-medium text-slate-200 group-hover:text-white truncate">
                {act.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
