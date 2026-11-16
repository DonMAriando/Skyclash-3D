import type {
  CombatantSlot,
  FighterId,
  FighterProfile,
  LocalRecords,
  MatchPresetId,
  MatchRuleMode,
  StageId,
  StageProfile,
  TeamId,
  TournamentRound,
} from './types';

export const TEAM_META: Record<
  TeamId,
  { name: string; hex: number; borderClass: string; textClass: string; bgDotClass: string; badgeClass: string }
> = {
  blue: {
    name: 'Azul',
    hex: 0x38bdf8,
    borderClass: 'border-sky-400/60',
    textClass: 'text-sky-400',
    bgDotClass: 'bg-sky-400 border-sky-200',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
  },
  red: {
    name: 'Rojo',
    hex: 0xf43f5e,
    borderClass: 'border-rose-400/60',
    textClass: 'text-rose-400',
    bgDotClass: 'bg-rose-500 border-rose-200',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
  },
  amber: {
    name: 'Ámbar',
    hex: 0xfbbf24,
    borderClass: 'border-amber-400/60',
    textClass: 'text-amber-300',
    bgDotClass: 'bg-amber-400 border-amber-200',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  },
  emerald: {
    name: 'Verde',
    hex: 0x34d399,
    borderClass: 'border-emerald-400/60',
    textClass: 'text-emerald-400',
    bgDotClass: 'bg-emerald-400 border-emerald-200',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  },
  violet: {
    name: 'Violeta',
    hex: 0xa78bfa,
    borderClass: 'border-violet-400/60',
    textClass: 'text-violet-400',
    bgDotClass: 'bg-violet-400 border-violet-200',
    badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-400/40',
  },
};

export const FFA_SLOT_TEAMS: TeamId[] = ['blue', 'red', 'amber', 'emerald', 'violet'];

export function buildPresetSlots(
  preset: MatchPresetId,
  playerId: FighterId,
): { ruleMode: MatchRuleMode; slots: CombatantSlot[] } {
  const others: FighterId[] = (['kael', 'vespera', 'titan', 'lyra'] as FighterId[]).filter(
    (id) => id !== playerId,
  );
  const f1 = others[0];
  const f2 = others[1];
  const f3 = others[2];
  const f4 = playerId;

  if (preset === '1v1') {
    return {
      ruleMode: 'ffa',
      slots: [
        { slotIndex: 0, isPlayer: true, fighterId: playerId, team: 'blue', label: 'J1' },
        { slotIndex: 1, isPlayer: false, fighterId: f1, team: 'red', label: 'Bot 1' },
      ],
    };
  }
  if (preset === 'ffa4') {
    return {
      ruleMode: 'ffa',
      slots: [
        { slotIndex: 0, isPlayer: true, fighterId: playerId, team: 'blue', label: 'J1' },
        { slotIndex: 1, isPlayer: false, fighterId: f1, team: 'red', label: 'Bot 1' },
        { slotIndex: 2, isPlayer: false, fighterId: f2, team: 'amber', label: 'Bot 2' },
        { slotIndex: 3, isPlayer: false, fighterId: f3, team: 'emerald', label: 'Bot 3' },
      ],
    };
  }
  if (preset === '2v2') {
    return {
      ruleMode: 'teams',
      slots: [
        { slotIndex: 0, isPlayer: true, fighterId: playerId, team: 'blue', label: 'J1' },
        { slotIndex: 1, isPlayer: false, fighterId: f1, team: 'blue', label: 'Aliado' },
        { slotIndex: 2, isPlayer: false, fighterId: f2, team: 'red', label: 'Bot 2' },
        { slotIndex: 3, isPlayer: false, fighterId: f3, team: 'red', label: 'Bot 3' },
      ],
    };
  }
  if (preset === '1v3') {
    return {
      ruleMode: 'teams',
      slots: [
        { slotIndex: 0, isPlayer: true, fighterId: playerId, team: 'blue', label: 'J1' },
        { slotIndex: 1, isPlayer: false, fighterId: f1, team: 'red', label: 'Bot 1' },
        { slotIndex: 2, isPlayer: false, fighterId: f2, team: 'red', label: 'Bot 2' },
        { slotIndex: 3, isPlayer: false, fighterId: f3, team: 'red', label: 'Bot 3' },
      ],
    };
  }
  // 1v4 Deathmatch (5 fighters!)
  return {
    ruleMode: 'teams',
    slots: [
      { slotIndex: 0, isPlayer: true, fighterId: playerId, team: 'blue', label: 'J1' },
      { slotIndex: 1, isPlayer: false, fighterId: f1, team: 'red', label: 'Bot 1' },
      { slotIndex: 2, isPlayer: false, fighterId: f2, team: 'red', label: 'Bot 2' },
      { slotIndex: 3, isPlayer: false, fighterId: f3, team: 'red', label: 'Bot 3' },
      { slotIndex: 4, isPlayer: false, fighterId: f4, team: 'red', label: 'Bot 4' },
    ],
  };
}

export const FIGHTERS: Record<FighterId, FighterProfile> = {
  kael: {
    id: 'kael',
    name: 'Kael',
    title: 'Guerrero Solar',
    archetype: 'Equilibrado',
    description: 'Espadachín versátil con orbes explosivos y ascenso ígneo de gran impacto.',
    primaryColor: '#EA580C',
    accentColor: '#FBBF24',
    emissiveColor: '#FB923C',
    weight: 100,
    runSpeed: 10.2,
    airSpeed: 8.6,
    jumpForce: 15.8,
    doubleJumpForce: 14.5,
    gravity: 34,
    fallSpeedMax: 21,
    lightDamage: 8,
    lightKnockback: 6.8,
    lightRange: 2.05,
    smashDamage: 18,
    smashKnockback: 14.2,
    smashRange: 2.65,
    specialName: 'Orbe Solar Explosivo',
    specialDesc: 'Lanza una esfera de fuego que detona en área al impactar o al límite de alcance.',
    upSpecialName: 'Ascenso Ígneo',
    upSpecialDesc: 'Corte ascendente en llamas con impulso diagonal y alto poder de K.O.',
    upSpecialBoost: 19.2,
    passiveName: 'Hoja Abrasadora',
    passiveDesc: 'Sus ataques Smash tienen mayor alcance con arco de fuego.',
    speedRating: 3,
    powerRating: 4,
    weightRating: 3,
  },
  vespera: {
    id: 'vespera',
    name: 'Vespera',
    title: 'Centinela Espectral',
    archetype: 'Velocista Aérea',
    description: 'Asesina ultrarrápida con triple salto, teletransporte y embestida invisible.',
    primaryColor: '#4F46E5',
    accentColor: '#22D3EE',
    emissiveColor: '#06B6D4',
    weight: 82,
    runSpeed: 12.6,
    airSpeed: 10.8,
    jumpForce: 16.8,
    doubleJumpForce: 15.4,
    gravity: 32,
    fallSpeedMax: 19.5,
    lightDamage: 7,
    lightKnockback: 5.8,
    lightRange: 1.85,
    smashDamage: 15,
    smashKnockback: 12.8,
    smashRange: 2.25,
    specialName: 'Destello Umbral',
    specialDesc: 'Embestida relámpago con invulnerabilidad breve que atraviesa al rival.',
    upSpecialName: 'Teletransporte Cian',
    upSpecialDesc: 'Salto dimensional instantáneo hacia arriba seguido de un torbellino de dagas.',
    upSpecialBoost: 16.0,
    passiveName: 'Triple Salto',
    passiveDesc: 'Posee 3 saltos totales (2 saltos en el aire) para dominio aéreo.',
    speedRating: 5,
    powerRating: 3,
    weightRating: 2,
  },
  titan: {
    id: 'titan',
    name: 'Titán-G',
    title: 'Coloso de Granito',
    archetype: 'Peso Pesado',
    description: 'Guardián acorazado con super armadura pétrea y ondas sísmicas dobles.',
    primaryColor: '#475569',
    accentColor: '#F59E0B',
    emissiveColor: '#FBBF24',
    weight: 134,
    runSpeed: 8.1,
    airSpeed: 6.9,
    jumpForce: 14.5,
    doubleJumpForce: 13.2,
    gravity: 37,
    fallSpeedMax: 24,
    lightDamage: 11,
    lightKnockback: 8.4,
    lightRange: 2.35,
    smashDamage: 24,
    smashKnockback: 17.8,
    smashRange: 2.85,
    specialName: 'Onda Sísmica',
    specialDesc: 'Aplasta el suelo enviando dos ondas doradas hacia ambos lados.',
    upSpecialName: 'Propulsión Áurea',
    upSpecialDesc: 'Despegue vertical con martillo y radio de impacto ampliado.',
    upSpecialBoost: 17.8,
    passiveName: 'Super Armadura',
    passiveDesc: 'Resiste el retroceso de golpes ligeros mientras carga Smash o usa Especiales.',
    speedRating: 2,
    powerRating: 5,
    weightRating: 5,
  },
  lyra: {
    id: 'lyra',
    name: 'Lyra',
    title: 'Maga del Viento',
    archetype: 'Control y Alcance',
    description: 'Hechicera capaz de planear en el aire y elevar rivales con torbellinos.',
    primaryColor: '#059669',
    accentColor: '#A7F3D0',
    emissiveColor: '#34D399',
    weight: 90,
    runSpeed: 9.7,
    airSpeed: 9.6,
    jumpForce: 16.2,
    doubleJumpForce: 15.2,
    gravity: 29,
    fallSpeedMax: 17.5,
    lightDamage: 8,
    lightKnockback: 6.5,
    lightRange: 2.25,
    smashDamage: 17,
    smashKnockback: 13.8,
    smashRange: 2.65,
    specialName: 'Céfiro Arcano',
    specialDesc: 'Vórtice rastreador de altura que lanza al enemigo hacia arriba.',
    upSpecialName: 'Corriente Celestial',
    upSpecialDesc: 'Gran impulso de viento ascendente con ráfaga protectora.',
    upSpecialBoost: 19.8,
    passiveName: 'Planeo Celestial',
    passiveDesc: 'Mantén Saltar (W o Espacio) en el aire para planear lentamente.',
    speedRating: 4,
    powerRating: 3,
    weightRating: 2,
  },
};

export const FIGHTER_LIST: FighterProfile[] = [
  FIGHTERS.kael,
  FIGHTERS.vespera,
  FIGHTERS.titan,
  FIGHTERS.lyra,
];

export const STAGES: Record<StageId, StageProfile> = {
  sky_temple: {
    id: 'sky_temple',
    name: 'Templo del Cielo',
    subtitle: 'Isla Clásica · 3 Plataformas',
    description: 'Santuario elevado de mármol y césped esmeralda con tres altares flotantes simétricos.',
    skyTopColor: '#1E40AF',
    skyBottomColor: '#7DD3FC',
    fogColor: '#BAE6FD',
    sunColor: '#FFF7ED',
    hemiSkyColor: '#93C5FD',
    hemiGroundColor: '#3F6212',
    accentColor: '#38BDF8',
    platforms: [
      { id: 'main', x: 0, y: 0, width: 17.5, thickness: 1.6, depth: 4.8, oneWay: false },
      { id: 'left_mid', x: -4.8, y: 3.1, width: 4.4, thickness: 0.42, depth: 2.6, oneWay: true },
      { id: 'right_mid', x: 4.8, y: 3.1, width: 4.4, thickness: 0.42, depth: 2.6, oneWay: true },
      { id: 'top_center', x: 0, y: 6.0, width: 4.8, thickness: 0.42, depth: 2.6, oneWay: true },
    ],
    blastZones: { left: -21, right: 21, top: 18, bottom: -13 },
    spawnPoints: [
      { x: -5.4, y: 2.2 },
      { x: 5.4, y: 2.2 },
      { x: -4.8, y: 5.0 },
      { x: 4.8, y: 5.0 },
      { x: 0, y: 7.8 },
    ],
  },
  pillar_sanctuary: {
    id: 'pillar_sanctuary',
    name: 'Santuario de los Pilares',
    subtitle: 'Ruinas Turquesa · Plataformas Móviles',
    description: 'Puente ancestral entre obeliscos flotantes con plataformas laterales en movimiento.',
    skyTopColor: '#0F766E',
    skyBottomColor: '#67E8F9',
    fogColor: '#A5F3FC',
    sunColor: '#FEFCE8',
    hemiSkyColor: '#5EEAD4',
    hemiGroundColor: '#1E293B',
    accentColor: '#14B8A6',
    platforms: [
      { id: 'main', x: 0, y: 0, width: 15.0, thickness: 1.5, depth: 4.6, oneWay: false },
      {
        id: 'left_mover',
        x: -6.8,
        y: 3.6,
        width: 4.2,
        thickness: 0.42,
        depth: 2.5,
        oneWay: true,
        moveAxis: 'y',
        moveAmplitude: 1.55,
        moveSpeed: 1.35,
        movePhase: 0,
      },
      {
        id: 'right_mover',
        x: 6.8,
        y: 3.6,
        width: 4.2,
        thickness: 0.42,
        depth: 2.5,
        oneWay: true,
        moveAxis: 'y',
        moveAmplitude: 1.55,
        moveSpeed: 1.35,
        movePhase: Math.PI,
      },
      {
        id: 'center_slide',
        x: 0,
        y: 5.5,
        width: 4.4,
        thickness: 0.42,
        depth: 2.5,
        oneWay: true,
        moveAxis: 'x',
        moveAmplitude: 2.6,
        moveSpeed: 0.95,
        movePhase: 0.4,
      },
    ],
    blastZones: { left: -21, right: 21, top: 18, bottom: -13 },
    spawnPoints: [
      { x: -4.8, y: 2.2 },
      { x: 4.8, y: 2.2 },
      { x: -1.8, y: 2.2 },
      { x: 1.8, y: 2.2 },
      { x: 0, y: 7.4 },
    ],
  },
  golden_summit: {
    id: 'golden_summit',
    name: 'Cumbre del Volcán Dorado',
    subtitle: 'Arena Competitiva · Altar Único',
    description: 'Meseta crepuscular de basalto y oro con un altar elevado para duelos intensos.',
    skyTopColor: '#31102F',
    skyBottomColor: '#FB923C',
    fogColor: '#FDBA74',
    sunColor: '#FDE68A',
    hemiSkyColor: '#FB923C',
    hemiGroundColor: '#27272A',
    accentColor: '#F59E0B',
    platforms: [
      { id: 'main', x: 0, y: 0, width: 18.8, thickness: 1.7, depth: 5.0, oneWay: false },
      { id: 'high_shrine', x: 0, y: 3.6, width: 5.6, thickness: 0.44, depth: 2.8, oneWay: true },
    ],
    blastZones: { left: -22, right: 22, top: 18, bottom: -13 },
    spawnPoints: [
      { x: -6.2, y: 2.2 },
      { x: 6.2, y: 2.2 },
      { x: -2.6, y: 2.2 },
      { x: 2.6, y: 2.2 },
      { x: 0, y: 5.4 },
    ],
  },
};

export const STAGE_LIST: StageProfile[] = [
  STAGES.sky_temple,
  STAGES.pillar_sanctuary,
  STAGES.golden_summit,
];

export const AI_LEVEL_LABELS: Record<number, string> = {
  1: 'Nivel 1 · Aprendiz',
  2: 'Nivel 2 · Combatiente',
  3: 'Nivel 3 · Veterano',
  4: 'Nivel 4 · Maestro',
  5: 'Nivel 5 · Leyenda',
};

export function buildTournamentLadder(playerId: FighterId): TournamentRound[] {
  const pool = (['kael', 'vespera', 'titan', 'lyra'] as FighterId[]).filter((id) => id !== playerId);
  return [
    {
      round: 1,
      aiLevel: 1,
      aiLabel: AI_LEVEL_LABELS[1],
      opponentId: pool[0],
      stageId: 'sky_temple',
    },
    {
      round: 2,
      aiLevel: 3,
      aiLabel: AI_LEVEL_LABELS[3],
      opponentId: pool[1],
      stageId: 'pillar_sanctuary',
    },
    {
      round: 3,
      aiLevel: 5,
      aiLabel: AI_LEVEL_LABELS[5],
      opponentId: pool[2],
      stageId: 'golden_summit',
    },
  ];
}

const RECORDS_STORAGE_KEY = 'skyclash_3d_records_v1';

export function loadLocalRecords(): LocalRecords {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) {
      return { tournamentWins: 0, bestTournamentTimeSec: null, totalKOs: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<LocalRecords>;
    return {
      tournamentWins: typeof parsed.tournamentWins === 'number' ? parsed.tournamentWins : 0,
      bestTournamentTimeSec:
        typeof parsed.bestTournamentTimeSec === 'number' ? parsed.bestTournamentTimeSec : null,
      totalKOs: typeof parsed.totalKOs === 'number' ? parsed.totalKOs : 0,
    };
  } catch {
    return { tournamentWins: 0, bestTournamentTimeSec: null, totalKOs: 0 };
  }
}

export function saveLocalRecords(records: LocalRecords): void {
  try {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota errors
  }
}

