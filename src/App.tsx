import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/engine';
import { audioManager } from './game/audio';
import {
  NPC,
  DialogueNode,
  ItemData,
  WorldChunk,
  EquipmentSlots,
  CraftingRecipe,
  SkillNode,
} from './types/game';
import {
  DEFAULT_CRAFTING_RECIPES,
  DEFAULT_SKILL_TREE_NODES,
  DEFAULT_BESTIARY_ENTRIES,
  DEFAULT_QUEST_LOG,
} from './game/roadmapData';
import { DIALOGUE_TREE, INITIAL_ITEMS } from './game/worldData';
import { DUNGEON_COMBAT_SKILLS } from './game/dungeonSystem';
import { saveGameData, getSaveGameData, deleteSaveGameData, SaveData } from './game/saveSystem';
import { DialogueBox } from './components/DialogueBox';
import { InventoryModal } from './components/InventoryModal';
import { VirtualGamepad } from './components/VirtualGamepad';
import { GodotArchitectureViewer } from './components/GodotArchitectureViewer';
import { motion, AnimatePresence } from 'motion/react';
import { GothicSkillProgression } from './components/GothicSkillProgression';
import { GameplayGuideModal } from './components/GameplayGuideModal';
import { MainMenu } from './components/MainMenu';
import { GameOver } from './components/GameOver';
import FastTravelModal from './components/FastTravelModal';
import { DungeonModal } from './components/DungeonModal';
import { EnchantingModal } from './components/EnchantingModal';
import {
  Sword,
  Hand,
  Package,
  Layers,
  Moon,
  Sparkles,
  Zap,
  Save,
  Download,
  BookOpen,
  Code2,
  Tv,
  RotateCcw,
  Volume2,
  Heart,
  Shield,
  Coins,
  MapPin,
  HelpCircle,
  Skull,
  Award,
  Castle,
  Flame,
  Edit3,
  Check,
  X,
  Info,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // UI Modals State
  const [isInMainMenu, setIsInMainMenu] = useState(true);
  const isInMainMenuRef = useRef(true);
  isInMainMenuRef.current = isInMainMenu;
  const [currentDialogue, setCurrentDialogue] = useState<DialogueNode | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showProgression, setShowProgression] = useState(false);
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [showGameplayGuide, setShowGameplayGuide] = useState(false);
  const [showDungeonModal, setShowDungeonModal] = useState(false);
  const [showEnchantingModal, setShowEnchantingModal] = useState(false);
  const [isFastTravelOpen, setIsFastTravelOpen] = useState(false);
  const [regionBanner, setRegionBanner] = useState<{ name: string; subtitle: string; danger: string; lore?: string } | null>(null);

  // Dungeon & Knight Combat State
  const [dungeonFloor, setDungeonFloor] = useState(1);
  const [maxFloorReached, setMaxFloorReached] = useState(1);
  const [activeOathId, setActiveOathId] = useState<string | null>('oath_purity');
  const [inDungeon, setInDungeon] = useState(false);
  const [isParrying, setIsParrying] = useState(false);
  const [isDefending, setIsDefending] = useState(false);

  // Player Stats synced from GameEngine
  const [playerName, setPlayerName] = useState('Sir Valen');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('Sir Valen');
  const [playerHp, setPlayerHp] = useState(100);
  const [playerMaxHp, setPlayerMaxHp] = useState(100);
  const [playerGold, setPlayerGold] = useState(60);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerExp, setPlayerExp] = useState(0);
  const [playerNextExp, setPlayerNextExp] = useState(100);
  const [playerSp, setPlayerSp] = useState(3);
  const [playerAttack, setPlayerAttack] = useState(30);
  const [playerDefense, setPlayerDefense] = useState(0);
  const [playerSpeed, setPlayerSpeed] = useState(113);
  const [inventory, setInventory] = useState<ItemData[]>([]);
  const [equipment, setEquipment] = useState<EquipmentSlots>({
    weapon: null,
    armor: null,
    accessory: null,
  });

  // World / Engine State
  const [activeRegion, setActiveRegion] = useState('Alun-Alun Ravenfall');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isHDMode, setIsHDMode] = useState(true);
  const [isBloodMoon, setIsBloodMoon] = useState(true);
  const [isRaining, setIsRaining] = useState(true);
  const [dynamicLighting, setDynamicLighting] = useState(true);
  const [showYSortLines, setShowYSortLines] = useState(false);
  const [showChunks, setShowChunks] = useState(false);

  // Progression & Quests
  const [skillNodes, setSkillNodes] = useState<SkillNode[]>(DEFAULT_SKILL_TREE_NODES);
  const [unlockedSkills, setUnlockedSkills] = useState<string[]>(['valen_atk_1']);
  const [equippedSkillId, setEquippedSkillId] = useState<string>('holy_cross_slash');
  const [recipes] = useState<CraftingRecipe[]>(DEFAULT_CRAFTING_RECIPES);
  const [bestiary] = useState(DEFAULT_BESTIARY_ENTRIES);
  const [quests, setQuests] = useState(DEFAULT_QUEST_LOG);
  const [currentSaveData, setCurrentSaveData] = useState<SaveData | null>(() => getSaveGameData());

  // Notification Toasts
  const [notifications, setNotifications] = useState<
    { id: string; message: string; type: 'info' | 'success' | 'warn' }[]
  >([]);

  const addNotification = (
    message: string,
    type: 'info' | 'success' | 'warn' = 'info'
  ) => {
    const id = Math.random().toString();
    setNotifications((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3800);
  };

  // Sync state from engine
  const syncStateFromEngine = (engine: GameEngine) => {
    if (engine.player.name) {
      setPlayerName(engine.player.name);
    }
    setPlayerHp(engine.player.hp);
    setPlayerMaxHp(engine.player.maxHp);
    setPlayerGold(engine.player.gold);
    setPlayerLevel(engine.player.level || 1);
    setPlayerExp(engine.player.exp || 0);
    setPlayerNextExp(engine.player.nextLevelExp || 100);
    setPlayerSp(engine.player.sp || 0);
    setPlayerAttack(engine.player.attackPower);
    setPlayerDefense(engine.player.defense || 0);
    setPlayerSpeed(engine.player.speed);
    setInventory([...engine.inventory]);
    setEquipment({ ...engine.equipment });
    setIsGameOver(engine.isGameOver);
    setIsBloodMoon(engine.isBloodMoon);
    setIsRaining(engine.isRaining);
    setDungeonFloor(engine.dungeonFloor);
    setMaxFloorReached(engine.maxFloorReached);
    setInDungeon(engine.inDungeon);
    setIsParrying(engine.player.isParrying || false);
    setIsDefending(engine.player.isDefending || false);
  };

  const handleSavePlayerName = (nameToSave: string) => {
    const trimmed = nameToSave.trim();
    if (trimmed) {
      setPlayerName(trimmed);
      setTempName(trimmed);
      if (engineRef.current) {
        engineRef.current.setPlayerName(trimmed);
      }
      addNotification(`Nama karakter berhasil diubah menjadi: ${trimmed}`, 'success');
    }
    setIsEditingName(false);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    // Attach global user interaction listener for BGM autoplay compliance
    const handleFirstInteraction = () => {
      audioManager.unlockAudio();
      if (audioManager.bgmEnabled) {
        audioManager.toggleBgm(true);
      }
    };
    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });

    // Instantiate and start engine
    const engine = new GameEngine();
    engineRef.current = engine;
    engine.init(canvasRef.current);

    // Bind callbacks
    engine.onNotification = (msg, type) => {
      addNotification(msg, type);
    };

    engine.onDialogueRequest = (npc: NPC) => {
      audioManager.playBlip();
      const node = DIALOGUE_TREE[npc.dialogueId];
      if (node) {
        openDialogue(node);
      }
    };

    engine.onRegionEnter = (chunk: WorldChunk) => {
      setActiveRegion(chunk.name);
      setRegionBanner({
        name: chunk.name,
        subtitle: chunk.subtitle || 'Wilayah Misterius Dunia Ravenfall',
        danger: chunk.dangerLevel || 'Aman',
        lore: 'Legenda kuno mengatakan wilayah ini menyimpan rahasia yang terkubur dalam kegelapan abadi.'
      });
      setTimeout(() => setRegionBanner(null), 6000);
    };

    engine.onFastTravelRequest = () => {
      setIsFastTravelOpen(true);
      audioManager.playBlip();
    };

    engine.onStateChange = () => {
      syncStateFromEngine(engine);
    };

    engine.onGameOver = () => {
      setIsGameOver(true);
      audioManager.playBlip();
    };

    // Initial sync
    syncStateFromEngine(engine);

    // Keyboard shortcuts for combat and modals
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (isInMainMenuRef.current) {
        return;
      }
      const k = e.key.toLowerCase();
      if (k === 'q' || k === 'c') {
        engineRef.current?.triggerParry();
      } else if (k === 'r') {
        engineRef.current?.triggerWeaponSkill();
      } else if (k === 'f') {
        engineRef.current?.triggerDungeonSkill();
      } else if (k === '1') {
        engineRef.current?.triggerDungeonSkill('aegis_of_dawn');
      } else if (k === '2') {
        engineRef.current?.triggerDungeonSkill('radiant_thrust');
      } else if (k === '3') {
        engineRef.current?.triggerDungeonSkill('judgement_pillar');
      } else if (k === '4') {
        engineRef.current?.triggerDungeonSkill('divine_wrath');
      } else if (e.key === 'Shift') {
        engineRef.current?.triggerDefense(true);
      } else if (k === 'i') {
        setShowInventory((prev) => !prev);
      } else if (k === 'g') {
        setShowProgression((prev) => !prev);
      } else if (k === 'b') {
        setShowArchitecture((prev) => !prev);
      } else if (k === 'h') {
        toggleHDMode();
      } else if (k === 'm') {
        toggleBloodMoon();
      } else if (k === 't') {
        setIsFastTravelOpen((prev) => !prev);
      } else if (k === 'escape') {
        setShowInventory(false);
        setShowProgression(false);
        setShowArchitecture(false);
        setShowDungeonModal(false);
        setShowEnchantingModal(false);
        setCurrentDialogue(null);
        setShowHelpGuide(false);
        setShowGameplayGuide(false);
      }
    };

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      if (isInMainMenuRef.current) return;
      if (e.key === 'Shift') {
        engineRef.current?.triggerDefense(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    window.addEventListener('keyup', handleGlobalKeyUp);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeys);
      window.removeEventListener('keyup', handleGlobalKeyUp);
      engine.stop();
    };
  }, []);

  // Save / Load & Main Menu Actions
  const handleAutoSaveGame = () => {
    if (!engineRef.current) return;
    const p = engineRef.current.player;
    const now = new Date();
    const timeStr = `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

    const data: SaveData = {
      playerName: p.name || playerName,
      hp: p.hp,
      maxHp: p.maxHp,
      baseMaxHp: p.baseMaxHp || p.maxHp || 100,
      gold: p.gold,
      level: p.level,
      exp: p.exp,
      nextExp: p.nextExp,
      sp: p.sp || 0,
      attackPower: p.attackPower,
      baseAttack: p.baseAttack || p.attackPower || 30,
      defense: p.defense || 0,
      baseDefense: p.baseDefense || p.defense || 0,
      speed: p.speed,
      baseSpeed: p.baseSpeed || p.speed || 113,
      inventory: p.inventory || [],
      equipment: p.equipment || { weapon: null, armor: null, accessory: null },
      unlockedSkills: unlockedSkills,
      equippedSkillId: equippedSkillId,
      unlockedDungeonSkills: engineRef.current.unlockedDungeonSkills || ['holy_cross_slash'],
      maxFloorReached: engineRef.current.maxFloorReached || 1,
      activeOathId: activeOathId,
      claimedRewards: p.claimedRewards || {},
      savedAt: timeStr,
    };

    saveGameData(data);
    setCurrentSaveData(data);
  };

  const handleStartNewGame = (playerNameInput: string, mode: 'normal' | 'bloodmoon' | 'story') => {
    setIsInMainMenu(false);
    setIsGameOver(false);

    audioManager.toggleBgm(true);
    audioManager.unlockAudio();

    setShowEnchantingModal(false);
    setShowProgression(false);
    setShowDungeonModal(false);
    setShowInventory(false);
    setShowArchitecture(false);
    setShowGameplayGuide(false);
    setShowHelpGuide(false);
    setIsFastTravelOpen(false);
    setCurrentDialogue(null);

    setPlayerName(playerNameInput);
    if (engineRef.current) {
      const startingHp = mode === 'story' ? 150 : 100;
      engineRef.current.player.name = playerNameInput;
      engineRef.current.player.baseMaxHp = startingHp;
      engineRef.current.player.hp = startingHp;
      engineRef.current.player.maxHp = startingHp;
      engineRef.current.player.baseAttack = 30;
      engineRef.current.player.baseDefense = 0;
      engineRef.current.player.baseSpeed = 113;
      engineRef.current.player.gold = 60;
      engineRef.current.player.level = 1;
      engineRef.current.player.exp = 0;
      engineRef.current.player.sp = 3;
      engineRef.current.player.inventory = [
        { ...INITIAL_ITEMS.holy_water, count: 2 },
        { ...INITIAL_ITEMS.bone_fragment, count: 1 },
      ];
      engineRef.current.player.equipment = { weapon: null, armor: null, accessory: null };
      engineRef.current.unlockedDungeonSkills = ['holy_cross_slash'];
      engineRef.current.equippedDungeonSkillId = 'holy_cross_slash';
      engineRef.current.maxFloorReached = 1;
      engineRef.current.recalculateStats();
      engineRef.current.exitDungeonToLobby();

      if (mode === 'bloodmoon') {
        engineRef.current.isBloodMoon = true;
        setIsBloodMoon(true);
        addNotification('Mode Lunatic Darah Aktif! Musuh semakin buas!', 'warn');
      } else if (mode === 'story') {
        addNotification(`Selamat datang ${playerNameInput}! Mode Cerita Aktif (+150 HP).`, 'info');
      } else {
        addNotification(`Selamat datang ${playerNameInput} di Suaka Ravenfall!`, 'success');
      }

      syncStateFromEngine(engineRef.current);
      handleAutoSaveGame();
    }
  };

  const handleLoadGame = () => {
    const data = getSaveGameData();
    if (!data) {
      addNotification('Tidak ada file simpanan permainan!', 'warn');
      return;
    }

    setIsInMainMenu(false);
    setIsGameOver(false);

    audioManager.toggleBgm(true);
    audioManager.unlockAudio();

    setShowEnchantingModal(false);
    setShowProgression(false);
    setShowDungeonModal(false);
    setShowInventory(false);
    setShowArchitecture(false);
    setShowGameplayGuide(false);
    setShowHelpGuide(false);
    setIsFastTravelOpen(false);
    setCurrentDialogue(null);

    setPlayerName(data.playerName || 'Sir Valen');
    setEquippedSkillId(data.equippedSkillId || 'holy_cross_slash');
    setUnlockedSkills(data.unlockedSkills || ['valen_atk_1']);

    if (engineRef.current) {
      const p = engineRef.current.player;
      p.name = data.playerName || 'Sir Valen';
      p.baseMaxHp = data.baseMaxHp || data.maxHp || 100;
      p.baseAttack = data.baseAttack || data.attackPower || 30;
      p.baseDefense = data.baseDefense || data.defense || 0;
      p.baseSpeed = data.baseSpeed || data.speed || 113;
      p.hp = data.hp || p.baseMaxHp;
      p.gold = data.gold || 0;
      p.level = data.level || 1;
      p.exp = data.exp || 0;
      p.nextExp = data.nextExp || 100;
      p.sp = data.sp || 0;
      p.inventory = data.inventory || [];
      p.equipment = data.equipment || { weapon: null, armor: null, accessory: null };
      p.claimedRewards = data.claimedRewards || {};

      engineRef.current.equipment = p.equipment;
      engineRef.current.recalculateStats();
      engineRef.current.unlockedDungeonSkills = data.unlockedDungeonSkills || ['holy_cross_slash'];
      engineRef.current.equippedDungeonSkillId = data.equippedSkillId || 'holy_cross_slash';
      engineRef.current.maxFloorReached = data.maxFloorReached || 1;
      engineRef.current.exitDungeonToLobby();

      syncStateFromEngine(engineRef.current);
      addNotification(`📂 Permainan ${p.name} berhasil dimuat! (Level ${p.level}, ${p.hp}/${p.maxHp} HP)`, 'success');
    }
  };

  const handleDeleteSaveData = () => {
    deleteSaveGameData();
    setCurrentSaveData(null);
    addNotification('File simpanan permainan berhasil dihapus.', 'info');
  };

  const handleFastTravel = (chunkId: string) => {
    if (engineRef.current) {
      engineRef.current.teleportToChunk(chunkId);
      setIsFastTravelOpen(false);
      audioManager.playSelect();
    }
  };

  const handleRespawn = () => {
    if (engineRef.current) {
      engineRef.current.respawnPlayer();
      setInDungeon(false);
      setIsGameOver(false);
      addNotification('Bangkit kembali di Suaka Ravenfall!', 'success');
      syncStateFromEngine(engineRef.current);
    }
  };

  const handleRetryDungeonFloor = () => {
    if (engineRef.current) {
      engineRef.current.retryDungeonFloor();
      setIsGameOver(false);
      syncStateFromEngine(engineRef.current);
    }
  };

  const handleReturnToMainMenu = () => {
    if (engineRef.current) {
      if (engineRef.current.inDungeon) {
        engineRef.current.exitDungeonToLobby();
      }
      handleAutoSaveGame();
    }
    setShowInventory(false);
    setShowProgression(false);
    setShowArchitecture(false);
    setShowDungeonModal(false);
    setShowEnchantingModal(false);
    setCurrentDialogue(null);
    setIsFastTravelOpen(false);
    setIsGameOver(false);
    setIsInMainMenu(true);
    addNotification('🚪 Keluar ke Menu Utama & Kemajuan Otomatis Disimpan!', 'success');
  };

  const toggleHDMode = () => {
    if (!engineRef.current) return;
    const next = !isHDMode;
    setIsHDMode(next);
    engineRef.current.setHDMode(next);
    addNotification(next ? 'Mode HD Aktif (480x270)' : 'Mode Retro Piksel Aktif (320x180)', 'info');
  };

  const toggleBloodMoon = () => {
    if (!engineRef.current) return;
    const next = !isBloodMoon;
    setIsBloodMoon(next);
    engineRef.current.isBloodMoon = next;
    addNotification(next ? 'Purnama Darah Menyala! Musuh semakin buas!' : 'Langit Malam Tenang Terpasang.', 'info');
  };

  const toggleRain = () => {
    if (!engineRef.current) return;
    const next = !isRaining;
    setIsRaining(next);
    engineRef.current.isRaining = next;
    addNotification(next ? 'Hujan Deras Terkutuk Mengguyur Ravenfall' : 'Hujan Reda.', 'info');
  };

  const toggleLighting = () => {
    if (!engineRef.current) return;
    const next = !dynamicLighting;
    setDynamicLighting(next);
    engineRef.current.debug.showDynamicLighting = next;
    addNotification(next ? 'Pencahayaan Dinamis PointLight2D Aktif' : 'Pencahayaan Dimatikan (Full Bright)', 'info');
  };

  const toggleYSort = () => {
    if (!engineRef.current) return;
    const next = !showYSortLines;
    setShowYSortLines(next);
    engineRef.current.debug.showYSortLines = next;
    addNotification(next ? 'Garis Kedalaman Y-Sort Ditampilkan' : 'Garis Y-Sort Disembunyikan', 'info');
  };

  const toggleChunks = () => {
    if (!engineRef.current) return;
    const next = !showChunks;
    setShowChunks(next);
    engineRef.current.debug.showChunkBoundaries = next;
    addNotification(next ? 'Batas Segmentasi Chunk Ditampilkan' : 'Batas Chunk Disembunyikan', 'info');
  };

  // Blessing and Regional Reward Handlers & Filtering
  const getFilteredDialogue = (node: DialogueNode): DialogueNode => {
    if (!engineRef.current || !node.options) return node;
    const player = engineRef.current.player;
    const inventory = engineRef.current.inventory;
    const claimedRewards = player.claimedRewards || {};

    const filteredOptions = node.options.filter((opt) => {
      const action = opt.action;
      if (!action) return true;

      // Regional rewards: if already claimed, remove option entirely
      if (action.startsWith('claim_reward_')) {
        const rewardKey = action.replace('claim_reward_', '');
        if (claimedRewards[rewardKey]) {
          return false;
        }
      }

      // Unique equipment gifts: if item already in inventory, remove option
      if (action === 'crow_charm') {
        if (inventory.some((i) => i.id === 'crow_feather_charm')) {
          return false;
        }
      }
      if (action === 'vampire_gift') {
        if (inventory.some((i) => i.id === 'blood_amulet')) {
          return false;
        }
      }

      return true;
    });

    return {
      ...node,
      options: filteredOptions,
    };
  };

  const openDialogue = (node: DialogueNode | null) => {
    if (!node) {
      setCurrentDialogue(null);
      return;
    }
    setCurrentDialogue(getFilteredDialogue(node));
  };

  const handleClaimBlessing = (blessingName: string, actionType: 'blessing' | 'astral_blessing', applyEffect: () => void): boolean => {
    if (!engineRef.current) return false;
    const player = engineRef.current.player;
    if (player.blessingsClaimed === undefined) player.blessingsClaimed = 0;
    const requiredLevel = (player.blessingsClaimed + 1) * 5;
    if (player.level < requiredLevel) {
      const diff = requiredLevel - player.level;
      const nodeKey = actionType === 'astral_blessing' ? 'astral_blessing_not_ready' : 'blessing_not_ready';
      if (DIALOGUE_TREE[nodeKey]) {
        const baseNode = DIALOGUE_TREE[nodeKey];
        const customText = actionType === 'astral_blessing'
          ? `Konstelasi bintang astral belum menyetujui penambahan kekuatanmu. Engkau masih membutuhkan ${diff} level lagi (mencapai Level ${requiredLevel}) untuk menyerap berkah astral ke-${player.blessingsClaimed + 1}.`
          : `Jiwa dan zirahmu belum cukup matang untuk menanggung berkat suci ini. Engkau masih membutuhkan ${diff} level lagi (mencapai Level ${requiredLevel}) untuk menerima berkat ke-${player.blessingsClaimed + 1}.`;
        openDialogue({
          ...baseNode,
          text: customText,
        });
      } else {
        addNotification(`Syarat Blessing belum terpenuhi! Butuh Level ${requiredLevel} (Kurang ${diff} level lagi).`, 'warn');
      }
      return false;
    }
    player.blessingsClaimed += 1;
    applyEffect();
    audioManager.playPotion();
    addNotification(`Berkat '${blessingName}' (Blessing ke-${player.blessingsClaimed}) berhasil diterima!`, 'success');
    syncStateFromEngine(engineRef.current);
    setCurrentDialogue(null);
    return true;
  };

  const handleClaimRegionReward = (rewardKey: string, requiredFloor: number, item: ItemData, npcName: string) => {
    if (!engineRef.current) return;
    const player = engineRef.current.player;
    if (!player.claimedRewards) player.claimedRewards = {};
    if (player.claimedRewards[rewardKey]) {
      addNotification(`${npcName}: "Kamu sudah mengambil hadiah wilayah ini sebelumnya!"`, 'warn');
      return;
    }
    const maxFloor = Math.max(engineRef.current.maxFloorReached || 1, player.maxDungeonFloorReached || 1);
    if (maxFloor < requiredFloor) {
      addNotification(`${npcName}: "Capai setidaknya Lantai ${requiredFloor} di Menara 100 Lantai terlebih dahulu! (Lantai tertinggi saat ini: ${maxFloor})"`, 'warn');
      return;
    }
    player.claimedRewards[rewardKey] = true;
    engineRef.current.addItem({ ...item });
    audioManager.playCoin();
    addNotification(`${npcName} memberikan "${item.name}" sebagai hadiah pencapaian Lantai ${requiredFloor}!`, 'success');
    syncStateFromEngine(engineRef.current);
    setCurrentDialogue(null);
  };

  // Dialogue Selection Handler
  const handleDialogueOption = (nextId?: string, action?: string) => {
    if (!engineRef.current) return;
    let blessingSuccess = true;
    if (action === 'heal') {
      engineRef.current.player.hp = engineRef.current.player.maxHp;
      audioManager.playPotion();
      addNotification('Pendeta Suci memulihkan seluruh darah Anda!', 'success');
      syncStateFromEngine(engineRef.current);
    } else if (action === 'blessing') {
      blessingSuccess = handleClaimBlessing('Berkat Katedral Suci', 'blessing', () => {
        engineRef.current!.player.baseMaxHp = (engineRef.current!.player.baseMaxHp || 100) + 25;
        engineRef.current!.recalculateStats();
        engineRef.current!.player.hp = engineRef.current!.player.maxHp;
      });
    } else if (action === 'cemetery_blessing') {
      blessingSuccess = handleClaimBlessing('Berkat Salib Pemakaman', 'blessing', () => {
        engineRef.current!.player.baseMaxHp = (engineRef.current!.player.baseMaxHp || 100) + 15;
        engineRef.current!.recalculateStats();
        engineRef.current!.player.hp = engineRef.current!.player.maxHp;
      });
    } else if (action === 'astral_blessing') {
      blessingSuccess = handleClaimBlessing('Berkat Bintang Astral', 'astral_blessing', () => {
        engineRef.current!.player.baseMaxHp = (engineRef.current!.player.baseMaxHp || 100) + 20;
        engineRef.current!.player.baseAttack = (engineRef.current!.player.baseAttack || 30) + 4;
        engineRef.current!.recalculateStats();
        engineRef.current!.player.hp = engineRef.current!.player.maxHp;
      });
    } else if (action === 'claim_reward_village') {
      handleClaimRegionReward('village', 10, INITIAL_ITEMS.hunter_coat, 'Elena sang Tabib Desa');
    } else if (action === 'claim_reward_cemetery') {
      handleClaimRegionReward('cemetery', 20, INITIAL_ITEMS.holy_water, 'Suster Genevieve');
    } else if (action === 'claim_reward_swamp') {
      handleClaimRegionReward('swamp', 30, INITIAL_ITEMS.venom_stiletto, 'Hantu Ksatria Godfrey');
    } else if (action === 'claim_reward_ruins') {
      handleClaimRegionReward('ruins', 40, INITIAL_ITEMS.gothic_dress, 'Seraphina');
    } else if (action === 'claim_reward_bone_valley') {
      handleClaimRegionReward('bone_valley', 50, INITIAL_ITEMS.crimson_scythe, 'Valerius');
    } else if (action === 'claim_reward_coven') {
      handleClaimRegionReward('coven', 60, INITIAL_ITEMS.templar_cuirass, 'Sir Roderick');
    } else if (action === 'claim_reward_castle') {
      handleClaimRegionReward('castle', 70, INITIAL_ITEMS.blood_amulet, 'Putri Lilith');
    } else if (action === 'claim_reward_astral') {
      handleClaimRegionReward('astral', 80, INITIAL_ITEMS.astral_wand, 'Celestine');
    } else if (action === 'claim_reward_abyss') {
      handleClaimRegionReward('abyss', 90, INITIAL_ITEMS.abyss_reaper, 'Morrigan');
    } else if (action === 'claim_reward_rose_garden') {
      handleClaimRegionReward('rose_garden', 100, INITIAL_ITEMS.rose_rapier, 'Vladimir');
    } else if (action === 'buy_holy_water') {
      if (engineRef.current.player.gold >= 25) {
        engineRef.current.player.gold -= 25;
        engineRef.current.addItem({
          id: 'holy_water',
          name: 'Air Suci Suaka',
          description: 'Membersihkan kutukan kegelapan dan memulihkan 50 HP.',
          icon: '💧',
          category: 'consumable',
          heal_amount: 50,
          count: 1,
          is_stackable: true,
          value: 25,
        });
        audioManager.playCoin();
        addNotification('Membeli Air Suci Suaka (-25 Gold)', 'success');
        syncStateFromEngine(engineRef.current);
      } else {
        addNotification('Uang tidak cukup!', 'warn');
      }
    } else if (action === 'trade_holy_potion') {
      if (engineRef.current.player.gold >= 200) {
        engineRef.current.player.gold -= 200;
        engineRef.current.addItem({
          id: 'holy_potion',
          name: 'Holy Potion',
          description: 'Ramuan suci yang memulihkan 100 HP seketika.',
          icon: '🧪',
          category: 'consumable',
          heal_amount: 100,
          count: 1,
          is_stackable: true,
          value: 200
        });
        audioManager.playCoin();
        addNotification('Berhasil membeli Holy Potion! (-200 Gold)', 'success');
        syncStateFromEngine(engineRef.current);
      } else {
        addNotification('Uang tidak cukup untuk membeli Holy Potion!', 'warn');
      }
    } else if (action === 'trade_shadow_essence') {
      if (engineRef.current.player.gold >= 500) {
        engineRef.current.player.gold -= 500;
        engineRef.current.player.baseAttack = (engineRef.current.player.baseAttack || 30) + 10;
        engineRef.current.recalculateStats();
        audioManager.playCoin();
        addNotification('Menyerap Shadow Essence! Attack Power bertambah +10 (-500 Gold)', 'success');
        syncStateFromEngine(engineRef.current);
      } else {
        addNotification('Uang tidak cukup untuk membeli Shadow Essence!', 'warn');
      }
    } else if (action === 'give_quest') {
      addNotification('Misi Baru Diterima: Basmi Kerangka Kuburan!', 'success');
      setQuests((prev) =>
        prev.map((q) =>
          q.id === 'side_skeleton_cull' ? { ...q, status: 'active' } : q
        )
      );
    } else if (action === 'crow_charm') {
      engineRef.current.addItem({
        id: 'crow_feather_charm',
        name: 'Jimat Bulu Gagak Morrigan (+35 SPD, +8 ATK)',
        description: 'Bulu gagak hitam gaib yang memanipulasi angin bayangan untuk mempercepat tebasan.',
        category: 'equipment',
        equip_slot: 'accessory',
        icon: '🪶',
        is_stackable: false,
        count: 1,
        heal_amount: 0,
        speed_bonus: 35,
        attack_bonus: 8,
        value: 190,
      });
      audioManager.playCoin();
      addNotification('Menerima Jimat Bulu Gagak Morrigan (+35 SPD, +8 ATK)!', 'success');
      syncStateFromEngine(engineRef.current);
      setCurrentDialogue(null);
    } else if (action === 'village_cure') {
      engineRef.current.player.hp = engineRef.current.player.maxHp;
      audioManager.playPotion();
      addNotification('Elena merawat luka-lukamu hingga pulih total!', 'success');
      syncStateFromEngine(engineRef.current);
    } else if (action === 'vampire_gift') {
      engineRef.current.addItem({
        id: 'blood_amulet',
        name: 'Amulet Tetes Darah Abadi (+12 ATK, +20 HP)',
        description: 'Pusaka kristal permata merah delima milik keluarga kerajaan bangsawan Drakula.',
        category: 'equipment',
        equip_slot: 'accessory',
        icon: '💎',
        is_stackable: false,
        count: 1,
        heal_amount: 0,
        attack_bonus: 12,
        max_hp_bonus: 20,
        value: 240,
      });
      audioManager.playCoin();
      addNotification('Putri Lilith menganugerahkan Amulet Tetes Darah Abadi!', 'success');
      syncStateFromEngine(engineRef.current);
      setCurrentDialogue(null);
    } else if (action === 'open_dungeon_modal') {
      setShowDungeonModal(true);
      setCurrentDialogue(null);
      return;
    } else if (action === 'open_enchanting_modal') {
      setShowEnchantingModal(true);
      setCurrentDialogue(null);
      return;
    } else if (action === 'take_oath_dungeon_breaker') {
      handleSelectOath('oath_retribution');
      addNotification('Sumpah Ksatria Suci Penakluk Menara Diikrarkan (+40% DMG vs Bos Menara)!', 'success');
      syncStateFromEngine(engineRef.current);
    } else if (action === 'upgrade_weapon') {
      handleUpgradeWeapon();
    } else if (action === 'upgrade_armor') {
      handleUpgradeArmor();
    } else if (action === 'dungeon_full_heal') {
      if (!engineRef.current) return;
      engineRef.current.player.hp = engineRef.current.player.maxHp;
      engineRef.current.dungeonNpc = null;
      audioManager.playPotion();
      addNotification('💖 Malaikat Penjaga memulihkan seluruh darah Anda hingga 100% HP!', 'success');
      syncStateFromEngine(engineRef.current);
      setCurrentDialogue(null);
      return;
    } else if (action === 'dungeon_random_blessing') {
      if (!engineRef.current) return;
      const p = engineRef.current.player;
      const blessingPool = [
        { name: 'Berkat Pedang Fajar', desc: '+12 Attack Power (ATK)!', run: () => { p.baseAttack = (p.baseAttack || 30) + 12; } },
        { name: 'Berkat Zirah Baja Suci', desc: '+8 Defense (DEF)!', run: () => { p.baseDefense = (p.baseDefense || 0) + 8; } },
        { name: 'Berkat Darah Abadi', desc: '+35 Max HP & Full Heal!', run: () => { p.baseMaxHp = (p.baseMaxHp || 100) + 35; p.hp = p.baseMaxHp; } },
        { name: 'Berkat Emas Kerajaan', desc: '+250 Gold!', run: () => { p.gold += 250; } },
        { name: 'Berkat Kirana Angin', desc: '+30 Kecepatan Gerak (SPD)!', run: () => { p.baseSpeed = (p.baseSpeed || 113) + 30; } },
        { name: 'Berkat Pengetahuan Suci', desc: '+2 Skill Points (SP)!', run: () => { p.sp = (p.sp || 0) + 2; } },
      ];
      const chosen = blessingPool[Math.floor(Math.random() * blessingPool.length)];
      chosen.run();
      engineRef.current.recalculateStats();
      engineRef.current.dungeonNpc = null;
      audioManager.playLevelUp();
      addNotification(`✨ ${chosen.name}: ${chosen.desc}`, 'success');
      syncStateFromEngine(engineRef.current);
      setCurrentDialogue(null);
      return;
    } else if (action === 'exit_dungeon') {
      handleExitDungeon();
    }

    if (blessingSuccess && nextId && DIALOGUE_TREE[nextId]) {
      openDialogue(DIALOGUE_TREE[nextId]);
    } else if (!blessingSuccess) {
      return;
    } else {
      setCurrentDialogue(null);
    }
  };

  // Dungeon & Knight Weapon/Armor Enchanting Handlers
  const handleUpgradeWeapon = (): boolean => {
    if (!engineRef.current) return false;
    const currentWeapon = engineRef.current.equipment.weapon;
    if (!currentWeapon) {
      addNotification('Kamu belum melengkapi senjata!', 'warn');
      return false;
    }
    if (engineRef.current.player.gold < 50) {
      addNotification('Emas tidak cukup untuk menempa (butuh 50 Gold)!', 'warn');
      return false;
    }
    engineRef.current.player.gold -= 50;
    currentWeapon.attack_bonus = (currentWeapon.attack_bonus || 0) + 6;
    currentWeapon.name = currentWeapon.name.includes('+')
      ? currentWeapon.name.replace(/\+(\d+)/, (_, n) => `+${Number(n) + 1}`)
      : `${currentWeapon.name} +1 (Holy Enchanted)`;
    engineRef.current.recalculateStats();
    audioManager.playCoin();
    addNotification('Enchanting Berhasil! Senjata bertambah +6 ATK!', 'success');
    syncStateFromEngine(engineRef.current);
    return true;
  };

  const handleUpgradeArmor = (): boolean => {
    if (!engineRef.current) return false;
    const currentArmor = engineRef.current.equipment.armor;
    if (!currentArmor) {
      addNotification('Kamu belum melengkapi zirah!', 'warn');
      return false;
    }
    if (engineRef.current.player.gold < 45) {
      addNotification('Emas tidak cukup untuk memperkuat zirah (butuh 45 Gold)!', 'warn');
      return false;
    }
    engineRef.current.player.gold -= 45;
    currentArmor.defense_bonus = (currentArmor.defense_bonus || 0) + 4;
    currentArmor.max_hp_bonus = (currentArmor.max_hp_bonus || 0) + 15;
    currentArmor.name = currentArmor.name.includes('+')
      ? currentArmor.name.replace(/\+(\d+)/, (_, n) => `+${Number(n) + 1}`)
      : `${currentArmor.name} +1 (White Steel Refined)`;
    engineRef.current.recalculateStats();
    audioManager.playCoin();
    addNotification('Penguatan Berhasil! Zirah Putih bertambah +4 DEF, +15 Max HP!', 'success');
    syncStateFromEngine(engineRef.current);
    return true;
  };

  const handleSelectOath = (oathId: string) => {
    setActiveOathId(oathId);
    if (engineRef.current) {
      engineRef.current.player.activeOath = oathId;
      audioManager.playPotion();
      addNotification('Sumpah Ksatria Suci diikrarkan!', 'success');
      syncStateFromEngine(engineRef.current);
    }
  };

  const handleEnterFloor = (floor: number) => {
    if (!engineRef.current) return;
    engineRef.current.enterDungeonFloor(floor);
    setDungeonFloor(floor);
    setMaxFloorReached((prev) => Math.max(prev, floor));
    setInDungeon(true);
    setShowDungeonModal(false);
    audioManager.playSelect();
    addNotification(`Memasuki Lantai ${floor}/100! Kalahkan musuh & bos menara!`, 'warn');
    syncStateFromEngine(engineRef.current);
  };

  const handleExitDungeon = () => {
    if (!engineRef.current) return;
    engineRef.current.exitDungeonToLobby();
    setInDungeon(false);
    audioManager.playSelect();
    addNotification('Kembali ke Lobi Suaka Ravenfall.', 'info');
    syncStateFromEngine(engineRef.current);
  };

  // Skill Unlocking Handler
  const handleUnlockSkill = (node: SkillNode) => {
    if (!engineRef.current) return;
    const currentSp = engineRef.current.player.sp || 0;
    if (currentSp < node.costSp) {
      addNotification('Poin Keterampilan (SP) tidak cukup!', 'warn');
      return;
    }

    // Deduct SP
    engineRef.current.player.sp = currentSp - node.costSp;

    // Apply stat bonuses to player base stats
    if (node.statBonus) {
      if (node.statBonus.atk) engineRef.current.player.baseAttack = (engineRef.current.player.baseAttack || 30) + node.statBonus.atk;
      if (node.statBonus.def) engineRef.current.player.baseDefense = (engineRef.current.player.baseDefense || 0) + node.statBonus.def;
      if (node.statBonus.spd) engineRef.current.player.baseSpeed = (engineRef.current.player.baseSpeed || 113) + node.statBonus.spd;
      if (node.statBonus.maxHp) {
        engineRef.current.player.baseMaxHp = (engineRef.current.player.baseMaxHp || 100) + node.statBonus.maxHp;
        engineRef.current.player.hp += node.statBonus.maxHp;
      }
      engineRef.current.recalculateStats();
    }

    setUnlockedSkills((prev) => [...prev, node.id]);
    setSkillNodes((prev) =>
      prev.map((n) => (n.id === node.id ? { ...n, unlocked: true } : n))
    );

    audioManager.playFanfare();
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    addNotification(`Berhasil Mempelajari: ${node.name}!`, 'success');
    syncStateFromEngine(engineRef.current);
  };

  // Direct Stat Point (SP) Allocation Handler ("Distem" System)
  const handleAllocateStatPoint = (statType: 'hp' | 'atk' | 'def' | 'spd') => {
    if (!engineRef.current) return;
    const p = engineRef.current.player;
    if ((p.sp || 0) <= 0) {
      addNotification('Poin Status (SP) tidak cukup! Naikkan level untuk mendapat SP.', 'warn');
      return;
    }

    p.sp -= 1;
    if (statType === 'hp') {
      p.baseMaxHp = (p.baseMaxHp || 100) + 20;
      p.hp = p.baseMaxHp + ((p.maxHp || 100) - (p.baseMaxHp - 20));
      addNotification('✨ Alokasi SP Berhasil: Vitalitas +20 Max HP!', 'success');
    } else if (statType === 'atk') {
      p.baseAttack = (p.baseAttack || 30) + 4;
      addNotification('✨ Alokasi SP Berhasil: Kekuatan +4 ATK!', 'success');
    } else if (statType === 'def') {
      p.baseDefense = (p.baseDefense || 0) + 2;
      addNotification('✨ Alokasi SP Berhasil: Ketahanan +2 DEF!', 'success');
    } else if (statType === 'spd') {
      p.baseSpeed = (p.baseSpeed || 113) + 5;
      addNotification('✨ Alokasi SP Berhasil: Kelincahan +5 SPD!', 'success');
    }

    engineRef.current.recalculateStats();
    audioManager.playLevelUp();
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    syncStateFromEngine(engineRef.current);
  };

  const handleEquipSkill = (skillId: string) => {
    setEquippedSkillId(skillId);
    if (engineRef.current) {
      engineRef.current.equippedDungeonSkillId = skillId;
    }
    const skillData = DUNGEON_COMBAT_SKILLS[skillId];
    const skillName = skillData ? skillData.name : skillId;
    audioManager.playSelect();
    addNotification(`⚡ Skill Aktif Diubah ke: ${skillName}! Tekan [F] saat bertarung untuk menggunakannya.`, 'success');
  };

  // Crafting Item Handler
  const handleCraftItem = (recipe: CraftingRecipe) => {
    if (!engineRef.current) return;

    // Check gold & materials
    if (engineRef.current.player.gold < recipe.requiredGold) {
      addNotification('Emas tidak cukup untuk menempa!', 'warn');
      return;
    }

    for (const mat of recipe.requiredMaterials) {
      const item = engineRef.current.inventory.find((i) => i.id === mat.itemId);
      if (!item || item.count < mat.count) {
        addNotification(`Bahan ${mat.name} tidak cukup!`, 'warn');
        return;
      }
    }

    // Deduct gold
    engineRef.current.player.gold -= recipe.requiredGold;

    // Deduct ingredients
    for (const mat of recipe.requiredMaterials) {
      const item = engineRef.current.inventory.find((i) => i.id === mat.itemId);
      if (item) {
        item.count -= mat.count;
      }
    }
    engineRef.current.inventory = engineRef.current.inventory.filter((i) => i.count > 0);

    // Add created item
    engineRef.current.addItem({ ...recipe.resultItem });

    audioManager.playLevelUp();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.5 } });
    addNotification(`Berhasil Menempa: ${recipe.resultItem.name}!`, 'success');
    syncStateFromEngine(engineRef.current);
  };

  // Equip / Unequip / Use
  const handleEquipItem = (item: ItemData) => {
    if (!engineRef.current) return;
    engineRef.current.equipItem(item as any);
  };

  const handleUnequipItem = (slot: 'weapon' | 'armor' | 'accessory') => {
    if (!engineRef.current) return;
    engineRef.current.unequipItem(slot);
  };

  const handleUseItem = (id: string) => {
    if (!engineRef.current) return;
    engineRef.current.useItem(id);
  };

  const handleRevive = () => {
    if (!engineRef.current) return;
    engineRef.current.revivePlayer();
    setIsGameOver(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* TOP BAR / STUDIO HEADER */}
      <header className="h-10 sm:h-14 bg-slate-900/95 border-b border-slate-800 px-1.5 sm:px-4 flex items-center justify-between z-30 shrink-0 backdrop-blur">
        {/* Title and Region */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xs sm:text-base shadow shrink-0">
            G4
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <h1 className="text-[10px] sm:text-sm font-bold text-amber-200 tracking-wide font-sans truncate max-w-[90px] sm:max-w-none">
                Godot 4 2D RPG Studio
              </h1>
              <span className="hidden md:inline-block text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                Gothic Horror Edition
              </span>
            </div>
            <div className="flex items-center gap-1 text-[8px] sm:text-[10px] text-slate-400 font-mono">
              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400 shrink-0" />
              <span className="text-slate-300 font-semibold truncate">{activeRegion}</span>
            </div>
          </div>
        </div>

        {/* Quick Top Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* HD Toggle */}
          <button
            id="toggle-hd-btn"
            onClick={toggleHDMode}
            className={`p-1 sm:px-2 sm:py-1 rounded-md text-[9px] sm:text-[11px] font-mono border flex items-center gap-1 transition ${
              isHDMode
                ? 'bg-sky-950/80 border-sky-600 text-sky-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle Resolusi HD (480x270 vs 320x180)"
          >
            <Tv className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400" />
            <span className="hidden sm:inline">{isHDMode ? 'HD 480p' : 'Piksel 180p'}</span>
          </button>

          {/* Blood Moon Toggle */}
          <button
            id="toggle-blood-moon-btn"
            onClick={toggleBloodMoon}
            className={`p-1 sm:p-1.5 rounded-md border text-xs transition ${
              isBloodMoon
                ? 'bg-red-950/80 border-red-600 text-red-300 shadow-md shadow-red-950'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle Suasana Purnama Darah (Blood Moon)"
          >
            <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" />
          </button>

          {/* Save / Load Buttons */}
          <button
            id="quick-save-btn"
            onClick={() => {
              handleAutoSaveGame();
              addNotification('💾 Permainan berhasil disimpan!', 'success');
            }}
            className="p-1 sm:p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 hover:text-emerald-300 transition"
            title="Simpan Permainan"
          >
            <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          <button
            id="quick-load-btn"
            onClick={handleLoadGame}
            className="p-1 sm:p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 hover:text-amber-300 transition"
            title="Muat Data Simpanan"
          >
            <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Dungeon 100 Floors Modal Button */}
          {!isInMainMenu && (inDungeon ? (
            <button
              id="exit-dungeon-header-btn"
              onClick={handleExitDungeon}
              className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-red-800 hover:bg-red-700 text-white text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition shadow animate-pulse"
              title="Keluar dari Menara kembali ke Lobi Suaka"
            >
              <Castle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Keluar (Lt. {dungeonFloor})</span>
              <span className="xs:hidden">Lt.{dungeonFloor}</span>
            </button>
          ) : (
            <button
              id="open-dungeon-header-btn"
              onClick={() => setShowDungeonModal(true)}
              className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-gradient-to-r from-amber-700 to-yellow-600 hover:from-amber-600 hover:to-yellow-500 border border-amber-400/80 text-amber-950 text-[10px] sm:text-xs font-bold flex items-center gap-1 transition shadow"
              title="Buka Menu Menara 100 Lantai (Dungeon Master)"
            >
              <Castle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-950" />
              <span className="hidden sm:inline">Menara 100 Lt</span>
            </button>
          ))}

          {/* Enchanting & Sacred Oaths Button */}
          {!isInMainMenu && (
            <button
              id="open-enchanting-header-btn"
              onClick={() => setShowEnchantingModal(true)}
              className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-purple-950/90 hover:bg-purple-900 border border-purple-600/80 text-purple-200 text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition shadow"
              title="Buka Bengkel Penempaan Senjata & Sumpah Suci Ksatria"
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Enchanting</span>
            </button>
          )}

          {/* Godot 4 Studio Architecture Modal Button */}
          <button
            id="open-architecture-btn"
            onClick={() => setShowArchitecture((prev) => !prev)}
            className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition shadow"
          >
            <Code2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Studio Godot 4</span>
          </button>

          {/* Gameplay Guide Button */}
          <button
            id="open-gameplay-guide-btn"
            onClick={() => {
              audioManager.playSelect();
              setShowGameplayGuide(true);
            }}
            className="p-1 sm:px-2.5 sm:py-1 rounded-md bg-stone-800 hover:bg-stone-700 border border-amber-900/60 text-amber-300 text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition shadow"
            title="Panduan Gameplay & Kontrol"
          >
            <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Panduan</span>
          </button>

          {/* Main Menu Button */}
          <button
            id="open-main-menu-btn"
            onClick={handleReturnToMainMenu}
            className="p-1 sm:px-2.5 sm:py-1 rounded-md bg-rose-950/90 hover:bg-rose-900 border border-rose-700 text-rose-200 text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition shadow-sm"
            title="Keluar ke Menu Utama & Simpan Permainan"
          >
            <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Menu Utama</span>
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT / CANVAS CONTAINER */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {/* The 2D RPG Engine Canvas */}
        <canvas
          id="rpg-game-canvas"
          ref={canvasRef}
          className="w-full h-full max-w-[1920px] max-h-[1080px] object-contain cursor-crosshair"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* HUD OVERLAYS (TOP-LEFT) */}
        <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-20 flex flex-col gap-1 sm:gap-1.5 pointer-events-none">
          {/* Player Identity & Compact Health Gauge */}
          <div className="bg-slate-950/85 border border-amber-900/50 rounded-md sm:rounded-lg p-1.5 sm:p-2 backdrop-blur-md shadow-lg max-w-[155px] sm:max-w-[240px] pointer-events-auto select-none">
            {/* Player Name / Edit Bar */}
            {isEditingName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSavePlayerName(tempName);
                }}
                className="flex items-center gap-1 mb-1"
              >
                <input
                  id="player-name-input"
                  type="text"
                  maxLength={16}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  autoFocus
                  placeholder="Nama..."
                  className="w-full bg-slate-900 border border-amber-500 text-amber-100 text-[10px] sm:text-xs px-1 py-0.5 rounded font-bold outline-none focus:ring-1 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  id="save-name-btn"
                  title="Simpan Nama"
                  className="p-0.5 sm:p-1 rounded bg-amber-600 hover:bg-amber-500 text-white transition"
                >
                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
                <button
                  type="button"
                  id="cancel-name-btn"
                  title="Batal"
                  onClick={() => setIsEditingName(false)}
                  className="p-0.5 sm:p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[10px] sm:text-xs font-bold text-amber-100 truncate max-w-[70px] sm:max-w-[110px]" title={playerName}>
                    {playerName}
                  </span>
                  <button
                    id="edit-name-btn"
                    onClick={() => {
                      setTempName(playerName);
                      setIsEditingName(true);
                    }}
                    title="Ubah Nama Karakter"
                    className="p-0.5 rounded text-amber-400/70 hover:text-amber-300 hover:bg-amber-950/60 transition"
                  >
                    <Edit3 className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                  </button>
                  <span className="text-[8px] sm:text-[9px] font-mono px-0.5 sm:px-1 py-0.1 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 font-semibold">
                    Lv.{playerLevel}
                  </span>
                </div>
                <span className="hidden sm:inline text-[8.5px] font-mono text-amber-300/80 font-medium">Ksatria Putih</span>
              </div>
            )}

            {/* Health Bar (Red / Blood) */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono leading-tight">
                <span className="flex items-center gap-0.5 sm:gap-1 text-red-400 font-bold">
                  <Heart className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-red-400" />
                  HP
                </span>
                <span className="text-red-300 text-[8.5px] sm:text-[9.5px]">
                  {playerHp}/{playerMaxHp}
                </span>
              </div>
              <div className="w-full h-1.5 sm:h-2 bg-slate-900 rounded-full overflow-hidden border border-red-950/80 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, (playerHp / playerMaxHp) * 100))}%` }}
                />
              </div>
            </div>

            {/* EXP Bar (Purple) */}
            <div className="space-y-0.5 mt-0.5 sm:mt-1">
              <div className="flex items-center justify-between text-[7px] sm:text-[8px] font-mono text-slate-400 leading-none">
                <span>EXP</span>
                <span>
                  {playerExp}/{playerNextExp}
                </span>
              </div>
              <div className="w-full h-0.5 sm:h-1 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, (playerExp / playerNextExp) * 100))}%` }}
                />
              </div>
            </div>

            {/* Quick Stats Badges */}
            <div className="flex items-center justify-between mt-1 pt-0.5 sm:pt-1 border-t border-slate-800/80 text-[8px] sm:text-[9px] font-mono">
              <span className="flex items-center gap-0.5 text-rose-300" title="Kekuatan Serangan">
                <Sword className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-rose-400" />
                {playerAttack}
              </span>
              <span className="flex items-center gap-0.5 text-sky-300" title="Pertahanan Armor">
                <Shield className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-sky-400" />
                {playerDefense}
              </span>
              <span className="flex items-center gap-0.5 text-amber-300" title="Uang Koin Emas">
                <Coins className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-amber-400" />
                {playerGold}G
              </span>
            </div>

            {/* Combat Stance & Skill Indicators */}
            <div className="grid grid-cols-4 gap-0.5 mt-1 pt-0.5 sm:pt-1 border-t border-slate-800/80 text-[7px] sm:text-[8px] font-mono text-center">
              <span
                className={`py-0.5 rounded border transition-all ${
                  isParrying
                    ? 'bg-yellow-400 text-black border-yellow-200 font-bold shadow-sm shadow-yellow-400'
                    : 'bg-slate-900 text-yellow-300/90 border-yellow-950'
                }`}
                title="Tangkis Serangan [Q / C]"
              >
                Parry
              </span>
              <span
                className={`py-0.5 rounded border transition-all ${
                  isDefending
                    ? 'bg-sky-500 text-black border-sky-200 font-bold shadow-sm shadow-sky-400 animate-pulse'
                    : 'bg-slate-900 text-sky-300/90 border-sky-950'
                }`}
                title="Tahan Tameng [Shift]"
              >
                Guard
              </span>
              <span
                className="py-0.5 rounded bg-slate-900 text-amber-300/90 border border-amber-950 hover:border-amber-800 transition-colors"
                title="Bilah Cahaya Fajar [R]"
              >
                Blade
              </span>
              <span
                className="py-0.5 rounded bg-slate-900 text-sky-300/90 border border-sky-950 hover:border-sky-800 transition-colors"
                title="Penghakiman Suci [F]"
              >
                Smite
              </span>
            </div>
          </div>
        </div>

        {/* HUD OVERLAYS (TOP-RIGHT QUICK ACTION BUTTONS) */}
        <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 z-20 flex flex-col gap-1 sm:gap-1.5 items-end pointer-events-auto">
          {/* Open Inventory Button */}
          <button
            id="hud-bag-btn"
            onClick={() => setShowInventory((prev) => !prev)}
            className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-amber-700/60 text-amber-200 text-[10px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-2 backdrop-blur shadow-lg transition active:scale-95"
          >
            <Package className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
            <span className="hidden sm:inline">Tas Inventaris</span>
            <span className="sm:hidden">Tas</span>
            <span className="hidden sm:inline text-[10px] font-mono bg-slate-950 px-1 rounded text-slate-400">[I]</span>
          </button>

          {/* Open Grimoire Progression Button */}
          <button
            id="hud-grimoire-btn"
            onClick={() => setShowProgression((prev) => !prev)}
            className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-purple-700/60 text-purple-200 text-[10px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-2 backdrop-blur shadow-lg transition active:scale-95"
          >
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
            <span className="hidden sm:inline">Grimoire &amp; Skill</span>
            <span className="sm:hidden">Grimoire</span>
            <span className="hidden sm:inline text-[10px] font-mono bg-slate-950 px-1 rounded text-slate-400">[G]</span>
            {playerSp > 0 && (
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-400 animate-pulse" />
            )}
          </button>

          {/* Quick Engine Debug Controls Dropdown Pill */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-md sm:rounded-lg p-1 sm:p-1.5 flex items-center gap-1 text-[8px] sm:text-[11px] font-mono text-slate-400">
            <button
              id="toggle-ysort-btn"
              onClick={toggleYSort}
              className={`px-1 py-0.5 rounded transition ${
                showYSortLines ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'hover:text-slate-200'
              }`}
              title="Garis Titik Poros Y-Sort [Y]"
            >
              Y-Sort
            </button>
            <span className="text-slate-700">|</span>
            <button
              id="toggle-chunks-btn"
              onClick={toggleChunks}
              className={`px-1 py-0.5 rounded transition ${
                showChunks ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'hover:text-slate-200'
              }`}
              title="Batas Area Chunks [C]"
            >
              Chunk
            </button>
            <span className="text-slate-700">|</span>
            <button
              id="toggle-lighting-btn"
              onClick={toggleLighting}
              className={`px-1 py-0.5 rounded transition ${
                dynamicLighting ? 'text-amber-300' : 'text-slate-600 line-through'
              }`}
              title="Pencahayaan 2D PointLight [L]"
            >
              Light
            </button>
          </div>
        </div>

        {/* NOTIFICATION TOASTS (BOTTOM-LEFT) */}
        <div className="absolute bottom-16 sm:bottom-4 left-3 z-30 flex flex-col gap-1.5 pointer-events-none max-w-sm">
          <AnimatePresence>
            {notifications.map((n) => {
              const Icon = n.type === 'success' ? CheckCircle2 : n.type === 'warn' ? AlertCircle : Info;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs font-mono backdrop-blur-md shadow-lg border ${
                    n.type === 'success'
                      ? 'bg-emerald-950/90 border-emerald-600/80 text-emerald-200'
                      : n.type === 'warn'
                      ? 'bg-rose-950/90 border-rose-600/80 text-rose-200'
                      : 'bg-slate-900/90 border-slate-700/80 text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{n.message}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* GAME OVER SCREEN OVERLAY */}
        {isGameOver && !isInMainMenu && (
          <GameOver
            onRespawn={handleRespawn}
            onReturnToMainMenu={handleReturnToMainMenu}
            playerLevel={playerLevel}
            playerGold={playerGold}
            inDungeon={inDungeon}
            dungeonFloor={dungeonFloor}
            onRetryFloor={handleRetryDungeonFloor}
          />
        )}

        {/* MAIN MENU OVERLAY */}
        {isInMainMenu && (
          <MainMenu
            onStartNewGame={handleStartNewGame}
            onLoadGame={handleLoadGame}
            onOpenGuide={() => setShowArchitecture(true)}
            hasSaveData={!!currentSaveData}
            saveData={currentSaveData}
            onDeleteSaveData={handleDeleteSaveData}
          />
        )}

        {/* DIALOGUE BOX (Godot RichTextLabel Simulation) */}
        <DialogueBox
          dialogue={currentDialogue}
          onOptionSelect={handleDialogueOption}
          onClose={() => setCurrentDialogue(null)}
        />
      </div>

      {/* BOTTOM ACTION BAR / KEYBOARD HINTS (DESKTOP) */}
      <footer className="hidden md:flex h-9 bg-slate-900 border-t border-slate-800 px-4 items-center justify-between text-[11px] font-mono text-slate-400 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">WASD</span>
            <span>Gerak</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">J</span>
            <span>Tebas</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-bold">Q / C</span>
            <span>Parry</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300 font-bold">Shift</span>
            <span>Guard</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300">R</span>
            <span>Tebasan Suci</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300">F</span>
            <span>Smite</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">E</span>
            <span>NPC/Peti</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>[I] Tas</span>
          <span>[G] Grimoire</span>
          <span>[B] Kode Godot</span>
          <span>[H] HD</span>
          <span>[M] Bulan Darah</span>
        </div>
      </footer>

      {/* VIRTUAL GAMEPAD (MOBILE / TOUCH SCREEN) */}
      <VirtualGamepad
        onDirectionChange={(dir, pressed) => {
          if (!engineRef.current) return;
          if (dir === 'up') engineRef.current.input.move_up = pressed;
          if (dir === 'down') engineRef.current.input.move_down = pressed;
          if (dir === 'left') engineRef.current.input.move_left = pressed;
          if (dir === 'right') engineRef.current.input.move_right = pressed;
        }}
        onAttack={() => {
          if (engineRef.current) engineRef.current.triggerAttack();
        }}
        onParry={() => {
          if (engineRef.current) engineRef.current.triggerParry();
        }}
        onDefend={(active) => {
          if (engineRef.current) engineRef.current.triggerDefense(active);
        }}
        onWeaponSkill={() => {
          if (engineRef.current) engineRef.current.triggerWeaponSkill();
        }}
        onDungeonSkill={() => {
          if (engineRef.current) engineRef.current.triggerDungeonSkill();
        }}
        onInteract={() => {
          if (engineRef.current) engineRef.current.triggerInteract();
        }}
        onOpenInventory={() => setShowInventory(true)}
      />

      {/* MODAL 1: INVENTORY & EQUIPMENT */}
      <InventoryModal
        isOpen={showInventory}
        onClose={() => setShowInventory(false)}
        inventory={inventory}
        equipment={equipment}
        onUseItem={handleUseItem}
        onEquipItem={handleEquipItem}
        onUnequipItem={handleUnequipItem}
        playerHp={playerHp}
        maxHp={playerMaxHp}
        playerGold={playerGold}
        playerAttack={playerAttack}
        playerDefense={playerDefense}
        playerSpeed={playerSpeed}
      />

      {/* MODAL 2: GOTHIC SKILL PROGRESSION & CRAFTING & BESTIARY & QUESTS */}
      <GothicSkillProgression
        isOpen={showProgression}
        onClose={() => setShowProgression(false)}
        skillNodes={skillNodes}
        recipes={recipes}
        bestiary={bestiary}
        unlockedSkills={unlockedSkills}
        onUnlockSkill={handleUnlockSkill}
        equippedSkillId={equippedSkillId}
        onEquipSkill={handleEquipSkill}
        unlockedDungeonSkillIds={engineRef.current?.unlockedDungeonSkills || ['holy_cross_slash']}
        inventory={inventory}
        onCraftItem={handleCraftItem}
        gold={playerGold}
        playerSp={playerSp}
        onAllocateStatPoint={handleAllocateStatPoint}
        playerMaxHp={playerMaxHp}
        playerAttack={playerAttack}
        playerDefense={playerDefense}
        playerSpeed={playerSpeed}
      />

      {/* MODAL 3: GODOT 4 ARCHITECTURE & GDSCRIPT STUDIO */}
      {showArchitecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="max-w-4xl w-full max-h-[92vh] overflow-y-auto relative">
            <button
              id="close-architecture-btn"
              onClick={() => setShowArchitecture(false)}
              className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono transition"
            >
              ✕ Tutup [B]
            </button>
            <GodotArchitectureViewer />
          </div>
        </div>
      )}

      {/* MODAL 4: MENARA 100 LANTAI (DUNGEON MODAL) */}
      <DungeonModal
        isOpen={showDungeonModal}
        onClose={() => setShowDungeonModal(false)}
        currentFloor={dungeonFloor}
        maxFloorReached={maxFloorReached}
        onEnterFloor={handleEnterFloor}
        onExitDungeon={handleExitDungeon}
        activeOathId={activeOathId}
        onSelectOath={handleSelectOath}
        inDungeon={inDungeon}
      />

      {/* MODAL 5: ENCHANTING & SACRED OATHS */}
      <EnchantingModal
        isOpen={showEnchantingModal}
        onClose={() => setShowEnchantingModal(false)}
        playerGold={playerGold}
        equipment={equipment}
        onUpgradeWeapon={handleUpgradeWeapon}
        onUpgradeArmor={handleUpgradeArmor}
        activeOathId={activeOathId}
        onSelectOath={handleSelectOath}
      />

      {/* CINEMATIC REGION TITLECARD (New Elegant Notification) */}
      <AnimatePresence>
        {regionBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-12 sm:top-16 left-1/2 z-40 flex flex-col items-center pointer-events-none w-[90%] max-w-sm"
          >
            <div className="bg-slate-950/95 border border-red-900/60 px-4 py-2 rounded-full shadow-xl backdrop-blur-md flex items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[8px] font-mono font-bold text-red-500 uppercase tracking-wider shrink-0 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800/40">
                  {regionBanner.danger}
                </span>
                <div className="min-w-0">
                  <h2 className="font-serif text-xs sm:text-sm font-black text-white tracking-tight truncate">
                    {regionBanner.name}
                  </h2>
                  <p className="text-purple-300/80 text-[9px] sm:text-[10px] font-medium tracking-wide truncate">
                    {regionBanner.subtitle}
                  </p>
                </div>
              </div>
              <span className="text-[7px] sm:text-[8px] font-mono text-stone-500 uppercase tracking-widest shrink-0 border-l border-slate-800 pl-2">
                Wilayah
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAST TRAVEL MODAL */}
      <FastTravelModal
        isOpen={isFastTravelOpen}
        onClose={() => setIsFastTravelOpen(false)}
        chunks={engineRef.current?.chunks || []}
        currentChunkId={engineRef.current?.getCurrentChunkId() || 'domain_village'}
        onTravel={handleFastTravel}
      />

      {/* MODAL 5: GAMEPLAY GUIDE & CONTROLS */}
      <GameplayGuideModal
        isOpen={showGameplayGuide}
        onClose={() => setShowGameplayGuide(false)}
      />
    </div>
  );
}
