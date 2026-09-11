import { ItemData, EquipmentSlots } from '../types/game';

export interface SaveData {
  playerName: string;
  hp: number;
  maxHp: number;
  baseMaxHp?: number;
  gold: number;
  level: number;
  exp: number;
  nextExp: number;
  sp: number;
  attackPower: number;
  baseAttack?: number;
  defense: number;
  baseDefense?: number;
  speed: number;
  baseSpeed?: number;
  inventory: ItemData[];
  equipment: EquipmentSlots;
  unlockedSkills: string[];
  equippedSkillId: string;
  unlockedDungeonSkills: string[];
  maxFloorReached: number;
  activeOathId: string | null;
  claimedRewards: Record<string, boolean>;
  savedAt: string;
}

const SAVE_KEY = 'bloodfall_requiem_save_v1';

export function saveGameData(data: SaveData): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Failed to save game data:', err);
    return false;
  }
}

export function getSaveGameData(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch (err) {
    console.error('Failed to load save data:', err);
    return null;
  }
}

export function deleteSaveGameData(): boolean {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch (err) {
    console.error('Failed to delete save data:', err);
    return false;
  }
}
