/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, History, User } from 'lucide-react';
import { AlexaTheme } from '../types/assistant';
import { BrandLogo } from './BrandLogo';

interface AssistantHeaderProps {
  userName: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenProfile: () => void;
  onOpenActivityPanel: () => void;
  activityCount: number;
  pendingTasksCount: number;
  themeColor: AlexaTheme;
}

export const AssistantHeader: React.FC<AssistantHeaderProps> = ({
  userName,
  isMuted,
  onToggleMute,
  onOpenProfile,
  onOpenActivityPanel,
  activityCount,
  pendingTasksCount,
  themeColor,
}) => {
  return (
    <header className="w-full max-w-5xl mx-auto py-2.5 px-4 sm:px-6 flex items-center justify-between z-20 flex-shrink-0">
      {/* Brand & Alexa Light Ring Logo */}
      <div className="flex items-center gap-2.5">
        <BrandLogo size={34} animate />
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-base sm:text-lg tracking-wider text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
              NOVA<span className="text-[#00CAFF] font-black">+</span>
            </span>
            <span className="text-[9px] uppercase font-mono tracking-widest text-[#00CAFF] font-bold px-1.5 py-0.2 bg-[#00CAFF]/10 rounded border border-[#00CAFF]/30">
              ALEXA+
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal -mt-0.5">
            Smart Voice Assistant
          </span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2">
        {/* User Name & Theme Quick Setting Button */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-[#0e1622] hover:bg-[#131f30] border border-slate-800 hover:border-[#00CAFF]/50 transition-colors focus-visible:ring-1 focus-visible:ring-[#00CAFF]"
          title="Change Name & Theme Color"
        >
          <User className="w-3.5 h-3.5 text-[#00CAFF]" />
          <span>{userName || 'Set Name'}</span>
        </button>

        {/* Past Activities & Tasks Side Panel Toggle */}
        <button
          type="button"
          onClick={onOpenActivityPanel}
          className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-100 bg-[#0e1622] hover:bg-[#131f30] border border-slate-800 hover:border-[#00CAFF]/50 transition-colors focus-visible:ring-1 focus-visible:ring-[#00CAFF]"
          title="Past Activities & Tasks Panel"
        >
          <History className="w-3.5 h-3.5 text-[#00CAFF]" />
          <span className="hidden sm:inline">Activities &amp; Tasks</span>
          {pendingTasksCount > 0 && (
            <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00CAFF] px-1 text-[10px] font-bold text-slate-950">
              {pendingTasksCount}
            </span>
          )}
        </button>

        {/* Audio Mute / Unmute Toggle */}
        <button
          type="button"
          onClick={onToggleMute}
          className={`p-1.5 rounded-lg text-xs transition-colors border focus-visible:ring-1 focus-visible:ring-[#00CAFF] ${
            isMuted
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-400 hover:bg-rose-900/40'
              : 'bg-[#0e1622] border-slate-800 text-slate-300 hover:text-[#00CAFF]'
          }`}
          title={isMuted ? 'Unmute Alexa' : 'Mute Alexa'}
          aria-label={isMuted ? 'Unmute speech output' : 'Mute speech output'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
