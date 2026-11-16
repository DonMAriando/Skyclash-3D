import { useCallback, useEffect, useRef, useState } from 'react';
import { CombatHud } from './components/CombatHud';
import { PauseAndResultModal } from './components/PauseAndResultModal';
import { SelectOverlay } from './components/SelectOverlay';
import { TitleOverlay } from './components/TitleOverlay';
import {
  AI_LEVEL_LABELS,
  FFA_SLOT_TEAMS,
  STAGES,
  buildPresetSlots,
  buildTournamentLadder,
  loadLocalRecords,
  saveLocalRecords,
} from './game/data';
import { SmashGameEngine } from './game/engine';
import type {
  CombatantSlot,
  FighterId,
  GameMode,
  HudSnapshot,
  LocalRecords,
  MatchConfig,
  MatchPresetId,
  MatchRuleMode,
  MatchStats,
  ScreenState,
  StageId,
  TournamentRound,
} from './game/types';

const INITIAL_HUD: HudSnapshot = {
  fighters: [
    {
      slotIndex: 0,
      id: 'kael',
      name: 'Kael',
      label: 'J1',
      isPlayer: true,
      team: 'blue',
      damage: 0,
      stocks: 3,
      maxStocks: 3,
      shield: 100,
      isShielding: false,
      eliminated: false,
      action: 'idle',
      lastHitTimestamp: 0,
      offscreen: { visible: false, xPct: 50, yPct: 50, angleRad: 0 },
    },
    {
      slotIndex: 1,
      id: 'vespera',
      name: 'Vespera',
      label: 'Bot 1',
      isPlayer: false,
      team: 'red',
      damage: 0,
      stocks: 3,
      maxStocks: 3,
      shield: 100,
      isShielding: false,
      eliminated: false,
      action: 'idle',
      lastHitTimestamp: 0,
      offscreen: { visible: false, xPct: 50, yPct: 50, angleRad: 0 },
    },
  ],
  elapsedSec: 0,
  banner: null,
  stats: {
    durationSec: 0,
    playerKOs: 0,
    aiKOs: 0,
    playerMaxDamage: 0,
    aiMaxDamage: 0,
    damageDealt: 0,
  },
};

function buildFormatSummary(ruleMode: MatchRuleMode, slots: CombatantSlot[]): string {
  if (ruleMode === 'ffa') {
    return slots.length === 2 ? '1 vs 1' : `Todos vs Todos (${slots.length})`;
  }
  const blueCount = slots.filter((s) => s.team === 'blue').length;
  const redCount = slots.filter((s) => s.team === 'red').length;
  return `${blueCount} vs ${redCount}`;
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<SmashGameEngine | null>(null);

  const [screen, setScreen] = useState<ScreenState>('title');
  const [mode, setMode] = useState<GameMode>('tournament');
  const [playerId, setPlayerId] = useState<FighterId>('kael');
  const [stageId, setStageId] = useState<StageId>('sky_temple');
  const [aiLevel, setAiLevel] = useState<number>(2);

  const [presetId, setPresetId] = useState<MatchPresetId | 'custom'>('ffa4');
  const [ruleMode, setRuleMode] = useState<MatchRuleMode>('ffa');
  const [slots, setSlots] = useState<CombatantSlot[]>(() => buildPresetSlots('ffa4', 'kael').slots);

  const [tournamentLadder, setTournamentLadder] = useState<TournamentRound[]>(() =>
    buildTournamentLadder('kael'),
  );
  const [tournamentRoundIdx, setTournamentRoundIdx] = useState<number>(0);
  const [tournamentElapsedAcc, setTournamentElapsedAcc] = useState<number>(0);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [matchStats, setMatchStats] = useState<MatchStats>(INITIAL_HUD.stats);
  const [records, setRecords] = useState<LocalRecords>(() => loadLocalRecords());
  const [muted, setMuted] = useState<boolean>(false);
  const [contextLost, setContextLost] = useState<boolean>(false);

  // Refs for stable access inside engine callbacks
  const screenRef = useRef<ScreenState>(screen);
  const modeRef = useRef<GameMode>(mode);
  const ladderRef = useRef<TournamentRound[]>(tournamentLadder);
  const roundIdxRef = useRef<number>(tournamentRoundIdx);
  const tournamentAccRef = useRef<number>(tournamentElapsedAcc);

  screenRef.current = screen;
  modeRef.current = mode;
  ladderRef.current = tournamentLadder;
  roundIdxRef.current = tournamentRoundIdx;
  tournamentAccRef.current = tournamentElapsedAcc;

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const engine = new SmashGameEngine(container, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onMatchEnd: (playerWon, stats) => {
        setMatchStats(stats);
        setRecords((prev) => {
          const next: LocalRecords = {
            ...prev,
            totalKOs: prev.totalKOs + stats.playerKOs,
          };
          if (
            playerWon &&
            modeRef.current === 'tournament' &&
            roundIdxRef.current >= ladderRef.current.length - 1
          ) {
            const totalTime = tournamentAccRef.current + stats.durationSec;
            next.tournamentWins = prev.tournamentWins + 1;
            next.bestTournamentTimeSec =
              prev.bestTournamentTimeSec === null
                ? totalTime
                : Math.min(prev.bestTournamentTimeSec, totalTime);
          }
          saveLocalRecords(next);
          return next;
        });

        if (playerWon && modeRef.current === 'tournament') {
          setTournamentElapsedAcc((acc) => acc + stats.durationSec);
        }
        setScreen(playerWon ? 'victory' : 'defeat');
      },
      onPauseToggle: () => {
        if (screenRef.current === 'playing') {
          engine.setPaused(true);
          setScreen('paused');
        } else if (screenRef.current === 'paused') {
          engine.setPaused(false);
          setScreen('playing');
        }
      },
      onContextLost: (lost) => {
        setContextLost(lost);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Keep 3D turntable showcase synced while on Select screen
  useEffect(() => {
    if (screen === 'select' && engineRef.current) {
      const previewStage = mode === 'tournament' ? 'sky_temple' : stageId;
      engineRef.current.setupSelectScene(playerId, previewStage);
    }
  }, [screen, playerId, stageId, mode]);

  const handlePlayerChange = useCallback((nextId: FighterId) => {
    setPlayerId(nextId);
    setSlots((prev) =>
      prev.map((s) => (s.isPlayer ? { ...s, fighterId: nextId } : s)),
    );
  }, []);

  const handleSelectPreset = useCallback(
    (nextPreset: MatchPresetId) => {
      const built = buildPresetSlots(nextPreset, playerId);
      setPresetId(nextPreset);
      setRuleMode(built.ruleMode);
      setSlots(built.slots);
    },
    [playerId],
  );

  const handleRuleModeChange = useCallback((nextRule: MatchRuleMode) => {
    setPresetId('custom');
    setRuleMode(nextRule);
    setSlots((prev) =>
      prev.map((s, idx) => {
        if (nextRule === 'ffa') {
          return {
            ...s,
            team: FFA_SLOT_TEAMS[idx % FFA_SLOT_TEAMS.length],
            label: s.isPlayer ? 'J1' : `Bot ${idx}`,
          };
        }
        // Teams mode: player on Blue, bots default to Red unless 4 slots (make Bot 1 ally for instant 2v2 feel)
        const defaultBlue = s.isPlayer || (prev.length === 4 && idx === 1);
        return {
          ...s,
          team: defaultBlue ? 'blue' : 'red',
          label: s.isPlayer ? 'J1' : defaultBlue ? 'Aliado' : `Bot ${idx}`,
        };
      }),
    );
  }, []);

  const handleSlotsChange = useCallback((nextSlots: CombatantSlot[]) => {
    setPresetId('custom');
    setSlots(nextSlots);
  }, []);

  const handleToggleMute = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    const nextMuted = eng.sound.toggleMute();
    setMuted(nextMuted);
  }, []);

  const handleGoSelectFromTitle = useCallback((chosenMode: GameMode) => {
    engineRef.current?.sound.unlock();
    setMode(chosenMode);
    setScreen('select');
  }, []);

  const buildTournamentMatchConfig = useCallback(
    (round: TournamentRound, totalRounds: number): MatchConfig => ({
      ruleMode: 'ffa',
      stageId: round.stageId,
      aiLevel: round.aiLevel,
      roundLabel: `Ronda ${round.round}/${totalRounds} · ${round.aiLabel}`,
      slots: [
        { slotIndex: 0, isPlayer: true, fighterId: playerId, team: 'blue', label: 'J1' },
        {
          slotIndex: 1,
          isPlayer: false,
          fighterId: round.opponentId,
          team: 'red',
          label: 'Bot 1',
        },
      ],
    }),
    [playerId],
  );

  const handleStartMatch = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;

    if (mode === 'tournament') {
      const ladder = buildTournamentLadder(playerId);
      setTournamentLadder(ladder);
      setTournamentRoundIdx(0);
      setTournamentElapsedAcc(0);
      const first = ladder[0];
      setStageId(first.stageId);
      setAiLevel(first.aiLevel);
      setScreen('playing');
      eng.startMatch(buildTournamentMatchConfig(first, ladder.length));
    } else {
      const formatText = buildFormatSummary(ruleMode, slots);
      setScreen('playing');
      eng.startMatch({
        ruleMode,
        stageId,
        aiLevel,
        slots,
        roundLabel: `${formatText} · ${AI_LEVEL_LABELS[aiLevel]}`,
      });
    }
  }, [mode, playerId, buildTournamentMatchConfig, ruleMode, slots, stageId, aiLevel]);

  const handleNextTournamentRound = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    const nextIdx = tournamentRoundIdx + 1;
    const round = tournamentLadder[nextIdx];
    if (!round) return;
    setTournamentRoundIdx(nextIdx);
    setStageId(round.stageId);
    setAiLevel(round.aiLevel);
    setScreen('playing');
    eng.startMatch(buildTournamentMatchConfig(round, tournamentLadder.length));
  }, [tournamentRoundIdx, tournamentLadder, buildTournamentMatchConfig]);

  const handleRestartMatch = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    if (mode === 'tournament') {
      if (screen === 'victory') {
        handleStartMatch();
        return;
      }
      const round = tournamentLadder[tournamentRoundIdx];
      setScreen('playing');
      eng.startMatch(buildTournamentMatchConfig(round, tournamentLadder.length));
    } else {
      const formatText = buildFormatSummary(ruleMode, slots);
      setScreen('playing');
      eng.startMatch({
        ruleMode,
        stageId,
        aiLevel,
        slots,
        roundLabel: `${formatText} · ${AI_LEVEL_LABELS[aiLevel]}`,
      });
    }
  }, [
    mode,
    screen,
    handleStartMatch,
    tournamentLadder,
    tournamentRoundIdx,
    buildTournamentMatchConfig,
    ruleMode,
    slots,
    stageId,
    aiLevel,
  ]);

  const handleResume = useCallback(() => {
    engineRef.current?.setPaused(false);
    setScreen('playing');
  }, []);

  const handlePauseButton = useCallback(() => {
    engineRef.current?.setPaused(true);
    setScreen('paused');
  }, []);

  const handleGoSelect = useCallback(() => {
    engineRef.current?.setPaused(false);
    setScreen('select');
  }, []);

  const handleGoTitle = useCallback(() => {
    engineRef.current?.setupTitleScene();
    setScreen('title');
  }, []);

  const activeStageName = STAGES[stageId].name;
  const activeModeLabel =
    mode === 'tournament'
      ? `Torneo · Ronda ${tournamentRoundIdx + 1}/${tournamentLadder.length} · Nv.${aiLevel}`
      : `${buildFormatSummary(ruleMode, slots)} · Nv.${aiLevel}`;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0B1324]">
      {/* Isolated WebGL Viewport Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {contextLost && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0B1324] text-center p-6">
          <div className="max-w-sm rounded-2xl border border-white/15 bg-slate-900 p-6 space-y-2">
            <h2 className="font-display font-bold text-xl text-white">
              Contexto gráfico WebGL suspendido
            </h2>
            <p className="text-sm text-slate-300">
              Esperando recuperación del renderizador 3D o recarga la página si persiste.
            </p>
          </div>
        </div>
      )}

      {screen === 'title' && (
        <TitleOverlay
          records={records}
          muted={muted}
          onToggleMute={handleToggleMute}
          onSelectMode={handleGoSelectFromTitle}
        />
      )}

      {screen === 'select' && (
        <SelectOverlay
          mode={mode}
          playerId={playerId}
          stageId={stageId}
          aiLevel={aiLevel}
          presetId={presetId}
          ruleMode={ruleMode}
          slots={slots}
          muted={muted}
          onToggleMute={handleToggleMute}
          onModeChange={setMode}
          onPlayerChange={handlePlayerChange}
          onStageChange={setStageId}
          onAiLevelChange={setAiLevel}
          onSelectPreset={handleSelectPreset}
          onRuleModeChange={handleRuleModeChange}
          onSlotsChange={handleSlotsChange}
          onStartMatch={handleStartMatch}
          onBack={handleGoTitle}
        />
      )}

      {(screen === 'playing' || screen === 'paused' || screen === 'victory' || screen === 'defeat') && (
        <CombatHud
          hud={hud}
          modeLabel={activeModeLabel}
          stageName={activeStageName}
          muted={muted}
          onToggleMute={handleToggleMute}
          onPause={handlePauseButton}
        />
      )}

      {(screen === 'paused' || screen === 'victory' || screen === 'defeat') && (
        <PauseAndResultModal
          screen={screen}
          mode={mode}
          tournamentRound={tournamentRoundIdx + 1}
          tournamentTotal={tournamentLadder.length}
          stats={matchStats}
          onResume={handleResume}
          onNextRound={handleNextTournamentRound}
          onRestart={handleRestartMatch}
          onChangeSelect={handleGoSelect}
          onMainMenu={handleGoTitle}
        />
      )}
    </main>
  );
}
