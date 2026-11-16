import React from 'react';
import { ArrowRight, Home, Play, RotateCcw, Swords, Trophy } from 'lucide-react';
import type { GameMode, MatchStats, ScreenState } from '../game/types';

interface PauseAndResultModalProps {
  screen: Extract<ScreenState, 'paused' | 'victory' | 'defeat'>;
  mode: GameMode;
  tournamentRound: number;
  tournamentTotal: number;
  stats: MatchStats;
  onResume: () => void;
  onNextRound: () => void;
  onRestart: () => void;
  onChangeSelect: () => void;
  onMainMenu: () => void;
}

function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const PauseAndResultModal: React.FC<PauseAndResultModalProps> = ({
  screen,
  mode,
  tournamentRound,
  tournamentTotal,
  stats,
  onResume,
  onNextRound,
  onRestart,
  onChangeSelect,
  onMainMenu,
}) => {
  const isTournamentNext =
    screen === 'victory' && mode === 'tournament' && tournamentRound < tournamentTotal;
  const isTournamentChamp =
    screen === 'victory' && mode === 'tournament' && tournamentRound >= tournamentTotal;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-[#060B16]/75">
      <div className="w-full max-w-md rounded-2xl bg-[#0B1324] border border-white/15 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          {screen === 'paused' && (
            <>
              <h2 className="font-display font-bold text-3xl text-white">Combate en Pausa</h2>
              <p className="text-sm text-slate-400">Pulsa Esc para reanudar cuando quieras</p>
            </>
          )}

          {screen === 'victory' && (
            <>
              <div className="mx-auto w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mb-2">
                <Trophy className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="font-display font-bold text-3xl text-amber-400">
                {isTournamentChamp ? '¡Campeón del Torneo!' : '¡Victoria!'}
              </h2>
              <p className="text-sm text-slate-300">
                {isTournamentNext
                  ? `Ronda ${tournamentRound} de ${tournamentTotal} superada`
                  : isTournamentChamp
                    ? 'Has conquistado todas las arenas flotantes'
                    : 'Has expulsado al rival de la arena'}
              </p>
            </>
          )}

          {screen === 'defeat' && (
            <>
              <div className="mx-auto w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center mb-2">
                <Swords className="w-6 h-6 text-rose-400" />
              </div>
              <h2 className="font-display font-bold text-3xl text-rose-400">Derrota</h2>
              <p className="text-sm text-slate-300">
                El rival te dejó sin vidas. ¡Inténtalo de nuevo!
              </p>
            </>
          )}
        </div>

        {/* Stats summary on victory/defeat or controls guide on pause */}
        {screen === 'paused' ? (
          <div className="rounded-xl bg-slate-900/90 border border-white/10 p-3.5 text-xs text-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Mover / Bajar plataforma</span>
              <span className="font-semibold text-white">A, D / S</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Saltar / Doble salto</span>
              <span className="font-semibold text-white">W o Espacio</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ataque Ligero / Smash Fuerte</span>
              <span className="font-semibold text-white">J / K (+ dirección)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Especial / Recuperar Arriba</span>
              <span className="font-semibold text-white">U / W+U (o I)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Escudo / Esquiva aérea</span>
              <span className="font-semibold text-white">Shift o L</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-slate-900/90 border border-white/10 p-3 text-center">
              <div className="text-xs text-slate-400">K.O.s logrados</div>
              <div className="font-display font-bold text-2xl text-white tabular-nums mt-0.5">
                {stats.playerKOs}
              </div>
            </div>
            <div className="rounded-xl bg-slate-900/90 border border-white/10 p-3 text-center">
              <div className="text-xs text-slate-400">Tiempo</div>
              <div className="font-display font-bold text-2xl text-white tabular-nums mt-0.5">
                {formatClock(stats.durationSec)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-900/90 border border-white/10 p-3 text-center">
              <div className="text-xs text-slate-400">Daño infligido</div>
              <div className="font-display font-bold text-2xl text-amber-400 tabular-nums mt-0.5">
                {stats.damageDealt}%
              </div>
            </div>
            <div className="rounded-xl bg-slate-900/90 border border-white/10 p-3 text-center">
              <div className="text-xs text-slate-400">Máx. % rival</div>
              <div className="font-display font-bold text-2xl text-sky-400 tabular-nums mt-0.5">
                {stats.aiMaxDamage}%
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {screen === 'paused' && (
            <button
              type="button"
              onClick={onResume}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-base py-3 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Reanudar</span>
            </button>
          )}

          {isTournamentNext && (
            <button
              type="button"
              onClick={onNextRound}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-base py-3 transition-colors cursor-pointer"
            >
              <span>Siguiente Ronda ({tournamentRound + 1}/{tournamentTotal})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {!isTournamentNext && (
            <button
              type="button"
              onClick={onRestart}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl font-display font-bold text-base py-3 transition-colors cursor-pointer ${
                screen === 'paused'
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-white/15'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>{mode === 'tournament' && screen === 'victory' ? 'Nuevo Torneo' : 'Jugar de Nuevo'}</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onChangeSelect}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15 py-2.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <Swords className="w-4 h-4 text-sky-400" />
              <span>Luchadores</span>
            </button>
            <button
              type="button"
              onClick={onMainMenu}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15 py-2.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <Home className="w-4 h-4 text-slate-400" />
              <span>Inicio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
