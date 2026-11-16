import React, { useEffect } from 'react';
import { Swords, Trophy, Volume2, VolumeX } from 'lucide-react';
import type { GameMode, LocalRecords } from '../game/types';
import { SkyclashLogoSvg } from './FighterEmblem';

interface TitleOverlayProps {
  records: LocalRecords;
  muted: boolean;
  onToggleMute: () => void;
  onSelectMode: (mode: GameMode) => void;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  records,
  muted,
  onToggleMute,
  onSelectMode,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onSelectMode('tournament');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSelectMode]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 md:p-10 pointer-events-none">
      {/* Top row: Brand lockup over calm negative space + Sound toggle */}
      <div className="flex items-start justify-between gap-6">
        <div className="max-w-xl pointer-events-auto">
          <div className="inline-block rounded-2xl bg-[#0B1324]/75 px-5 py-4 border border-white/10 shadow-2xl">
            <SkyclashLogoSvg className="w-[300px] sm:w-[390px] h-auto" />
          </div>

          <p className="mt-4 max-w-md text-sm sm:text-base text-slate-100 leading-relaxed bg-[#0B1324]/75 rounded-xl px-4 py-3 border border-white/10">
            Lucha en islas flotantes con física de daño porcentual. Acumula daño en el rival y lánzalo fuera de la arena.
          </p>

          {/* Primary Actions */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectMode('tournament')}
              className="inline-flex items-center gap-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:translate-y-0.5 text-slate-950 font-display font-bold text-base px-6 py-3.5 shadow-lg transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
            >
              <Trophy className="w-5 h-5" />
              <span>Torneo Progresivo</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectMode('quick')}
              className="inline-flex items-center gap-2.5 rounded-xl bg-[#0F172A]/90 hover:bg-[#1E293B] text-white border border-white/20 font-display font-bold text-base px-6 py-3.5 shadow-lg transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              <Swords className="w-5 h-5 text-sky-400" />
              <span>Combate Rápido</span>
            </button>
          </div>

          {/* Unboxed clean metadata summary */}
          <div className="mt-4 inline-flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 bg-[#0B1324]/75 px-3.5 py-1.5 rounded-lg border border-white/10 tabular-nums">
            <span>4 Luchadores</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span>3 Arenas 3D</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span>Torneos ganados: {records.tournamentWins}</span>
            {records.bestTournamentTimeSec !== null && (
              <>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span>Mejor tiempo: {formatDuration(records.bestTournamentTimeSec)}</span>
              </>
            )}
          </div>
        </div>

        {/* Audio toggle */}
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-[#0B1324]/85 hover:bg-[#1E293B] text-slate-100 border border-white/15 px-3.5 py-2.5 text-sm font-medium transition-colors cursor-pointer shrink-0"
        >
          {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          <span className="hidden sm:inline whitespace-nowrap">{muted ? 'Silenciado' : 'Sonido'}</span>
        </button>
      </div>

      {/* Bottom single flat control hint line */}
      <div className="flex justify-center">
        <div className="pointer-events-auto rounded-xl bg-[#0B1324]/85 border border-white/10 px-5 py-2.5 text-xs sm:text-sm text-slate-200 tracking-wide">
          A / D Mover · W / Espacio Saltar · S Bajar · J Ligero · K Smash · U Especial · W+U / I Recuperar · Shift Escudo · Enter Iniciar
        </div>
      </div>
    </div>
  );
};
