import React from 'react';
import { ArrowLeft, Minus, Play, Plus, Shield, Swords, Trophy, Users, Volume2, VolumeX } from 'lucide-react';
import {
  AI_LEVEL_LABELS,
  FFA_SLOT_TEAMS,
  FIGHTER_LIST,
  FIGHTERS,
  STAGE_LIST,
  TEAM_META,
  buildTournamentLadder,
} from '../game/data';
import type {
  CombatantSlot,
  FighterId,
  GameMode,
  MatchPresetId,
  MatchRuleMode,
  StageId,
  TeamId,
} from '../game/types';
import { FighterEmblem } from './FighterEmblem';

interface SelectOverlayProps {
  mode: GameMode;
  playerId: FighterId;
  stageId: StageId;
  aiLevel: number;
  presetId: MatchPresetId | 'custom';
  ruleMode: MatchRuleMode;
  slots: CombatantSlot[];
  muted: boolean;
  onToggleMute: () => void;
  onModeChange: (mode: GameMode) => void;
  onPlayerChange: (id: FighterId) => void;
  onStageChange: (id: StageId) => void;
  onAiLevelChange: (lvl: number) => void;
  onSelectPreset: (preset: MatchPresetId) => void;
  onRuleModeChange: (rule: MatchRuleMode) => void;
  onSlotsChange: (slots: CombatantSlot[]) => void;
  onStartMatch: () => void;
  onBack: () => void;
}

const PRESET_OPTIONS: Array<{ id: MatchPresetId; label: string }> = [
  { id: '1v1', label: '1 vs 1' },
  { id: 'ffa4', label: 'Todos vs Todos (4)' },
  { id: '2v2', label: 'Equipos 2 vs 2' },
  { id: '1v3', label: '1 vs 3' },
  { id: '1v4', label: '1 vs 4 Deathmatch' },
];

const FIGHTER_ORDER: FighterId[] = ['kael', 'vespera', 'titan', 'lyra'];

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
  stageId,
  aiLevel,
  presetId,
  ruleMode,
  slots,
  muted,
  onToggleMute,
  onModeChange,
  onPlayerChange,
  onStageChange,
  onAiLevelChange,
  onSelectPreset,
  onRuleModeChange,
  onSlotsChange,
  onStartMatch,
  onBack,
}) => {
  const activeFighter = FIGHTERS[playerId];
  const ladder = buildTournamentLadder(playerId);

  const cycleSlotFighter = (slotIndex: number) => {
    onSlotsChange(
      slots.map((s) => {
        if (s.slotIndex !== slotIndex) return s;
        const nextIdx = (FIGHTER_ORDER.indexOf(s.fighterId) + 1) % FIGHTER_ORDER.length;
        return { ...s, fighterId: FIGHTER_ORDER[nextIdx] };
      }),
    );
  };

  const toggleSlotTeam = (slotIndex: number) => {
    if (ruleMode !== 'teams') return;
    onSlotsChange(
      slots.map((s) => {
        if (s.slotIndex !== slotIndex || s.isPlayer) return s;
        const nextTeam: TeamId = s.team === 'blue' ? 'red' : 'blue';
        return {
          ...s,
          team: nextTeam,
          label: nextTeam === 'blue' ? 'Aliado' : `Bot ${s.slotIndex}`,
        };
      }),
    );
  };

  const handleAddBot = () => {
    if (slots.length >= 5) return;
    const nextIdx = slots.length;
    const nextFighter = FIGHTER_ORDER[nextIdx % FIGHTER_ORDER.length];
    const nextTeam: TeamId = ruleMode === 'teams' ? 'red' : FFA_SLOT_TEAMS[nextIdx % FFA_SLOT_TEAMS.length];
    onSlotsChange([
      ...slots,
      {
        slotIndex: nextIdx,
        isPlayer: false,
        fighterId: nextFighter,
        team: nextTeam,
        label: `Bot ${nextIdx}`,
      },
    ]);
  };

  const handleRemoveBot = () => {
    if (slots.length <= 2) return;
    onSlotsChange(slots.slice(0, -1));
  };

  const hasValidTeams =
    ruleMode === 'ffa' ||
    (slots.some((s) => s.team === 'blue') && slots.some((s) => s.team === 'red'));

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
      <div className="my-auto w-full max-w-[560px] max-h-[calc(100vh-118px)] overflow-y-auto pointer-events-auto rounded-2xl bg-[#0B1324]/92 border border-white/15 p-5 shadow-2xl space-y-4">
        {/* Player Fighter Roster */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="font-display font-bold text-lg text-white tracking-wide">
              Elige tu Luchador (J1)
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
          <div>
            <div className="font-display font-bold text-base text-white">
              {activeFighter.name}{' '}
              <span className="text-slate-400 font-normal">· {activeFighter.title}</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">{activeFighter.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1.5 pt-1">
            <StatBars label="Velocidad" value={activeFighter.speedRating} colorClass="bg-sky-400" />
            <StatBars label="Poder" value={activeFighter.powerRating} colorClass="bg-amber-400" />
            <StatBars label="Peso" value={activeFighter.weightRating} colorClass="bg-emerald-400" />
          </div>

          <div className="pt-2 border-t border-white/10 space-y-1 text-xs text-slate-300">
            <div>
              <strong className="text-amber-300">Especial (U): {activeFighter.specialName}</strong>
              <span className="text-slate-400"> — {activeFighter.specialDesc}</span>
            </div>
            <div>
              <strong className="text-sky-300">Recuperar (W+U): {activeFighter.upSpecialName}</strong>
              <span className="text-slate-400"> — {activeFighter.upSpecialDesc}</span>
            </div>
            <div>
              <strong className="text-emerald-300">Rasgo Único: {activeFighter.passiveName}</strong>
              <span className="text-slate-400"> — {activeFighter.passiveDesc}</span>
            </div>
          </div>
        </div>

        {/* Tournament Ladder OR Quick Match Multi-Fighter Config */}
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
          <div className="space-y-3.5">
            {/* Presets */}
            <div>
              <h3 className="font-display font-bold text-sm text-slate-200 mb-2">
                Formato de Combate
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelectPreset(opt.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      presetId === opt.id
                        ? 'bg-sky-500 border-sky-400 text-slate-950'
                        : 'bg-slate-900/80 border-white/10 text-slate-200 hover:border-white/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rules Toggle + Combatant Count */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900/75 border border-white/10 p-2.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onRuleModeChange('ffa')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    ruleMode === 'ffa'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Todos vs Todos
                </button>
                <button
                  type="button"
                  onClick={() => onRuleModeChange('teams')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    ruleMode === 'teams'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Por Equipos</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-200">
                <span className="tabular-nums font-medium">{slots.length} Luchadores</span>
                <button
                  type="button"
                  onClick={handleRemoveBot}
                  disabled={slots.length <= 2}
                  aria-label="Quitar bot"
                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 border border-white/15 hover:bg-slate-700 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleAddBot}
                  disabled={slots.length >= 5}
                  aria-label="Añadir bot"
                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 border border-white/15 hover:bg-slate-700 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Combatant Slots Builder */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Haz clic en un bot para cambiar personaje</span>
                {ruleMode === 'teams' && <span>Pulsa el equipo para cambiar bando</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {slots.map((slot) => {
                  const tm = TEAM_META[slot.team];
                  const fighter = FIGHTERS[slot.fighterId];
                  return (
                    <div
                      key={slot.slotIndex}
                      className={`flex items-center justify-between gap-2 rounded-xl bg-slate-900/90 border px-2.5 py-2 ${tm.borderClass}`}
                    >
                      <button
                        type="button"
                        onClick={() => !slot.isPlayer && cycleSlotFighter(slot.slotIndex)}
                        disabled={slot.isPlayer}
                        className={`flex items-center gap-2 min-w-0 text-left ${
                          slot.isPlayer ? 'cursor-default' : 'cursor-pointer hover:opacity-85'
                        }`}
                      >
                        <FighterEmblem id={slot.fighterId} className="w-7 h-7 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-display font-bold text-white truncate">
                            {fighter.name}
                          </div>
                          <div className={`text-[10px] font-semibold ${tm.textClass}`}>
                            {slot.isPlayer ? 'Tú (J1)' : slot.label}
                          </div>
                        </div>
                      </button>

                      {ruleMode === 'teams' ? (
                        <button
                          type="button"
                          onClick={() => toggleSlotTeam(slot.slotIndex)}
                          disabled={slot.isPlayer}
                          className={`px-2 py-1 rounded-md border text-[10px] font-semibold whitespace-nowrap ${tm.badgeClass} ${
                            slot.isPlayer ? 'cursor-default opacity-80' : 'cursor-pointer hover:brightness-110'
                          }`}
                        >
                          {slot.team === 'blue' ? 'Equipo Azul' : 'Equipo Rojo'}
                        </button>
                      ) : (
                        <span className={`px-2 py-1 rounded-md border text-[10px] font-semibold whitespace-nowrap ${tm.badgeClass}`}>
                          {tm.name}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {!hasValidTeams && (
                <p className="text-xs text-rose-400">
                  Debe haber al menos un rival en el Equipo Rojo para iniciar.
                </p>
              )}
            </div>

            {/* Stage Picker + AI Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-200 mb-1.5">Escenario</h3>
                <div className="space-y-1.5">
                  {STAGE_LIST.map((st) => {
                    const selected = st.id === stageId;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onStageChange(st.id)}
                        className={`w-full rounded-lg px-2.5 py-1.5 border text-left transition-all cursor-pointer ${
                          selected
                            ? 'bg-slate-800 border-sky-400'
                            : 'bg-slate-900/80 border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="font-display font-bold text-xs text-white truncate">
                          {st.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-display font-bold text-sm text-slate-200">Dificultad Bots</h3>
                  <span className="text-[11px] text-rose-300 font-medium tabular-nums">
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
          disabled={mode === 'quick' && !hasValidTeams}
          onClick={onStartMatch}
          className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 active:translate-y-0.5 text-slate-950 font-display font-bold text-base py-3.5 shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{mode === 'tournament' ? 'Comenzar Torneo' : '¡Iniciar Combate!'}</span>
        </button>
      </div>

      {/* Bottom hint */}
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="bg-[#0B1324]/85 px-3 py-1.5 rounded-lg border border-white/10 inline-flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-sky-400" />
          <span>3 Vidas por luchador · Hasta 5 combatientes en arena</span>
        </span>
      </div>
    </div>
  );
};
