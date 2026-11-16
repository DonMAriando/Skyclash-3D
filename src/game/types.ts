export type FighterId = 'kael' | 'vespera' | 'titan' | 'lyra';
export type StageId = 'sky_temple' | 'pillar_sanctuary' | 'golden_summit';
export type GameMode = 'tournament' | 'quick';
export type ScreenState = 'title' | 'select' | 'playing' | 'paused' | 'victory' | 'defeat';

export type FighterActionState =
  | 'idle'
  | 'run'
  | 'jump'
  | 'fall'
  | 'light'
  | 'smash_charge'
  | 'smash'
  | 'special'
  | 'up_special'
  | 'shield'
  | 'dodge'
  | 'hitstun'
  | 'dizzy'
  | 'respawn'
  | 'ko';

export interface FighterProfile {
  id: FighterId;
  name: string;
  title: string;
  archetype: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  emissiveColor: string;
  // Physics stats
  weight: number; // Higher = resists knockback more
  runSpeed: number;
  airSpeed: number;
  jumpForce: number;
  doubleJumpForce: number;
  gravity: number;
  fallSpeedMax: number;
  // Combat stats
  lightDamage: number;
  lightKnockback: number;
  lightRange: number;
  smashDamage: number;
  smashKnockback: number;
  smashRange: number;
  specialName: string;
  specialDesc: string;
  upSpecialName: string;
  upSpecialDesc: string;
  upSpecialBoost: number;
  passiveName: string;
  passiveDesc: string;
  // UI display ratings (1-5)
  speedRating: number;
  powerRating: number;
  weightRating: number;
}

export interface PlatformDef {
  id: string;
  x: number;
  y: number;
  width: number;
  thickness: number;
  depth: number;
  oneWay: boolean;
  /** Optional oscillation for moving platforms */
  moveAxis?: 'x' | 'y';
  moveAmplitude?: number;
  moveSpeed?: number;
  movePhase?: number;
}

export interface StageProfile {
  id: StageId;
  name: string;
  subtitle: string;
  description: string;
  skyTopColor: string;
  skyBottomColor: string;
  fogColor: string;
  sunColor: string;
  hemiSkyColor: string;
  hemiGroundColor: string;
  accentColor: string;
  platforms: PlatformDef[];
  blastZones: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  spawnPoints: [
    { x: number; y: number },
    { x: number; y: number }
  ];
}

export interface TournamentRound {
  round: number;
  aiLevel: number;
  aiLabel: string;
  opponentId: FighterId;
  stageId: StageId;
}

export interface FighterHudState {
  id: FighterId;
  name: string;
  isPlayer: boolean;
  damage: number;
  stocks: number;
  maxStocks: number;
  shield: number;
  isShielding: boolean;
  action: FighterActionState;
  lastHitTimestamp: number;
  offscreen: {
    visible: boolean;
    xPct: number;
    yPct: number;
    angleRad: number;
  };
}

export interface MatchBanner {
  text: string;
  subtext?: string;
  tone: 'neutral' | 'ko' | 'victory' | 'defeat';
}

export interface MatchStats {
  durationSec: number;
  playerKOs: number;
  aiKOs: number;
  playerMaxDamage: number;
  aiMaxDamage: number;
  damageDealt: number;
}

export interface HudSnapshot {
  fighters: [FighterHudState, FighterHudState];
  elapsedSec: number;
  banner: MatchBanner | null;
  stats: MatchStats;
}

export interface LocalRecords {
  tournamentWins: number;
  bestTournamentTimeSec: number | null;
  totalKOs: number;
}
