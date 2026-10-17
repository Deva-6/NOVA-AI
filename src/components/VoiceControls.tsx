/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mic, MicOff, Square, AlertCircle } from 'lucide-react';
import { VoiceState } from '../types/assistant';

interface VoiceControlsProps {
  state: VoiceState;
  onToggleMic: () => void;
  onStopSpeaking: () => void;
  interimTranscript: string;
  errorMessage: string | null;
  isMicSupported: boolean;
  onClearError: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  state,
  onToggleMic,
  onStopSpeaking,
  interimTranscript,
  errorMessage,
  isMicSupported,
  onClearError,
}) => {
  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';
  const isProcessing = state === 'processing';

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-2 px-4 flex-shrink-0">
      {/* Live Interim Transcript Display while listening */}
      {isListening && (
        <div className="w-full bg-[#0e1622]/95 border border-[#00CAFF]/50 rounded-xl px-3.5 py-1.5 flex items-center gap-2 backdrop-blur-md animate-fade-in shadow-[0_0_12px_rgba(0,202,255,0.2)]">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00CAFF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00CAFF]"></span>
          </span>
          <p className="text-xs text-[#00CAFF] font-mono italic truncate">
            {interimTranscript || 'Listening to your voice... speak now'}
          </p>
        </div>
      )}

      {/* Error / Permission Alert */}
      {errorMessage && (
        <div className="w-full bg-rose-950/70 border border-rose-800/80 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 text-xs text-rose-200">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span className="line-clamp-1">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={onClearError}
            className="text-[11px] text-rose-300 hover:text-white underline flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Voice Action Buttons Bar */}
      <div className="flex items-center gap-2.5">
        {/* Main Alexa Microphone Button */}
        <button
          type="button"
          onClick={onToggleMic}
          disabled={!isMicSupported}
          aria-label={isListening ? 'Stop listening' : 'Start Alexa voice input'}
          className={`relative group flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 shadow-md ${
            !isMicSupported
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : isListening
              ? 'bg-[#00CAFF] text-slate-950 shadow-[0_0_15px_rgba(0,202,255,0.4)] ring-2 ring-[#00CAFF]/40 animate-pulse'
              : isProcessing
              ? 'bg-sky-900 text-sky-200 cursor-wait'
              : 'bg-[#0e1622] hover:bg-[#131f30] text-slate-100 border border-slate-700/80 hover:border-[#00CAFF]/60 hover:text-[#00CAFF]'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-3.5 h-3.5 text-slate-950" />
              <span>Listening (Tap to send)</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-[#00CAFF]" />
              <span>{isProcessing ? 'Alexa is thinking...' : 'Talk to Alexa'}</span>
            </>
          )}
        </button>

        {/* Dedicated Stop Speaking Button */}
        {isSpeaking && (
          <button
            type="button"
            onClick={onStopSpeaking}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full font-medium text-xs text-amber-300 bg-amber-950/60 border border-amber-700/60 hover:bg-amber-900/60 transition-all shadow-sm animate-fade-in"
            title="Silence Alexa"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop Speaking</span>
          </button>
        )}
      </div>
    </div>
  );
};
