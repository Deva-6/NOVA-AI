/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, Clock, X, Check } from 'lucide-react';
import { Reminder } from '../types/assistant';

interface ReminderToastProps {
  activeReminder: Reminder | null;
  onDismiss: (id: string) => void;
  onSnooze: (id: string) => void;
}

export const ReminderToast: React.FC<ReminderToastProps> = ({
  activeReminder,
  onDismiss,
  onSnooze,
}) => {
  if (!activeReminder) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full mx-4 sm:mx-0 bg-slate-900 border-2 border-cyan-400 rounded-2xl p-4 shadow-2xl shadow-cyan-500/20 backdrop-blur-md animate-bounce-subtle">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse flex-shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
            Reminder Alert
          </span>
          <h4 className="text-sm font-semibold text-slate-100 mt-0.5 break-words">
            {activeReminder.title}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Scheduled for {activeReminder.time}</span>
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => onDismiss(activeReminder.id)}
              className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Dismiss</span>
            </button>
            <button
              type="button"
              onClick={() => onSnooze(activeReminder.id)}
              className="py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Snooze 10m
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(activeReminder.id)}
          className="text-slate-500 hover:text-slate-300 p-1"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
