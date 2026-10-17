/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 32, className = '', animate = true }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label="Nova Voice Assistant Logo"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(0,202,255,0.45)]"
      >
        <defs>
          {/* Main Alexa Electric Cyan to Deep Sapphire Gradient */}
          <linearGradient id="novaCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00CAFF" />
            <stop offset="50%" stopColor="#0099FF" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          {/* Luminous Glow Gradient */}
          <linearGradient id="novaGlowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.4" />
          </linearGradient>

          {/* Deep Echo Charcoal Radial Gradient */}
          <radialGradient id="novaCoreDark" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#131e2d" />
            <stop offset="70%" stopColor="#0a1017" />
            <stop offset="100%" stopColor="#06090e" />
          </radialGradient>
        </defs>

        {/* Outer Acoustic Resonance Orbit Ring */}
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke="url(#novaCyanGrad)"
          strokeWidth="2"
          strokeDasharray="4 6"
          opacity="0.5"
          className={animate ? 'animate-spin' : ''}
          style={{ transformOrigin: '50% 50%', animationDuration: '20s' }}
        />

        {/* Luminous Alexa Light Ring */}
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke="url(#novaCyanGrad)"
          strokeWidth="3.5"
          fill="none"
        />

        {/* Concentric Voice Waves / Sonic Arcs */}
        {/* Top Sound Wave Arc */}
        <path
          d="M 26 50 A 24 24 0 0 1 74 50"
          stroke="#00CAFF"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.9"
        />
        {/* Bottom Inverse Wave Arc */}
        <path
          d="M 32 50 A 18 18 0 0 0 68 50"
          stroke="#38BDF8"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Outer Wave Horizon */}
        <path
          d="M 20 50 A 30 30 0 0 1 80 50"
          stroke="url(#novaGlowGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.4"
        />

        {/* Central Charcoal Core */}
        <circle
          cx="50"
          cy="50"
          r="16"
          fill="url(#novaCoreDark)"
          stroke="#00CAFF"
          strokeWidth="1.5"
        />

        {/* Focal Star / Light Beacon */}
        <circle
          cx="50"
          cy="50"
          r="4"
          fill="#00CAFF"
          className={animate ? 'animate-pulse' : ''}
        />
      </svg>
    </div>
  );
};
