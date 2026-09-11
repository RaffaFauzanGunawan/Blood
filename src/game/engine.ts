import {
  Player,
  Enemy,
  WorldObject,
  NPC,
  WorldChunk,
  SaveGameData,
  DebugVisualSettings,
  EquipmentSlots,
  WorldTrap,
  ItemData,
} from '../types/game';
import {
  CHUNK_WIDTH,
  CHUNK_HEIGHT,
  INITIAL_CHUNKS,
  INITIAL_ENEMIES,
  INITIAL_NPCS,
  INITIAL_OBJECTS,
  INITIAL_ITEMS,
} from './worldData';
import { audioManager } from './audio';
import {
  DungeonTier,
  KnightOath,
  DUNGEON_TIERS,
  DUNGEON_COMBAT_SKILLS,
  SACRED_KNIGHT_OATHS,
  SKILL_COMBOS,
  SkillCombo,
  getTierForFloor,
} from './dungeonSystem';

export interface FloorLootItem {
  id: string;
  x: number;
  y: number;
  z: number;
  vz: number;
  vx: number;
  vy: number;
  type: 'gold' | 'exp' | 'item';
  itemData?: ItemData;
  amount: number;
  color: string;
  glowColor: string;
  icon: string;
  label: string;
  life: number;
  maxLife: number;
  scale: number;
  bounceCount: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface FogParticle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  alpha: number;
}

export interface CombatParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  glowColor: string;
  alpha: number;
  maxLife: number;
  life: number;
  shape: 'spark' | 'star' | 'circle' | 'ring' | 'rune' | 'ray' | 'slash_mote';
  rotation: number;
  rotSpeed: number;
  glyph?: string;
}

export interface DashGhost {
  x: number;
  y: number;
  alpha: number;
  direction: string;
  color: string;
}

export class GameEngine {
  public canvas: HTMLCanvasElement | null = null;
  public ctx: CanvasRenderingContext2D | null = null;

  // Viewport
  public VIEWPORT_WIDTH = 320;
  public VIEWPORT_HEIGHT = 180;
  public isHDMode = true; // HD visual toggle
  public cameraX = 0;
  public cameraY = 0;

  // World Data & Floor Loot System
  public chunks: WorldChunk[] = JSON.parse(JSON.stringify(INITIAL_CHUNKS));
  public objects: WorldObject[] = JSON.parse(JSON.stringify(INITIAL_OBJECTS));
  public npcs: NPC[] = JSON.parse(JSON.stringify(INITIAL_NPCS));
  public enemies: Enemy[] = JSON.parse(JSON.stringify(INITIAL_ENEMIES));
  public floatingTexts: FloatingText[] = [];
  public floorLoots: FloorLootItem[] = [];

  // Combo Bonus System & Skill Chain States
  public comboHistory: { skillId: string; timestamp: number }[] = [];
  public activeComboNotice: {
    name: string;
    title: string;
    multiplier: number;
    timer: number;
    color: string;
    icon: string;
  } | null = null;

  // Gothic Fog / Mist particles & Combat VFX
  private mistParticles: FogParticle[] = [];
  public combatParticles: CombatParticle[] = [];
  public dashGhosts: DashGhost[] = [];
  private dashGhostSpawnTimer = 0;

  // Player CharacterBody2D (Gothic Vampire Hunter)
  public player: Player = {
    name: 'Sir Valen',
    x: 320,
    y: 230,
    vx: 0,
    vy: 0,
    speed: 113,
    baseSpeed: 113,
    direction: 'down',
    state: 'Idle',
    animationFrame: 0,
    animationTimer: 0,
    attackTimer: 0,
    attackCooldown: 0.28,
    dashTimer: 0,
    dashCooldown: 0.8,
    hp: 100,
    maxHp: 100,
    baseMaxHp: 100,
    attackPower: 30,
    baseAttack: 30,
    defense: 0,
    baseDefense: 0,
    gold: 60,
    level: 1,
    exp: 0,
    nextLevelExp: 100,
    sp: 3,
    width: 16,
    height: 22,
    collisionRadius: 6,
    isParrying: false,
    parryTimer: 0,
    parryCooldownTimer: 0,
    isDefending: false,
    weaponSkillTimer: 0,
    weaponSkillCooldownTimer: 0,
    dungeonFloor: 1,
    activeOath: null,
    unlockedSkills: ['sword_of_dawn'],
  };

  // 100-Floor Dungeon & Combat States
  public inDungeon: boolean = false;
  public dungeonFloor: number = 1;
  public maxFloorReached: number = 1;
  public dungeonTier: DungeonTier = getTierForFloor(1);
  public dungeonPortalActive: boolean = false;
  public dungeonPortalX: number = 320;
  public dungeonPortalY: number = 110;
  public floorEnemiesTotal: number = 0;
  public floorEnemiesDefeated: number = 0;
  public unlockedDungeonSkills: string[] = ['holy_cross_slash'];
  public equippedDungeonSkillId: string = 'holy_cross_slash';
  public dungeonNpc: NPC | null = null;
  public activeOath: KnightOath | null = null;
  public parrySuccessFlash: number = 0;
  public parryVfxPos: { x: number; y: number } = { x: 0, y: 0 };
  public smitePillarVfx: { active: boolean; timer: number; x: number; y: number } = { active: false, timer: 0, x: 0, y: 0 };
  public holySlashVfx: { active: boolean; timer: number; x: number; y: number; dir: string } = { active: false, timer: 0, x: 0, y: 0, dir: 'down' };

  // Traps & Dungeon Hazards
  public traps: WorldTrap[] = [
    { id: 'trap_spikes_1', x: 720, y: 560, type: 'spikes', state: 'active', damage: 15, width: 28, height: 28 },
    { id: 'trap_spikes_2', x: 800, y: 620, type: 'spikes', state: 'active', damage: 15, width: 28, height: 28 },
    { id: 'trap_gas_1', x: 680, y: 780, type: 'poison_gas', state: 'active', damage: 10, width: 32, height: 32 },
    { id: 'crypt_lever_1', x: 880, y: 520, type: 'crypt_lever', state: 'active', damage: 0, width: 20, height: 20 },
  ];

  // Day / Dusk / Night Cycle
  public timeOfDay: 'day' | 'dusk' | 'night' = 'night';
  public timeOfDayTimer: number = 0;
  public onTriggerTacticalCombat?: (type: 'skeleton' | 'ghoul' | 'bat' | 'malakar') => void;

  // Equipable slots
  public equipment: EquipmentSlots = {
    weapon: null,
    armor: null,
    accessory: null,
  };

  // Inventory & Quests
  public inventory = [
    { ...INITIAL_ITEMS.blood_elixir, count: 3 },
    { ...INITIAL_ITEMS.holy_water, count: 2 },
    { ...INITIAL_ITEMS.silver_rapier, count: 1 },
  ];
  public questStatus: SaveGameData['quest_status'] = {
    blood_curse_quest: 'not_started',
    enemies_slain: 0,
  };
  public openedChests: string[] = [];

  // Input states (Godot Input Map equivalent)
  public input = {
    move_up: false,
    move_down: false,
    move_left: false,
    move_right: false,
    attack: false,
    interact: false,
    dash: false,
  };

  // Debug settings
  public debug: DebugVisualSettings = {
    showYSortLines: false,
    showCollisions: false,
    showHitboxes: false,
    showDetectionZones: false,
    showChunkBoundaries: false,
    showFps: true,
    showDynamicLighting: true,
    showMist: true,
  };

  // Gothic Atmosphere
  public isBloodMoon = true;
  public isRaining = true;
  public lightningFlash = 0;
  private raindrops: { x: number; y: number; speed: number; len: number }[] = [];

  // Region Tracking
  private lastActiveChunkId = '';

  // Callbacks
  public onDialogueRequest: ((npc: NPC) => void) | null = null;
  public onNotification: ((msg: string, type?: 'info' | 'success' | 'warn') => void) | null = null;
  public onRegionEnter: ((chunk: WorldChunk) => void) | null = null;
  public onFastTravelRequest: (() => void) | null = null;
  public onStateChange: (() => void) | null = null;
  public onGameOver: (() => void) | null = null;
  public isGameOver = false;

  // Engine loop
  private isRunning = false;
  private lastTime = 0;
  private fps = 60;
  private fpsTimer = 0;
  private frameCount = 0;
  private lightningTimer = 8 + Math.random() * 10;

  constructor() {
    this.initAtmosphere();
    // Default equipped starting weapon
    this.equipment.weapon = { ...INITIAL_ITEMS.silver_rapier };
    this.recalculateStats();
  }

  public init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.updateCanvasResolution();
    this.bindEvents();
    this.start();
  }

  public setHDMode(enabled: boolean) {
    this.isHDMode = enabled;
    this.updateCanvasResolution();
  }

  private updateCanvasResolution() {
    if (!this.canvas) return;
    if (this.isHDMode) {
      this.VIEWPORT_WIDTH = 480;
      this.VIEWPORT_HEIGHT = 270;
      this.canvas.width = 480;
      this.canvas.height = 270;
    } else {
      this.VIEWPORT_WIDTH = 320;
      this.VIEWPORT_HEIGHT = 180;
      this.canvas.width = 320;
      this.canvas.height = 180;
    }
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  private initAtmosphere() {
    // Rain
    this.raindrops = [];
    for (let i = 0; i < 90; i++) {
      this.raindrops.push({
        x: Math.random() * 640,
        y: Math.random() * 360,
        speed: 210 + Math.random() * 90,
        len: 5 + Math.random() * 6,
      });
    }
    // Volumetric creeping ground fog
    this.mistParticles = [];
    for (let i = 0; i < 45; i++) {
      this.mistParticles.push({
        x: Math.random() * (CHUNK_WIDTH * 3),
        y: Math.random() * (CHUNK_HEIGHT * 3),
        radius: 40 + Math.random() * 50,
        vx: 8 + Math.random() * 12,
        alpha: 0.12 + Math.random() * 0.14,
      });
    }
  }

  public revivePlayer() {
    this.respawnPlayer();
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  public stop() {
    this.isRunning = false;
  }

  private loop(currentTime: number) {
    if (!this.isRunning) return;
    const delta = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    // Calculate FPS
    this.frameCount++;
    this.fpsTimer += delta;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.update(delta);
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }

  private bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      this.handleKeyDown(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      this.handleKeyUp(e.key.toLowerCase());
    });
  }

  public handleKeyDown(key: string) {
    if (key === 'w' || key === 'arrowup') this.input.move_up = true;
    if (key === 's' || key === 'arrowdown') this.input.move_down = true;
    if (key === 'a' || key === 'arrowleft') this.input.move_left = true;
    if (key === 'd' || key === 'arrowright') this.input.move_right = true;
    if (key === 'j') {
      this.triggerAttack();
    }
    if (key === 'q' || key === 'c') {
      this.triggerParry();
    }
    if (key === 'shift') {
      this.triggerDefense(true);
    }
    if (key === 'r' || key === 'u') {
      this.triggerWeaponSkill();
    }
    if (key === 'f' || key === 'y') {
      this.triggerDungeonSkill();
    }
    if (key === ' ' || key === 'k') {
      this.triggerDash();
    }
    if (key === 'e') {
      this.triggerInteract();
    }
  }

  public handleKeyUp(key: string) {
    if (key === 'w' || key === 'arrowup') this.input.move_up = false;
    if (key === 's' || key === 'arrowdown') this.input.move_down = false;
    if (key === 'a' || key === 'arrowleft') this.input.move_left = false;
    if (key === 'd' || key === 'arrowright') this.input.move_right = false;
    if (key === 'shift') {
      this.triggerDefense(false);
    }
  }

  public setPlayerName(name: string) {
    this.player.name = name;
    if (this.onStateChange) this.onStateChange();
  }

  // --- COMBAT PARTICLE SPAWNERS ---
  public spawnCombatSparks(
    x: number,
    y: number,
    count: number,
    color: string = '#fef08a',
    glowColor: string = '#f59e0b',
    speed: number = 70,
    shape: CombatParticle['shape'] = 'spark'
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.7) * speed;
      this.combatParticles.push({
        id: Math.random().toString(),
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 2 + Math.random() * 3.5,
        color,
        glowColor,
        alpha: 1.0,
        maxLife: 0.25 + Math.random() * 0.35,
        life: 0,
        shape,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 8,
      });
    }
  }

  public spawnDirectionalSlashSparks(
    x: number,
    y: number,
    direction: string,
    color: string,
    glowColor: string,
    count: number = 8
  ) {
    let baseAngle = 0;
    if (direction === 'right') baseAngle = 0;
    else if (direction === 'left') baseAngle = Math.PI;
    else if (direction === 'down') baseAngle = Math.PI / 2;
    else if (direction === 'up') baseAngle = -Math.PI / 2;

    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 1.2;
      const angle = baseAngle + spread;
      const spd = 40 + Math.random() * 90;
      this.combatParticles.push({
        id: Math.random().toString(),
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 2 + Math.random() * 3,
        color,
        glowColor,
        alpha: 1.0,
        maxLife: 0.2 + Math.random() * 0.25,
        life: 0,
        shape: Math.random() < 0.6 ? 'slash_mote' : 'spark',
        rotation: angle,
        rotSpeed: (Math.random() - 0.5) * 6,
      });
    }
  }

  public spawnHolyRuneParticles(x: number, y: number, count: number = 6) {
    const glyphs = ['✧', '✦', '☩', '𐌈', '𖤍', '☼'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 15 + Math.random() * 35;
      this.combatParticles.push({
        id: Math.random().toString(),
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 12,
        size: 8 + Math.random() * 4,
        color: '#fffbeb',
        glowColor: '#fbbf24',
        alpha: 1.0,
        maxLife: 0.45 + Math.random() * 0.35,
        life: 0,
        shape: 'rune',
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 2,
        glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
      });
    }
  }

  public spawnShockwaveRing(x: number, y: number, color: string = '#fbbf24', size: number = 32) {
    this.combatParticles.push({
      id: Math.random().toString(),
      x,
      y,
      vx: 0,
      vy: 0,
      size,
      color,
      glowColor: color,
      alpha: 1.0,
      maxLife: 0.35,
      life: 0,
      shape: 'ring',
      rotation: 0,
      rotSpeed: 0,
    });
  }

  // --- FLOOR LOOT & ANIMATED PICKUP SYSTEM ---
  public spawnFloorLoot(x: number, y: number, goldAmount: number, expAmount: number, dropItem?: ItemData) {
    // 1. Gold Coins (Bouncing physical coins)
    if (goldAmount > 0) {
      const coinsCount = Math.min(6, Math.max(2, Math.floor(goldAmount / 7)));
      const perCoin = Math.max(1, Math.ceil(goldAmount / coinsCount));
      for (let i = 0; i < coinsCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 20 + Math.random() * 40;
        this.floorLoots.push({
          id: Math.random().toString(),
          x,
          y,
          z: 6 + Math.random() * 8,
          vz: 85 + Math.random() * 55,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          type: 'gold',
          amount: perCoin,
          color: '#fbbf24',
          glowColor: '#f59e0b',
          icon: '🪙',
          label: 'Emas',
          life: 0,
          maxLife: 30,
          scale: 1.0,
          bounceCount: 0,
        });
      }
    }

    // 2. EXP Soul Orb
    if (expAmount > 0) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 18 + Math.random() * 28;
      this.floorLoots.push({
        id: Math.random().toString(),
        x,
        y,
        z: 10,
        vz: 95 + Math.random() * 40,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        type: 'exp',
        amount: expAmount,
        color: '#c084fc',
        glowColor: '#9333ea',
        icon: '🔮',
        label: 'EXP',
        life: 0,
        maxLife: 30,
        scale: 1.15,
        bounceCount: 0,
      });
    }

    // 3. Item Drop
    if (dropItem) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 15 + Math.random() * 20;
      this.floorLoots.push({
        id: Math.random().toString(),
        x,
        y,
        z: 12,
        vz: 110,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        type: 'item',
        itemData: dropItem,
        amount: dropItem.count || 1,
        color: '#38bdf8',
        glowColor: '#0284c7',
        icon: dropItem.icon || '🧪',
        label: dropItem.name,
        life: 0,
        maxLife: 45,
        scale: 1.25,
        bounceCount: 0,
      });
    }
  }

  // --- COMBO BONUS SYSTEM ---
  public checkSkillCombos(castSkillId: string): number {
    const now = performance.now();
    this.comboHistory.push({ skillId: castSkillId, timestamp: now });

    // Purge combo history older than 5.5 seconds
    this.comboHistory = this.comboHistory.filter((c) => now - c.timestamp <= 5500);

    const historyIds = this.comboHistory.map((c) => c.skillId);

    for (const combo of SKILL_COMBOS) {
      const seq = combo.sequence;
      if (historyIds.length >= seq.length) {
        const tail = historyIds.slice(historyIds.length - seq.length);
        let match = true;
        for (let i = 0; i < seq.length; i++) {
          if (tail[i] !== seq[i]) {
            match = false;
            break;
          }
        }

        if (match) {
          // COMBO MATCH FOUND!
          this.activeComboNotice = {
            name: combo.name,
            title: combo.title,
            multiplier: combo.damageMultiplier,
            timer: 2.2,
            color: combo.color,
            icon: combo.icon,
          };

          // Consume current history
          this.comboHistory = [];

          // Visual & Audio Fanfare
          audioManager.playLevelUp();
          this.spawnShockwaveRing(this.player.x, this.player.y, combo.color, 88);
          this.spawnShockwaveRing(this.player.x, this.player.y, '#ffffff', 55);
          this.spawnHolyRuneParticles(this.player.x, this.player.y, 16);
          this.spawnCombatSparks(this.player.x, this.player.y, 22, combo.color, combo.glowColor, 130, 'star');

          this.showFloatingText(
            this.player.x,
            this.player.y - 34,
            `🔥 COMBO BONUS: ${combo.name.toUpperCase()} (x${combo.damageMultiplier})!`,
            combo.color
          );

          if (this.onNotification) {
            this.onNotification(
              `🔥 COMBO TERBENTUK! [${combo.name}] Kerusakan Meningkat x${combo.damageMultiplier}!`,
              'success'
            );
          }

          return combo.damageMultiplier;
        }
      }
    }

    return 1.0;
  }

  public triggerDash() {
    if (this.player.dashTimer <= 0 && this.player.state !== 'Dash') {
      this.player.state = 'Dash';
      this.player.dashTimer = this.player.dashCooldown;
      audioManager.playDash();

      // Dash velocity burst & afterimage
      const angle =
        this.player.direction === 'right'
          ? 0
          : this.player.direction === 'left'
          ? Math.PI
          : this.player.direction === 'down'
          ? Math.PI / 2
          : -Math.PI / 2;
      this.player.vx = Math.cos(angle) * (this.player.speed * 2.2);
      this.player.vy = Math.sin(angle) * (this.player.speed * 2.2);

      // Dash ghost burst
      this.dashGhosts.push({
        x: this.player.x,
        y: this.player.y,
        alpha: 0.85,
        direction: this.player.direction,
        color: '#e2e8f0',
      });
      this.spawnCombatSparks(this.player.x, this.player.y, 8, '#f8fafc', '#93c5fd', 45, 'spark');
    }
  }

  public triggerAttack() {
    if (this.player.attackTimer <= 0) {
      this.player.state = 'Attack';
      this.player.attackTimer = this.player.attackCooldown;
      audioManager.playSwordSwing();

      // Weapon-specific particle color palette
      const weaponId = this.equipment.weapon?.id || 'silver_rapier';
      let slashColor = '#f8fafc';
      let glowColor = '#60a5fa';
      if (weaponId.includes('scythe')) {
        slashColor = '#ef4444'; glowColor = '#b91c1c';
      } else if (weaponId.includes('broadsword')) {
        slashColor = '#fbbf24'; glowColor = '#d97706';
      } else if (weaponId.includes('reaver')) {
        slashColor = '#c084fc'; glowColor = '#7e22ce';
      } else if (weaponId.includes('rose')) {
        slashColor = '#fb7185'; glowColor = '#be123c';
      } else if (weaponId.includes('mourne')) {
        slashColor = '#7dd3fc'; glowColor = '#0284c7';
      }

      this.spawnDirectionalSlashSparks(this.player.x, this.player.y, this.player.direction, slashColor, glowColor, 6);
      this.checkAttackHit();
    }
  }

  public triggerParry() {
    if (this.player.parryCooldownTimer <= 0 && this.player.state !== 'Parry') {
      this.player.isParrying = true;
      this.player.parryTimer = 0.45;
      this.player.parryCooldownTimer = 1.2;
      this.player.state = 'Parry';
      audioManager.playSwordSwing();
      this.spawnHolyRuneParticles(this.player.x, this.player.y, 5);
      this.spawnShockwaveRing(this.player.x, this.player.y, '#f59e0b', 24);
      this.showFloatingText(this.player.x, this.player.y - 18, 'SIKAP PARRY!', '#fbbf24');
      if (this.onStateChange) this.onStateChange();
    }
  }

  public triggerDefense(active: boolean) {
    if (active) {
      this.player.isDefending = true;
      this.player.state = 'Defend';
      this.spawnCombatSparks(this.player.x, this.player.y, 4, '#38bdf8', '#0284c7', 20, 'spark');
      if (this.onStateChange) this.onStateChange();
    } else {
      this.player.isDefending = false;
      if (this.player.state === 'Defend') {
        this.player.state = 'Idle';
      }
      if (this.onStateChange) this.onStateChange();
    }
  }

  public triggerWeaponSkill() {
    if (this.player.weaponSkillCooldownTimer <= 0) {
      this.player.weaponSkillCooldownTimer = 3.5;
      audioManager.playWeaponSkill();

      const comboMult = this.checkSkillCombos('holy_cross_slash');

      this.holySlashVfx = {
        active: true,
        timer: 0.45,
        x: this.player.x,
        y: this.player.y,
        dir: this.player.direction,
      };

      // Burst of radiant sunburst particles & runes
      this.spawnShockwaveRing(this.player.x, this.player.y, '#fbbf24', comboMult > 1 ? 90 : 60);
      this.spawnShockwaveRing(this.player.x, this.player.y, '#fef08a', comboMult > 1 ? 60 : 40);
      this.spawnHolyRuneParticles(this.player.x, this.player.y, comboMult > 1 ? 16 : 10);
      this.spawnCombatSparks(this.player.x, this.player.y, comboMult > 1 ? 24 : 16, '#fef08a', '#f59e0b', 90, 'star');

      const slashRadius = 58;
      const skillDmg = Math.round(this.player.attackPower * 2.2 * comboMult);

      for (const enemy of this.enemies) {
        if (enemy.state === 'DEAD') continue;
        const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        if (dist <= slashRadius + enemy.width / 2) {
          enemy.hp -= skillDmg;
          enemy.hurtTimer = 0.4;
          enemy.state = 'HURT';
          this.spawnCombatSparks(enemy.x, enemy.y, 8, '#fef08a', '#ea580c', 80, 'spark');
          const dmgLabel = comboMult > 1 ? `🔥 COMBO x${comboMult}! -${skillDmg}` : `TEBASAN FAJAR! -${skillDmg}`;
          this.showFloatingText(enemy.x, enemy.y - 14, dmgLabel, comboMult > 1 ? '#fbbf24' : '#fef08a');
          const angle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
          enemy.x += Math.cos(angle) * 25;
          enemy.y += Math.sin(angle) * 25;
          if (enemy.hp <= 0) {
            this.handleEnemyDefeat(enemy);
          }
        }
      }
      this.showFloatingText(this.player.x, this.player.y - 24, comboMult > 1 ? '🔥 TEBASAN COMBO FAJAR!' : 'BILAH CAHAYA FAJAR!', '#fbbf24');
      if (this.onStateChange) this.onStateChange();
    }
  }

  public triggerDungeonSkill(skillId?: string) {
    const activeSkillId = skillId || this.equippedDungeonSkillId || 'holy_cross_slash';
    const skillData = DUNGEON_COMBAT_SKILLS[activeSkillId] || DUNGEON_COMBAT_SKILLS['holy_cross_slash'];

    if (this.player.weaponSkillCooldownTimer <= 0) {
      this.player.weaponSkillCooldownTimer = skillData ? skillData.cooldown : 5.0;
      audioManager.playHolySpell();

      const comboMult = this.checkSkillCombos(activeSkillId);

      let targetX = this.player.x;
      let targetY = this.player.y;
      if (this.player.direction === 'down') targetY += 45;
      else if (this.player.direction === 'up') targetY -= 45;
      else if (this.player.direction === 'left') targetX -= 45;
      else if (this.player.direction === 'right') targetX += 45;

      const skillPower = skillData ? skillData.power : 2.5;

      if (skillData && (skillData.effectType === 'shield' || activeSkillId === 'aegis_of_dawn')) {
        // Perisai Fajar Suci: Heal +35 HP & Shield Dome
        const healAmt = Math.round(35 * (comboMult > 1 ? 1.5 : 1.0));
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
        this.spawnShockwaveRing(this.player.x, this.player.y, '#fef08a', comboMult > 1 ? 110 : 80);
        this.spawnHolyRuneParticles(this.player.x, this.player.y, 16);
        const shieldLabel = comboMult > 1 ? `🔥 PERISAI COMBO! (+${healAmt} HP)` : `PERISAI FAJAR SUCI! (+${healAmt} HP)`;
        this.showFloatingText(this.player.x, this.player.y - 28, shieldLabel, '#fef08a');
      } else if (skillData && (skillData.effectType === 'dash_thrust' || activeSkillId === 'radiant_thrust')) {
        // Tusukan Kilat Cahaya: Forward Dash Thrust
        let dashDx = 0, dashDy = 0;
        if (this.player.direction === 'down') dashDy = 80;
        else if (this.player.direction === 'up') dashDy = -80;
        else if (this.player.direction === 'left') dashDx = -80;
        else if (this.player.direction === 'right') dashDx = 80;

        this.player.x = Math.max(80, Math.min(560, this.player.x + dashDx));
        this.player.y = Math.max(80, Math.min(320, this.player.y + dashDy));

        this.spawnShockwaveRing(this.player.x, this.player.y, '#38bdf8', comboMult > 1 ? 110 : 75);
        this.spawnCombatSparks(this.player.x, this.player.y, 15, '#38bdf8', '#e0f2fe', 120, 'star');

        const thrustDmg = Math.round(this.player.attackPower * skillPower * comboMult);
        for (const enemy of this.enemies) {
          if (enemy.state === 'DEAD') continue;
          if (Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) <= 85) {
            enemy.hp -= thrustDmg;
            enemy.hurtTimer = 0.6;
            enemy.state = 'HURT';
            const dmgLabel = comboMult > 1 ? `🔥 COMBO TUSUKAN x${comboMult}! -${thrustDmg}` : `TUSUKAN KILAT! -${thrustDmg}`;
            this.showFloatingText(enemy.x, enemy.y - 16, dmgLabel, '#38bdf8');
            if (enemy.hp <= 0) this.handleEnemyDefeat(enemy);
          }
        }
      } else if (skillData && (skillData.effectType === 'divine_wrath' || activeSkillId === 'divine_wrath')) {
        // Murka Gerhana Ilahi: Full Screen Cataclysm
        const healAmt = Math.round(50 * (comboMult > 1 ? 1.5 : 1.0));
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
        this.spawnShockwaveRing(320, 180, '#c084fc', 220);
        this.spawnShockwaveRing(320, 180, '#fbbf24', 160);
        this.spawnHolyRuneParticles(320, 180, 28);

        const wrathDmg = Math.round(this.player.attackPower * skillPower * comboMult);
        for (const enemy of this.enemies) {
          if (enemy.state === 'DEAD') continue;
          enemy.hp -= wrathDmg;
          enemy.hurtTimer = 1.0;
          enemy.state = 'HURT';
          const dmgLabel = comboMult > 1 ? `🔥 COMBO MURKA x${comboMult}! -${wrathDmg}` : `MURKA ILAHI! -${wrathDmg}`;
          this.showFloatingText(enemy.x, enemy.y - 16, dmgLabel, '#c084fc');
          if (enemy.hp <= 0) this.handleEnemyDefeat(enemy);
        }
        this.showFloatingText(320, 120, comboMult > 1 ? '🔥 BENCANA MURKA GERHANA!' : 'MURKA GERHANA ILAHI!', '#c084fc');
      } else {
        // Smite / Slash (Holy Cross Slash, Judgement Pillar, etc.)
        this.smitePillarVfx = {
          active: true,
          timer: 0.6,
          x: targetX,
          y: targetY,
        };

        this.spawnShockwaveRing(targetX, targetY, '#38bdf8', comboMult > 1 ? 90 : 65);
        this.spawnShockwaveRing(targetX, targetY, '#e0f2fe', comboMult > 1 ? 65 : 45);
        this.spawnHolyRuneParticles(targetX, targetY, 14);
        this.spawnCombatSparks(targetX, targetY, 20, '#38bdf8', '#0284c7', 100, 'star');

        const smiteDmg = Math.round(this.player.attackPower * skillPower * comboMult);
        for (const enemy of this.enemies) {
          if (enemy.state === 'DEAD') continue;
          const dist = Math.hypot(enemy.x - targetX, enemy.y - targetY);
          if (dist <= 70) {
            enemy.hp -= smiteDmg;
            enemy.hurtTimer = 0.8;
            enemy.state = 'HURT';
            this.spawnCombatSparks(enemy.x, enemy.y, 10, '#38bdf8', '#fbbf24', 90, 'spark');
            const dmgLabel = comboMult > 1 ? `🔥 COMBO x${comboMult}! -${smiteDmg}` : `${skillData ? skillData.name.toUpperCase() : 'SKILL'}! -${smiteDmg}`;
            this.showFloatingText(enemy.x, enemy.y - 16, dmgLabel, comboMult > 1 ? '#fbbf24' : '#38bdf8');
            if (enemy.hp <= 0) {
              this.handleEnemyDefeat(enemy);
            }
          }
        }
        this.showFloatingText(
          targetX,
          targetY - 26,
          comboMult > 1 ? `🔥 COMBO ${skillData?.name.toUpperCase()}` : (skillData ? skillData.name.toUpperCase() : 'SKILL!'),
          comboMult > 1 ? '#fbbf24' : '#38bdf8'
        );
      }

      if (this.onStateChange) this.onStateChange();
    }
  }

  public triggerInteract() {
    // If in dungeon, check portal to advance or return
    if (this.inDungeon && this.dungeonPortalActive) {
      const dist = Math.hypot(this.player.x - this.dungeonPortalX, this.player.y - this.dungeonPortalY);
      if (dist < 42) {
        this.nextDungeonFloor();
        return;
      }
    }

    // Candidate Scoring System: Prioritizes the closest interactable in the player's facing direction
    interface InteractCandidate {
      type: 'npc' | 'portal' | 'chest' | 'trap';
      target: any;
      score: number;
    }

    const candidates: InteractCandidate[] = [];

    const calculateScore = (tx: number, ty: number, maxDist: number) => {
      const dx = tx - this.player.x;
      const dy = ty - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > maxDist) return -1;

      let facingBonus = 0;
      if (this.player.direction === 'up' && dy < 0) facingBonus = 25;
      if (this.player.direction === 'down' && dy > 0) facingBonus = 25;
      if (this.player.direction === 'left' && dx < 0) facingBonus = 25;
      if (this.player.direction === 'right' && dx > 0) facingBonus = 25;

      return (maxDist - dist) + facingBonus;
    };

    // Check nearby Crypt Lever / Traps puzzle & NPCs
    if (this.inDungeon) {
      if (this.dungeonNpc) {
        const score = calculateScore(this.dungeonNpc.x, this.dungeonNpc.y, 40);
        if (score >= 0) {
          candidates.push({ type: 'npc', target: this.dungeonNpc, score });
        }
      }
    } else {
      for (const trap of this.traps) {
        if (trap.type === 'crypt_lever') {
          const score = calculateScore(trap.x, trap.y, 34);
          if (score >= 0) {
            candidates.push({ type: 'trap', target: trap, score });
          }
        }
      }

      // Check nearby NPCs
      for (const npc of this.npcs) {
        const score = calculateScore(npc.x, npc.y, 34);
        if (score >= 0) {
          candidates.push({ type: 'npc', target: npc, score });
        }
      }

      // Check nearby Blood Chests and Portal Gates
      for (const obj of this.objects) {
        if (obj.type === 'portal_gate') {
          const score = calculateScore(obj.x, obj.y, 35);
          if (score >= 0) {
            candidates.push({ type: 'portal', target: obj, score });
          }
        }
        if (obj.type === 'blood_chest' && !obj.opened) {
          const score = calculateScore(obj.x, obj.y, 30);
          if (score >= 0) {
            candidates.push({ type: 'chest', target: obj, score });
          }
        }
      }
    }

    if (candidates.length === 0) return;

    // Pick highest scored interactable
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    if (best.type === 'trap') {
      const trap = best.target;
      trap.state = trap.state === 'active' ? 'disabled' : 'active';
      audioManager.playTrapSound('crypt_lever');
      const isOff = trap.state === 'disabled';
      this.traps.forEach((t) => {
        if (t.type === 'spikes') t.state = isOff ? 'disabled' : 'active';
      });
      const alertMsg = isOff
        ? 'Mekanisme Kuno Berputar! Semua jebakan duri katakomba berhasil dinonaktifkan!'
        : 'Tuas Ditarik Kembali! Jebakan duri kembali aktif menusuk!';
      this.showFloatingText(trap.x, trap.y - 16, isOff ? 'JEBAKAN OFF' : 'JEBAKAN ON', '#38bdf8');
      if (this.onNotification) this.onNotification(alertMsg, 'success');
      if (this.onStateChange) this.onStateChange();
      return;
    }

    if (best.type === 'npc') {
      audioManager.playBlip();
      if (this.onDialogueRequest) {
        this.onDialogueRequest(best.target);
      }
      return;
    }

    if (best.type === 'portal') {
      audioManager.playBlip();
      if (this.onFastTravelRequest) {
        this.onFastTravelRequest();
      }
      return;
    }

    if (best.type === 'chest') {
      const obj = best.target;
      obj.opened = true;
      this.openedChests.push(obj.id);
      audioManager.playCoin();
      const goldAmt = 35 + Math.floor(Math.random() * 25);
      this.spawnFloorLoot(obj.x, obj.y, goldAmt, 60, obj.chestItem || undefined);
      if (this.onNotification) {
        this.onNotification(`Membuka ${obj.name}! Harta karun terhambur di lantai!`, 'success');
      }
      if (this.onStateChange) this.onStateChange();
      return;
    }
  }

  private checkAttackHit() {
    const attackOffsetDist = 20;
    let hitX = this.player.x;
    let hitY = this.player.y;
    const hitRadius = 22;

    if (this.player.direction === 'down') hitY += attackOffsetDist;
    else if (this.player.direction === 'up') hitY -= attackOffsetDist;
    else if (this.player.direction === 'left') hitX -= attackOffsetDist;
    else if (this.player.direction === 'right') hitX += attackOffsetDist;

    for (const enemy of this.enemies) {
      if (enemy.state === 'DEAD') continue;
      const dist = Math.hypot(hitX - enemy.x, hitY - enemy.y);
      if (dist < hitRadius + enemy.width / 2) {
        // Critical hit calculation
        const isCrit = Math.random() < 0.25;
        const baseDmg = this.player.attackPower + Math.floor(Math.random() * 5);
        const dmg = isCrit ? Math.floor(baseDmg * 1.6) : baseDmg;
        enemy.hp -= dmg;
        enemy.hurtTimer = 0.22;
        enemy.state = 'HURT';
        audioManager.playHit();

        // Hit and Crit particles
        const weaponId = this.equipment.weapon?.id || 'silver_rapier';
        const hitColor = isCrit ? '#fbbf24' : (weaponId.includes('scythe') ? '#ef4444' : '#f8fafc');
        const glowColor = isCrit ? '#f59e0b' : (weaponId.includes('scythe') ? '#b91c1c' : '#38bdf8');
        this.spawnCombatSparks(enemy.x, enemy.y, isCrit ? 12 : 6, hitColor, glowColor, isCrit ? 90 : 60, isCrit ? 'star' : 'spark');
        this.spawnShockwaveRing(enemy.x, enemy.y, isCrit ? '#fbbf24' : '#ffffff', isCrit ? 28 : 18);

        this.showFloatingText(
          enemy.x,
          enemy.y - 12,
          isCrit ? `CRIT! -${dmg}` : `-${dmg}`,
          isCrit ? '#fbbf24' : '#ef4444'
        );

        // Knockback vector
        const angle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
        enemy.x += Math.cos(angle) * 16;
        enemy.y += Math.sin(angle) * 16;

        if (enemy.hp <= 0) {
          this.handleEnemyDefeat(enemy);
        }
      }
    }
    if (this.onStateChange) this.onStateChange();
  }

  public handleEnemyDefeat(enemy: Enemy) {
    enemy.state = 'DEAD';
    enemy.respawnTimer = this.inDungeon ? 999999 : 15;
    this.questStatus.enemies_slain++;
    const lootGold = 12 + Math.floor(Math.random() * 18);
    const expGained = enemy.type === 'lich_boss' ? 300 : 45;
    const dropItem = enemy.type === 'skeleton' ? { ...INITIAL_ITEMS.bone_fragment, count: 1 } : undefined;

    // Spawn animated bouncing floor loot
    this.spawnFloorLoot(enemy.x, enemy.y, lootGold, expGained, dropItem);

    if (enemy.type === 'lich_boss') {
      audioManager.playQuestFanfare();
      this.showFloatingText(enemy.x, enemy.y - 42, `${enemy.name.toUpperCase()} DITAKLUKKAN!`, '#ec4899');
    }

    if (this.inDungeon) {
      this.floorEnemiesDefeated++;
      if (this.floorEnemiesDefeated >= this.floorEnemiesTotal) {
        this.dungeonPortalActive = true;
        audioManager.playFloorClear();
        this.showFloatingText(this.dungeonPortalX, this.dungeonPortalY - 20, 'PORTAL LANTAI TERBUKA! [E]', '#38bdf8');

        // Spawn Dungeon NPC for Full Heal or Random Blessing
        this.dungeonNpc = {
          id: 'dungeon_guardian_npc',
          name: 'Malaikat Penjaga Menara',
          title: 'Pelindung Jiwa Lantai Menara',
          role: 'healer',
          x: 240,
          y: 140,
          direction: 'down',
          sprite: 'seraphina',
          dialogueId: 'dungeon_guardian_dialogue',
          portraitTheme: {
            primaryColor: '#fbbf24',
            accentColor: '#38bdf8',
            bgStyle: 'cathedral',
            quote: 'Selamat atas kemenanganmu! Ambillah berkat atau pulihkan seluruh tenagamu.',
          },
        };
        this.showFloatingText(240, 115, 'MALAIKAT PENJAGA MUNCUL! [E]', '#fbbf24');

        // Check if boss floor milestone
        if (this.dungeonFloor % 10 === 0) {
          const tier = getTierForFloor(this.dungeonFloor);
          if (tier.boss.rewardSkillId && !this.unlockedDungeonSkills.includes(tier.boss.rewardSkillId)) {
            this.unlockedDungeonSkills.push(tier.boss.rewardSkillId);
            const rewardSkill = DUNGEON_COMBAT_SKILLS[tier.boss.rewardSkillId];
            if (rewardSkill && this.onNotification) {
              this.onNotification(`🏆 MEMPEROLEH SKILL DUNGEON: ${rewardSkill.name}! (${rewardSkill.description})`, 'success');
            }
          }
        }

        if (this.onNotification) {
          this.onNotification(`✨ Lantai ${this.dungeonFloor} Bersih! Malaikat Penjaga muncul [E] untuk Full Heal / Berkat, atau masuk Portal Kristal!`, 'success');
        }
      }
    } else {
      if (this.onNotification) {
        this.onNotification(`${enemy.name} berhasil dibinasakan! (+${lootGold} Gold, +${expGained} EXP)`, 'success');
      }
    }
  }

  public enterDungeonFloor(floorNum: number) {
    this.inDungeon = true;
    this.dungeonFloor = Math.max(1, Math.min(100, floorNum));
    if (this.dungeonFloor > this.maxFloorReached) {
      this.maxFloorReached = this.dungeonFloor;
    }
    this.dungeonTier = getTierForFloor(this.dungeonFloor);
    this.dungeonPortalActive = false;
    this.dungeonPortalX = 320;
    this.dungeonPortalY = 110;
    this.floorEnemiesDefeated = 0;
    this.dungeonNpc = null;

    // Position White Knight at entrance
    this.player.x = 320;
    this.player.y = 280;
    this.player.direction = 'up';
    this.player.state = 'Idle';

    // Clear old enemies
    this.enemies = [];

    const isBossFloor = this.dungeonFloor % 10 === 0;
    if (isBossFloor) {
      // Spawn Tier Boss
      const bossData = this.dungeonTier.boss;
      const bossEnemy: Enemy = {
        id: `dungeon_boss_${this.dungeonFloor}`,
        name: bossData.name,
        type: 'lich_boss',
        x: 320,
        y: 150,
        vx: 0,
        vy: 0,
        hp: bossData.hp,
        maxHp: bossData.hp,
        speed: 62 + Math.floor(this.dungeonFloor * 0.35),
        detectionRadius: 280,
        attackRadius: 36,
        attackDamage: bossData.atk,
        attackCooldown: 1.1,
        attackTimer: 0.5,
        state: 'IDLE',
        direction: 'down',
        wanderTarget: null,
        wanderTimer: 2.0,
        hurtTimer: 0,
        respawnTimer: 999999,
        ySortOffset: 16,
        width: 36,
        height: 44,
      };
      this.enemies.push(bossEnemy);
      this.floorEnemiesTotal = 1;
      this.showFloatingText(320, 120, `BOS LANTAI ${this.dungeonFloor}: ${bossData.name}`, '#f43f5e');
    } else {
      // Normal floor: spawn 3 to 6 enemies based on floor
      const count = 3 + Math.floor((this.dungeonFloor % 10) * 0.35);
      this.floorEnemiesTotal = count;
      const enemyNames = this.dungeonTier.enemyPool.map((e) => e.name);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const spawnDist = 85 + Math.random() * 55;
        const ex = Math.max(90, Math.min(550, 320 + Math.cos(angle) * spawnDist));
        const ey = Math.max(90, Math.min(240, 180 + Math.sin(angle) * spawnDist));
        const baseHp = 45 + Math.floor(this.dungeonFloor * 8);
        const baseAtk = 12 + Math.floor(this.dungeonFloor * 1.6);
        const eType: 'skeleton' | 'ghoul' | 'vampire_bat' =
          i % 3 === 0 ? 'skeleton' : i % 3 === 1 ? 'ghoul' : 'vampire_bat';

        this.enemies.push({
          id: `dungeon_enemy_${this.dungeonFloor}_${i}`,
          name: `${enemyNames[i % enemyNames.length]} (Lt.${this.dungeonFloor})`,
          type: eType,
          x: ex,
          y: ey,
          vx: 0,
          vy: 0,
          hp: baseHp,
          maxHp: baseHp,
          speed: eType === 'vampire_bat' ? 95 : 56 + Math.min(32, this.dungeonFloor),
          detectionRadius: 180,
          attackRadius: eType === 'vampire_bat' ? 18 : 24,
          attackDamage: baseAtk,
          attackCooldown: 0.9,
          attackTimer: 0.4 + Math.random() * 0.5,
          state: 'IDLE',
          direction: 'down',
          wanderTarget: null,
          wanderTimer: 2.0,
          hurtTimer: 0,
          respawnTimer: 999999,
          ySortOffset: 12,
          width: 24,
          height: 28,
        });
      }
    }

    if (this.dungeonFloor === 100 && this.onDialogueRequest) {
      this.onDialogueRequest({
        id: 'lord_malakar_npc',
        name: 'Lord Malakar',
        title: 'Penguasa Gerhana 100 Lantai',
        dialogueId: 'lord_malakar_boss_intro',
        x: 320,
        y: 100,
        direction: 'down',
        sprite: 'boss_malakar',
      });
    }
    if (this.onStateChange) this.onStateChange();
  }

  public nextDungeonFloor() {
    if (this.dungeonFloor >= 100) {
      if (this.onNotification) {
        this.onNotification('👑 SELAMAT! Anda telah menaklukkan Lantai 100 dan menjadi Dewa Ksatria Ravenfall!', 'success');
      }
      this.exitDungeonToLobby();
      return;
    }
    this.enterDungeonFloor(this.dungeonFloor + 1);
  }

  public exitDungeonToLobby() {
    this.inDungeon = false;
    this.enemies = [];
    this.dungeonPortalActive = false;
    this.floorEnemiesDefeated = 0;
    this.dungeonNpc = null;
    this.isGameOver = false;
    this.player.x = 320;
    this.player.y = 220;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.direction = 'down';
    this.player.state = 'Idle';
    this.player.isParrying = false;
    this.player.isDefending = false;
    this.lastActiveChunkId = '';
    this.cameraX = this.player.x - this.VIEWPORT_WIDTH / 2;
    this.cameraY = this.player.y - this.VIEWPORT_HEIGHT / 2;
    this.recalculateStats();
    if (this.onNotification) {
      this.onNotification('Kembali ke Suaka Ksatria (Lobby Desa Ravenfall)', 'info');
    }
    if (this.onStateChange) this.onStateChange();
  }

  public gainExp(amount: number) {
    if (!this.player.exp) this.player.exp = 0;
    if (!this.player.level) this.player.level = 1;
    if (!this.player.nextLevelExp) this.player.nextLevelExp = 100;
    if (!this.player.sp) this.player.sp = 0;

    this.player.exp += amount;
    while (this.player.exp >= this.player.nextLevelExp) {
      this.player.exp -= this.player.nextLevelExp;
      this.player.level += 1;
      this.player.sp += 2;
      this.player.baseMaxHp = (this.player.baseMaxHp || 100) + 20;
      this.player.baseAttack = (this.player.baseAttack || 30) + 4;
      this.player.baseDefense = (this.player.baseDefense || 0) + 2;
      this.recalculateStats();
      this.player.hp = this.player.maxHp;
      this.player.nextLevelExp = Math.round(this.player.nextLevelExp * 1.5);
      audioManager.playLevelUp();
      if (this.onNotification) {
        this.onNotification(
          `★ LEVEL UP! Valen naik ke Level ${this.player.level}! (+2 SP, +4 ATK, +2 DEF, Full HP)`,
          'success'
        );
      }
    }
    if (this.onStateChange) this.onStateChange();
  }

  public triggerLightning() {
    this.lightningFlash = 1.0;
    audioManager.playThunder();
  }

  public addItem(newItem: typeof INITIAL_ITEMS[string]) {
    const existing = this.inventory.find((i) => i.id === newItem.id);
    if (existing && existing.is_stackable) {
      existing.count += newItem.count;
    } else {
      this.inventory.push({ ...newItem });
    }
    if (this.onStateChange) this.onStateChange();
  }

  public useItem(itemId: string) {
    const idx = this.inventory.findIndex((i) => i.id === itemId);
    if (idx === -1) return;
    const item = this.inventory[idx];
    if (item.category === 'consumable' && item.heal_amount > 0) {
      if (this.player.hp >= this.player.maxHp) {
        if (this.onNotification) this.onNotification('Darah / HP Anda sudah penuh!', 'info');
        return;
      }
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + item.heal_amount);
      audioManager.playPotion();
      this.showFloatingText(this.player.x, this.player.y - 18, `+${item.heal_amount} HP`, '#22c55e');
      item.count--;
      if (item.count <= 0) {
        this.inventory.splice(idx, 1);
      }
      if (this.onStateChange) this.onStateChange();
    }
  }

  public showFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      color,
      life: 0,
      maxLife: 1.0,
    });
  }

  private update(delta: number) {
    // Lightning random timer
    this.lightningTimer -= delta;
    if (this.lightningTimer <= 0) {
      this.triggerLightning();
      this.lightningTimer = 12 + Math.random() * 15;
    }
    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - delta * 2.5);
    }

    // 1. Dash cooldown & duration
    if (this.player.dashTimer > 0) {
      this.player.dashTimer -= delta;
    }
    if (this.player.state === 'Dash') {
      if (this.player.dashTimer <= this.player.dashCooldown - 0.2) {
        this.player.state = 'Idle';
      }
    }

    // 1.5 Parry & Combat Ability Timers
    if (this.player.isParrying) {
      this.player.parryTimer -= delta;
      if (this.player.parryTimer <= 0) {
        this.player.isParrying = false;
        if (this.player.state === 'Parry') {
          this.player.state = 'Idle';
        }
      }
    }
    if (this.player.parryCooldownTimer > 0) {
      this.player.parryCooldownTimer -= delta;
    }
    if (this.player.weaponSkillCooldownTimer > 0) {
      this.player.weaponSkillCooldownTimer -= delta;
    }
    if (this.parrySuccessFlash > 0) {
      this.parrySuccessFlash = Math.max(0, this.parrySuccessFlash - delta * 2.0);
    }
    if (this.smitePillarVfx.active) {
      this.smitePillarVfx.timer -= delta;
      if (this.smitePillarVfx.timer <= 0) this.smitePillarVfx.active = false;
    }
    if (this.holySlashVfx.active) {
      this.holySlashVfx.timer -= delta;
      if (this.holySlashVfx.timer <= 0) this.holySlashVfx.active = false;
    }
    if (this.activeComboNotice) {
      this.activeComboNotice.timer -= delta;
      if (this.activeComboNotice.timer <= 0) {
        this.activeComboNotice = null;
      }
    }

    // --- FLOOR LOOT PHYSICS & MAGNETIC PICKUP UPDATE ---
    for (let i = this.floorLoots.length - 1; i >= 0; i--) {
      const loot = this.floorLoots[i];
      loot.life += delta;
      if (loot.life >= loot.maxLife) {
        this.floorLoots.splice(i, 1);
        continue;
      }

      // Physics: gravity and bouncing elevation
      if (loot.z > 0 || loot.bounceCount < 2) {
        loot.z += loot.vz * delta;
        loot.vz -= 380 * delta;
        loot.x += loot.vx * delta;
        loot.y += loot.vy * delta;
        loot.vx *= 0.92;
        loot.y += loot.vy * delta;
        loot.vy *= 0.92;

        if (loot.z <= 0) {
          loot.z = 0;
          loot.bounceCount++;
          loot.vz = Math.abs(loot.vz) * 0.45;
          if (loot.vz < 15) loot.vz = 0;
        }
      }

      // Magnetic Attraction towards Player
      const distToPlayer = Math.hypot(this.player.x - loot.x, this.player.y - loot.y);
      const magnetRadius = 65;
      if (distToPlayer <= magnetRadius) {
        const pullSpeed = (1 - distToPlayer / magnetRadius) * 280 * delta;
        const angle = Math.atan2(this.player.y - loot.y, this.player.x - loot.x);
        loot.x += Math.cos(angle) * pullSpeed;
        loot.y += Math.sin(angle) * pullSpeed;
      }

      // Pickup Collection Check
      if (distToPlayer <= 14) {
        this.spawnCombatSparks(this.player.x, this.player.y, 8, loot.color, loot.glowColor, 80, 'star');
        this.spawnShockwaveRing(this.player.x, this.player.y, loot.color, 24);

        if (loot.type === 'gold') {
          this.player.gold += loot.amount;
          audioManager.playCoin();
          this.showFloatingText(this.player.x, this.player.y - 18, `+${loot.amount} Gold 🪙`, '#fbbf24');
        } else if (loot.type === 'exp') {
          this.gainExp(loot.amount);
          audioManager.playPotion();
          this.showFloatingText(this.player.x, this.player.y - 24, `+${loot.amount} EXP 🔮`, '#c084fc');
        } else if (loot.type === 'item' && loot.itemData) {
          this.addItem({ ...loot.itemData, count: loot.amount });
          audioManager.playEquipSound();
          this.showFloatingText(this.player.x, this.player.y - 28, `+${loot.itemData.name} ${loot.icon}`, '#38bdf8');
        }

        this.floorLoots.splice(i, 1);
        if (this.onStateChange) this.onStateChange();
      }
    }

    // 2. Player Input Physics
    if (this.player.state !== 'Dash') {
      let ix = 0;
      let iy = 0;
      if (this.input.move_right) ix += 1;
      if (this.input.move_left) ix -= 1;
      if (this.input.move_down) iy += 1;
      if (this.input.move_up) iy -= 1;

      let len = Math.hypot(ix, iy);
      if (len > 0) {
        ix /= len;
        iy /= len;
        if (this.player.state !== 'Attack') {
          this.player.state = 'Walk';
        }
        if (Math.abs(ix) > Math.abs(iy)) {
          this.player.direction = ix > 0 ? 'right' : 'left';
        } else {
          this.player.direction = iy > 0 ? 'down' : 'up';
        }
        this.player.vx = ix * this.player.speed;
        this.player.vy = iy * this.player.speed;
        this.player.animationTimer += delta;
        if (this.player.animationTimer > 0.14) {
          this.player.animationTimer = 0;
          this.player.animationFrame = (this.player.animationFrame + 1) % 4;
        }
      } else {
        if (this.player.state !== 'Attack') {
          this.player.state = 'Idle';
          this.player.animationFrame = 0;
        }
        this.player.vx = 0;
        this.player.vy = 0;
      }
    }

    if (this.player.attackTimer > 0) {
      this.player.attackTimer -= delta;
      if (this.player.attackTimer <= 0 && this.player.state !== 'Dash') {
        const hasInput = this.input.move_up || this.input.move_down || this.input.move_left || this.input.move_right;
        this.player.state = hasInput ? 'Walk' : 'Idle';
      }
    }

    // Move & slide with collision
    let newPx = this.player.x + this.player.vx * delta;
    let newPy = this.player.y + this.player.vy * delta;

    // REALM ISOLATION: Check current active region and clamp within its solid boundaries
    const currentChunk = this.chunks.find(c => 
      this.player.x >= c.pixelX && 
      this.player.x < c.pixelX + c.width && 
      this.player.y >= c.pixelY && 
      this.player.y < c.pixelY + c.height
    ) || this.chunks[0];

    if (this.inDungeon) {
      newPx = Math.max(40, Math.min(600, newPx));
      newPy = Math.max(50, Math.min(315, newPy));
    } else if (currentChunk) {
      newPx = Math.max(currentChunk.pixelX + 22, Math.min(currentChunk.pixelX + currentChunk.width - 22, newPx));
      newPy = Math.max(currentChunk.pixelY + 28, Math.min(currentChunk.pixelY + currentChunk.height - 24, newPy));
    }

    if (!this.checkSolidCollision(newPx, this.player.y, this.player.collisionRadius)) {
      this.player.x = newPx;
    }
    if (!this.checkSolidCollision(this.player.x, newPy, this.player.collisionRadius)) {
      this.player.y = newPy;
    }
    
    const currentChunkX = Math.floor(this.player.x / CHUNK_WIDTH);
    const currentChunkY = Math.floor(this.player.y / CHUNK_HEIGHT);

    // 3. Chunk Optimization & Region Entry Detection
    let activeChunk: WorldChunk | undefined;
    
    if (this.inDungeon) {
      activeChunk = {
        id: `dungeon_instance_${this.dungeonFloor}`,
        name: `Menara Lantai ${this.dungeonFloor}: ${this.dungeonTier.name}`,
        subtitle: `Area Pertarungan Bos & Gelombang Musuh`,
        dangerLevel: 'Maut Ekstrem',
        dangerColor: '#f43f5e',
        x: 0,
        y: 0,
        pixelX: 0,
        pixelY: 0,
        width: 640,
        height: 360,
        active: true,
        biome: 'crypt'
      };
      // Keep surface chunks inactive
      this.chunks.forEach((chunk) => {
        chunk.active = false;
      });
    } else {
      activeChunk = this.chunks.find((c) => c.x === currentChunkX && c.y === currentChunkY);
      this.chunks.forEach((chunk) => {
        chunk.active = chunk.x === currentChunkX && chunk.y === currentChunkY;
      });
    }

    if (activeChunk && activeChunk.id !== this.lastActiveChunkId) {
      const isFirst = this.lastActiveChunkId === '';
      this.lastActiveChunkId = activeChunk.id;
      if (!isFirst) {
        audioManager.playRegionChime();
      }
      if (this.onRegionEnter) {
        this.onRegionEnter(activeChunk);
      }
    }

    // 3.5 Day/Dusk/Night Dynamic Cycle
    this.timeOfDayTimer += delta;
    if (this.timeOfDayTimer >= 60) {
      this.timeOfDayTimer = 0;
      if (this.timeOfDay === 'night') this.timeOfDay = 'day';
      else if (this.timeOfDay === 'day') this.timeOfDay = 'dusk';
      else this.timeOfDay = 'night';
      if (this.onNotification) {
        const cycleMsgs = {
          day: '☀️ Fajar menyingsing di atas Ravenfall. Kabut perlahan menipis.',
          dusk: '🌅 Senja kemerahan turun... Makhluk kegelapan mulai merayap keluar.',
          night: '🌕 Bulan Purnama Darah (Blood Moon)! Makhluk malam menjadi lebih agresif!',
        };
        this.onNotification(cycleMsgs[this.timeOfDay], 'info');
      }
      if (this.onStateChange) this.onStateChange();
    }

    // 3.8 Traps & Hazards collision
    if (!this.inDungeon) {
      for (const trap of this.traps) {
        if (trap.state !== 'active') continue;
        const dist = Math.hypot(this.player.x - trap.x, this.player.y - trap.y);
        if (dist < 18 && this.player.state !== 'Dash') {
          if (trap.type === 'spikes' || trap.type === 'poison_gas') {
            const reducedDmg = Math.max(
              5,
              trap.damage - (this.player.defense ? Math.floor(this.player.defense * 0.4) : 0)
            );
            this.player.hp = Math.max(0, this.player.hp - reducedDmg);
            audioManager.playTrapSound(trap.type);
            this.showFloatingText(this.player.x, this.player.y - 16, `-${reducedDmg} JEBAKAN!`, '#f87171');
            trap.state = 'triggered';
            setTimeout(() => {
              if (trap.state === 'triggered') trap.state = 'active';
            }, 2400);
            if (this.onStateChange) this.onStateChange();
            if (this.player.hp <= 0 && !this.isGameOver) {
              this.isGameOver = true;
              this.player.state = 'Idle';
              if (this.onGameOver) this.onGameOver();
            }
          }
        }
      }
    }

    // 4. Enemy AI (Gothic Skeletons, Ghouls, Lich)
    for (const enemy of this.enemies) {
      if (enemy.state === 'DEAD') {
        enemy.respawnTimer -= delta;
        if (enemy.respawnTimer <= 0) {
          enemy.hp = enemy.maxHp;
          enemy.state = 'IDLE';
        }
        continue;
      }
      if (enemy.hurtTimer > 0) {
        enemy.hurtTimer -= delta;
        if (enemy.hurtTimer <= 0) {
          enemy.state = 'CHASE';
        }
      }
      if (enemy.attackTimer > 0) {
        enemy.attackTimer -= delta;
      }

      const distToPlayer = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
      if (distToPlayer <= enemy.detectionRadius) {
        enemy.state = 'CHASE';
        if (distToPlayer <= enemy.attackRadius) {
          if (enemy.attackTimer <= 0 && this.player.state !== 'Dash') {
            enemy.attackTimer = enemy.attackCooldown;

            // 1. Parry Stance Counter
            if (this.player.isParrying && this.player.parryTimer > 0) {
              audioManager.playParry();
              this.parrySuccessFlash = 0.4;
              this.parryVfxPos = { x: this.player.x, y: this.player.y };
              this.spawnShockwaveRing(this.player.x, this.player.y, '#fbbf24', 54);
              this.spawnShockwaveRing(this.player.x, this.player.y, '#fffbeb', 36);
              this.spawnHolyRuneParticles(this.player.x, this.player.y, 8);
              this.spawnCombatSparks(this.player.x, this.player.y, 20, '#fbbf24', '#f59e0b', 120, 'star');
              this.showFloatingText(this.player.x, this.player.y - 18, 'PERFECT PARRY!', '#fbbf24');

              // Counter-attack damage to enemy
              enemy.hurtTimer = 0.8;
              enemy.state = 'HURT';
              const counterDmg = Math.round(this.player.attackPower * 2.2);
              enemy.hp -= counterDmg;
              this.showFloatingText(enemy.x, enemy.y - 12, `COUNTER! -${counterDmg}`, '#f59e0b');

              // Heavy knockback to staggered enemy
              const angle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
              enemy.x += Math.cos(angle) * 32;
              enemy.y += Math.sin(angle) * 32;
              if (enemy.hp <= 0) {
                this.handleEnemyDefeat(enemy);
              }
              if (this.onStateChange) this.onStateChange();
              continue;
            }

            // 2. Defense Guard (Shield Block)
            if (this.player.isDefending) {
              audioManager.playParry();
              this.spawnCombatSparks(this.player.x, this.player.y, 8, '#38bdf8', '#0284c7', 60, 'spark');
              this.spawnShockwaveRing(this.player.x, this.player.y, '#38bdf8', 26);
              const rawDamage = enemy.attackDamage;
              const guardedDmg = Math.max(1, Math.round((rawDamage - (this.player.defense || 0)) * 0.18));
              this.player.hp = Math.max(0, this.player.hp - guardedDmg);
              this.showFloatingText(this.player.x, this.player.y - 14, `GUARD! -${guardedDmg}`, '#38bdf8');
              if (this.onStateChange) this.onStateChange();
              if (this.player.hp <= 0 && !this.isGameOver) {
                this.isGameOver = true;
                this.player.state = 'Idle';
                if (this.onGameOver) this.onGameOver();
              }
              continue;
            }

            // 3. Normal unblocked hit
            const rawDamage = enemy.attackDamage;
            const reducedDamage = Math.max(1, Math.round(rawDamage - (this.player.defense || 0)));
            this.player.hp = Math.max(0, this.player.hp - reducedDamage);
            audioManager.playHit();
            this.showFloatingText(this.player.x, this.player.y - 14, `-${reducedDamage}`, '#ef4444');
            if (this.onStateChange) this.onStateChange();
            if (this.player.hp <= 0 && !this.isGameOver) {
              this.isGameOver = true;
              this.player.state = 'Idle';
              if (this.onGameOver) this.onGameOver();
            }
          }
        } else {
          const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
          const evx = Math.cos(angle) * enemy.speed;
          const evy = Math.sin(angle) * enemy.speed;
          const nextEx = enemy.x + evx * delta;
          const nextEy = enemy.y + evy * delta;
          if (!this.checkSolidCollision(nextEx, enemy.y, 8)) enemy.x = nextEx;
          if (!this.checkSolidCollision(enemy.x, nextEy, 8)) enemy.y = nextEy;
          enemy.direction =
            Math.abs(evx) > Math.abs(evy) ? (evx > 0 ? 'right' : 'left') : evy > 0 ? 'down' : 'up';
        }
      } else {
        enemy.state = 'IDLE';
        enemy.wanderTimer -= delta;
        if (enemy.wanderTimer <= 0) {
          enemy.wanderTimer = 2.5 + Math.random() * 3;
          if (Math.random() < 0.6) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 24 + Math.random() * 30;
            enemy.wanderTarget = {
              x: enemy.x + Math.cos(angle) * dist,
              y: enemy.y + Math.sin(angle) * dist,
            };
          } else {
            enemy.wanderTarget = null;
          }
        }
        if (enemy.wanderTarget) {
          const wDist = Math.hypot(enemy.wanderTarget.x - enemy.x, enemy.wanderTarget.y - enemy.y);
          if (wDist > 5) {
            const angle = Math.atan2(enemy.wanderTarget.y - enemy.y, enemy.wanderTarget.x - enemy.x);
            enemy.x += Math.cos(angle) * (enemy.speed * 0.4) * delta;
            enemy.y += Math.sin(angle) * (enemy.speed * 0.4) * delta;
          } else {
            enemy.wanderTarget = null;
          }
        }
      }
    }

    // 5. Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += delta;
      ft.y -= 16 * delta;
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 6. Update Combat Particles & VFX
    for (let i = this.combatParticles.length - 1; i >= 0; i--) {
      const cp = this.combatParticles[i];
      cp.life += delta;
      cp.x += cp.vx * delta;
      cp.y += cp.vy * delta;
      cp.vx *= 0.93;
      cp.vy *= 0.93;
      cp.rotation += cp.rotSpeed * delta;
      cp.alpha = Math.max(0, 1 - cp.life / cp.maxLife);
      if (cp.life >= cp.maxLife) {
        this.combatParticles.splice(i, 1);
      }
    }

    // 7. Update Dash Ghosts
    for (let i = this.dashGhosts.length - 1; i >= 0; i--) {
      const dg = this.dashGhosts[i];
      dg.alpha -= delta * 3.8;
      if (dg.alpha <= 0) {
        this.dashGhosts.splice(i, 1);
      }
    }

    // Continuous Dash Ghost trail while dashing
    if (this.player.state === 'Dash') {
      this.dashGhostSpawnTimer += delta;
      if (this.dashGhostSpawnTimer >= 0.04) {
        this.dashGhostSpawnTimer = 0;
        this.dashGhosts.push({
          x: this.player.x,
          y: this.player.y,
          alpha: 0.6,
          direction: this.player.direction,
          color: '#cbd5e1',
        });
      }
    }

    // 8. Update Mist Particles
    for (const mist of this.mistParticles) {
      mist.x += mist.vx * delta;
      if (mist.x - mist.radius > CHUNK_WIDTH * 3) {
        mist.x = -mist.radius;
        mist.y = Math.random() * (CHUNK_HEIGHT * 4);
      }
    }

    // 9. Update Rain
    if (this.isRaining) {
      for (const drop of this.raindrops) {
        drop.y += drop.speed * delta;
        drop.x += (drop.speed * 0.35) * delta;
        if (drop.y > this.VIEWPORT_HEIGHT) {
          drop.y = -10;
          drop.x = Math.random() * this.VIEWPORT_WIDTH;
        }
      }
    }

    // 8. Camera Smooth Tracking
    const targetCamX = this.player.x - this.VIEWPORT_WIDTH / 2;
    const targetCamY = this.player.y - this.VIEWPORT_HEIGHT / 2;
    this.cameraX += (targetCamX - this.cameraX) * 0.14;
    this.cameraY += (targetCamY - this.cameraY) * 0.14;
    this.cameraX = Math.max(0, Math.min(CHUNK_WIDTH * 3 - this.VIEWPORT_WIDTH, this.cameraX));
    this.cameraY = Math.max(0, Math.min(CHUNK_HEIGHT * 4 - this.VIEWPORT_HEIGHT, this.cameraY));
  }

  private checkSolidCollision(x: number, y: number, radius: number): boolean {
    if (!this.inDungeon) {
      for (const obj of this.objects) {
        if (!obj.solid) continue;
        const boxW = obj.width * 0.75;
        const boxH = obj.height * 0.38;
        const boxX = obj.x - boxW / 2;
        const boxY = obj.y + (obj.ySortOffset || 0) - boxH;
        if (
          x + radius > boxX &&
          x - radius < boxX + boxW &&
          y + radius > boxY &&
          y - radius < boxY + boxH
        ) {
          return true;
        }
      }
      for (const npc of this.npcs) {
        const dist = Math.hypot(x - npc.x, y - npc.y);
        if (dist < radius + 8) return true;
      }
    }
    return false;
  }

  // --- RENDER PASS (HD Gothic Pixel Art) ---
  private render() {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.save();
    // Gothic deep dark background
    ctx.fillStyle = '#090a0f';
    ctx.fillRect(0, 0, this.VIEWPORT_WIDTH, this.VIEWPORT_HEIGHT);

    // Apply Camera
    if (this.inDungeon) {
      this.cameraX = 0;
      this.cameraY = 0;
    }
    ctx.translate(-Math.round(this.cameraX), -Math.round(this.cameraY));

    // 1. Ground Tiles / Arena
    if (this.inDungeon) {
      this.renderDungeonArena(ctx);
    } else {
      this.renderGothicGround(ctx);
      this.renderTraps(ctx);
    }

    // 2. Y-Sorting Render Queue
    interface RenderableEntity {
      ySortKey: number;
      type: 'player' | 'npc' | 'enemy' | 'object';
      data: Player | NPC | Enemy | WorldObject;
    }

    const renderables: RenderableEntity[] = [];

    renderables.push({
      ySortKey: this.player.y + 6,
      type: 'player',
      data: this.player,
    });

    if (this.inDungeon) {
      if (this.dungeonNpc) {
        renderables.push({
          ySortKey: this.dungeonNpc.y + 6,
          type: 'npc',
          data: this.dungeonNpc,
        });
      }
    } else {
      for (const npc of this.npcs) {
        renderables.push({
          ySortKey: npc.y + 6,
          type: 'npc',
          data: npc,
        });
      }

      for (const obj of this.objects) {
        renderables.push({
          ySortKey: obj.y + (obj.ySortOffset || 0),
          type: 'object',
          data: obj,
        });
      }
    }

    for (const enemy of this.enemies) {
      if (enemy.state !== 'DEAD') {
        renderables.push({
          ySortKey: enemy.y + (enemy.ySortOffset || 0),
          type: 'enemy',
          data: enemy,
        });
      }
    }

    renderables.sort((a, b) => a.ySortKey - b.ySortKey);

    for (const item of renderables) {
      if (item.type === 'object') {
        this.renderGothicObject(ctx, item.data as WorldObject);
      } else if (item.type === 'player') {
        this.renderGothicPlayer(ctx);
      } else if (item.type === 'npc') {
        this.renderGothicNPC(ctx, item.data as NPC);
      } else if (item.type === 'enemy') {
        this.renderGothicEnemy(ctx, item.data as Enemy);
      }

      if (this.debug.showYSortLines) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo((item.data as { x: number }).x - 16, item.ySortKey);
        ctx.lineTo((item.data as { x: number }).x + 16, item.ySortKey);
        ctx.stroke();
      }
    }

    // 2.3 Animated Floor Loot Items
    this.renderFloorLoots(ctx);

    // 2.5 Combat VFX (Shockwave, Smite, Holy Slashes)
    this.renderCombatVFX(ctx);

    // 3. Volumetric Ground Mist
    if (this.debug.showMist) {
      this.renderMist(ctx);
    }

    // 4. Debug Overlays
    if (this.debug.showCollisions) {
      this.renderCollisionOverlays(ctx);
    }
    if (this.debug.showHitboxes && this.player.state === 'Attack') {
      this.renderPlayerAttackHitbox(ctx);
    }
    if (this.debug.showDetectionZones) {
      this.renderDetectionZones(ctx);
    }
    if (this.debug.showChunkBoundaries) {
      this.renderChunkBoundaries(ctx);
    }

    // 5. Floating Damage & Loot
    for (const ft of this.floatingTexts) {
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 3;
      ctx.fillText(ft.text, ft.x - 10, ft.y);
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    // 6. Dynamic 2D Lighting System (PointLight2D effect)
    if (this.debug.showDynamicLighting) {
      this.renderDynamicLighting(ctx);
    }

    // 7. Gothic Rain with Streaks
    if (this.isRaining) {
      this.renderRain(ctx);
    }

    // 8. Lightning Strike Full-screen Flash
    if (this.lightningFlash > 0) {
      ctx.fillStyle = `rgba(224, 231, 255, ${this.lightningFlash * 0.75})`;
      ctx.fillRect(0, 0, this.VIEWPORT_WIDTH, this.VIEWPORT_HEIGHT);
    }

    // 9. HUD Mini Stats
    this.renderViewportHUD(ctx);
  }

  // --- SUB-RENDERERS ---
  private renderTraps(ctx: CanvasRenderingContext2D) {
    for (const trap of this.traps) {
      if (trap.type === 'spikes') {
        ctx.fillStyle = trap.state === 'disabled' ? '#27272a' : '#18181b';
        ctx.fillRect(trap.x - 14, trap.y - 14, 28, 28);
        ctx.strokeStyle = trap.state === 'disabled' ? '#3f3f46' : '#7f1d1d';
        ctx.strokeRect(trap.x - 14, trap.y - 14, 28, 28);

        if (trap.state !== 'disabled') {
          // Sharp metallic spikes popping up with bloody tips
          for (let i = -10; i <= 10; i += 7) {
            for (let j = -10; j <= 10; j += 7) {
              ctx.fillStyle = '#a1a1aa';
              ctx.beginPath();
              ctx.moveTo(trap.x + i, trap.y + j - 6);
              ctx.lineTo(trap.x + i - 2, trap.y + j + 2);
              ctx.lineTo(trap.x + i + 2, trap.y + j + 2);
              ctx.fill();
              ctx.fillStyle = '#dc2626';
              ctx.fillRect(trap.x + i - 1, trap.y + j - 6, 2, 2);
            }
          }
        } else {
          ctx.fillStyle = '#71717a';
          ctx.font = 'bold 7px monospace';
          ctx.fillText('DISARMED', trap.x - 16, trap.y + 3);
        }
      } else if (trap.type === 'poison_gas') {
        ctx.fillStyle = 'rgba(21, 128, 61, 0.35)';
        ctx.beginPath();
        ctx.arc(trap.x, trap.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#22c55e';
        ctx.stroke();
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(trap.x + Math.sin(Date.now() / 300) * 4, trap.y + Math.cos(Date.now() / 300) * 4, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (trap.type === 'crypt_lever') {
        // Ancient Crypt Stone Pedestal with interactive pull lever
        ctx.fillStyle = '#27272a';
        ctx.fillRect(trap.x - 8, trap.y - 8, 16, 16);
        ctx.strokeStyle = '#52525b';
        ctx.strokeRect(trap.x - 8, trap.y - 8, 16, 16);
        ctx.fillStyle = trap.state === 'disabled' ? '#22c55e' : '#ef4444';
        ctx.fillRect(trap.x - 2, trap.y - (trap.state === 'disabled' ? 12 : 5), 4, 10);
        ctx.fillStyle = '#e4e4e7';
        ctx.font = 'bold 6px monospace';
        ctx.fillText('TUAS', trap.x - 8, trap.y + 14);
      }
    }
  }

  private renderGothicGround(ctx: CanvasRenderingContext2D) {
    const left = Math.floor(this.cameraX / 32) * 32;
    const top = Math.floor(this.cameraY / 32) * 32;
    const right = left + this.VIEWPORT_WIDTH + 64;
    const bottom = top + this.VIEWPORT_HEIGHT + 64;

    for (let x = left; x < right; x += 32) {
      for (let y = top; y < bottom; y += 32) {
        const chunkX = Math.floor(x / CHUNK_WIDTH);
        const chunkY = Math.floor(y / CHUNK_HEIGHT);

        if (chunkX === 0 && chunkY === 0) {
          // (0, 0) Village Ravenfall: weathered dark flagstones & muddy earth
          const isCobble =
            (x > 190 && x < 430 && y > 140 && y < 230) || (x > 270 && x < 350 && y > 70 && y < 330);
          ctx.fillStyle = isCobble ? '#262626' : '#171717';
          ctx.fillRect(x, y, 32, 32);
          if (isCobble) {
            ctx.fillStyle = '#404040';
            ctx.fillRect(x + 2, y + 2, 12, 8);
            ctx.fillRect(x + 16, y + 14, 12, 8);
          } else {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(x + 8, y + 8, 4, 3);
          }
        } else if (chunkX === 1 && chunkY === 0) {
          // (1, 0) Haunted Cemetery: gloomy dead earth with bone fragments & eerie moss
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(x, y, 32, 32);
          ctx.fillStyle = '#292524';
          ctx.fillRect(x + 6, y + 10, 8, 8);
          if ((x + y) % 64 === 0) {
            ctx.fillStyle = '#450a0a'; // Blood patch
            ctx.fillRect(x + 12, y + 12, 6, 4);
          }
        } else if (chunkX === 2 && chunkY === 0) {
          // (2, 0) Blood Swamp: murky dark water & dead moss
          const isWater = (x * 7 + y * 13) % 48 < 20;
          ctx.fillStyle = isWater ? '#142217' : '#0f172a';
          ctx.fillRect(x, y, 32, 32);
          if (isWater) {
            ctx.fillStyle = 'rgba(220, 38, 38, 0.25)';
            ctx.fillRect(x + 4, y + 6, 12, 4);
          } else {
            ctx.fillStyle = '#134e4a';
            ctx.fillRect(x + 6, y + 8, 6, 5);
          }
        } else if (chunkX === 0 && chunkY === 1) {
          // (0, 1) Blood Cathedral: black gothic marble with crimson veins
          ctx.fillStyle = '#1e1b2e';
          ctx.fillRect(x, y, 32, 32);
          ctx.fillStyle = '#2e1065';
          ctx.fillRect(x + 4, y + 4, 10, 10);
          if ((x * y) % 96 === 0) {
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(x + 14, y + 14, 3, 3);
          }
        } else if (chunkX === 1 && chunkY === 1) {
          // (1, 1) Ruined Abbey Gates: cracked stone flagstones & ivy
          ctx.fillStyle = '#27272a';
          ctx.fillRect(x, y, 32, 32);
          ctx.fillStyle = '#18181b';
          ctx.fillRect(x + 2, y + 2, 28, 28);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x + 10, y + 10, 4, 12);
        } else if (chunkX === 2 && chunkY === 1) {
          // (2, 1) Valley of Bones: ashen earth with scattered bone shards
          ctx.fillStyle = '#292524';
          ctx.fillRect(x, y, 32, 32);
          if ((x + y) % 48 === 0) {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(x + 8, y + 8, 8, 3);
            ctx.fillRect(x + 12, y + 16, 5, 2);
          }
        } else if (chunkX === 0 && chunkY === 2) {
          // (0, 2) Vampire Coven Sanctum: crimson velvet floor tiles
          ctx.fillStyle = '#1f1315';
          ctx.fillRect(x, y, 32, 32);
          ctx.fillStyle = '#881337';
          ctx.fillRect(x + 3, y + 3, 26, 26);
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(x + 14, y + 14, 4, 4);
        } else if (chunkX === 1 && chunkY === 2) {
          // (1, 2) Crypt of the Lich King: ancient blackened stone tiles with occult purple runes
          ctx.fillStyle = '#18181b';
          ctx.fillRect(x, y, 32, 32);
          ctx.fillStyle = '#27272a';
          ctx.fillRect(x + 4, y + 4, 24, 24);
          ctx.strokeStyle = '#581c87';
          ctx.strokeRect(x + 4, y + 4, 24, 24);
          if ((x * y) % 128 === 0) {
            ctx.fillStyle = '#a855f7';
            ctx.fillRect(x + 12, y + 12, 8, 2);
          }
        } else if (chunkX === 2 && chunkY === 2) {
          // (2, 2) Forgotten Castle Throne: dark polished marble & royal carpet
          const isRug = x > 1560 && x < 1640;
          ctx.fillStyle = isRug ? '#991b1b' : '#09090b';
          ctx.fillRect(x, y, 32, 32);
          if (isRug) {
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(x + 1, y, 2, 32);
            ctx.fillRect(x + 29, y, 2, 32);
          } else {
            ctx.strokeStyle = '#1e1e24';
            ctx.strokeRect(x + 2, y + 2, 28, 28);
          }
        } else if (chunkX === 0 && chunkY === 3) {
          // (0, 3) Astral Tower & Observatory: cosmic obsidian stone with glowing starlight inlays
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x, y, 32, 32);
          ctx.strokeStyle = '#312e81';
          ctx.strokeRect(x + 2, y + 2, 28, 28);
          if ((x * 3 + y * 5) % 64 === 0) {
            ctx.fillStyle = '#a5b4fc';
            ctx.beginPath();
            ctx.arc(x + 16, y + 16, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (chunkX === 1 && chunkY === 3) {
          // (1, 3) Ancient Abyss Rift: deep abyss void stone with pulsing violet fissures
          ctx.fillStyle = '#090514';
          ctx.fillRect(x, y, 32, 32);
          ctx.strokeStyle = '#3b0764';
          ctx.strokeRect(x + 3, y + 3, 26, 26);
          if ((x + y) % 32 === 0) {
            ctx.fillStyle = '#c084fc';
            ctx.fillRect(x + 8, y + 14, 16, 2);
            ctx.fillRect(x + 15, y + 8, 2, 14);
          }
        } else if (chunkX === 2 && chunkY === 3) {
          // (2, 3) Forbidden Black Rose Garden: velvet dark soil with blood roses
          ctx.fillStyle = '#1c0f13';
          ctx.fillRect(x, y, 32, 32);
          ctx.fillStyle = '#4c0519';
          ctx.fillRect(x + 6, y + 6, 8, 8);
          if ((x * y) % 64 === 0) {
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.arc(x + 16, y + 16, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = '#18181b';
          ctx.fillRect(x, y, 32, 32);
        }
      }
    }

    // Render Gothic Perimeter Boundary Walls for regions in view
    for (const chunk of this.chunks) {
      if (
        chunk.pixelX + chunk.width < this.cameraX - 32 ||
        chunk.pixelX > this.cameraX + this.VIEWPORT_WIDTH + 32 ||
        chunk.pixelY + chunk.height < this.cameraY - 32 ||
        chunk.pixelY > this.cameraY + this.VIEWPORT_HEIGHT + 32
      ) {
        continue;
      }

      const cx = chunk.pixelX;
      const cy = chunk.pixelY;
      const cw = chunk.width;
      const ch = chunk.height;

      // 1. Top Wall: Gothic Stone Battlement & Molding
      ctx.fillStyle = '#090514';
      ctx.fillRect(cx, cy, cw, 22);
      ctx.fillStyle = '#1c162b';
      ctx.fillRect(cx, cy + 22, cw, 4);
      ctx.fillStyle = '#2d2440';
      ctx.fillRect(cx, cy + 26, cw, 2);

      // Top Wall Crenellations / Stone Bricks
      for (let bx = cx; bx < cx + cw; bx += 20) {
        ctx.fillStyle = '#171124';
        ctx.fillRect(bx + 2, cy + 2, 16, 16);
        ctx.fillStyle = '#312845';
        ctx.fillRect(bx + 4, cy + 4, 12, 2);
        // Wall sconces / torch glow hints
        if ((bx - cx) % 120 === 60) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(bx + 9, cy + 18, 3, 4);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(bx + 10, cy + 15, 2, 3);
        }
      }

      // 2. Bottom Wall: Fortress Base & Spiked Iron Balustrade
      ctx.fillStyle = '#0a0614';
      ctx.fillRect(cx, cy + ch - 18, cw, 18);
      ctx.fillStyle = '#1c162b';
      ctx.fillRect(cx, cy + ch - 22, cw, 4);

      // Bottom Railing Spikes
      for (let bx = cx; bx < cx + cw; bx += 12) {
        ctx.fillStyle = '#382f4e';
        ctx.fillRect(bx + 4, cy + ch - 24, 2, 6);
        ctx.fillStyle = '#5b4a78';
        ctx.fillRect(bx + 3, cy + ch - 26, 4, 2);
      }

      // 3. Left Wall: Stone Boundary Pillars & Iron Grating
      ctx.fillStyle = '#0c0818';
      ctx.fillRect(cx, cy, 18, ch);
      ctx.fillStyle = '#1f1930';
      ctx.fillRect(cx + 18, cy, 3, ch);

      // 4. Right Wall: Stone Boundary Pillars & Iron Grating
      ctx.fillStyle = '#0c0818';
      ctx.fillRect(cx + cw - 18, cy, 18, ch);
      ctx.fillStyle = '#1f1930';
      ctx.fillRect(cx + cw - 21, cy, 3, ch);

      // 5. Four Sturdy Corner Towers / Pillars
      const cornerSize = 22;
      const corners = [
        [cx, cy],
        [cx + cw - cornerSize, cy],
        [cx, cy + ch - cornerSize],
        [cx + cw - cornerSize, cy + ch - cornerSize],
      ];
      for (const [corX, corY] of corners) {
        ctx.fillStyle = '#05030a';
        ctx.fillRect(corX, corY, cornerSize, cornerSize);
        ctx.strokeStyle = '#433461';
        ctx.lineWidth = 1;
        ctx.strokeRect(corX + 1, corY + 1, cornerSize - 2, cornerSize - 2);
        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(corX + 8, corY + 8, 5, 5);
      }
    }
  }

  private renderGothicObject(ctx: CanvasRenderingContext2D, obj: WorldObject) {
    ctx.save();
    const x = obj.x;
    const y = obj.y;

    if (obj.type === 'portal_gate') {
      const time = performance.now() / 1000;
      
      // Ground Arcane Seal Ring
      ctx.save();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(x, y + 16, 26, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)';
      ctx.beginPath();
      ctx.ellipse(x, y + 16, 18, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Ancient Heavy Stone Archway Pillars
      ctx.fillStyle = '#120924';
      ctx.fillRect(x - 20, y - 28, 10, 52);
      ctx.fillRect(x + 10, y - 28, 10, 52);
      // Keystone Arch Top
      ctx.fillStyle = '#1a0d33';
      ctx.fillRect(x - 22, y - 32, 44, 14);
      ctx.strokeStyle = '#4c1d95';
      ctx.strokeRect(x - 22, y - 32, 44, 14);
      
      // Swirling Dimensional Portal Energy
      const pulse = Math.sin(time * 3) * 0.25 + 0.75;
      const grad = ctx.createRadialGradient(x, y, 2, x, y, 22);
      grad.addColorStop(0, `rgba(236, 72, 153, ${0.9 * pulse})`);
      grad.addColorStop(0.5, `rgba(147, 51, 234, ${0.7 * pulse})`);
      grad.addColorStop(1, 'rgba(30, 10, 60, 0.1)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - 10, y - 18, 20, 38);
      
      // Floating Cosmic Runes
      ctx.fillStyle = '#fdf4ff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('✧', x - 4, y - 2 + Math.sin(time * 4) * 4);
      ctx.fillStyle = '#e879f9';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('✦', x - 8, y + 8 + Math.cos(time * 3) * 3);
      ctx.fillText('✦', x + 3, y + 8 + Math.sin(time * 3.5) * 3);

      // Nearby Interaction Prompt
      const dist = Math.hypot(this.player.x - x, this.player.y - y);
      if (dist < 46) {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 5, 20, 0.85)';
        ctx.fillRect(x - 52, y - 48, 104, 16);
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 52, y - 48, 104, 16);
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[E] GERBANG WARP REALM', x, y - 37);
        ctx.restore();
      }
    } else if (obj.type === 'dead_tree') {
      // Gnarled twisted gothic dead tree
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(x - 8, y + 26);
      ctx.lineTo(x + 8, y + 26);
      ctx.lineTo(x + 5, y + 4);
      ctx.lineTo(x - 5, y + 4);
      ctx.closePath();
      ctx.fill();

      // Skeletal branches
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y + 8);
      ctx.lineTo(x - 18, y - 14);
      ctx.lineTo(x - 26, y - 20);
      ctx.moveTo(x, y + 6);
      ctx.lineTo(x + 16, y - 12);
      ctx.lineTo(x + 24, y - 22);
      ctx.stroke();

      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 12, y - 6);
      ctx.lineTo(x - 14, y - 24);
      ctx.moveTo(x + 10, y - 4);
      ctx.lineTo(x + 12, y - 20);
      ctx.stroke();
    } else if (obj.type === 'gothic_house') {
      // Dark gothic manor with pointed arch roof & stained glass
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x - obj.width / 2, y, obj.width, obj.height);

      // Pointed steep gothic roof
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(x - obj.width / 2 - 6, y);
      ctx.lineTo(x, y - 32);
      ctx.lineTo(x + obj.width / 2 + 6, y);
      ctx.closePath();
      ctx.fill();

      // Heavy arched iron door
      ctx.fillStyle = '#3f3f46';
      ctx.beginPath();
      ctx.arc(x, y + obj.height - 18, 9, Math.PI, 0);
      ctx.lineTo(x + 9, y + obj.height);
      ctx.lineTo(x - 9, y + obj.height);
      ctx.closePath();
      ctx.fill();

      // Arched stained glass windows with blood amber glow
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x - 22, y + 14, 5, Math.PI, 0);
      ctx.lineTo(x - 17, y + 26);
      ctx.lineTo(x - 27, y + 26);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x + 22, y + 14, 5, Math.PI, 0);
      ctx.lineTo(x + 27, y + 26);
      ctx.lineTo(x + 17, y + 26);
      ctx.closePath();
      ctx.fill();
    } else if (obj.type === 'tombstone') {
      // Gothic tombstone cross
      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.arc(x, y - 4, 8, Math.PI, 0);
      ctx.lineTo(x + 8, y + 10);
      ctx.lineTo(x - 8, y + 10);
      ctx.closePath();
      ctx.fill();

      // Engraved cross
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x - 1, y - 6, 2, 10);
      ctx.fillRect(x - 4, y - 3, 8, 2);
    } else if (obj.type === 'blood_chest') {
      // Blood chest with skull lock
      ctx.fillStyle = obj.opened ? '#450a0a' : '#7f1d1d';
      ctx.fillRect(x - 11, y - 6, 22, 16);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(x - 11, y - 2, 22, 4);

      // Skull ornament
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x - 3, y - 1, 6, 5);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x - 2, y, 1, 1);
      ctx.fillRect(x + 1, y, 1, 1);
    } else if (obj.type === 'cathedral') {
      // Blood Cathedral Altar with stained glass rose window
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(x - obj.width / 2, y, obj.width, obj.height);

      // Cathedral Roof Spire
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(x - obj.width / 2 - 8, y);
      ctx.lineTo(x, y - 38);
      ctx.lineTo(x + obj.width / 2 + 8, y);
      ctx.closePath();
      ctx.fill();

      // Gothic Rose Window
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(x, y + 18, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (obj.type === 'gargoyle') {
      // Gargoyle carved stone statue
      ctx.fillStyle = '#52525b';
      ctx.fillRect(x - 8, y + 4, 16, 24);

      // Wings
      ctx.fillStyle = '#3f3f46';
      ctx.beginPath();
      ctx.moveTo(x - 8, y + 8);
      ctx.lineTo(x - 18, y - 6);
      ctx.lineTo(x - 6, y + 16);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x + 8, y + 8);
      ctx.lineTo(x + 18, y - 6);
      ctx.lineTo(x + 6, y + 16);
      ctx.fill();

      // Red glowing eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x - 4, y + 8, 2, 2);
      ctx.fillRect(x + 2, y + 8, 2, 2);
    } else if (obj.type === 'gothic_lantern') {
      // Ornate wrought iron lamp post with lantern
      ctx.fillStyle = '#18181b';
      ctx.fillRect(x - 2, y - 14, 4, 26);

      // Wrought iron crest
      ctx.strokeStyle = '#27272a';
      ctx.strokeRect(x - 6, y - 22, 12, 10);

      // Glowing flame
      ctx.fillStyle = '#f97316';
      ctx.fillRect(x - 4, y - 20, 8, 7);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x - 2, y - 18, 4, 4);
    } else if (obj.type === 'crypt') {
      // Mausoleum / Crypt
      ctx.fillStyle = '#18181b';
      ctx.fillRect(x - obj.width / 2, y, obj.width, obj.height);
      ctx.fillStyle = '#27272a';
      ctx.fillRect(x - obj.width / 2 + 4, y - 12, obj.width - 8, 14);

      // Dark crypt entrance
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.arc(x, y + obj.height - 20, 14, Math.PI, 0);
      ctx.lineTo(x + 14, y + obj.height);
      ctx.lineTo(x - 14, y + obj.height);
      ctx.closePath();
      ctx.fill();
    } else if (obj.type === 'anvil') {
      // Blacksmith Anvil
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(x - 10, y + 8, 20, 10);
      ctx.fillRect(x - 14, y, 28, 8);
      ctx.fillStyle = '#71717a';
      ctx.fillRect(x + 14, y + 1, 6, 4);

      // Red-hot embers
      ctx.fillStyle = '#f97316';
      ctx.fillRect(x - 4, y + 2, 8, 3);
    } else if (obj.type === 'mausoleum') {
      // Large Gothic Mausoleum
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x - obj.width / 2, y, obj.width, obj.height);

      // Roof pediment
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.moveTo(x - obj.width / 2 - 4, y);
      ctx.lineTo(x, y - 24);
      ctx.lineTo(x + obj.width / 2 + 4, y);
      ctx.closePath();
      ctx.fill();

      // Stone Cross on top
      ctx.fillStyle = '#78716c';
      ctx.fillRect(x - 2, y - 36, 4, 14);
      ctx.fillRect(x - 6, y - 32, 12, 3);

      // Arched iron gate
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.arc(x, y + obj.height - 20, 14, Math.PI, 0);
      ctx.lineTo(x + 14, y + obj.height);
      ctx.lineTo(x - 14, y + obj.height);
      ctx.closePath();
      ctx.fill();
    } else if (obj.type === 'bone_pile') {
      // Ribcage and bone mound
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(x, y + 10, 18, Math.PI, 0);
      ctx.fill();

      // Rib lines
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 12, y + 4);
      ctx.lineTo(x - 6, y + 12);
      ctx.moveTo(x + 12, y + 4);
      ctx.lineTo(x + 6, y + 12);
      ctx.stroke();
    } else if (obj.type === 'blood_fountain') {
      // Stone Blood Fountain
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.ellipse(x, y + 16, 26, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bubbling Blood Pool
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.ellipse(x, y + 14, 20, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gargoyle fountain head
      ctx.fillStyle = '#18181b';
      ctx.fillRect(x - 5, y - 8, 10, 18);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(x - 2, y + 2, 4, 10);
    } else if (obj.type === 'throne') {
      // Dracula Iron Throne
      ctx.fillStyle = '#18181b';
      ctx.fillRect(x - 16, y - 28, 32, 48);

      // Spikes & gothic arches on backrest
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.moveTo(x - 16, y - 28);
      ctx.lineTo(x - 10, y - 44);
      ctx.lineTo(x, y - 36);
      ctx.lineTo(x + 10, y - 44);
      ctx.lineTo(x + 16, y - 28);
      ctx.closePath();
      ctx.fill();

      // Blood cushion
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x - 12, y + 2, 24, 12);
    } else if (obj.type === 'astral_telescope') {
      // Brass & Astral Glass Telescope
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(x - 12, y + 10, 24, 8); // Plinth
      // Tripod legs
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x - 14, y + 14);
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x + 14, y + 14);
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x, y + 14);
      ctx.stroke();
      // Main telescope tube (tilted)
      ctx.fillStyle = '#312e81';
      ctx.save();
      ctx.translate(x, y - 8);
      ctx.rotate(-0.55);
      ctx.fillRect(-18, -4, 36, 8);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-18, -5, 4, 10);
      ctx.fillRect(14, -5, 4, 10);
      // Lens glow
      ctx.fillStyle = '#818cf8';
      ctx.beginPath();
      ctx.arc(17, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (obj.type === 'abyss_crystal') {
      // Nether Abyss Purple Crystal Formation
      ctx.fillStyle = '#2e1065';
      ctx.beginPath();
      ctx.moveTo(x, y - 24);
      ctx.lineTo(x + 12, y);
      ctx.lineTo(x + 8, y + 16);
      ctx.lineTo(x - 8, y + 16);
      ctx.lineTo(x - 12, y);
      ctx.closePath();
      ctx.fill();
      // Crystal Facets & Inner Glow
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(x, y - 20);
      ctx.lineTo(x + 6, y - 2);
      ctx.lineTo(x, y + 10);
      ctx.lineTo(x - 6, y - 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f3e8ff';
      ctx.fillRect(x - 1, y - 10, 3, 8);
    } else if (obj.type === 'rose_shrine') {
      // Gothic Black Rose Shrine Monument
      ctx.fillStyle = '#18181b';
      ctx.fillRect(x - 18, y - 14, 36, 32);
      ctx.strokeStyle = '#831843';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 16, y - 12, 32, 28);
      // Arch top
      ctx.beginPath();
      ctx.arc(x, y - 14, 18, Math.PI, 0);
      ctx.fillStyle = '#18181b';
      ctx.fill();
      ctx.stroke();
      // Rose Crest & Blooming Petals
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(x, y - 4, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(x - 2, y - 6, 3, 0, Math.PI * 2);
      ctx.fill();
      // Thorny vines
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 16, y + 14);
      ctx.quadraticCurveTo(x - 8, y, x - 12, y - 10);
      ctx.moveTo(x + 16, y + 14);
      ctx.quadraticCurveTo(x + 8, y, x + 12, y - 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderGothicPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    ctx.save();
    const x = p.x;
    const y = p.y;

    // Soft entity ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 10, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const bob = p.state === 'Walk' ? Math.sin(p.animationFrame * Math.PI) * 2 : 0;

    // 1. Flowing Royal White Knight Cape with Golden Trim
    ctx.fillStyle = '#f8fafc'; // Pure white cape
    ctx.fillRect(x - 7, y - 8 + bob, 14, 16);
    ctx.fillStyle = '#eab308'; // Golden trim
    ctx.fillRect(x - 7, y + 7 + bob, 14, 2);
    if (p.direction === 'left') {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(x + 4, y - 8 + bob, 7, 14);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x + 4, y + 5 + bob, 7, 2);
    } else if (p.direction === 'right') {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(x - 11, y - 8 + bob, 7, 14);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x - 11, y + 5 + bob, 7, 2);
    }

    // 2. White Steel Armored Boots (Sabatons)
    ctx.fillStyle = '#cbd5e1';
    if (p.state === 'Walk') {
      const legOffset = p.animationFrame % 2 === 0 ? 2 : -2;
      ctx.fillRect(x - 5, y + 8 + bob, 4, 5 + legOffset);
      ctx.fillRect(x + 1, y + 8 + bob, 4, 5 - legOffset);
    } else {
      ctx.fillRect(x - 5, y + 8, 4, 5);
      ctx.fillRect(x + 1, y + 8, 4, 5);
    }
    // Gold knee poleyns
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x - 5, y + 7 + bob, 4, 2);
    ctx.fillRect(x + 1, y + 7 + bob, 4, 2);

    // 3. Polished White Steel Breastplate Cuirass
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 6, y - 7 + bob, 12, 14);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 6, y - 7 + bob, 12, 14);

    // Holy Golden Cross / Sun Crest on Breastplate
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x - 1, y - 5 + bob, 2, 8);
    ctx.fillRect(x - 4, y - 3 + bob, 8, 2);

    // White Steel Pauldrons (Shoulder Plates) with Gold Rims
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x - 9, y - 8 + bob, 4, 5);
    ctx.fillRect(x + 5, y - 8 + bob, 4, 5);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x - 9, y - 9 + bob, 4, 1.5);
    ctx.fillRect(x + 5, y - 9 + bob, 4, 1.5);

    // 4. White Knight Great-Helm (Closed Visor)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 5, y - 18 + bob, 10, 10);
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(x - 5, y - 18 + bob, 10, 10);

    // Golden Knight Crest / Plume on Helm
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(x - 2, y - 18 + bob);
    ctx.lineTo(x, y - 24 + bob);
    ctx.lineTo(x + 2, y - 18 + bob);
    ctx.fill();
    // Radiant white feathers plume
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x - 1, y - 23 + bob, 2, 4);

    // Radiant Visor Slit
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 4, y - 14 + bob, 8, 2);
    ctx.fillStyle = '#fef08a'; // Glowing holy eyes
    if (p.direction === 'down') {
      ctx.fillRect(x - 3, y - 14 + bob, 2, 2);
      ctx.fillRect(x + 1, y - 14 + bob, 2, 2);
    } else if (p.direction === 'left') {
      ctx.fillRect(x - 4, y - 14 + bob, 3, 2);
    } else if (p.direction === 'right') {
      ctx.fillRect(x + 1, y - 14 + bob, 3, 2);
    } else {
      ctx.fillRect(x - 2, y - 14 + bob, 4, 1);
    }

    // 5. PARRY / DEFEND SHIELD VISUALS
    if (p.isParrying || p.state === 'Parry') {
      // Radiant Golden Aegis Shield with Celestial Runes
      ctx.save();
      const shieldOffset = p.direction === 'left' ? -12 : p.direction === 'right' ? 12 : 0;
      const sy = p.direction === 'up' ? y - 10 : y + 2;
      const time = performance.now() / 1000;

      // Outer Holy Glow
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 16;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + shieldOffset, sy, 16, 0, Math.PI * 2);
      ctx.stroke();

      // Translucent Golden Barrier
      const gradient = ctx.createRadialGradient(x + shieldOffset, sy, 2, x + shieldOffset, sy, 16);
      gradient.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
      gradient.addColorStop(0.7, 'rgba(245, 158, 11, 0.35)');
      gradient.addColorStop(1, 'rgba(217, 119, 6, 0.1)');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Rotating Solar Cross / Star Runes
      ctx.save();
      ctx.translate(x + shieldOffset, sy);
      ctx.rotate(time * 3);
      ctx.fillStyle = '#fffbeb';
      ctx.fillRect(-1, -9, 2, 18);
      ctx.fillRect(-9, -1, 18, 2);
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    } else if (p.isDefending || p.state === 'Defend') {
      // Shimmering Guardian Bastion Shield with Hexagonal Crystalline Glow
      ctx.save();
      const shieldOffset = p.direction === 'left' ? -11 : p.direction === 'right' ? 11 : 0;
      const sy = p.direction === 'up' ? y - 8 : y + 2;
      const time = performance.now() / 1000;
      const pulse = Math.sin(time * 6) * 0.15 + 0.85;

      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 14;

      // Outer Barrier Border
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.9 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x + shieldOffset - 9, sy - 14, 18, 28, 4);
      ctx.stroke();

      // Gradient Fill
      const bGrad = ctx.createLinearGradient(x + shieldOffset, sy - 14, x + shieldOffset, sy + 14);
      bGrad.addColorStop(0, 'rgba(186, 230, 253, 0.45)');
      bGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.3)');
      bGrad.addColorStop(1, 'rgba(2, 132, 199, 0.15)');
      ctx.fillStyle = bGrad;
      ctx.fill();

      // Hex Facet Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + shieldOffset, sy - 10);
      ctx.lineTo(x + shieldOffset - 5, sy);
      ctx.lineTo(x + shieldOffset, sy + 10);
      ctx.lineTo(x + shieldOffset + 5, sy);
      ctx.closePath();
      ctx.stroke();

      ctx.restore();
    }

    // 6. Equipped Weapon Rendering
    const weaponId = this.equipment.weapon?.id || 'silver_rapier';
    if (p.state === 'Attack') {
      const atkPhase = p.attackTimer / p.attackCooldown; // 1.0 to 0.0

      ctx.save();
      ctx.translate(x, y);

      let wColor = '#f8fafc'; // Silver
      let gColor = '#94a3b8'; // Guard
      let glowColor = '#38bdf8';
      let reach = 22;
      let width = 2.5;

      // SPECIFIC WEAPON CONFIGS
      if (weaponId.includes('scythe')) {
        wColor = '#450a0a'; gColor = '#b91c1c'; glowColor = '#ef4444'; reach = 28; width = 4;
      } else if (weaponId.includes('broadsword')) {
        wColor = '#fef08a'; gColor = '#d97706'; glowColor = '#fbbf24'; reach = 29; width = 5.5;
      } else if (weaponId.includes('fang')) {
        wColor = '#064e3b'; gColor = '#10b981'; glowColor = '#34d399'; reach = 19; width = 2;
      } else if (weaponId.includes('scepter')) {
        wColor = '#1e1b4b'; gColor = '#6366f1'; glowColor = '#818cf8'; reach = 24; width = 4;
      } else if (weaponId.includes('reaver')) {
        wColor = '#09090b'; gColor = '#6b21a8'; glowColor = '#c084fc'; reach = 32; width = 5;
      } else if (weaponId.includes('rose')) {
        wColor = '#7f1d1d'; gColor = '#be123c'; glowColor = '#fb7185'; reach = 21; width = 2.5;
      } else if (weaponId.includes('blade')) {
        wColor = '#450a0a'; gColor = '#ea580c'; glowColor = '#f97316'; reach = 25; width = 4;
      } else if (weaponId.includes('mourne')) {
        wColor = '#0c4a6e'; gColor = '#0ea5e9'; glowColor = '#7dd3fc'; reach = 26; width = 4.5;
      }

      // 1. MULTI-LAYER LUMINOUS SWING ARC VFX
      ctx.save();
      const arcSize = Math.PI * 0.75;
      let startAngle = 0;
      if (p.direction === 'right') startAngle = -arcSize / 2;
      else if (p.direction === 'left') startAngle = Math.PI - arcSize / 2;
      else if (p.direction === 'down') startAngle = Math.PI / 2 - arcSize / 2;
      else if (p.direction === 'up') startAngle = -Math.PI / 2 - arcSize / 2;

      // Outer glow bloom
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = width + 5;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 18;
      ctx.shadowColor = glowColor;
      ctx.globalAlpha = Math.sin(atkPhase * Math.PI) * 0.85;
      ctx.beginPath();
      ctx.arc(0, 0, reach + 2, startAngle, startAngle + arcSize);
      ctx.stroke();

      // Sharp inner bright core streak
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffffff';
      ctx.globalAlpha = Math.sin(atkPhase * Math.PI) * 0.95;
      ctx.beginPath();
      ctx.arc(0, 0, reach + 1, startAngle, startAngle + arcSize);
      ctx.stroke();
      ctx.restore();

      // 2. WEAPON SPRITE RENDERING
      const swingAngle = (1 - atkPhase) * Math.PI - Math.PI / 2;
      let rot = 0;
      if (p.direction === 'right') rot = swingAngle;
      else if (p.direction === 'left') rot = -swingAngle + Math.PI;
      else if (p.direction === 'down') rot = swingAngle + Math.PI / 2;
      else if (p.direction === 'up') rot = swingAngle - Math.PI / 2;

      ctx.rotate(rot);

      // Guard
      ctx.fillStyle = gColor;
      ctx.fillRect(0, -width * 1.4, width * 0.8, width * 2.8);
      
      // Blade
      ctx.fillStyle = wColor;
      ctx.beginPath();
      ctx.moveTo(0, -width / 2);
      ctx.lineTo(reach, 0);
      ctx.lineTo(0, width / 2);
      ctx.closePath();
      ctx.fill();

      // Edge Shine
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Blade Tip Flare
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(reach, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else {
      // Idle Sheathed or Held Position
      ctx.save();
      ctx.translate(x, y);
      const idleOffset = p.direction === 'right' ? 8 : -8;
      ctx.rotate(p.direction === 'right' ? 0.4 : -0.4);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'; // Sheath
      ctx.fillRect(idleOffset - 2, 0, 4, 18);
      ctx.restore();
    }
    ctx.restore();
  }

  private renderGothicNPC(ctx: CanvasRenderingContext2D, npc: NPC) {
    ctx.save();
    const x = npc.x;
    const y = npc.y;
    const time = performance.now() / 1000;
    const bob = Math.sin(time * 3 + (npc.x % 10)) * 1.5;
    const distToPlayer = Math.hypot(this.player.x - npc.x, this.player.y - npc.y);
    const isNearby = distToPlayer <= 38;

    // Soft entity ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x, y + 9, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (npc.sprite === 'carmilla') {
      // Lady Carmilla: Crimson rose aura, Victorian gown, black velvet hair, ruby eyes
      // Ethereal red mist
      ctx.fillStyle = 'rgba(225, 29, 72, 0.15)';
      ctx.beginPath();
      ctx.arc(x, y - 6 + bob, 18, 0, Math.PI * 2);
      ctx.fill();

      // Long flowing black hair behind
      ctx.fillStyle = '#09050e';
      ctx.fillRect(x - 8, y - 16 + bob, 16, 20);
      ctx.fillRect(x - 9, y - 4 + bob, 18, 10);

      // Gothic gown: Crimson dress with black corset & lace trim
      ctx.fillStyle = '#be123c';
      ctx.beginPath();
      ctx.moveTo(x - 7, y + 8);
      ctx.lineTo(x - 4, y - 4 + bob);
      ctx.lineTo(x + 4, y - 4 + bob);
      ctx.lineTo(x + 7, y + 8);
      ctx.closePath();
      ctx.fill();

      // Black Corset bodice
      ctx.fillStyle = '#0f071a';
      ctx.fillRect(x - 4, y - 4 + bob, 8, 7);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(x - 2, y - 3 + bob, 4, 1);
      ctx.fillRect(x - 2, y - 1 + bob, 4, 1);

      // Pale Porcelain Vampire Face
      ctx.fillStyle = '#fff1eb';
      ctx.fillRect(x - 4, y - 15 + bob, 8, 8);

      // Ruby Vampire Eyes
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(x - 3, y - 12 + bob, 2, 2);
      ctx.fillRect(x + 1, y - 12 + bob, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 2, y - 13 + bob, 1, 1);
      ctx.fillRect(x + 2, y - 13 + bob, 1, 1);

      // Front hair framing & bangs
      ctx.fillStyle = '#180a22';
      ctx.fillRect(x - 5, y - 17 + bob, 10, 3);
      ctx.fillRect(x - 5, y - 14 + bob, 2, 6);
      ctx.fillRect(x + 3, y - 14 + bob, 2, 6);

      // Crimson Rose Hair Ornament
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(x + 3, y - 17 + bob, 3, 3);
      ctx.fillStyle = '#fda4af';
      ctx.fillRect(x + 4, y - 16 + bob, 1, 1);

      // Floating Blood Rose Petals
      const petalY = y - 10 + Math.sin(time * 2 + npc.x) * 6;
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(x + 9, petalY, 2, 2);
    } else if (npc.sprite === 'inquisitor') {
      // Inkuisitor Balthazar: Hunter's tricorn hat, trenchcoat, silver crucifix
      // Dark Crimson Trenchcoat
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(x - 6, y - 4 + bob, 12, 12);
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(x - 7, y + 2 + bob, 14, 6);

      // Belt & Bandolier
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x - 5, y + 1 + bob, 10, 2);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(x - 1, y + 1 + bob, 2, 2); // Buckle

      // Silver Cross Pendant
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x - 1, y - 3 + bob, 2, 5);
      ctx.fillRect(x - 2, y - 2 + bob, 4, 1);

      // Face with rugged jaw & scar
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(x - 4, y - 13 + bob, 8, 7);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(x - 2, y - 11 + bob, 1, 3); // Scar

      // Glowing Amber Hunter Eyes
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x - 3, y - 11 + bob, 2, 1);
      ctx.fillRect(x + 1, y - 11 + bob, 2, 1);

      // Wide-Brimmed Hunter's Tricorn Hat
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x - 8, y - 15 + bob, 16, 3);
      ctx.fillRect(x - 5, y - 18 + bob, 10, 4);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(x - 5, y - 15 + bob, 10, 1); // Hatband
    } else if (npc.sprite === 'blacksmith') {
      // Viktor Blacksmith: Muscular, heavy apron, brass welding goggles, glowing forge sparks
      // Heavy leather apron & pants
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x - 7, y - 4 + bob, 14, 12);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x - 5, y - 3 + bob, 10, 9);

      // Massive Warhammer on his back
      ctx.fillStyle = '#475569';
      ctx.fillRect(x + 6, y - 16 + bob, 4, 8); // Hammer head
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + 7, y - 9 + bob, 2, 14); // Handle

      // Muscular Arms & Face
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(x - 8, y - 2 + bob, 2, 7);
      ctx.fillRect(x + 6, y - 2 + bob, 2, 7);
      ctx.fillRect(x - 5, y - 14 + bob, 10, 8);

      // Soot Smudge & Stubble
      ctx.fillStyle = '#292524';
      ctx.fillRect(x - 3, y - 8 + bob, 6, 2);

      // Brass Welding Goggles on Forehead
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x - 5, y - 15 + bob, 10, 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x - 4, y - 15 + bob, 3, 2);
      ctx.fillRect(x + 1, y - 15 + bob, 3, 2);

      // Brown hair
      ctx.fillStyle = '#292524';
      ctx.fillRect(x - 5, y - 17 + bob, 10, 3);

      // Forge Sparks
      const sparkY = y - 8 + Math.sin(time * 4 + npc.x) * 5;
      ctx.fillStyle = '#f97316';
      ctx.fillRect(x - 9, sparkY, 2, 2);
    } else if (npc.sprite === 'nun') {
      // Sister Genevieve: White and indigo habit, silk blindfold, holy aura, silver rosary
      // Divine soft glow
      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.beginPath();
      ctx.arc(x, y - 5 + bob, 18, 0, Math.PI * 2);
      ctx.fill();

      // Indigo Habit Dress with White Scapular
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(x - 7, y - 4 + bob, 14, 12);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x - 3, y - 4 + bob, 6, 12);

      // White Nun Cowl & Veil
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(x - 6, y - 17 + bob, 12, 14);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x - 7, y - 18 + bob, 14, 4);

      // Pure face
      ctx.fillStyle = '#fff1eb';
      ctx.fillRect(x - 4, y - 13 + bob, 8, 7);

      // White Blindfold with glowing azure holy symbol
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x - 4, y - 12 + bob, 8, 3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x - 1, y - 11 + bob, 2, 1);

      // Silver Rosary Cross
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x - 1, y + 2 + bob, 2, 4);
      ctx.fillRect(x - 2, y + 3 + bob, 4, 1);
    } else if (npc.sprite === 'elena' || npc.id === 'npc_elena') {
      // Elena: Village Healer with forest green dress, white apron, herbal garland, healing leaf motes
      ctx.fillStyle = '#065f46';
      ctx.fillRect(x - 7, y - 4 + bob, 14, 12); // Forest green dress
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x - 4, y - 3 + bob, 8, 10); // White medical apron
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x - 1, y + bob, 2, 4); // Green medical cross
      ctx.fillRect(x - 2, y + 1 + bob, 4, 2);

      // Pale porcelain face & auburn twin braids
      ctx.fillStyle = '#fff1eb';
      ctx.fillRect(x - 4, y - 13 + bob, 8, 7);
      ctx.fillStyle = '#92400e'; // Auburn hair
      ctx.fillRect(x - 5, y - 16 + bob, 10, 4);
      ctx.fillRect(x - 7, y - 10 + bob, 2, 8); // Left braid
      ctx.fillRect(x + 5, y - 10 + bob, 2, 8); // Right braid

      // Emerald eyes
      ctx.fillStyle = '#059669';
      ctx.fillRect(x - 3, y - 11 + bob, 2, 2);
      ctx.fillRect(x + 1, y - 11 + bob, 2, 2);

      // Flower garland on head
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(x - 4, y - 16 + bob, 2, 2);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(x - 1, y - 17 + bob, 2, 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + 2, y - 16 + bob, 2, 2);

      // Floating healing herb particles
      const leafY = y - 8 + Math.sin(time * 3 + npc.x) * 4;
      ctx.fillStyle = '#34d399';
      ctx.fillRect(x + 8, leafY, 2, 2);
    } else if (npc.sprite === 'vladimir' || npc.id === 'npc_vladimir') {
      // Vladimir: Victorian Castle Butler, crisp black tuxedo, silver monocle, black rose
      ctx.fillStyle = '#0f172a'; // Black tuxedo jacket
      ctx.fillRect(x - 6, y - 4 + bob, 12, 12);
      ctx.fillStyle = '#f8fafc'; // White shirt & cravat
      ctx.fillRect(x - 2, y - 3 + bob, 4, 6);
      ctx.fillStyle = '#e11d48'; // Red bowtie
      ctx.fillRect(x - 2, y - 3 + bob, 4, 1.5);

      // Pale butler face & slicked silver hair
      ctx.fillStyle = '#fff1eb';
      ctx.fillRect(x - 4, y - 13 + bob, 8, 7);
      ctx.fillStyle = '#94a3b8'; // Slicked silver grey hair
      ctx.fillRect(x - 5, y - 16 + bob, 10, 4);

      // Silver monocle over left eye
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeRect(x - 3.5, y - 12.5 + bob, 3, 3);
      ctx.fillStyle = '#e11d48'; // Red eye gleam
      ctx.fillRect(x - 3, y - 12 + bob, 2, 2);
      ctx.fillRect(x + 1, y - 12 + bob, 2, 2);

      // Silver serving tray on hand
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x + 5, y - 3 + bob, 6, 2);
      ctx.fillStyle = '#be123c'; // Crimson wine chalice
      ctx.fillRect(x + 7, y - 7 + bob, 2, 4);
    } else if (npc.sprite === 'noel' || npc.id === 'npc_noel') {
      // Noel: Young Squire Gate Guard with silver armor, sky-blue scarf, iron halberd
      ctx.fillStyle = '#475569'; // Silver breastplate
      ctx.fillRect(x - 6, y - 4 + bob, 12, 12);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x - 4, y - 3 + bob, 8, 8);

      // Sky-blue squire scarf
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(x - 5, y - 4 + bob, 10, 3);
      ctx.fillRect(x + 2, y - 2 + bob, 3, 6);

      // Youthful face & golden hair
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(x - 4, y - 13 + bob, 8, 7);
      ctx.fillStyle = '#fde047'; // Blonde hair
      ctx.fillRect(x - 5, y - 16 + bob, 10, 4);
      ctx.fillStyle = '#0369a1'; // Blue eyes
      ctx.fillRect(x - 3, y - 11 + bob, 2, 2);
      ctx.fillRect(x + 1, y - 11 + bob, 2, 2);

      // Halberd / Guard Spear
      ctx.fillStyle = '#78350f'; // Shaft
      ctx.fillRect(x - 7, y - 18 + bob, 2, 26);
      ctx.fillStyle = '#cbd5e1'; // Blade
      ctx.fillRect(x - 10, y - 18 + bob, 5, 5);
      ctx.fillRect(x - 8, y - 22 + bob, 3, 5);
    } else if (npc.sprite === 'astrologer' || npc.sprite === 'celestine' || npc.id === 'npc_celestine') {
      // Celestine: Celestial star robes, crescent diadem, floating star orb
      // Astral Violet Robes with Gold Stars
      ctx.fillStyle = '#312e81';
      ctx.fillRect(x - 7, y - 4 + bob, 14, 12);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x - 1, y - 1 + bob, 2, 2);
      ctx.fillRect(x + 3, y + 4 + bob, 1, 1);

      // Midnight-blue starry hair
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(x - 6, y - 16 + bob, 12, 14);

      // Face
      ctx.fillStyle = '#fff1eb';
      ctx.fillRect(x - 4, y - 13 + bob, 8, 7);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(x - 3, y - 11 + bob, 2, 2);
      ctx.fillRect(x + 1, y - 11 + bob, 2, 2);

      // Golden Moon Diadem
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x - 4, y - 15 + bob, 8, 2);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(x - 1, y - 16 + bob, 2, 2);

      // Floating Astrological Star Orb
      const orbY = y - 6 + Math.sin(time * 3) * 4;
      const orbX = x + 10 + Math.cos(time * 3) * 3;
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(orbX, orbY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(orbX - 1, orbY - 1, 2, 2);
    } else if (npc.sprite === 'crow_queen' || npc.sprite === 'morrigan' || npc.id === 'npc_morrigan') {
      // Morrigan: Raven feather mantle, sharp purple silhouette, crow hairpin
      ctx.fillStyle = '#0f071a';
      ctx.fillRect(x - 7, y - 4 + bob, 14, 12);
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(x - 6, y - 5 + bob, 12, 4); // Feather collar

      // Jet-black hair
      ctx.fillStyle = '#180828';
      ctx.fillRect(x - 6, y - 16 + bob, 12, 14);

      // Face & Amethyst eyes
      ctx.fillStyle = '#fff1eb';
      ctx.fillRect(x - 4, y - 13 + bob, 8, 7);
      ctx.fillStyle = '#9333ea';
      ctx.fillRect(x - 3, y - 11 + bob, 2, 2);
      ctx.fillRect(x + 1, y - 11 + bob, 2, 2);

      // Silver raven skull hair accessory
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x + 3, y - 16 + bob, 3, 2);

      // Floating shadow feather
      const fX = x - 9 + Math.sin(time * 2) * 3;
      const fY = y - 4 + Math.cos(time * 2) * 4;
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(fX, fY, 2, 3);
    } else if (npc.sprite === 'bard' || npc.sprite === 'aria' || npc.id === 'npc_bard') {
      // Aria the Bard: Velvet poet cape, lilac twin hair, violin
      ctx.fillStyle = '#881337';
      ctx.fillRect(x - 6, y - 4 + bob, 12, 12);

      // Rosewood Violin on waist/back
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + 5, y - 6 + bob, 4, 8);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(x + 6, y - 10 + bob, 2, 5);

      // Lilac twin hair
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(x - 7, y - 16 + bob, 14, 14);
      ctx.fillRect(x - 8, y - 8 + bob, 2, 8);
      ctx.fillRect(x + 6, y - 8 + bob, 2, 8);

      // Face
      ctx.fillStyle = '#fff1eb';
      ctx.fillRect(x - 4, y - 13 + bob, 8, 7);
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(x - 3, y - 11 + bob, 2, 2);
      ctx.fillRect(x + 1, y - 11 + bob, 2, 2);
    } else if (npc.sprite === 'ghost_knight') {
      // Ghost Knight Godfrey: Spectral teal armor
      ctx.fillStyle = 'rgba(45, 212, 191, 0.75)';
      ctx.fillRect(x - 7, y - 4 + bob, 14, 12);
      ctx.fillStyle = '#14b8a6';
      ctx.fillRect(x - 5, y - 16 + bob, 10, 10);
      ctx.fillStyle = '#5eead4';
      ctx.fillRect(x - 3, y - 13 + bob, 6, 2);
    } else if (npc.sprite === 'eldrin') {
      // Eldrin: Emerald scholar robes, monocle, white beard
      ctx.fillStyle = '#065f46';
      ctx.fillRect(x - 6, y - 4 + bob, 12, 12);
      ctx.fillStyle = '#047857';
      ctx.fillRect(x - 4, y - 2 + bob, 8, 10);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(x - 4, y - 13 + bob, 8, 7); // Face
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(x - 5, y - 8 + bob, 10, 5); // White beard
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + 1, y - 11 + bob, 3, 3); // Monocle
    } else if (npc.sprite === 'seraphina') {
      // Seraphina: Golden angel armor, blonde hair, halo
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x - 6, y - 4 + bob, 12, 12);
      ctx.fillStyle = '#fcd34d';
      ctx.fillRect(x - 5, y - 4 + bob, 10, 10); // Gold armor
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(x - 4, y - 13 + bob, 8, 7); // Face
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x - 5, y - 16 + bob, 10, 4); // Blonde hair
      ctx.fillRect(x - 6, y - 12 + bob, 2, 8); // Hair sides
      ctx.fillStyle = 'rgba(253, 224, 71, 0.6)';
      ctx.beginPath();
      ctx.arc(x, y - 18 + bob, 6, 0, Math.PI * 2); // Halo
      ctx.stroke();
    } else if (npc.sprite === 'valerius') {
      // Valerius: Royal blue cape, silver crown, noble
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(x - 7, y - 4 + bob, 14, 12); // Blue cape
      ctx.fillStyle = '#475569';
      ctx.fillRect(x - 4, y - 2 + bob, 8, 10); // Inner armor
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(x - 4, y - 13 + bob, 8, 7); // Face
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x - 4, y - 16 + bob, 8, 3); // Crown
      ctx.fillStyle = '#f87171';
      ctx.fillRect(x - 1, y - 15 + bob, 2, 2); // Ruby on crown
    } else if (npc.sprite === 'roderick') {
      // Roderick: Brown leather jacket, eyepatch, grey hair
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x - 6, y - 4 + bob, 12, 12);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x - 4, y - 2 + bob, 8, 10);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(x - 4, y - 13 + bob, 8, 7); // Face
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x - 5, y - 15 + bob, 10, 3); // Grey hair
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x + 1, y - 12 + bob, 3, 3); // Eyepatch
    } else if (npc.sprite === 'dungeon_master' || npc.id === 'dungeon_master') {
      // Grandmaster Vane: White Knight armor, golden mantle, winged crown, holy claymore
      ctx.fillStyle = '#f8fafc'; // White cape
      ctx.fillRect(x - 8, y - 6 + bob, 16, 16);
      ctx.fillStyle = '#eab308'; // Gold trim
      ctx.fillRect(x - 8, y + 8 + bob, 16, 2);

      // Polished white cuirass with gold cross
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 5, y - 3 + bob, 10, 11);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x - 1, y - 2 + bob, 2, 7);
      ctx.fillRect(x - 3, y + bob, 6, 2);

      // Head & White hair
      ctx.fillStyle = '#fff1eb';
      ctx.fillRect(x - 4, y - 13 + bob, 8, 7);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(x - 5, y - 16 + bob, 10, 4);

      // Golden Winged Helm Crown
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x - 6, y - 17 + bob, 12, 2);
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 17 + bob);
      ctx.lineTo(x - 8, y - 23 + bob);
      ctx.lineTo(x - 4, y - 17 + bob);
      ctx.moveTo(x + 6, y - 17 + bob);
      ctx.lineTo(x + 8, y - 23 + bob);
      ctx.lineTo(x + 4, y - 17 + bob);
      ctx.fill();

      // Golden Greatsword planted on ground
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x + 7, y - 18 + bob, 3, 26);
      ctx.fillRect(x + 4, y - 12 + bob, 9, 2);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x + 8, y - 10 + bob, 1, 16);
    } else if (npc.sprite === 'lilith') {
      // Lilith: Dark red gothic corset, black twin tails
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(x - 5, y - 4 + bob, 10, 12);
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(x - 4, y - 2 + bob, 8, 5); // Corset
      ctx.fillStyle = '#fff1eb';
      ctx.fillRect(x - 4, y - 13 + bob, 8, 7); // Pale Face
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x - 5, y - 16 + bob, 10, 4); // Black hair
      ctx.fillRect(x - 8, y - 12 + bob, 3, 10); // Twin tails left
      ctx.fillRect(x + 5, y - 12 + bob, 3, 10); // Twin tails right
    } else {
      // Gravekeeper / Villager
      ctx.fillStyle = '#27272a';
      ctx.fillRect(x - 6, y - 4 + bob, 12, 12);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(x - 4, y - 14 + bob, 8, 8);
      ctx.fillStyle = '#475569';
      ctx.fillRect(x - 5, y - 16 + bob, 10, 3);
      // Iron shovel
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x + 6, y - 12 + bob, 2, 18);
      ctx.fillRect(x + 4, y + 4 + bob, 6, 5);
    }

    // Quest indicator
    if (npc.hasQuest && !npc.questCompleted) {
      const qPulse = Math.sin(time * 5) * 2;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x, y - 24 + bob + qPulse, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('!', x - 2.5, y - 21 + bob + qPulse);
    }

    // HIGH-POLISH INTERACTIVE PROMPT BADGE
    if (isNearby) {
      // Glowing interactive badge when player is within range
      const badgeW = 68;
      const badgeH = 15;
      const badgeX = x - badgeW / 2;
      const badgeY = y - 32 + bob;

      // Glow behind badge
      ctx.fillStyle = 'rgba(225, 29, 72, 0.35)';
      ctx.fillRect(badgeX - 2, badgeY - 2, badgeW + 4, badgeH + 4);

      // Badge Container
      ctx.fillStyle = 'rgba(15, 7, 23, 0.92)';
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1;
      ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

      // Golden [E] Key Tag
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(badgeX + 3, badgeY + 2, 15, 11);
      ctx.fillStyle = '#0f071a';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('[E]', badgeX + 4, badgeY + 10);

      // "Bicara" text
      ctx.fillStyle = '#fecdd3';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('Bicara', badgeX + 22, badgeY + 10);
    } else {
      // Normal Name & Role Label
      ctx.font = 'bold 7px monospace';
      ctx.fillStyle = '#f1f5f9';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      const text = npc.name;
      ctx.fillText(text, x - (text.length * 3.8) / 2, y + 18);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  private renderGothicEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    ctx.save();
    const x = enemy.x;
    const y = enemy.y;
    const isHurt = enemy.hurtTimer > 0;

    if (enemy.type === 'skeleton') {
      // Skeleton Warrior with jagged bone blade
      ctx.fillStyle = isHurt ? '#ef4444' : '#e2e8f0'; // Bone white
      // Ribcage
      ctx.fillRect(x - 5, y - 5, 10, 10);
      ctx.fillStyle = '#09090b';
      ctx.fillRect(x - 3, y - 3, 6, 1);
      ctx.fillRect(x - 3, y - 1, 6, 1);

      // Skull
      ctx.fillStyle = isHurt ? '#ef4444' : '#f8fafc';
      ctx.fillRect(x - 5, y - 15, 10, 9);

      // Glowing Red Sockets
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x - 3, y - 11, 2, 2);
      ctx.fillRect(x + 1, y - 11, 2, 2);

      // Jagged bone sword
      ctx.fillStyle = '#d1d5db';
      ctx.fillRect(x + 6, y - 10, 3, 14);
    } else if (enemy.type === 'ghoul') {
      // Blood Ghoul with jagged red claws
      ctx.fillStyle = isHurt ? '#ffffff' : '#7f1d1d';
      ctx.fillRect(x - 6, y - 5, 12, 12);
      ctx.fillStyle = isHurt ? '#ffffff' : '#450a0a';
      ctx.fillRect(x - 5, y - 15, 10, 9);

      // Red feral eyes
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x - 3, y - 11, 2, 2);
      ctx.fillRect(x + 1, y - 11, 2, 2);

      // Sharp Claws
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x - 8, y - 2, 3, 6);
      ctx.fillRect(x + 6, y - 2, 3, 6);
    } else if (enemy.type === 'lich_boss') {
      // Lord Malakar the Lich King (Boss)
      ctx.fillStyle = isHurt ? '#ffffff' : '#312e81'; // Royal dark purple shroud
      ctx.fillRect(x - 8, y - 7, 16, 18);

      // Floating Horned Lich Skull
      ctx.fillStyle = isHurt ? '#ffffff' : '#e0e7ff';
      ctx.fillRect(x - 6, y - 20, 12, 12);

      // Horned Crown
      ctx.fillStyle = '#d97706';
      ctx.fillRect(x - 7, y - 24, 14, 4);
      ctx.fillRect(x - 6, y - 28, 3, 5);
      ctx.fillRect(x + 3, y - 28, 3, 5);

      // Burning occult eyes
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(x - 4, y - 16, 3, 3);
      ctx.fillRect(x + 1, y - 16, 3, 3);

      // Staff of the Blood Chalice
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + 9, y - 22, 3, 32);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x + 10, y - 24, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (enemy.type === 'vampire_bat') {
      // Vampire Bat with flapping wings
      const flap = Math.sin(Date.now() * 0.018) * 5;
      ctx.fillStyle = isHurt ? '#ffffff' : '#09090b';
      ctx.fillRect(x - 3, y - 5, 6, 8);

      // Wings
      ctx.fillStyle = isHurt ? '#ef4444' : '#1c1917';
      ctx.beginPath();
      ctx.moveTo(x - 3, y - 2);
      ctx.lineTo(x - 12, y - 6 + flap);
      ctx.lineTo(x - 9, y + 4 + flap);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x + 3, y - 2);
      ctx.lineTo(x + 12, y - 6 + flap);
      ctx.lineTo(x + 9, y + 4 + flap);
      ctx.closePath();
      ctx.fill();

      // Glowing crimson eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x - 2, y - 3, 1.5, 1.5);
      ctx.fillRect(x + 1, y - 3, 1.5, 1.5);
    }

    // Health bar
    const barW = 20;
    const barH = 2.5;
    const pct = Math.max(0, enemy.hp / enemy.maxHp);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(x - barW / 2, y - 20, barW, barH);
    ctx.fillStyle = enemy.type === 'lich_boss' ? '#ec4899' : '#dc2626';
    ctx.fillRect(x - barW / 2, y - 20, barW * pct, barH);
    ctx.restore();
  }

  private renderMist(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const mist of this.mistParticles) {
      const grad = ctx.createRadialGradient(mist.x, mist.y, 0, mist.x, mist.y, mist.radius);
      grad.addColorStop(0, `rgba(148, 163, 184, ${mist.alpha})`);
      grad.addColorStop(1, 'rgba(148, 163, 184, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mist.x, mist.y, mist.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderDynamicLighting(ctx: CanvasRenderingContext2D) {
    // Gothic Dynamic 2D Lighting pass
    const offscreen = document.createElement('canvas');
    offscreen.width = this.VIEWPORT_WIDTH;
    offscreen.height = this.VIEWPORT_HEIGHT;
    const octx = offscreen.getContext('2d');
    if (!octx) return;

    // Fill screen with deep gothic nocturnal darkness
    const darkAlpha = this.isBloodMoon ? 0.72 : 0.85;
    octx.fillStyle = this.isBloodMoon
      ? `rgba(20, 8, 15, ${darkAlpha})`
      : `rgba(6, 8, 14, ${darkAlpha})`;
    octx.fillRect(0, 0, this.VIEWPORT_WIDTH, this.VIEWPORT_HEIGHT);

    // Carve light cutouts using destination-out
    octx.globalCompositeOperation = 'destination-out';

    // 1. Player Lantern / Torch light
    const playerScreenX = this.player.x - this.cameraX;
    const playerScreenY = this.player.y - this.cameraY;
    const pGrad = octx.createRadialGradient(
      playerScreenX,
      playerScreenY,
      10,
      playerScreenX,
      playerScreenY,
      85
    );
    pGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    pGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.6)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    octx.fillStyle = pGrad;
    octx.beginPath();
    octx.arc(playerScreenX, playerScreenY, 85, 0, Math.PI * 2);
    octx.fill();

    // 2. Gothic Lanterns & Cathedral Altars
    for (const obj of this.objects) {
      if (obj.lightRadius) {
        const objScreenX = obj.x - this.cameraX;
        const objScreenY = obj.y - this.cameraY;
        if (
          objScreenX > -100 &&
          objScreenX < this.VIEWPORT_WIDTH + 100 &&
          objScreenY > -100 &&
          objScreenY < this.VIEWPORT_HEIGHT + 100
        ) {
          const lGrad = octx.createRadialGradient(
            objScreenX,
            objScreenY,
            8,
            objScreenX,
            objScreenY,
            obj.lightRadius
          );
          lGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
          lGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)');
          lGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          octx.fillStyle = lGrad;
          octx.beginPath();
          octx.arc(objScreenX, objScreenY, obj.lightRadius, 0, Math.PI * 2);
          octx.fill();
        }
      }
    }

    ctx.drawImage(offscreen, 0, 0);
  }

  private renderRain(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const drop of this.raindrops) {
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + 2, drop.y + drop.len);
    }
    ctx.stroke();
  }

  private renderCollisionOverlays(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y + 4, this.player.collisionRadius, 0, Math.PI * 2);
    ctx.stroke();

    for (const obj of this.objects) {
      if (!obj.solid) continue;
      const boxW = obj.width * 0.75;
      const boxH = obj.height * 0.38;
      const boxX = obj.x - boxW / 2;
      const boxY = obj.y + (obj.ySortOffset || 0) - boxH;
      ctx.strokeRect(boxX, boxY, boxW, boxH);
    }
  }

  private renderPlayerAttackHitbox(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.lineWidth = 1;
    const attackOffsetDist = 20;
    let hitX = this.player.x;
    let hitY = this.player.y;
    const hitRadius = 22;

    if (this.player.direction === 'down') hitY += attackOffsetDist;
    else if (this.player.direction === 'up') hitY -= attackOffsetDist;
    else if (this.player.direction === 'left') hitX -= attackOffsetDist;
    else if (this.player.direction === 'right') hitX += attackOffsetDist;

    ctx.beginPath();
    ctx.arc(hitX, hitY, hitRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  private renderDetectionZones(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
    ctx.lineWidth = 1;
    for (const enemy of this.enemies) {
      if (enemy.state === 'DEAD') continue;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.detectionRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private renderChunkBoundaries(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (const chunk of this.chunks) {
      ctx.strokeRect(chunk.pixelX, chunk.pixelY, chunk.width, chunk.height);
      ctx.fillStyle = chunk.active ? '#c084fc' : '#64748b';
      ctx.font = '8px monospace';
      ctx.fillText(
        `[Chunk ${chunk.x},${chunk.y}] ${chunk.name}`,
        chunk.pixelX + 8,
        chunk.pixelY + 14
      );
    }
    ctx.setLineDash([]);
  }

  private renderDungeonArena(ctx: CanvasRenderingContext2D) {
    const tier = this.dungeonTier;
    // 1. Fill arena background
    ctx.fillStyle = tier.bgColor;
    ctx.fillRect(0, 0, 640, 360);

    // 2. Floor stone tiles
    ctx.fillStyle = tier.floorColor;
    for (let x = 32; x < 608; x += 32) {
      for (let y = 32; y < 328; y += 32) {
        ctx.fillRect(x + 1, y + 1, 30, 30);
      }
    }
    // Floor grid lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 32; x <= 608; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 32);
      ctx.lineTo(x, 328);
      ctx.stroke();
    }
    for (let y = 32; y <= 328; y += 32) {
      ctx.beginPath();
      ctx.moveTo(32, y);
      ctx.lineTo(608, y);
      ctx.stroke();
    }

    // 3. Thick Stone Boundary Walls
    ctx.fillStyle = tier.wallColor;
    ctx.fillRect(0, 0, 640, 32); // top
    ctx.fillRect(0, 328, 640, 32); // bottom
    ctx.fillRect(0, 0, 32, 360); // left
    ctx.fillRect(608, 0, 32, 360); // right

    // Wall Torches
    ctx.fillStyle = tier.torchColor;
    [96, 192, 288, 384, 480, 576].forEach((tx) => {
      ctx.beginPath();
      ctx.arc(tx, 26, 4 + Math.sin(Date.now() / 150 + tx) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tx, 334, 4 + Math.sin(Date.now() / 150 + tx) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Central Runestone Circle
    ctx.strokeStyle = tier.torchColor + '66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(320, 180, 55, 0, Math.PI * 2);
    ctx.stroke();

    // 5. Portal to Next Floor (when cleared)
    if (this.dungeonPortalActive) {
      const px = this.dungeonPortalX;
      const py = this.dungeonPortalY;
      const time = performance.now() / 350;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(time);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, 20 + Math.sin(time * 2) * 3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.strokeRect(-12, -12, 24, 24);
      ctx.restore();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[E] MENUJU LANTAI BERIKUTNYA', px, py + 32);
    }
  }

  private renderCombatVFX(ctx: CanvasRenderingContext2D) {
    const time = performance.now() / 1000;

    // 1. Dash Ghost Shadows
    for (const ghost of this.dashGhosts) {
      ctx.save();
      ctx.globalAlpha = ghost.alpha * 0.45;
      ctx.fillStyle = ghost.color;
      ctx.shadowColor = '#93c5fd';
      ctx.shadowBlur = 10;
      // Silhouette representation
      ctx.beginPath();
      ctx.ellipse(ghost.x, ghost.y - 2, 8, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Combat Particles (Sparks, Stars, Rings, Runes, Streaks)
    for (const cp of this.combatParticles) {
      ctx.save();
      ctx.globalAlpha = cp.alpha;
      ctx.shadowColor = cp.glowColor;
      ctx.shadowBlur = 12;

      if (cp.shape === 'spark') {
        ctx.fillStyle = cp.color;
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, cp.size / 2, 0, Math.PI * 2);
        ctx.fill();
        // Inner white shine
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, cp.size / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (cp.shape === 'star') {
        ctx.save();
        ctx.translate(cp.x, cp.y);
        ctx.rotate(cp.rotation);
        ctx.fillStyle = cp.color;
        const s = cp.size * 1.5;
        // 4-point stellar flare
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(0, 0, s, 0);
        ctx.quadraticCurveTo(0, 0, 0, s);
        ctx.quadraticCurveTo(0, 0, -s, 0);
        ctx.quadraticCurveTo(0, 0, 0, -s);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, cp.size / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (cp.shape === 'ring') {
        const progress = cp.life / cp.maxLife;
        const currentRad = cp.size * (0.3 + progress * 0.7);
        ctx.strokeStyle = cp.color;
        ctx.lineWidth = Math.max(1, (1 - progress) * 2.5);
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, currentRad, 0, Math.PI * 2);
        ctx.stroke();
      } else if (cp.shape === 'rune') {
        ctx.fillStyle = cp.color;
        ctx.font = `bold ${Math.round(cp.size)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cp.glyph || '✧', cp.x, cp.y);
      } else if (cp.shape === 'slash_mote') {
        ctx.save();
        ctx.translate(cp.x, cp.y);
        ctx.rotate(cp.rotation);
        ctx.fillStyle = cp.color;
        ctx.fillRect(-cp.size * 1.5, -1, cp.size * 3, 2);
        ctx.restore();
      }
      ctx.restore();
    }

    // 3. Perfect Parry Divine Shockwave
    if (this.parrySuccessFlash > 0) {
      ctx.save();
      const progress = (0.4 - this.parrySuccessFlash) / 0.4;
      const rad = 12 + progress * 68;
      const alpha = (this.parrySuccessFlash / 0.4);

      // Primary Outer Solar Ring
      ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(this.parryVfxPos.x, this.parryVfxPos.y, rad, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Fast Wave
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.parryVfxPos.x, this.parryVfxPos.y, rad * 0.65, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating Sacred Runes on Perimeter
      ctx.save();
      ctx.translate(this.parryVfxPos.x, this.parryVfxPos.y);
      ctx.rotate(time * 4);
      ctx.fillStyle = `rgba(254, 240, 138, ${alpha})`;
      ctx.font = 'bold 9px serif';
      ctx.textAlign = 'center';
      for (let a = 0; a < 6; a++) {
        const angle = (a * Math.PI) / 3;
        const rx = Math.cos(angle) * rad;
        const ry = Math.sin(angle) * rad;
        ctx.fillText('☼', rx, ry + 3);
      }
      ctx.restore();

      ctx.restore();
    }

    // 4. Weapon Skill: Radiant Holy Arc (Bilah Cahaya Fajar)
    if (this.holySlashVfx.active) {
      ctx.save();
      ctx.translate(this.holySlashVfx.x, this.holySlashVfx.y);

      const animPhase = this.holySlashVfx.timer / 0.45; // 1.0 to 0.0
      const radius = 58;
      const spinAngle = (1 - animPhase) * Math.PI * 2;

      // 1. Holy Ground Consecrated Seal
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 22;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Translucent Solar Field
      const discGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, radius);
      discGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      discGrad.addColorStop(0.4, 'rgba(254, 240, 138, 0.4)');
      discGrad.addColorStop(0.8, 'rgba(245, 158, 11, 0.2)');
      discGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Spinning Radiant Sunburst Blades
      ctx.save();
      ctx.rotate(spinAngle);
      ctx.strokeStyle = '#fffbeb';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rayAngle = (i * Math.PI) / 4;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(rayAngle) * (radius - 2), Math.sin(rayAngle) * (radius - 2));
      }
      ctx.stroke();

      // Solar Crest Runes
      ctx.fillStyle = '#fffbeb';
      ctx.font = 'bold 10px serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < 4; i++) {
        const rAngle = (i * Math.PI) / 2;
        const rx = Math.cos(rAngle) * (radius * 0.65);
        const ry = Math.sin(rAngle) * (radius * 0.65);
        ctx.fillText('☩', rx, ry + 3);
      }
      ctx.restore();

      // Outer Shock Arc
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // 5. Dungeon Skill: Judgment Smite Pillar (Penghakiman Suci)
    if (this.smitePillarVfx.active) {
      ctx.save();
      const sx = this.smitePillarVfx.x;
      const sy = this.smitePillarVfx.y;
      const animPhase = this.smitePillarVfx.timer / 0.6; // 1.0 to 0.0

      // 1. Ground Consecrated Sacred Halo
      ctx.save();
      ctx.translate(sx, sy);
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 24;

      // Concentric Pulsing Light Rings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.stroke();

      // Celestial Hexagram / Runes
      ctx.rotate(time * 2);
      ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
      ctx.font = 'bold 9px serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < 6; i++) {
        const hAngle = (i * Math.PI) / 3;
        const hx = Math.cos(hAngle) * 40;
        const hy = Math.sin(hAngle) * 40;
        ctx.fillText('𐌈', hx, hy + 3);
      }
      ctx.restore();

      // 2. Towering Celestial Sky-Beam
      const beamWidth = 36 * (0.6 + Math.sin(animPhase * Math.PI) * 0.4);
      const beamGrad = ctx.createLinearGradient(sx - beamWidth / 2, 0, sx + beamWidth / 2, 0);
      beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      beamGrad.addColorStop(0.2, 'rgba(56, 189, 248, 0.5)');
      beamGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
      beamGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.5)');
      beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = beamGrad;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 28;
      ctx.fillRect(sx - beamWidth / 2, 0, beamWidth, sy);

      // Core pure white vertical laser
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx - 3, 0, 6, sy);

      // Vertical energy streak ribbons
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.8)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const xOff = (i - 1.5) * 8;
        ctx.beginPath();
        ctx.moveTo(sx + xOff, 0);
        ctx.lineTo(sx + xOff + Math.sin(time * 8 + i) * 3, sy);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private renderFloorLoots(ctx: CanvasRenderingContext2D) {
    for (const loot of this.floorLoots) {
      const rx = Math.round(loot.x);
      const ry = Math.round(loot.y);
      const floatZ = Math.round(loot.z);

      // Soft ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(rx, ry, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Elevation Y with gentle bobbing oscillation
      const drawY = ry - floatZ - Math.abs(Math.sin(performance.now() / 200) * 2);

      // Glowing radial aura
      const grad = ctx.createRadialGradient(rx, drawY, 1, rx, drawY, 10);
      grad.addColorStop(0, loot.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(rx, drawY, 10, 0, Math.PI * 2);
      ctx.fill();

      // Icon display
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(loot.icon, rx, drawY);

      // Sparkle motes
      if (Math.random() < 0.25) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(rx + (Math.random() - 0.5) * 8, drawY + (Math.random() - 0.5) * 8, 1.5, 1.5);
      }
    }
  }

  private renderViewportHUD(ctx: CanvasRenderingContext2D) {
    if (this.inDungeon) {
      // Dungeon Top Banner HUD
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(this.VIEWPORT_WIDTH / 2 - 140, 4, 280, 24);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.VIEWPORT_WIDTH / 2 - 140, 4, 280, 24);

      // Floor & Tier info
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      const isBoss = this.dungeonFloor % 10 === 0;
      ctx.fillText(
        `LANTAI ${this.dungeonFloor}/100 • ${this.dungeonTier.name.toUpperCase()}`,
        this.VIEWPORT_WIDTH / 2,
        14
      );

      // Enemies remaining or Boss HP
      ctx.font = '7.5px monospace';
      if (isBoss) {
        const boss = this.enemies[0];
        if (boss && boss.state !== 'DEAD') {
          ctx.fillStyle = '#f43f5e';
          ctx.fillText(`⚔️ BOSS: ${boss.name} (${Math.max(0, boss.hp)}/${boss.maxHp} HP)`, this.VIEWPORT_WIDTH / 2, 24);
        } else {
          ctx.fillStyle = '#4ade80';
          ctx.fillText(`✨ BOS TELAH DIKALAHKAN! PORTAL TERBUKA`, this.VIEWPORT_WIDTH / 2, 24);
        }
      } else {
        const remaining = Math.max(0, this.floorEnemiesTotal - this.floorEnemiesDefeated);
        ctx.fillStyle = remaining === 0 ? '#4ade80' : '#e2e8f0';
        ctx.fillText(
          remaining === 0 ? '✨ LANTAI BERSIH! MASUK PORTAL [E]' : `MUSUH TERSISA: ${remaining}/${this.floorEnemiesTotal}`,
          this.VIEWPORT_WIDTH / 2,
          24
        );
      }
      ctx.restore();
    }

    // --- COMBO BONUS OVERLAY & CHAIN TRACKER ---
    if (this.activeComboNotice) {
      ctx.save();
      const bannerW = 240;
      const bannerH = 22;
      const bx = this.VIEWPORT_WIDTH / 2 - bannerW / 2;
      const by = this.inDungeon ? 32 : 10;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.fillRect(bx, by, bannerW, bannerH);
      ctx.strokeStyle = this.activeComboNotice.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, bannerW, bannerH);

      ctx.shadowColor = this.activeComboNotice.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = this.activeComboNotice.color;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `🔥 COMBO BONUS: ${this.activeComboNotice.name.toUpperCase()} (x${this.activeComboNotice.multiplier})!`,
        this.VIEWPORT_WIDTH / 2,
        by + bannerH / 2
      );
      ctx.restore();
    } else if (this.comboHistory.length > 0) {
      ctx.save();
      const now = performance.now();
      const activeChain = this.comboHistory.filter((c) => now - c.timestamp <= 5500);
      if (activeChain.length > 0) {
        const icons = activeChain.map((c) => {
          const sk = DUNGEON_COMBAT_SKILLS[c.skillId];
          return sk ? sk.icon : '✨';
        });
        const chainStr = `COMBO: [ ${icons.join(' ➔ ')} ]`;
        const bx = this.VIEWPORT_WIDTH / 2;
        const by = this.VIEWPORT_HEIGHT - 16;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(bx - 75, by - 8, 150, 16);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx - 75, by - 8, 150, 16);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 7.5px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(chainStr, bx, by);
      }
      ctx.restore();
    }

    if (!this.debug.showFps) return;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(4, 4, 110, 16);
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(
      `${this.fps} FPS | ${this.VIEWPORT_WIDTH}x${this.VIEWPORT_HEIGHT} HD`,
      8,
      15
    );
  }

  // --- EQUIPMENT SYSTEM ---
  public recalculateStats() {
    if (this.player.baseMaxHp === undefined) this.player.baseMaxHp = 100;
    if (this.player.baseAttack === undefined) this.player.baseAttack = 30;
    if (this.player.baseDefense === undefined) this.player.baseDefense = 0;
    if (this.player.baseSpeed === undefined) this.player.baseSpeed = 113;

    const baseAttack = this.player.baseAttack;
    const baseDefense = this.player.baseDefense;
    const baseMaxHp = this.player.baseMaxHp;
    const baseSpeed = this.player.baseSpeed;

    let bonusAtk = 0;
    let bonusDef = 0;
    let bonusHp = 0;
    let bonusSpd = 0;

    if (this.equipment.weapon) {
      bonusAtk += this.equipment.weapon.attack_bonus || 0;
      bonusDef += this.equipment.weapon.defense_bonus || 0;
      bonusHp += this.equipment.weapon.max_hp_bonus || 0;
      bonusSpd += this.equipment.weapon.speed_bonus || 0;
    }
    if (this.equipment.armor) {
      bonusAtk += this.equipment.armor.attack_bonus || 0;
      bonusDef += this.equipment.armor.defense_bonus || 0;
      bonusHp += this.equipment.armor.max_hp_bonus || 0;
      bonusSpd += this.equipment.armor.speed_bonus || 0;
    }
    if (this.equipment.accessory) {
      bonusAtk += this.equipment.accessory.attack_bonus || 0;
      bonusDef += this.equipment.accessory.defense_bonus || 0;
      bonusHp += this.equipment.accessory.max_hp_bonus || 0;
      bonusSpd += this.equipment.accessory.speed_bonus || 0;
    }

    this.player.attackPower = baseAttack + bonusAtk;
    this.player.defense = baseDefense + bonusDef;
    this.player.maxHp = baseMaxHp + bonusHp;
    this.player.speed = baseSpeed + bonusSpd;
    this.player.hp = Math.min(this.player.hp, this.player.maxHp);
    this.player.equipment = this.equipment;

    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  public equipItem(item: (typeof INITIAL_ITEMS)[string]): boolean {
    if (item.category !== 'equipment' || !item.equip_slot) {
      if (this.onNotification) {
        this.onNotification('Item ini bukan perlengkapan!', 'warn');
      }
      return false;
    }
    const slot = item.equip_slot;
    this.equipment[slot] = item;
    this.recalculateStats();
    audioManager.playEquipSound();
    this.showFloatingText(this.player.x, this.player.y - 18, `Dipasang: ${item.name}`, '#38bdf8');
    if (this.onNotification) {
      this.onNotification(`Berhasil melengkapi: ${item.name}`, 'success');
    }
    if (this.onStateChange) this.onStateChange();
    return true;
  }

  public unequipItem(slot: 'weapon' | 'armor' | 'accessory'): boolean {
    const current = this.equipment[slot];
    if (!current) return false;
    this.equipment[slot] = null;
    this.recalculateStats();
    audioManager.playEquipSound();
    this.showFloatingText(this.player.x, this.player.y - 18, `Dilepas: ${current.name}`, '#94a3b8');
    if (this.onNotification) {
      this.onNotification(`Melepaskan: ${current.name}`, 'info');
    }
    if (this.onStateChange) this.onStateChange();
    return true;
  }

  // --- SAVE / LOAD SYSTEM ---
  public exportSaveGame(): SaveGameData {
    return {
      player_pos_x: Math.round(this.player.x),
      player_pos_y: Math.round(this.player.y),
      hp: this.player.hp,
      max_hp: this.player.maxHp,
      gold: this.player.gold,
      inventory: this.inventory,
      equipment: {
        weaponId: this.equipment.weapon?.id || null,
        armorId: this.equipment.armor?.id || null,
        accessoryId: this.equipment.accessory?.id || null,
      },
      quest_status: this.questStatus,
      opened_chests: this.openedChests,
      timestamp: Date.now(),
    };
  }

  public importSaveGame(data: SaveGameData) {
    this.player.x = data.player_pos_x;
    this.player.y = data.player_pos_y;
    this.player.hp = data.hp;
    this.player.maxHp = data.max_hp;
    this.player.gold = data.gold;
    this.inventory = data.inventory || [];
    this.questStatus = data.quest_status || { blood_curse_quest: 'not_started', enemies_slain: 0 };
    this.openedChests = data.opened_chests || [];
    // Restore equipped items from inventory
    if (data.equipment) {
      this.equipment.weapon = this.inventory.find((i) => i.id === data.equipment?.weaponId) || null;
      this.equipment.armor = this.inventory.find((i) => i.id === data.equipment?.armorId) || null;
      this.equipment.accessory = this.inventory.find((i) => i.id === data.equipment?.accessoryId) || null;
    }
    this.recalculateStats();
    for (const obj of this.objects) {
      if (this.openedChests.includes(obj.id)) {
        obj.opened = true;
      }
    }
    if (this.onStateChange) this.onStateChange();
    if (this.onNotification)
      this.onNotification('Permainan berhasil dimuat dari save data!', 'success');
  }

  public respawnPlayer() {
    this.inDungeon = false;
    this.enemies = [];
    this.dungeonPortalActive = false;
    this.floorEnemiesDefeated = 0;
    this.player.x = 320;
    this.player.y = 220;
    this.player.hp = this.player.maxHp;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.direction = 'down';
    this.player.state = 'Idle';
    this.player.isParrying = false;
    this.player.isDefending = false;
    this.isGameOver = false;
    this.lastActiveChunkId = '';
    this.cameraX = this.player.x - this.VIEWPORT_WIDTH / 2;
    this.cameraY = this.player.y - this.VIEWPORT_HEIGHT / 2;
    this.recalculateStats();
    audioManager.playPotion();
    this.showFloatingText(this.player.x, this.player.y - 20, 'BANGKIT DI SUAKA RAVENFALL!', '#38bdf8');
    if (this.onNotification) {
      this.onNotification('Bangkit kembali di Suaka Desa Ravenfall!', 'success');
    }
    if (this.onStateChange) this.onStateChange();
  }

  public retryDungeonFloor() {
    this.player.hp = this.player.maxHp;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.state = 'Idle';
    this.player.isParrying = false;
    this.player.isDefending = false;
    this.isGameOver = false;
    this.enterDungeonFloor(this.dungeonFloor);
    audioManager.playPotion();
    this.showFloatingText(this.player.x, this.player.y - 20, `COBA LAGI LANTAI ${this.dungeonFloor}!`, '#f43f5e');
    if (this.onStateChange) this.onStateChange();
  }

  public getCurrentChunkId(): string {
    if (this.inDungeon) {
      return `dungeon_instance_${this.dungeonFloor}`;
    }
    for (const chunk of this.chunks) {
      if (
        this.player.x >= chunk.pixelX &&
        this.player.x < chunk.pixelX + chunk.width &&
        this.player.y >= chunk.pixelY &&
        this.player.y < chunk.pixelY + chunk.height
      ) {
        return chunk.id;
      }
    }
    return 'domain_village';
  }

  public teleportToChunk(chunkId: string) {
    const chunk = this.chunks.find((c) => c.id === chunkId);
    if (chunk) {
      // Warp directly to the center of the region (near the center Realm Gate)
      const centerX = chunk.pixelX + CHUNK_WIDTH / 2;
      const centerY = chunk.pixelY + CHUNK_HEIGHT / 2;
      this.player.x = centerX;
      this.player.y = centerY + 32; // positioned cleanly in front of the center gate facing up
      this.player.direction = 'up';
      this.player.state = 'Idle';
      this.player.vx = 0;
      this.player.vy = 0;
      this.cameraX = this.player.x - this.VIEWPORT_WIDTH / 2;
      this.cameraY = this.player.y - this.VIEWPORT_HEIGHT / 2;
      
      // Trigger effect
      this.lightningFlash = 1.0;
      audioManager.playLoadSound();
      
      if (this.onRegionEnter) {
        this.onRegionEnter(chunk);
      }
      if (this.onStateChange) {
        this.onStateChange();
      }
    }
  }

  public fastTravelToDomain(domainId: string) {
    this.teleportToChunk(domainId);
  }
}
