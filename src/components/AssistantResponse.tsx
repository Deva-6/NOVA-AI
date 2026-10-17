/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Volume2, CheckCircle2, Calendar, Bell, Copy, Check, ArrowRight } from 'lucide-react';
import { ConversationTurn } from '../types/assistant';

interface AssistantResponseProps {
  latestTurn: ConversationTurn | null;
  onReplayVoice: (text: string, audioBase64?: string) => void;
  onOpenPanel: () => void;
  isSpeaking: boolean;
}

export const AssistantResponse: React.FC<AssistantResponseProps> = ({
  latestTurn,
  onReplayVoice,
  onOpenPanel,
  isSpeaking,
}) => {
  const [copied, setCopied] = useState(false);

  if (!latestTurn) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 mt-2 flex-shrink-0">
        <div className="bg-[#0e1622]/70 border border-slate-800/80 rounded-xl px-3.5 py-2 text-center backdrop-blur-sm">
          <p className="text-xs text-slate-400">
            Alexa is listening. Ask to plan your day, manage tasks, set reminders, or answer questions.
          </p>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(latestTurn.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const action = latestTurn.actionExecuted;

  return (
    <div className="w-full max-w-xl mx-auto px-4 mt-2 transition-all duration-200 flex-shrink-0">
      <div className="bg-[#0e1622] border border-slate-800 rounded-xl p-3 shadow-lg relative overflow-hidden">
        {/* Alexa cyan accent top bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#00CAFF]" />

        {/* Action Execution Banner (if an action was performed) */}
        {action && (
          <div className="mb-2 pb-2 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-[#00CAFF]/15 text-[#00CAFF]">
                {action.type === 'create_reminder' ? (
                  <Bell className="w-3.5 h-3.5" />
                ) : action.type === 'plan_day' ? (
                  <Calendar className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-xs font-medium text-slate-200 truncate">
                {action.summary}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenPanel}
              className="text-[11px] text-[#00CAFF] hover:underline flex items-center gap-0.5 font-medium flex-shrink-0"
            >
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Alexa Response Text */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs sm:text-sm text-slate-100 font-normal leading-relaxed line-clamp-3">
            {latestTurn.text}
          </p>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
            <span className="font-mono text-[10px] text-slate-500">
              {latestTurn.timestamp}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onReplayVoice(latestTurn.text, latestTurn.audioBase64)}
                disabled={isSpeaking}
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded text-slate-400 hover:text-[#00CAFF] hover:bg-slate-800 transition-colors"
                title="Hear response"
              >
                <Volume2 className="w-3 h-3" />
                <span>Hear</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Copy response"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
