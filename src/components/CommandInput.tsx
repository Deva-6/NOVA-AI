/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Send, X } from 'lucide-react';

interface CommandInputProps {
  onSubmit: (command: string) => void;
  isProcessing: boolean;
  placeholder?: string;
}

export const CommandInput: React.FC<CommandInputProps> = ({
  onSubmit,
  isProcessing,
  placeholder = 'Ask Alexa or type a task, reminder, or schedule...',
}) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isProcessing) return;
    onSubmit(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl mx-auto px-4 mt-1.5 flex-shrink-0"
    >
      <div className="relative flex items-center bg-[#0e1622] border border-slate-800 focus-within:border-[#00CAFF]/80 focus-within:ring-1 focus-within:ring-[#00CAFF]/40 rounded-xl p-1 transition-all shadow-md">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-50"
        />

        {value && !isProcessing && (
          <button
            type="button"
            onClick={() => setValue('')}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-md transition-colors mr-1"
            title="Clear text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="submit"
          disabled={!value.trim() || isProcessing}
          className={`flex items-center justify-center p-1.5 rounded-lg transition-all ${
            value.trim() && !isProcessing
              ? 'bg-[#00CAFF] text-slate-950 hover:bg-[#24d2e8] shadow-sm'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
          title="Send command"
          aria-label="Send command"
        >
          {isProcessing ? (
            <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-[#00CAFF] rounded-full animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </form>
  );
};
