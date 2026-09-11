export interface DungeonTier {
  tier: number;
  floorRange: [number, number];
  name: string;
  themeName: string;
  subtitle: string;
  description: string;
  bgColor: string;
  wallColor: string;
  floorColor: string;
  gridColor: string;
  torchColor: string;
  ambientLight: string;
  enemyPool: {
    type: 'skeleton' | 'ghoul' | 'vampire_bat' | 'lich_boss' | 'boss_malakar';
    name: string;
    hpBase: number;
    atkBase: number;
    speed: number;
    color: string;
  }[];
  boss: {
    name: string;
    title: string;
    type: 'lich_boss' | 'boss_malakar';
    hp: number;
    atk: number;
    speed: number;
    specialMove: string;
    rewardSkillId: string;
  };
}

export interface DungeonSkill {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  cooldown: number; // in seconds
  power: number;
  multiplier?: number;
  unlockedAtFloor: number;
  effectType: 'shield' | 'slash' | 'smite' | 'dash_thrust' | 'divine_wrath';
}

export interface KnightOath {
  id: string;
  name: string;
  npcSource: string;
  title: string;
  description: string;
  icon: string;
  bonus: {
    hpRegen?: number;
    maxHpPercent?: number;
    attackPercent?: number;
    defenseFlat?: number;
    parryBonusWindow?: number;
    bossDamageBonus?: number;
  };
}

// 10 Distinct Environments & Bosses every 10 floors up to Floor 100
export const DUNGEON_TIERS: DungeonTier[] = [
  {
    tier: 1,
    floorRange: [1, 10],
    name: 'Katakomba Penebusan Kuno',
    themeName: 'Ancient Penitence Catacombs',
    subtitle: 'Lantai 1 - 10 • Lorong Batu Lembab & Ratapan Kerangka',
    description: 'Bawah tanah suaka tempat mayat prajurit purba terkubur, kini dirasuki hawa kutukan kelam.',
    bgColor: '#09080e',
    floorColor: '#14121b',
    wallColor: '#2b2737',
    gridColor: 'rgba(74, 66, 94, 0.25)',
    torchColor: '#38bdf8',
    ambientLight: 'rgba(56, 189, 248, 0.08)',
    enemyPool: [
      { type: 'skeleton', name: 'Kerangka Martir Berkarat', hpBase: 45, atkBase: 12, speed: 65, color: '#e2e8f0' },
      { type: 'ghoul', name: 'Mayat Pengembara Kripta', hpBase: 65, atkBase: 16, speed: 50, color: '#a3e635' },
    ],
    boss: {
      name: 'Vorok Sang Penjaga Makam',
      title: 'Warden of the Catacombs (Lantai 10)',
      type: 'lich_boss',
      hp: 350,
      atk: 28,
      speed: 70,
      specialMove: 'Grave Earth Shatter',
      rewardSkillId: 'aegis_of_dawn',
    },
  },
  {
    tier: 2,
    floorRange: [11, 20],
    name: 'Kripta Air Bawah Tanah Purba',
    themeName: 'Sunken Aquatic Crypts',
    subtitle: 'Lantai 11 - 20 • Air Terkutuk & Mayat Berlumut',
    description: 'Saluran air kuno yang tenggelam ribuan tahun lalu, dipenuhi gas beracun dan arwah tenggelam.',
    bgColor: '#040d12',
    floorColor: '#071d26',
    wallColor: '#0d384a',
    gridColor: 'rgba(13, 148, 136, 0.25)',
    torchColor: '#2dd4bf',
    ambientLight: 'rgba(45, 212, 191, 0.09)',
    enemyPool: [
      { type: 'ghoul', name: 'Arwah Tenggelam Beracun', hpBase: 90, atkBase: 22, speed: 55, color: '#2dd4bf' },
      { type: 'vampire_bat', name: 'Kelelawar Air Rawa Purba', hpBase: 60, atkBase: 18, speed: 100, color: '#38bdf8' },
    ],
    boss: {
      name: 'Sir Dagonith Sang Ksatria Laut Dalam',
      title: 'Abyssal Drowned Knight (Lantai 20)',
      type: 'boss_malakar',
      hp: 600,
      atk: 36,
      speed: 75,
      specialMove: 'Tidal Wave Impale',
      rewardSkillId: 'radiant_thrust',
    },
  },
  {
    tier: 3,
    floorRange: [21, 30],
    name: 'Gua Darah Membara',
    themeName: 'Crimson Blood Caverns',
    subtitle: 'Lantai 21 - 30 • Danau Darah & Tulang Iblis',
    description: 'Gua merah menyala yang mengalirkan darah abadi peninggalan ritual terlarang bangsawan vampir.',
    bgColor: '#160509',
    floorColor: '#280a10',
    wallColor: '#5c101c',
    gridColor: 'rgba(225, 29, 72, 0.3)',
    torchColor: '#f43f5e',
    ambientLight: 'rgba(244, 63, 94, 0.12)',
    enemyPool: [
      { type: 'vampire_bat', name: 'Gargoyle Pengisap Darah', hpBase: 100, atkBase: 28, speed: 105, color: '#f43f5e' },
      { type: 'skeleton', name: 'Kerangka Ksatria Darah', hpBase: 125, atkBase: 32, speed: 72, color: '#fda4af' },
    ],
    boss: {
      name: 'Bayangan Ratu Carmilla',
      title: 'Blood Gorgon Matron (Lantai 30)',
      type: 'lich_boss',
      hp: 950,
      atk: 48,
      speed: 82,
      specialMove: 'Blood Rose Vortex',
      rewardSkillId: 'judgement_pillar',
    },
  },
  {
    tier: 4,
    floorRange: [31, 40],
    name: 'Kawah Obsidian Api Neraka',
    themeName: 'Molten Obsidian Forge',
    subtitle: 'Lantai 31 - 40 • Lahar Panas & Abu Hitam Neraka',
    description: 'Bengkel bawah tanah kuno tempat iblis menempa senjata kutukan menggunakan batu obsidian dan magma.',
    bgColor: '#170603',
    floorColor: '#260a04',
    wallColor: '#631a08',
    gridColor: 'rgba(234, 88, 12, 0.3)',
    torchColor: '#f97316',
    ambientLight: 'rgba(249, 115, 22, 0.14)',
    enemyPool: [
      { type: 'ghoul', name: 'Iblis Abu Vulkanik', hpBase: 160, atkBase: 40, speed: 65, color: '#f97316' },
      { type: 'skeleton', name: 'Prajurit Pembakar Obsidian', hpBase: 180, atkBase: 45, speed: 75, color: '#fdba74' },
    ],
    boss: {
      name: 'Ignis Colossus',
      title: 'Raksasa Api Obsidian Terkutuk (Lantai 40)',
      type: 'boss_malakar',
      hp: 1400,
      atk: 60,
      speed: 70,
      specialMove: 'Hellfire Eruption',
      rewardSkillId: 'holy_cross_slash',
    },
  },
  {
    tier: 5,
    floorRange: [41, 50],
    name: 'Makam Es Abadi Yang Terkutuk',
    themeName: 'Glacial Tomb of the Forsaken',
    subtitle: 'Lantai 41 - 50 • Badai Salju Beku & Kristal Jiwa',
    description: 'Ruang es abadi dengan suhu di bawah nol mutlak, membekukan darah dan jiwa ksatria yang gugur.',
    bgColor: '#030d17',
    floorColor: '#071828',
    wallColor: '#0e3352',
    gridColor: 'rgba(56, 189, 248, 0.3)',
    torchColor: '#38bdf8',
    ambientLight: 'rgba(56, 189, 248, 0.15)',
    enemyPool: [
      { type: 'skeleton', name: 'Ksatria Salju Beku', hpBase: 220, atkBase: 52, speed: 78, color: '#bae6fd' },
      { type: 'ghoul', name: 'Mayat Es Frost Revenant', hpBase: 250, atkBase: 58, speed: 62, color: '#7dd3fc' },
    ],
    boss: {
      name: 'Lich King Arthas the Frostbound',
      title: 'Raja Mayat Hidup Es Abadi (Lantai 50)',
      type: 'lich_boss',
      hp: 1950,
      atk: 74,
      speed: 85,
      specialMove: 'Glacial Blizzard Nova',
      rewardSkillId: 'radiant_burst_cleave',
    },
  },
  {
    tier: 6,
    floorRange: [51, 60],
    name: 'Rawa Beracun Siksa Dosa',
    themeName: 'Toxic Abyss Mire',
    subtitle: 'Lantai 51 - 60 • Kabut Asam & Lendir Jiwa Hampa',
    description: 'Kedalaman beracun di mana bangkai monster purba membusuk menjadi cairan asam pemusnah baja.',
    bgColor: '#081408',
    floorColor: '#0e240e',
    wallColor: '#1e4b1e',
    gridColor: 'rgba(34, 197, 94, 0.3)',
    torchColor: '#4ade80',
    ambientLight: 'rgba(74, 222, 128, 0.12)',
    enemyPool: [
      { type: 'vampire_bat', name: 'Naga Terbang Beracun Rawa', hpBase: 280, atkBase: 65, speed: 110, color: '#86efac' },
      { type: 'ghoul', name: 'Abominasi Racun Berlendir', hpBase: 340, atkBase: 72, speed: 60, color: '#4ade80' },
    ],
    boss: {
      name: 'Hydra Sembilan Kepala Rawa Neraka',
      title: 'Venomous Behemoth Hydra (Lantai 60)',
      type: 'boss_malakar',
      hp: 2600,
      atk: 90,
      speed: 80,
      specialMove: 'Corrosive Acid Rain',
      rewardSkillId: 'divine_wrath',
    },
  },
  {
    tier: 7,
    floorRange: [61, 70],
    name: 'Menara Astral Bintang Purba',
    themeName: 'Cosmic Astral Spires',
    subtitle: 'Lantai 61 - 70 • Jalur Angkasa & Nebula Kosmik',
    description: 'Puncak arsitektur falak di mana ruang angkasa dan sihir bintang berputar melindungi rahasia ilahi.',
    bgColor: '#0c071a',
    floorColor: '#170e33',
    wallColor: '#341f70',
    gridColor: 'rgba(168, 85, 247, 0.3)',
    torchColor: '#c084fc',
    ambientLight: 'rgba(192, 132, 252, 0.15)',
    enemyPool: [
      { type: 'skeleton', name: 'Prajurit Bintang Astral', hpBase: 380, atkBase: 84, speed: 85, color: '#e9d5ff' },
      { type: 'vampire_bat', name: 'Entitas Cahaya Kosmik', hpBase: 320, atkBase: 88, speed: 115, color: '#d8b4fe' },
    ],
    boss: {
      name: 'Naga Falak Penjaga Rasi Bintang',
      title: 'Astral Celestial Dragon (Lantai 70)',
      type: 'lich_boss',
      hp: 3400,
      atk: 105,
      speed: 92,
      specialMove: 'Supernova Burst',
      rewardSkillId: 'celestial_ward',
    },
  },
  {
    tier: 8,
    floorRange: [71, 80],
    name: 'Balairung Ksatria Jatuh',
    themeName: 'Halls of Corrupted Paladins',
    subtitle: 'Lantai 71 - 80 • Zirah Hitam Terkutuk & Pedang Berkarat',
    description: 'Markas para ksatria suci zaman dahulu yang mengkhianati sumpah dan bersujud pada iblis kegelapan.',
    bgColor: '#120409',
    floorColor: '#1f0710',
    wallColor: '#451025',
    gridColor: 'rgba(190, 18, 60, 0.3)',
    torchColor: '#fb7185',
    ambientLight: 'rgba(251, 113, 133, 0.12)',
    enemyPool: [
      { type: 'skeleton', name: 'Ksatria Templar Kegelapan', hpBase: 460, atkBase: 100, speed: 88, color: '#f43f5e' },
      { type: 'ghoul', name: 'Algojo Zirah Besi Berduri', hpBase: 520, atkBase: 112, speed: 70, color: '#9f1239' },
    ],
    boss: {
      name: 'Grand Inquisitor Malakar the Corrupted',
      title: 'Panglima Ksatria Kegelapan (Lantai 80)',
      type: 'boss_malakar',
      hp: 4400,
      atk: 130,
      speed: 90,
      specialMove: 'Unholy Smite Guillotine',
      rewardSkillId: 'holy_avenger',
    },
  },
  {
    tier: 9,
    floorRange: [81, 90],
    name: 'Suaka Kehampaan Dimensi Hitam',
    themeName: 'Eldritch Void Domain',
    subtitle: 'Lantai 81 - 90 • Gravitasi Hancur & Realitas Retak',
    description: 'Retakan ruang dan waktu di mana monster tidak memiliki wujud fisik tetap dan menelan cahaya apa pun.',
    bgColor: '#05020a',
    floorColor: '#0b0416',
    wallColor: '#1a0933',
    gridColor: 'rgba(139, 92, 246, 0.35)',
    torchColor: '#a855f7',
    ambientLight: 'rgba(168, 85, 247, 0.18)',
    enemyPool: [
      { type: 'ghoul', name: 'Penelan Realitas Kehampaan', hpBase: 600, atkBase: 125, speed: 78, color: '#c084fc' },
      { type: 'vampire_bat', name: 'Bayangan Antariksa Tanpa Wajah', hpBase: 500, atkBase: 135, speed: 120, color: '#e9d5ff' },
    ],
    boss: {
      name: 'The Reality Devourer',
      title: 'Sang Penghancur Dimensi Hitam (Lantai 90)',
      type: 'lich_boss',
      hp: 5600,
      atk: 155,
      speed: 95,
      specialMove: 'Singularity Void Collapse',
      rewardSkillId: 'dawn_cataclysm',
    },
  },
  {
    tier: 10,
    floorRange: [91, 100],
    name: 'Puncak Takhta Cahaya Ilahi Terlarang',
    themeName: 'Apex Celestial Throne',
    subtitle: 'Lantai 91 - 100 • Emas Murni & Gerhana Suci Terakhir',
    description: 'Puncak tertinggi menara 100 lantai. Tempat bersemayam Dewa Gerhana penentu takdir dunia.',
    bgColor: '#120f04',
    floorColor: '#241e08',
    wallColor: '#574914',
    gridColor: 'rgba(234, 179, 8, 0.4)',
    torchColor: '#facc15',
    ambientLight: 'rgba(250, 204, 21, 0.22)',
    enemyPool: [
      { type: 'skeleton', name: 'Malaikat Penjaga Gerbang Emas', hpBase: 750, atkBase: 150, speed: 95, color: '#fef08a' },
      { type: 'ghoul', name: 'Cherubim Pedang Cahaya', hpBase: 850, atkBase: 165, speed: 82, color: '#fde047' },
    ],
    boss: {
      name: 'Empyrean God of the Eclipse',
      title: 'Dewa Gerhana Abadi — Penguasa 100 Lantai (Lantai 100)',
      type: 'boss_malakar',
      hp: 8888,
      atk: 220,
      speed: 105,
      specialMove: 'Eternal Solar Flare Judgment',
      rewardSkillId: 'god_slayer_blade',
    },
  },
];

export interface SkillCombo {
  id: string;
  name: string;
  title: string;
  sequence: string[]; // skill IDs in order
  damageMultiplier: number; // e.g. 2.5 = 250% total multiplier
  description: string;
  icon: string;
  color: string;
  glowColor: string;
}

// Combo Skill Sequences (Rantai Combo Skill)
export const SKILL_COMBOS: SkillCombo[] = [
  {
    id: 'trinity_light',
    name: 'Tritunggal Cahaya Suci',
    title: 'TRINITY OF LIGHT (Bonus +250% Damage)',
    sequence: ['aegis_of_dawn', 'radiant_thrust', 'holy_cross_slash'],
    damageMultiplier: 2.5,
    description: 'Perisai -> Tusukan Kilat -> Tebasan Sabit: Ledakan gabungan ilahi menyapu seluruh musuh!',
    icon: '⚡',
    color: '#fef08a',
    glowColor: '#f59e0b',
  },
  {
    id: 'holy_cataclysm',
    name: 'Bencana Suci Gerhana',
    title: 'HOLY CATACLYSM (Bonus +320% Damage)',
    sequence: ['radiant_thrust', 'judgement_pillar', 'divine_wrath'],
    damageMultiplier: 3.2,
    description: 'Tusukan -> Pillar -> Murka Ilahi: Pembantaian bencana suci pemusnah bos!',
    icon: '⚜️',
    color: '#c084fc',
    glowColor: '#9333ea',
  },
  {
    id: 'celestial_strike',
    name: 'Penghakiman Angkasa',
    title: 'CELESTIAL JUDGEMENT (Bonus +220% Damage)',
    sequence: ['holy_cross_slash', 'radiant_thrust', 'judgement_pillar'],
    damageMultiplier: 2.2,
    description: 'Tebasan -> Tusukan -> Pillar: Gelombang tebasan kilat yang meruntuhkan pilar cahaya!',
    icon: '☀️',
    color: '#38bdf8',
    glowColor: '#0284c7',
  },
  {
    id: 'shield_blade_burst',
    name: 'Empasan Perisai Bilah',
    title: 'SHIELD BLADE SURGE (Bonus +180% Damage)',
    sequence: ['aegis_of_dawn', 'holy_cross_slash'],
    damageMultiplier: 1.8,
    description: 'Perisai -> Tebasan Sabit: Memantulkan energi perisai ke tebasan pedang!',
    icon: '🛡️',
    color: '#4ade80',
    glowColor: '#16a34a',
  },
];

// Available Special Combat Skills (Equippable & Castable in Dungeon)
export const DUNGEON_COMBAT_SKILLS: Record<string, DungeonSkill> = {
  holy_cross_slash: {
    id: 'holy_cross_slash',
    name: 'Tebasan Sabit Suci',
    title: 'Holy Crescent Cleave [R]',
    description: 'Mengayunkan pedang suci dengan gelombang cahaya busur menyapu semua musuh di depan untuk 250% damage.',
    icon: '✨',
    cooldown: 4.5,
    power: 2.5,
    unlockedAtFloor: 1, // Base weapon skill
    effectType: 'slash',
  },
  aegis_of_dawn: {
    id: 'aegis_of_dawn',
    name: 'Perisai Fajar Suci',
    title: 'Aegis of the Dawn [1]',
    description: 'Menciptakan perisai kubah cahaya tak tertembus selama 4 detik yang memantulkan 50% damage musuh.',
    icon: '🛡️',
    cooldown: 12,
    power: 1.0,
    unlockedAtFloor: 10,
    effectType: 'shield',
  },
  radiant_thrust: {
    id: 'radiant_thrust',
    name: 'Tusukan Kilat Cahaya',
    title: 'Radiant Piercing Thrust [2]',
    description: 'Melesat maju seketika menembus barisan musuh dan memberikan 300% damage tusukan suci.',
    icon: '⚡',
    cooldown: 7.0,
    power: 3.0,
    unlockedAtFloor: 20,
    effectType: 'dash_thrust',
  },
  judgement_pillar: {
    id: 'judgement_pillar',
    name: 'Pilar Penghakiman Langit',
    title: 'Pillar of Holy Judgement [3]',
    description: 'Memanggil tiang cahaya suci raksasa menghantam tanah, membakar semua musuh di sekitarnya.',
    icon: '☀️',
    cooldown: 10,
    power: 3.8,
    unlockedAtFloor: 30,
    effectType: 'smite',
  },
  divine_wrath: {
    id: 'divine_wrath',
    name: 'Murka Gerhana Ilahi',
    title: 'Divine Wrath Cataclysm [4]',
    description: 'Ultimate Ksatria Putih: Ledakan partikel suci layar penuh yang menghancurkan kawanan monster dan memulihkan HP.',
    icon: '⚜️',
    cooldown: 22,
    power: 5.5,
    unlockedAtFloor: 60,
    effectType: 'divine_wrath',
  },
};

// Sacred Oaths (Replacing old blessings - Provided by Sanctuary NPCs)
export const SACRED_KNIGHT_OATHS: Record<string, KnightOath> = {
  oath_purity: {
    id: 'oath_purity',
    name: 'Sumpah Kesucian Suci (Vow of Purity)',
    npcSource: 'Sister Beatrice (Kuil Doa)',
    title: 'Perlindungan Roh Kudus',
    description: 'Memulihkan 4 HP setiap 2 detik dan memberikan imunitas dari racun & kutukan lantai dungeon.',
    icon: '🕊️',
    bonus: { hpRegen: 4, maxHpPercent: 20 },
  },
  oath_radiance: {
    id: 'oath_radiance',
    name: 'Sumpah Martir Cahaya (Vow of Radiance)',
    npcSource: 'Father Ronald (Altar Suaka)',
    title: 'Pedang Api Kudus',
    description: 'Meningkatkan serangan fisik dan skill sebesar +35% dengan efek percikan cahaya suci.',
    icon: '🔥',
    bonus: { attackPercent: 35 },
  },
  oath_ironclad: {
    id: 'oath_ironclad',
    name: 'Sumpah Zirah Baja Abadi (Vow of Aegis)',
    npcSource: 'Blacksmith Gabriel (Bengkel Penempaan)',
    title: 'Benteng Tak Tertembus',
    description: 'Menambah +25 Pertahanan Armor dasar dan memperpanjang jendela Waktu Parry Sempurna +0.25 detik.',
    icon: '🛡️',
    bonus: { defenseFlat: 25, parryBonusWindow: 0.25 },
  },
  oath_dungeon_breaker: {
    id: 'oath_dungeon_breaker',
    name: 'Sumpah Penakluk Menara (Dungeon Conqueror)',
    npcSource: 'Dungeon Master (Gerbang 100 Lantai)',
    title: 'Pembasmi Iblis Bos',
    description: 'Memberikan +40% Kerusakan Tambahan saat bertarung melawan monster Bos setiap kelipatan 10 lantai.',
    icon: '👑',
    bonus: { bossDamageBonus: 40 },
  },
};

export function getTierForFloor(floor: number): DungeonTier {
  const clamped = Math.max(1, Math.min(100, floor));
  const tierIndex = Math.floor((clamped - 1) / 10);
  return DUNGEON_TIERS[Math.min(tierIndex, DUNGEON_TIERS.length - 1)];
}
