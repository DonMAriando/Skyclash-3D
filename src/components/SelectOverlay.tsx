import React from 'react';
import { ArrowLeft, Play, Shield, Swords, Trophy, Volume2, VolumeX } from 'lucide-react';
import { AI_LEVEL_LABELS, FIGHTER_LIST, FIGHTERS, STAGE_LIST, buildTournamentLadder } from '../game/data';
import type { FighterId, GameMode, StageId } from '../game/types';
import { FighterEmblem } from './FighterEmblem';

interface SelectOverlayProps {
  mode: GameMode;
  playerId: FighterId;
  opponentId: FighterId;
  stageId: StageId;
  aiLevel: number;
  muted: boolean;
  onToggleMute: () => void;
  onModeChange: (mode: GameMode) => void;
  onPlayerChange: (id: FighterId) => void;
  onOpponentChange: (id: FighterId) => void;
  onStageChange: (id: StageId) => void;
  onAiLevelChange: (lvl: number) => void;
  onStartMatch: () => void;
  onBack: () => void;
}

const StatBars: React.FC<{ label: string; value: number; colorClass: string }> = ({
  label,
  value,
  colorClass,
}) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="w-16 text-slate-400 shrink-0">{label}</span>
    <div className="flex-1 flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className={`h-1.5 flex-1 rounded-sm ${n <= value ? colorClass : 'bg-slate-700/80'}`}
        />
      ))}
    </div>
  </div>
);

export const SelectOverlay: React.FC<SelectOverlayProps> = ({
  mode,
  playerId,
  opponentId,
  stageId,
  aiLevel,
  muted,
  onToggleMute,
  onModeChange,
  onPlayerChange,
  onOpponentChange,
  onStageChange,
  onAiLevelChange,
  onStartMatch,
  onBack,
}) => {
  const activeFighter = FIGHTERS[playerId];
  const ladder = buildTournamentLadder(playerId);

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6 pointer-events-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-[#0B1324]/90 hover:bg-[#1E293B] text-slate-100 border border-white/15 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        {/* Mode Segmented Control */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-xl bg-[#0B1324]/90 border border-white/15">
          <button
            type="button"
            onClick={() => onModeChange('tournament')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              mode === 'tournament'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Torneo (3 Rondas)</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange('quick')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              mode === 'quick'
                ? 'bg-sky-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Combate Rápido</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
          className="pointer-events-auto inline-flex items-center justify-center rounded-xl bg-[#0B1324]/90 hover:bg-[#1E293B] text-slate-100 border border-white/15 w-10 h-10 transition-colors cursor-pointer shrink-0"
        >
          {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
        </button>
      </div>

      {/* Left Selector Panel (keeps right 3D fighter showcase unobstructed) */}
      <div className="my-auto w-full max-w-[540px] max-h-[calc(100vh-120px)] overflow-y-auto pointer-events-auto rounded-2xl bg-[#0B1324]/92 border border-white/15 p-5 shadow-2xl space-y-5">
        {/* Player Fighter Roster */}
        <div>
          <div className="flex items-baseline justify-between mb-2.5">
            <h2 className="font-display font-bold text-lg text-white tracking-wide">
              Elige tu Luchador
            </h2>
            <span className="text-xs text-sky-400 font-medium">Vista previa 3D en vivo</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FIGHTER_LIST.map((f) => {
              const selected = f.id === playerId;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onPlayerChange(f.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl p-2.5 border text-center transition-all cursor-pointer ${
                    selected
                      ? 'bg-slate-800 border-amber-400 shadow-md'
                      : 'bg-slate-900/80 border-white/10 hover:border-white/30'
                  }`}
                >
                  <FighterEmblem id={f.id} className="w-9 h-9" />
                  <span className="font-display font-bold text-sm text-white whitespace-nowrap">
                    {f.name}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate max-w-full">
                    {f.archetype}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Highlighted Fighter Details */}
        <div className="rounded-xl bg-slate-900/90 border border-white/10 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-display font-bold text-base text-white">
                {activeFighter.name} <span className="text-slate-400 font-normal">· {activeFighter.title}</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{activeFighter.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1.5 pt-1">
            <StatBars label="Velocidad" value={activeFighter.speedRating} colorClass="bg-sky-400" />
            <StatBars label="Poder" value={activeFighter.powerRating} colorClass="bg-amber-400" />
            <StatBars label="Peso" value={activeFighter.weightRating} colorClass="bg-emerald-400" />
          </div>

          <div className="pt-1 border-t border-white/10 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300">
            <span>
              <strong className="text-amber-300">Especial (U):</strong> {activeFighter.specialName}
            </span>
            <span>
              <strong className="text-sky-300">Recuperar (W+U):</strong> {activeFighter.upSpecialName}
            </span>
          </div>
        </div>

        {/* Tournament Ladder OR Quick Match Config */}
        {mode === 'tournament' ? (
          <div className="space-y-2">
            <h3 className="font-display font-bold text-sm text-slate-200">
              Ruta del Torneo Progresivo
            </h3>
            <div className="space-y-1.5">
              {ladder.map((r) => (
                <div
                  key={r.round}
                  className="flex items-center justify-between rounded-lg bg-slate-900/80 border border-white/10 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-bold text-amber-400 tabular-nums">
                      Ronda {r.round}
                    </span>
                    <span className="text-white font-medium">
                      vs {FIGHTERS[r.opponentId].name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>{STAGE_LIST.find((s) => s.id === r.stageId)?.name}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-sky-300">{r.aiLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stage Picker */}
            <div>
              <h3 className="font-display font-bold text-sm text-slate-200 mb-2">Escenario</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {STAGE_LIST.map((st) => {
                  const selected = st.id === stageId;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => onStageChange(st.id)}
                      className={`rounded-xl p-2.5 border text-left transition-all cursor-pointer ${
                        selected
                          ? 'bg-slate-800 border-sky-400'
                          : 'bg-slate-900/80 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="font-display font-bold text-xs text-white truncate">
                        {st.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {st.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opponent + AI Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-200 mb-2">Rival IA</h3>
                <div className="grid grid-cols-4 gap-1.5">
                  {FIGHTER_LIST.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onOpponentChange(f.id)}
                      title={f.name}
                      className={`flex flex-col items-center p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        opponentId === f.id
                          ? 'bg-slate-800 border-rose-400'
                          : 'bg-slate-900/80 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <FighterEmblem id={f.id} className="w-7 h-7" />
                      <span className="text-[10px] text-slate-200 mt-1 truncate max-w-full">
                        {f.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-bold text-sm text-slate-200">Dificultad IA</h3>
                  <span className="text-xs text-rose-300 font-medium tabular-nums">
                    {AI_LEVEL_LABELS[aiLevel]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => onAiLevelChange(lvl)}
                      className={`flex-1 py-2.5 rounded-lg border font-display font-bold text-sm transition-colors cursor-pointer tabular-nums ${
                        aiLevel === lvl
                          ? 'bg-rose-500 border-rose-400 text-white'
                          : 'bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/30'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Start CTA */}
        <button
          type="button"
          onClick={onStartMatch}
          className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:translate-y-0.5 text-slate-950 font-display font-bold text-base py-3.5 shadow-lg transition-all cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{mode === 'tournament' ? 'Comenzar Torneo' : '¡Iniciar Combate!'}</span>
        </button>
      </div>

      {/* Bottom hint */}
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="bg-[#0B1324]/85 px-3 py-1.5 rounded-lg border border-white/10 inline-flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-sky-400" />
          <span>3 Vidas por combate · Gana expulsando al rival de la isla</span>
        </span>
      </div>
    </div>
  );
};
