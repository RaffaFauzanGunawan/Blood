export interface Vector2D {
  x: number;
  y: number;
}

export type Direction = 'down' | 'up' | 'left' | 'right';

export type PlayerState = 'Idle' | 'Walk' | 'Attack' | 'Dash' | 'Parry' | 'Defend';

export interface EquipmentSlots {
  weapon: ItemData | null;
  armor: ItemData | null;
  accessory: ItemData | null;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  direction: Direction;
  state: PlayerState;
  animationFrame: number;
  animationTimer: number;
  attackTimer: number;
  attackCooldown: number;
  dashTimer: number;
  dashCooldown: number;
  hp: number;
  maxHp: number;
  baseMaxHp?: number;
  attackPower: number;
  baseAttack?: number;
  defense: number;
  baseDefense?: number;
  baseSpeed?: number;
  gold: number;
  level: number;
  exp: number;
  nextLevelExp: number;
  sp: number;
  width: number;
  height: number;
  collisionRadius: number;
  equipment?: EquipmentSlots;
  // White Knight Combat & Dungeon System extensions
  isParrying?: boolean;
  parryTimer?: number;
  parryWindow?: number;
  parryCooldown?: number;
  parryCooldownTimer?: number;
  isDefending?: boolean;
  weaponSkillTimer?: number;
  weaponSkillCooldownTimer?: number;
  weaponSkillCooldown?: number;
  specialSkillCooldowns?: Record<string, number>;
  activeOath?: string | null;
  name?: string;
  dungeonFloor?: number;
  maxDungeonFloorReached?: number;
  inDungeon?: boolean;
  unlockedSkills?: string[];
  blessingsClaimed?: number;
  claimedRewards?: Record<string, boolean>;
}

export type EnemyType = 'skeleton' | 'ghoul' | 'vampire_bat' | 'lich_boss' | 'boss_malakar';
export type EnemyState = 'IDLE' | 'CHASE' | 'ATTACK' | 'HURT' | 'DEAD';

export interface Enemy {
  id: string;
  name: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  speed: number;
  detectionRadius: number;
  attackRadius: number;
  attackDamage: number;
  attackCooldown: number;
  attackTimer: number;
  state: EnemyState;
  direction: Direction;
  wanderTarget: Vector2D | null;
  wanderTimer: number;
  hurtTimer: number;
  respawnTimer: number;
  ySortOffset: number;
  width: number;
  height: number;
}

export interface ItemData {
  id: string;
  name: string;
  description: string;
  category: 'consumable' | 'equipment' | 'quest' | 'material';
  icon: string;
  is_stackable: boolean;
  count: number;
  heal_amount: number;
  attack_bonus?: number;
  defense_bonus?: number;
  max_hp_bonus?: number;
  hp_bonus?: number;
  speed_bonus?: number;
  equip_slot?: 'weapon' | 'armor' | 'accessory';
  value: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  color?: string;
}

export interface NPC {
  id: string;
  name: string;
  title: string;
  affiliation?: string;
  role?:
    | 'quest_giver'
    | 'merchant'
    | 'healer'
    | 'blacksmith'
    | 'lore'
    | 'guide'
    | 'alchemist'
    | 'oracle'
    | 'mercenary'
    | 'templar'
    | 'princess';
  mood?: string;
  x: number;
  y: number;
  direction: Direction;
  sprite: string;
  dialogueId: string;
  hasQuest?: boolean;
  questCompleted?: boolean;
  voicePitch?: number;
  lore?: string;
  portraitTheme?: {
    primaryColor: string;
    accentColor: string;
    bgStyle: 'cathedral' | 'cemetery' | 'village' | 'forge' | 'swamp' | 'crypt' | 'ruins';
    headwear?: string;
    eyeGlowColor?: string;
    quote?: string;
  };
}

export interface WorldObject {
  id: string;
  type:
    | 'tombstone'
    | 'gothic_house'
    | 'crypt'
    | 'cathedral'
    | 'dead_tree'
    | 'gargoyle'
    | 'blood_chest'
    | 'gothic_lantern'
    | 'iron_fence'
    | 'altar'
    | 'blood_fountain'
    | 'bone_pile'
    | 'throne'
    | 'anvil'
    | 'mausoleum'
    | 'astral_telescope'
    | 'abyss_crystal'
    | 'rose_shrine'
    | 'portal_gate';
  x: number;
  y: number;
  width: number;
  height: number;
  ySortOffset: number;
  solid: boolean;
  collisionBox?: { x: number; y: number; w: number; h: number };
  opened?: boolean;
  chestItem?: ItemData;
  name?: string;
  lightRadius?: number;
  lightColor?: string;
}

export interface WorldChunk {
  id: string;
  name: string;
  subtitle?: string;
  dangerLevel?: 'Aman' | 'Waspada' | 'Berbahaya' | 'Maut Ekstrem' | 'Lobby Suaka';
  dangerColor?: string;
  x: number;
  y: number;
  pixelX: number;
  pixelY: number;
  width: number;
  height: number;
  biome:
    | 'village'
    | 'cemetery'
    | 'cathedral'
    | 'crypt'
    | 'swamp'
    | 'ruins'
    | 'bone_valley'
    | 'vampire_sanctum'
    | 'castle_throne'
    | 'astral_tower'
    | 'abyss'
    | 'rose_garden';
  active: boolean;
}

export interface DialogueNode {
  speaker: string;
  speakerTitle?: string;
  mood?: 'normal' | 'serious' | 'mysterious' | 'grumpy' | 'holy' | 'eerie' | 'poetic' | 'blush' | 'shock';
  animePortraitId?: string;
  affiliation?: string;
  text: string;
  options?: {
    text: string;
    nextId?: string;
    action?: string;
    icon?: string;
  }[];
}

export interface SaveGameData {
  player_pos_x: number;
  player_pos_y: number;
  hp: number;
  max_hp: number;
  gold: number;
  inventory: ItemData[];
  equipment?: {
    weaponId: string | null;
    armorId: string | null;
    accessoryId: string | null;
  };
  quest_status: {
    blood_curse_quest: 'not_started' | 'in_progress' | 'completed';
    enemies_slain: number;
  };
  opened_chests: string[];
  timestamp: number;
}

export interface DebugVisualSettings {
  showYSortLines: boolean;
  showCollisions: boolean;
  showHitboxes: boolean;
  showDetectionZones: boolean;
  showChunkBoundaries: boolean;
  showFps: boolean;
  showDynamicLighting: boolean;
  showMist: boolean;
}

// --- ROADMAP EXTENSIONS: COMBAT, PROGRESSION, BESTIARY, QUESTS, TRAPS ---
export type ElementType = 'Physical' | 'Fire' | 'Holy' | 'Dark' | 'Ice';
export type StatusEffectType =
  | 'Bleed'
  | 'Poison'
  | 'Curse'
  | 'Stun'
  | 'AtkBoost'
  | 'Shield'
  | 'Regen';

export interface ActiveStatusEffect {
  type: StatusEffectType;
  duration: number;
  value?: number;
}

export interface CombatSkill {
  id: string;
  name: string;
  description: string;
  element: ElementType;
  costMp: number;
  power: number;
  target: 'single_enemy' | 'all_enemies' | 'self' | 'single_ally' | 'all_allies';
  statusEffect?: StatusEffectType;
  icon: string;
  isUltimate?: boolean;
}

export interface PartyMember {
  id: string;
  name: string;
  title: string;
  avatar: string;
  role: 'DPS' | 'Healer' | 'Mage' | 'Tank';
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  element: ElementType;
  ultimateGauge: number; // 0 to 100
  statusEffects: ActiveStatusEffect[];
  skills: CombatSkill[];
  isDown?: boolean;
}

export interface TurnBasedEnemy {
  id: string;
  name: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  weaknesses: ElementType[];
  resistances: ElementType[];
  staggerPoints: number;
  maxStagger: number;
  isStaggered: boolean;
  statusEffects: ActiveStatusEffect[];
  sprite: string;
  expReward: number;
  goldReward: number;
  dropItemId?: string;
}

export interface SkillNode {
  id: string;
  name: string;
  characterId: string;
  branch: 'Offense' | 'Defense' | 'Utility';
  tier: number;
  costSp: number;
  unlocked: boolean;
  icon: string;
  description: string;
  requiresNodeId?: string;
  statBonus?: {
    atk?: number;
    def?: number;
    maxHp?: number;
    spd?: number;
  };
  unlockedSkill?: CombatSkill;
}

export interface CraftingRecipe {
  id: string;
  resultItem: ItemData;
  requiredMaterials: { itemId: string; name: string; icon: string; count: number }[];
  requiredGold: number;
  description: string;
}

export interface MonsterCodexEntry {
  id: string;
  name: string;
  subtitle: string;
  type: EnemyType;
  threatLevel: 'Rendah' | 'Sedang' | 'Tinggi' | 'Bos Ekstrem';
  lore: string;
  weaknesses: ElementType[];
  resistances: ElementType[];
  drops: { name: string; icon: string; rate: string }[];
  kills: number;
  unlocked: boolean;
  sprite: string;
}

export interface QuestLogEntry {
  id: string;
  title: string;
  category: 'Main' | 'Side';
  giver: string;
  description: string;
  currentCount: number;
  targetCount: number;
  targetLabel: string;
  rewardGold: number;
  rewardExp: number;
  rewardItemName?: string;
  status: 'not_started' | 'active' | 'completed' | 'in_progress';
}

export interface WorldTrap {
  id: string;
  x: number;
  y: number;
  type: 'spikes' | 'poison_gas' | 'crypt_lever';
  state: 'active' | 'triggered' | 'disabled';
  damage: number;
  width: number;
  height: number;
}

export interface AudioVisualSettings {
  bgmVolume: number;
  sfxVolume: number;
  voiceVolume?: number;
  hdMode: boolean;
  mistEnabled: boolean;
  bloodMoon: boolean;
  screenShake?: boolean;
  pixelFilter?: 'nearest' | 'smooth';
  crtFilter?: boolean;
}

export interface SaveSlotMetadata {
  slotId: number;
  title: string;
  level?: number;
  hp?: number;
  maxHp?: number;
  gold?: number;
  regionName: string;
  timestamp: number;
  isAutoSave?: boolean;
  playTime?: string;
}
