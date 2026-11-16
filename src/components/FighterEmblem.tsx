import React from 'react';
import type { FighterId } from '../game/types';

export const SkyclashLogoSvg: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 460 112"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="SKYCLASH 3D"
  >
    <defs>
      <linearGradient id="skyLogoGrad" x1="0" y1="0" x2="420" y2="96" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="55%" stopColor="#E0F2FE" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
      <linearGradient id="skyAccentGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#F97316" />
      </linearGradient>
    </defs>

    {/* Emblem crest */}
    <path
      d="M44 12L74 28L66 74L44 96L22 74L14 28L44 12Z"
      fill="#0F172A"
      stroke="url(#skyAccentGrad)"
      strokeWidth="3.5"
    />
    <path d="M44 22L58 50L44 82L30 50L44 22Z" fill="url(#skyAccentGrad)" />
    <path d="M22 44L44 36L66 44L44 52L22 44Z" fill="#38BDF8" fillOpacity="0.88" />

    {/* Wordmark */}
    <text
      x="92"
      y="64"
      fill="url(#skyLogoGrad)"
      fontFamily="'Chakra Petch', sans-serif"
      fontWeight="700"
      fontSize="54"
      letterSpacing="2"
    >
      SKYCLASH
    </text>
    <text
      x="376"
      y="64"
      fill="url(#skyAccentGrad)"
      fontFamily="'Chakra Petch', sans-serif"
      fontWeight="700"
      fontStyle="italic"
      fontSize="44"
    >
      3D
    </text>
    <rect x="94" y="76" width="332" height="3" rx="1.5" fill="url(#skyAccentGrad)" />
    <text
      x="94"
      y="97"
      fill="#BAE6FD"
      fontFamily="'Plus Jakarta Sans', sans-serif"
      fontWeight="600"
      fontSize="14"
      letterSpacing="3.4"
    >
      ARENA DE LUCHA EN PLATAFORMAS
    </text>
  </svg>
);

export const FighterEmblem: React.FC<{
  id: FighterId;
  className?: string;
}> = ({ id, className = 'w-8 h-8' }) => {
  if (id === 'kael') {
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <polygon points="18,3 31,11 27,29 18,33 9,29 5,11" fill="#7C2D12" stroke="#FBBF24" strokeWidth="2" />
        <path d="M18 8L22 18L18 28L14 18L18 8Z" fill="#FB923C" />
        <circle cx="18" cy="18" r="3" fill="#FEF08A" />
      </svg>
    );
  }
  if (id === 'vespera') {
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <polygon points="18,4 32,18 18,32 4,18" fill="#1E1B4B" stroke="#22D3EE" strokeWidth="2" />
        <path d="M10 18L18 11L26 18L18 25L10 18Z" fill="#4F46E5" />
        <rect x="13" y="16.5" width="10" height="3" rx="1.5" fill="#67E8F9" />
      </svg>
    );
  }
  if (id === 'titan') {
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <rect x="5" y="6" width="26" height="24" rx="4" fill="#334155" stroke="#F59E0B" strokeWidth="2" />
        <rect x="10" y="11" width="16" height="7" rx="1.5" fill="#FBBF24" />
        <rect x="15.5" y="18" width="5" height="9" fill="#94A3B8" />
      </svg>
    );
  }
  if (id === 'voltik') {
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <circle cx="18" cy="18" r="14" fill="#422006" stroke="#FACC15" strokeWidth="2" />
        <path d="M20 7L12 19H18L15 29L25 16H19L20 7Z" fill="#FEF08A" />
        <circle cx="11.5" cy="21" r="2.2" fill="#EF4444" />
      </svg>
    );
  }
  if (id === 'puffo') {
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <circle cx="18" cy="18" r="14" fill="#831843" stroke="#F472B6" strokeWidth="2" />
        <circle cx="18" cy="18" r="9.5" fill="#F9A8D4" />
        <path d="M18 11L20 15.5L25 16L21.2 19.2L22.2 24L18 21.5L13.8 24L14.8 19.2L11 16L16 15.5L18 11Z" fill="#FEF08A" />
      </svg>
    );
  }
  if (id === 'selene') {
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <polygon points="18,4 30,14 25,31 11,31 6,14" fill="#3B0764" stroke="#E879F9" strokeWidth="2" />
        <polygon points="18,9 24,18 18,27 12,18" fill="#38BDF8" />
        <polygon points="18,12 21,18 18,24 15,18" fill="#E0F2FE" />
      </svg>
    );
  }
  if (id === 'marco') {
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <circle cx="18" cy="18" r="14" fill="#7F1D1D" stroke="#EF4444" strokeWidth="2" />
        <path d="M9 17C9 11.5 13 8 18 8C23 8 27 11.5 27 17H9Z" fill="#DC2626" />
        <rect x="8" y="16" width="20" height="3.5" rx="1.75" fill="#991B1B" />
        <circle cx="18" cy="13" r="3.4" fill="#FFFFFF" />
        <path d="M15.8 14.5V11.5L18 13.4L20.2 11.5V14.5" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === 'arion') {
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <path d="M8 8H28V18C28 24.5 18 31 18 31C18 31 8 24.5 8 18V8Z" fill="#14532D" stroke="#4ADE80" strokeWidth="2" />
        <path d="M18 11L23 19H13L18 11Z" fill="#FACC15" />
        <path d="M18 27V14" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === 'vulpex') {
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <polygon points="6,10 14,14 18,7 22,14 30,10 25,27 18,31 11,27" fill="#7C2D12" stroke="#22D3EE" strokeWidth="2" />
        <polygon points="18,14 24,20 18,26 12,20" fill="#22D3EE" fillOpacity="0.85" />
        <polygon points="18,16 21,20 18,24 15,20" fill="#ECFEFF" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <circle cx="18" cy="18" r="14" fill="#064E3B" stroke="#34D399" strokeWidth="2" />
      <path d="M18 7C22 12 24 18 18 29C12 18 14 12 18 7Z" fill="#6EE7B7" />
      <circle cx="18" cy="18" r="3.2" fill="#ECFDF5" />
    </svg>
  );
};
