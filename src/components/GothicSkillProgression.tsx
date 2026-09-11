import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Hammer,
  Zap,
  Shield,
  Heart,
  Skull,
  X,
  Plus,
  Flame,
  Coins,
} from 'lucide-react';
import { audioManager } from '../game/audio';
import {
  CraftingRecipe,
  SkillNode,
  MonsterCodexEntry,
  ItemData,
} from '../types/game';

import { DUNGEON_COMBAT_SKILLS } from '../game/dungeonSystem';

interface GothicSkillProgressionProps {
  isOpen: boolean;
  onClose: () => void;
  skillNodes: SkillNode[];
  recipes: CraftingRecipe[];
  bestiary: MonsterCodexEntry[];
  unlockedSkills: string[];
  onUnlockSkill: (node: SkillNode) => void;
  equippedSkillId?: string;
  onEquipSkill?: (skillId: string) => void;
  unlockedDungeonSkillIds?: string[];
  inventory: ItemData[];
  onCraftItem: (recipe: CraftingRecipe) => void;
  gold: number;
  playerSp?: number;
  onAllocateStatPoint?: (statType: 'hp' | 'atk' | 'def' | 'spd') => void;
  playerMaxHp?: number;
  playerAttack?: number;
  playerDefense?: number;
  playerSpeed?: number;
}

export const GothicSkillProgression: React.FC<GothicSkillProgressionProps> = ({
  isOpen,
  onClose,
  skillNodes,
  recipes,
  bestiary,
  unlockedSkills,
  onUnlockSkill,
  equippedSkillId = 'holy_cross_slash',
  onEquipSkill,
  unlockedDungeonSkillIds = ['holy_cross_slash'],
  inventory,
  onCraftItem,
  gold,
  playerSp = 2,
  onAllocateStatPoint,
  playerMaxHp = 100,
  playerAttack = 30,
  playerDefense = 0,
  playerSpeed = 113,
}) => {
  const [progressionTab, setProgressionTab] = useState<'skills' | 'crafting' | 'bestiary'>('skills');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Helper to check if crafting ingredients and gold are available
  const canCraft = (recipe: CraftingRecipe) => {
    if (gold < recipe.requiredGold) return false;
    return recipe.requiredMaterials.every((mat) => {
      const item = inventory.find((i) => i.id === mat.itemId);
      return item && item.count >= mat.count;
    });
  };

  // Group skill nodes by branch
  const offenseSkills = skillNodes.filter((n) => n.branch === 'Offense');
  const defenseSkills = skillNodes.filter((n) => n.branch === 'Defense');
  const utilitySkills = skillNodes.filter((n) => n.branch === 'Utility');

  const branches = [
    { name: 'Kutukan Serang (Offense)', icon: '⚔️', nodes: offenseSkills },
    { name: 'Ketahanan Darah (Defense)', icon: '🛡️', nodes: defenseSkills },
    { name: 'Kelincahan Malam (Utility)', icon: '⚡', nodes: utilitySkills },
  ];

  return (
    <div
      id="gothic-progression-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          audioManager.playSelect();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        id="gothic-progression-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border-2 border-purple-700/80 rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl text-slate-100 flex flex-col gap-4 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-purple-100 tracking-wide font-sans">
                Grimoire Petualang Gothic Ravenfall
              </h2>
              <p className="text-[11px] text-slate-400">
                Pohon Keterampilan (Skill Tree), Tempa Relik, Monster Codex &amp; Log Misi
              </p>
            </div>
          </div>
          <button
            id="close-progression-btn"
            type="button"
            onClick={() => {
              audioManager.playSelect();
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Tutup (Esc)</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            id="tab-skills-btn"
            onClick={() => setProgressionTab('skills')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
              progressionTab === 'skills'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Pohon Keterampilan ({unlockedSkills.length})
          </button>
          <button
            id="tab-crafting-btn"
            onClick={() => setProgressionTab('crafting')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
              progressionTab === 'crafting'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            Tempa &amp; Crafting Relik
          </button>
          <button
            id="tab-bestiary-btn"
            onClick={() => setProgressionTab('bestiary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
              progressionTab === 'bestiary'
                ? 'bg-rose-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Skull className="w-3.5 h-3.5" />
            Bestiary Makhluk Terkutuk
          </button>
        </div>

        {/* TAB 1: SKILL TREE */}
        {progressionTab === 'skills' && (
          <div className="space-y-4">
            {/* Active Combat Skill Loadout & Swap Section */}
            <div className="bg-slate-950/90 border border-sky-800/80 rounded-xl p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-sky-900/60">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-sky-400 animate-pulse" />
                  <h3 className="text-xs font-bold font-mono text-sky-200 uppercase tracking-wider">
                    LOADOUT SKILL UTAMA COMBAT [TEKAN F SAAT BERTARUNG]
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-sky-950/70 border border-sky-800/60 px-2 py-0.5 rounded">
                  Pilih skill aktif untuk slot tombol [F]
                </span>
              </div>

              {/* Skills Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {Object.values(DUNGEON_COMBAT_SKILLS).map((skill) => {
                  const isEquipped = equippedSkillId === skill.id;
                  const isUnlocked = unlockedDungeonSkillIds.includes(skill.id) || skill.id === 'holy_cross_slash';

                  return (
                    <div
                      key={skill.id}
                      className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between transition ${
                        isEquipped
                          ? 'bg-sky-950/80 border-sky-400 shadow-md shadow-sky-900/40 ring-1 ring-sky-400'
                          : isUnlocked
                          ? 'bg-slate-900/80 border-slate-700/80 hover:border-sky-600'
                          : 'bg-slate-950/60 border-slate-900 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                            <span className="text-sm">{skill.icon}</span>
                            {skill.name}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-sky-400">
                            CD: {skill.cooldown}s
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 mb-2 leading-relaxed">
                          {skill.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[9px] font-mono text-amber-400 font-semibold">
                          Dmg: x{skill.power}
                        </span>

                        {isEquipped ? (
                          <span className="text-[10px] font-mono font-bold text-sky-300 bg-sky-950 px-2 py-0.5 rounded border border-sky-500/80 flex items-center gap-1">
                            ★ TERPASANG [F]
                          </span>
                        ) : isUnlocked ? (
                          <button
                            id={`equip-skill-${skill.id}`}
                            onClick={() => onEquipSkill && onEquipSkill(skill.id)}
                            className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-mono text-[10px] font-bold shadow transition active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            Gunakan
                          </button>
                        ) : (
                          <span className="text-[9px] font-mono text-slate-500 italic">
                            🔒 Buka di Menara
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <span>
                Pelajari bakat kutukan untuk memperkuat karakter. Kalahkan monster dan naikkan level untuk memperoleh Poin Keterampilan (SP).
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-purple-300 font-bold bg-purple-950/60 px-2.5 py-1 rounded border border-purple-800">
                  SP Tersedia: {playerSp} Poin
                </span>
                <span className="font-mono text-emerald-300 font-bold">
                  Aktif: {unlockedSkills.length} Bakat
                </span>
              </div>
            </div>

            {/* DISTEM / STAT ALLOCATION PANEL */}
            <div className="bg-gradient-to-r from-slate-950 via-purple-950/40 to-slate-950 border border-purple-900/60 rounded-xl p-3.5 shadow-xl">
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-purple-900/40">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-amber-200 text-xs uppercase tracking-wider">
                    Alokasi Status Karakter (Distem Poin SP)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-700 font-semibold">
                  SP Tersedia: {playerSp || 0} Poin
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Vitalitas (Max HP) */}
                <div className="bg-slate-900/90 border border-red-900/50 rounded-lg p-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-red-400 font-bold text-xs mb-1">
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 fill-red-400" /> Vitalitas (HP)</span>
                    </div>
                    <div className="text-[11px] font-mono text-red-200 font-semibold mb-2">
                      {playerMaxHp} Max HP
                    </div>
                  </div>
                  <button
                    onClick={() => onAllocateStatPoint && onAllocateStatPoint('hp')}
                    disabled={(playerSp || 0) <= 0}
                    className="w-full py-1 rounded text-xs font-bold font-mono transition bg-red-950/90 hover:bg-red-900 border border-red-700 text-red-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3 h-3" /> +20 HP (1 SP)
                  </button>
                </div>

                {/* Kekuatan (ATK) */}
                <div className="bg-slate-900/90 border border-rose-900/50 rounded-lg p-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-rose-400 font-bold text-xs mb-1">
                      <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> Kekuatan (ATK)</span>
                    </div>
                    <div className="text-[11px] font-mono text-rose-200 font-semibold mb-2">
                      {playerAttack} ATK
                    </div>
                  </div>
                  <button
                    onClick={() => onAllocateStatPoint && onAllocateStatPoint('atk')}
                    disabled={(playerSp || 0) <= 0}
                    className="w-full py-1 rounded text-xs font-bold font-mono transition bg-rose-950/90 hover:bg-rose-900 border border-rose-700 text-rose-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3 h-3" /> +4 ATK (1 SP)
                  </button>
                </div>

                {/* Pertahanan (DEF) */}
                <div className="bg-slate-900/90 border border-sky-900/50 rounded-lg p-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-sky-400 font-bold text-xs mb-1">
                      <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Pertahanan (DEF)</span>
                    </div>
                    <div className="text-[11px] font-mono text-sky-200 font-semibold mb-2">
                      {playerDefense} DEF
                    </div>
                  </div>
                  <button
                    onClick={() => onAllocateStatPoint && onAllocateStatPoint('def')}
                    disabled={(playerSp || 0) <= 0}
                    className="w-full py-1 rounded text-xs font-bold font-mono transition bg-sky-950/90 hover:bg-sky-900 border border-sky-700 text-sky-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3 h-3" /> +2 DEF (1 SP)
                  </button>
                </div>

                {/* Kelincahan (SPD) */}
                <div className="bg-slate-900/90 border border-amber-900/50 rounded-lg p-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-amber-400 font-bold text-xs mb-1">
                      <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Kelincahan (SPD)</span>
                    </div>
                    <div className="text-[11px] font-mono text-amber-200 font-semibold mb-2">
                      {playerSpeed} SPD
                    </div>
                  </div>
                  <button
                    onClick={() => onAllocateStatPoint && onAllocateStatPoint('spd')}
                    disabled={(playerSp || 0) <= 0}
                    className="w-full py-1 rounded text-xs font-bold font-mono transition bg-amber-950/90 hover:bg-amber-900 border border-amber-700 text-amber-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3 h-3" /> +5 SPD (1 SP)
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {branches.map((branch, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-800">
                      <span className="text-xl">{branch.icon}</span>
                      <h3 className="font-bold text-slate-200 text-xs font-sans">{branch.name}</h3>
                    </div>

                    <div className="space-y-2 mt-2">
                      {branch.nodes.map((node) => {
                        const isUnlocked = unlockedSkills.includes(node.id) || node.unlocked;
                        const canUnlock = !isUnlocked && playerSp >= node.costSp;

                        return (
                          <div
                            key={node.id}
                            className={`p-2.5 rounded-lg border text-xs transition ${
                              isUnlocked
                                ? 'bg-purple-950/40 border-purple-600/60 text-purple-200'
                                : 'bg-slate-900/60 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold flex items-center gap-1.5">
                                {isUnlocked ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                )}
                                {node.name}
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                                Tingkat {node.tier}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                              {node.description}
                            </p>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                              <span className="text-[10px] font-mono text-purple-400 font-semibold">
                                Biaya: {node.costSp} SP
                              </span>
                              {!isUnlocked && (
                                <button
                                  id={`unlock-skill-${node.id}`}
                                  onClick={() => onUnlockSkill(node)}
                                  disabled={!canUnlock}
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition ${
                                    canUnlock
                                      ? 'bg-purple-700 hover:bg-purple-600 text-white cursor-pointer active:scale-95'
                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                                  }`}
                                >
                                  <Plus className="w-3 h-3" />
                                  Pelajari
                                </button>
                              )}
                              {isUnlocked && (
                                <span className="text-[10px] text-emerald-400 font-mono">
                                  Telah Dikuasai
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CRAFTING & FORGE */}
        {progressionTab === 'crafting' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <span>
                Kombinasikan material gothic dari monster atau peti rahasia untuk menempa ramuan dan perlengkapan sakti.
              </span>
              <span className="font-mono text-amber-400 font-bold flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                {gold} Gold
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recipes.map((recipe) => {
                const ready = canCraft(recipe);
                return (
                  <div
                    key={recipe.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{recipe.resultItem.icon}</span>
                          <div>
                            <h4 className="font-bold text-amber-200 text-xs sm:text-sm">
                              {recipe.resultItem.name}
                            </h4>
                            <p className="text-[10px] text-slate-400">{recipe.description}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                          {recipe.resultItem.category}
                        </span>
                      </div>

                      {/* Required Materials */}
                      <div className="mt-3 space-y-1.5">
                        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Bahan Diperlukan:</span>
                          <span className="text-amber-400">Biaya: {recipe.requiredGold} Gold</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {recipe.requiredMaterials.map((mat) => {
                            const playerItem = inventory.find((i) => i.id === mat.itemId);
                            const currentCount = playerItem ? playerItem.count : 0;
                            const hasEnough = currentCount >= mat.count;
                            return (
                              <div
                                key={mat.itemId}
                                className={`px-2 py-1 rounded text-[11px] font-mono flex items-center justify-between border ${
                                  hasEnough
                                    ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                                    : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                                }`}
                              >
                                <span className="truncate flex items-center gap-1">
                                  <span>{mat.icon}</span>
                                  <span>{mat.name}</span>
                                </span>
                                <span className="font-bold shrink-0 ml-1">
                                  {currentCount}/{mat.count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end">
                      <button
                        id={`craft-btn-${recipe.id}`}
                        onClick={() => onCraftItem(recipe)}
                        disabled={!ready}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                          ready
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/50 cursor-pointer active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                        }`}
                      >
                        <Hammer className="w-3.5 h-3.5" />
                        {ready ? 'Tempa Relik Ini' : 'Bahan / Emas Belum Cukup'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: BESTIARY CODEX */}
        {progressionTab === 'bestiary' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              Dokumentasi makhluk malam Ravenfall, kelemahan elemen pertempuran, dan persentase jarahan drop item.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bestiary.map((beast) => (
                <div
                  key={beast.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                      <div className="w-9 h-9 rounded-lg bg-rose-950/60 border border-rose-800 flex items-center justify-center text-xl">
                        {beast.type === 'skeleton' ? '💀' : beast.type === 'ghoul' ? '🧟' : beast.type === 'vampire_bat' ? '🦇' : '👑'}
                      </div>
                      <div>
                        <h4 className="font-bold text-rose-200 text-xs sm:text-sm">{beast.name}</h4>
                        <span className="text-[9px] font-mono text-slate-400">
                          Tingkat Bahaya: {beast.threatLevel} | Korban Gugur: {beast.kills}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 my-2 leading-relaxed">
                      {beast.lore}
                    </p>
                    <div className="space-y-1.5 text-[10px] font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                      <div className="flex items-center justify-between text-amber-300">
                        <span>Kelemahan Elemen:</span>
                        <span className="font-bold">{beast.weaknesses.join(', ')}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Kebal Elemen:</span>
                        <span>{beast.resistances.join(', ')}</span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-300">
                        <span>Loot Drop:</span>
                        <span>{beast.drops.map((d) => `${d.name} (${d.rate})`).join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Footer Bar with Close Button */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Tip: Tekan [G] atau tombol Tutup untuk kembali berpetualang
          </span>
          <button
            id="footer-close-progression-btn"
            type="button"
            onClick={() => {
              audioManager.playSelect();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>TUTUP GRIMOIRE (ESC)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
