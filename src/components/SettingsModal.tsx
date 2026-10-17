/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, User, Palette, Check } from 'lucide-react';
import { UserVoiceSettings, AlexaTheme } from '../types/assistant';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserVoiceSettings;
  onSaveSettings: (settings: UserVoiceSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [userName, setUserName] = useState(settings.userName || 'Alex');
  const [themeColor, setThemeColor] = useState<AlexaTheme>(settings.themeColor || 'alexa-cyan');

  useEffect(() => {
    setUserName(settings.userName || 'Alex');
    setThemeColor(settings.themeColor || 'alexa-cyan');
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      userName: userName.trim() || 'Alex',
      themeColor,
    });
    onClose();
  };

  const themeOptions: { id: AlexaTheme; label: string; color: string; border: string; bg: string }[] = [
    { id: 'alexa-cyan', label: 'Alexa Cyan', color: '#00CAFF', border: 'border-[#00CAFF]', bg: 'bg-[#00CAFF]' },
    { id: 'electric-blue', label: 'Electric Blue', color: '#38BDF8', border: 'border-[#38BDF8]', bg: 'bg-[#38BDF8]' },
    { id: 'amazon-amber', label: 'Amazon Amber', color: '#FF9900', border: 'border-[#FF9900]', bg: 'bg-[#FF9900]' },
    { id: 'emerald', label: 'Emerald Glow', color: '#10B981', border: 'border-[#10B981]', bg: 'bg-[#10B981]' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0e1622] border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#0b1118]">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#00CAFF]" />
            <h3 className="text-sm font-semibold text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
              Profile &amp; Theme
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 space-y-4">
          {/* User Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">
              Your Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={30}
              className="w-full bg-[#0b1118] border border-slate-800 focus:border-[#00CAFF] rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">
              Alexa will address you as: <span className="text-[#00CAFF] font-medium">&ldquo;Good evening, {userName.trim() || 'Alex'}&rdquo;</span>
            </p>
          </div>

          {/* Theme Color Picker */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <span>Alexa Light Ring Theme</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setThemeColor(opt.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                    themeColor === opt.id
                      ? `${opt.border} bg-slate-800/80 ring-1 ring-offset-0 ring-[#00CAFF]/50`
                      : 'border-slate-800/80 bg-[#0b1118] hover:border-slate-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${opt.bg}`}
                  >
                    {themeColor === opt.id && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                  </span>
                  <span className="text-xs text-slate-200 font-medium">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-1.5 px-4 rounded-lg text-xs font-semibold bg-[#00CAFF] hover:bg-[#24d2e8] text-slate-950 transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
