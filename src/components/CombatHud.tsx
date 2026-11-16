import React, { useState } from 'react';
import { HelpCircle, Pause, Volume2, VolumeX } from 'lucide-react';
import type { FighterHudState, HudSnapshot } from '../game/types';
import { FighterEmblem } from './FighterEmblem';

interface CombatHudProps {
  hud: HudSnapshot;
  modeLabel: string;
  stageName: string;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

function getDamageColor(dmg: number): string {
  if (dmg >= 120) return 'text-rose-500';
  if (dmg >= 75) return 'text-orange-400';
  if (dmg >= 40) return 'text-amber-300';
  return 'text-white';
}

function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const FighterStatusCard: React.FC<{ fighter: FighterHudState }> = ({ fighter }) => {
  const isP1 = fighter.isPlayer;
  const dmgColor = getDamageColor(fighter.damage);
  const popKey = fighter.lastHitTimestamp;

  return (
    <div
      className={`flex items-center gap-3.5 rounded-2xl bg-[#0B1324]/88 border px-4 py-2.5 shadow-xl min-w-[215px] ${
        isP1 ? 'border-sky-400/50' : 'border-rose-400/50'
      }`}
    >
      <FighterEmblem id={fighter.id} className="w-10 h-10 shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display font-bold text-sm text-white truncate">
            {fighter.name}
          </span>
          <span
            className={`text-[11px] font-semibold ${
              isP1 ? 'text-sky-400' : 'text-rose-400'
            }`}
          >
            {isP1 ? 'J1' : 'IA'}
          </span>
        </div>

        {/* Stock pips */}
        <div className="flex items-center gap-1.5 mt-1" aria-label={`Vidas: ${fighter.stocks}`}>
          {Array.from({ length: fighter.maxStocks }).map((_, idx) => (
            <span
              key={idx}
              className={`w-2.5 h-2.5 rounded-full border ${
                idx < fighter.stocks
                  ? isP1
                    ? 'bg-sky-400 border-sky-200'
                    : 'bg-rose-500 border-rose-200'
                  : 'bg-slate-800 border-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Shield indicator bar */}
        {fighter.isShielding && (
          <div className="mt-1.5 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-sky-400 transition-all duration-75"
              style={{ width: `${fighter.shield}%` }}
            />
          </div>
        )}
      </div>

      {/* Damage Percentage */}
      <div
        key={popKey}
        className={`font-display font-bold text-3xl leading-none tabular-nums animate-hud-pop ${dmgColor}`}
      >
        {fighter.damage}
        <span className="text-lg ml-0.5">%</span>
      </div>
    </div>
  );
};

export const CombatHud: React.FC<CombatHudProps> = ({
  hud,
  modeLabel,
  stageName,
  muted,
  onToggleMute,
  onPause,
}) => {
  const [showControls, setShowControls] = useState(false);
  const [p1, ai] = hud.fighters;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-5">
      {/* Offscreen Magnifying Indicators */}
      {hud.fighters.map((f) => {
        if (!f.offscreen.visible) return null;
        return (
          <div
            key={f.isPlayer ? 'off-p1' : 'off-ai'}
            style={{
              left: `${f.offscreen.xPct}%`,
              top: `${f.offscreen.yPct}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute flex items-center gap-1.5 rounded-full px-2.5 py-1 border bg-[#0B1324]/92 shadow-lg ${
              f.isPlayer ? 'border-sky-400 text-sky-300' : 'border-rose-400 text-rose-300'
            }`}
          >
            <FighterEmblem id={f.id} className="w-5 h-5" />
            <span className="font-display font-bold text-xs tabular-nums">{f.damage}%</span>
          </div>
        );
      })}

      {/* Top Row: Match Clock & Quick Controls */}
      <div className="flex items-start justify-between gap-4">
        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-[#0B1324]/85 border border-white/10 px-3.5 py-2 text-xs text-slate-300">
          <span className="font-semibold text-white">{stageName}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{modeLabel}</span>
        </div>

        {/* Center Clock */}
        <div className="mx-auto sm:mx-0 rounded-xl bg-[#0B1324]/90 border border-white/15 px-4 py-1.5 text-center shadow-lg">
          <div className="font-display font-bold text-xl text-white tabular-nums leading-tight">
            {formatClock(hud.elapsedSec)}
          </div>
        </div>

        {/* Top-Right Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowControls((v) => !v)}
            aria-label="Ver controles"
            className="inline-flex items-center justify-center rounded-xl bg-[#0B1324]/88 hover:bg-[#1E293B] text-slate-200 border border-white/15 w-9 h-9 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
            className="inline-flex items-center justify-center rounded-xl bg-[#0B1324]/88 hover:bg-[#1E293B] text-slate-200 border border-white/15 w-9 h-9 transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>
          <button
            type="button"
            onClick={onPause}
            aria-label="Pausar combate"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1324]/88 hover:bg-[#1E293B] text-slate-100 border border-white/15 px-3 h-9 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Pause className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pausa</span>
          </button>
        </div>
      </div>

      {/* Transient Center Banner (LISTOS / COMBATE / K.O. / VICTORIA) */}
      {hud.banner && (
        <div className="my-auto flex flex-col items-center justify-center text-center">
          <div
            className={`font-display font-bold text-5xl sm:text-7xl tracking-wider drop-shadow-[0_6px_18px_rgba(0,0,0,0.85)] ${
              hud.banner.tone === 'ko'
                ? 'text-rose-500'
                : hud.banner.tone === 'victory'
                  ? 'text-amber-400'
                  : hud.banner.tone === 'defeat'
                    ? 'text-rose-400'
                    : 'text-white'
            }`}
          >
            {hud.banner.text}
          </div>
          {hud.banner.subtext && (
            <div className="mt-2 rounded-lg bg-[#0B1324]/90 border border-white/15 px-4 py-1 text-sm font-medium text-slate-100">
              {hud.banner.subtext}
            </div>
          )}
        </div>
      )}

      {/* Optional compact controls popover */}
      {showControls && (
        <div className="mx-auto mb-2 rounded-xl bg-[#0B1324]/95 border border-white/15 px-4 py-2 text-xs text-slate-200 shadow-xl">
          A / D Mover · W / Espacio Saltar (x2) · S Bajar plataforma · J Ligero · K Smash · U Especial · W+U / I Recuperar · Shift Escudo
        </div>
      )}

      {/* Bottom Corner Fighter Cards */}
      <div className="flex items-end justify-between gap-4">
        <FighterStatusCard fighter={p1} />
        <FighterStatusCard fighter={ai} />
      </div>
    </div>
  );
};
