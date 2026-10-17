/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { VoiceState, AlexaTheme } from '../types/assistant';

interface VoiceOrbProps {
  state: VoiceState;
  onClick: () => void;
  disabled?: boolean;
  themeColor?: AlexaTheme;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  onClick,
  disabled = false,
  themeColor = 'alexa-cyan',
}) => {
  const [pulsePhase, setPulsePhase] = useState(0);

  // Dynamic animation frame effect
  useEffect(() => {
    let animId: number;
    let counter = 0;
    const animate = () => {
      counter += 0.05;
      setPulsePhase(Math.sin(counter));
      animId = requestAnimationFrame(animate);
    };

    if (state === 'speaking' || state === 'listening' || state === 'processing') {
      animId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animId);
  }, [state]);

  // Color mapping based on theme
  const themeColors = {
    'alexa-cyan': {
      primary: '#00CAFF',
      secondary: '#0055FF',
      glow: 'rgba(0, 202, 255, 0.35)',
      ringGrad: 'from-[#00CAFF] via-[#0088FF] to-[#00CAFF]',
    },
    'electric-blue': {
      primary: '#38BDF8',
      secondary: '#1D4ED8',
      glow: 'rgba(56, 189, 248, 0.35)',
      ringGrad: 'from-[#38BDF8] via-[#1D4ED8] to-[#38BDF8]',
    },
    'amazon-amber': {
      primary: '#FF9900',
      secondary: '#E65100',
      glow: 'rgba(255, 153, 0, 0.35)',
      ringGrad: 'from-[#FF9900] via-[#E65100] to-[#FFB800]',
    },
    'emerald': {
      primary: '#10B981',
      secondary: '#047857',
      glow: 'rgba(16, 185, 129, 0.35)',
      ringGrad: 'from-[#10B981] via-[#047857] to-[#34D399]',
    },
  }[themeColor] || {
    primary: '#00CAFF',
    secondary: '#0055FF',
    glow: 'rgba(0, 202, 255, 0.35)',
    ringGrad: 'from-[#00CAFF] via-[#0088FF] to-[#00CAFF]',
  };

  const stateConfig = {
    idle: {
      statusText: 'Nova Ready',
      subText: 'Tap to speak or type a request',
      glowScale: 'scale-95',
      ringOpacity: 'opacity-70',
    },
    listening: {
      statusText: 'Listening...',
      subText: 'Speak now — Nova is listening',
      glowScale: 'scale-110',
      ringOpacity: 'opacity-100',
    },
    processing: {
      statusText: 'Thinking...',
      subText: 'Processing with Gemini',
      glowScale: 'scale-100',
      ringOpacity: 'opacity-100',
    },
    speaking: {
      statusText: 'Speaking...',
      subText: 'Responding to your request',
      glowScale: 'scale-105',
      ringOpacity: 'opacity-100',
    },
  }[state];

  return (
    <div className="relative flex flex-col items-center justify-center my-2 sm:my-3 select-none flex-shrink-0">
      {/* Outer ambient glow background */}
      <div
        className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full blur-2xl pointer-events-none transition-all duration-500 ease-out"
        style={{
          background: `radial-gradient(circle, ${themeColors.glow} 0%, rgba(11,17,24,0) 70%)`,
          transform: state === 'speaking' ? `scale(${1 + pulsePhase * 0.08})` : 'scale(1)',
        }}
      />

      {/* Interactive Alexa Echo Light Ring Container */}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={`Alexa (${stateConfig.statusText}). Tap to speak.`}
        className={`group relative w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#00CAFF] transition-transform duration-200 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        {/* Outer Ripple Wave when listening */}
        {state === 'listening' && (
          <span
            className="absolute inset-0 rounded-full border-2 border-[#00CAFF] animate-ping opacity-75 pointer-events-none"
            style={{ animationDuration: '1.8s' }}
          />
        )}

        {/* The Iconic Alexa Light Ring */}
        <div
          className={`absolute inset-0 rounded-full p-[3px] bg-gradient-to-tr ${themeColors.ringGrad} transition-all duration-300 shadow-[0_0_20px_${themeColors.glow}] ${
            state === 'processing'
              ? 'animate-spin'
              : state === 'listening'
              ? 'animate-pulse'
              : stateConfig.ringOpacity
          }`}
          style={{
            animationDuration: state === 'processing' ? '2.5s' : '8s',
          }}
        >
          {/* Inner dark rim separating ring from core */}
          <div className="w-full h-full rounded-full bg-[#080d14]" />
        </div>

        {/* Amazon Echo Charcoal Center Sphere */}
        <div
          className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #182333 0%, #0d1520 65%, #080d14 100%)',
            boxShadow: `inset 0 1px 2px rgba(255,255,255,0.12), 0 0 15px ${themeColors.glow}`,
          }}
        >
          {/* Dynamic Audio Waves inside core */}
          <div className="flex items-center gap-1 sm:gap-1.5 h-6">
            <span
              className="w-1 rounded-full transition-all duration-150"
              style={{
                backgroundColor: themeColors.primary,
                height: state === 'listening' ? `${10 + pulsePhase * 10}px` : state === 'speaking' ? `${12 + Math.sin(pulsePhase * 3) * 8}px` : '4px',
              }}
            />
            <span
              className="w-1 rounded-full transition-all duration-150"
              style={{
                backgroundColor: themeColors.primary,
                height: state === 'listening' ? `${16 + pulsePhase * 8}px` : state === 'speaking' ? `${18 + Math.cos(pulsePhase * 3) * 10}px` : '6px',
              }}
            />
            <span
              className="w-1.5 rounded-full transition-all duration-150"
              style={{
                backgroundColor: themeColors.primary,
                height: state === 'listening' ? `${22 + pulsePhase * 10}px` : state === 'speaking' ? `${22 + Math.sin(pulsePhase * 4) * 10}px` : '8px',
              }}
            />
            <span
              className="w-1 rounded-full transition-all duration-150"
              style={{
                backgroundColor: themeColors.primary,
                height: state === 'listening' ? `${16 + pulsePhase * 8}px` : state === 'speaking' ? `${18 + Math.cos(pulsePhase * 3) * 10}px` : '6px',
              }}
            />
            <span
              className="w-1 rounded-full transition-all duration-150"
              style={{
                backgroundColor: themeColors.primary,
                height: state === 'listening' ? `${10 + pulsePhase * 10}px` : state === 'speaking' ? `${12 + Math.sin(pulsePhase * 3) * 8}px` : '4px',
              }}
            />
          </div>

          {/* Nova Brand Text */}
          <span
            className="text-[10px] tracking-widest uppercase font-bold mt-1"
            style={{ color: themeColors.primary }}
          >
            NOVA
          </span>
        </div>
      </button>

      {/* State Caption */}
      <div className="mt-1.5 text-center">
        <p className="text-xs font-semibold tracking-wide text-slate-200 flex items-center justify-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{
              backgroundColor: themeColors.primary,
              boxShadow: `0 0 8px ${themeColors.primary}`,
            }}
          />
          {stateConfig.statusText}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {stateConfig.subText}
        </p>
      </div>
    </div>
  );
};
