import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DUNGEON_TIERS,
  DUNGEON_COMBAT_SKILLS,
  SACRED_KNIGHT_OATHS,
  getTierForFloor,
  DungeonTier,
} from '../game/dungeonSystem';
import { audioManager } from '../game/audio';
import {
  Skull,
  Shield,
  Zap,
  Sword,
  Sparkles,
  ChevronRight,
  Flame,
  Crown,
  Play,
  LogOut,
  X,
  Info,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface DungeonModalProps {
  isOpen?: boolean;
  currentFloor: number;
  maxFloorReached: number;
  unlockedSkills?: string[];
  activeOathId: string | null;
  onEnterFloor: (floor: number) => void;
  onExitDungeon?: () => void;
  onSelectOath?: (oathId: string) => void;
  inDungeon?: boolean;
  onClose: () => void;
}

export const DungeonModal: React.FC<DungeonModalProps> = ({
  isOpen = false,
  currentFloor,
  maxFloorReached,
  unlockedSkills = [],
  activeOathId,
  onEnterFloor,
  onExitDungeon,
  onSelectOath,
  inDungeon = false,
  onClose,
}) => {
  const [selectedFloor, setSelectedFloor] = useState<number>(currentFloor);
  const [dungeonTab, setDungeonTab] = useState<'explore' | 'milestones'>('explore');
  const selectedTier = getTierForFloor(selectedFloor);
  const activeOath = activeOathId ? SACRED_KNIGHT_OATHS[activeOathId] : null;

  useEffect(() => {
    setSelectedFloor(currentFloor);
  }, [currentFloor]);

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

  const handleFloorSelect = (floor: number) => {
    if (floor > maxFloorReached) return;
    audioManager.playSelect();
    setSelectedFloor(floor);
  };

  const handleStart = () => {
    audioManager.playFanfare();
    onEnterFloor(selectedFloor);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="dungeon-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              audioManager.playSelect();
              onClose();
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-950/40 overflow-hidden text-slate-200 font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-amber-100 flex items-center gap-2">
                    <span>Menara 100 Lantai</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-950 border border-amber-700 text-amber-300">
                      The 100-Floor Dungeon
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Dungeon Master Guardian • 10 Lingkungan Unik &amp; 10 Bos Terkutuk
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {inDungeon && onExitDungeon && (
                  <button
                    id="exit-dungeon-from-modal-btn"
                    type="button"
                    onClick={() => {
                      onExitDungeon();
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-900/80 hover:bg-red-800 text-red-200 border border-red-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar ke Lobi</span>
                  </button>
                )}
                <button
                  id="close-dungeon-modal-btn"
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
            </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Active Oath Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/90 border border-amber-900/60 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{activeOath?.icon || '🕊️'}</span>
                <div>
                  <span className="font-bold text-amber-200">
                    {activeOath ? activeOath.name : 'Belum Memilih Sumpah Ksatria'}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {activeOath ? activeOath.description : 'Bicaralah dengan Suster, Roderick, atau Viktor di Lobby untuk mengambil Sumpah Suci.'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80">
                Rekor Tertinggi: Lantai {maxFloorReached}/100
              </span>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setDungeonTab('explore')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                  dungeonTab === 'explore'
                    ? 'bg-amber-600 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Crown className="w-4 h-4" />
                <span>Eksplorasi Menara &amp; Lantai</span>
              </button>
              <button
                type="button"
                onClick={() => setDungeonTab('milestones')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                  dungeonTab === 'milestones'
                    ? 'bg-amber-600 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Milestone &amp; Reward Regional NPC</span>
              </button>
            </div>

            {dungeonTab === 'milestones' ? (
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 max-h-[420px] overflow-y-auto">
                <div className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-amber-500/30 flex items-center gap-2.5">
                  <span className="text-lg">🎁</span>
                  <div>
                    <span className="font-bold text-amber-200">Milestone Tracker Reward Regional NPC</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Capai lantai menara tertentu untuk membuka dan mengklaim hadiah pusaka eksklusif langsung dari NPC regional di dunia luar!
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {[
                    { floor: 10, npc: 'Elena (Tabib Desa)', item: 'Mantel Pemburu', desc: 'Sektor Desa' },
                    { floor: 20, npc: 'Suster Genevieve', item: 'Air Suci (x3)', desc: 'Makam Suci' },
                    { floor: 30, npc: 'Ksatria Godfrey', item: 'Belati Racun', desc: 'Rawa Kuno' },
                    { floor: 40, npc: 'Seraphina', item: 'Gaun Sutra Gotik', desc: 'Biara Kuno' },
                    { floor: 50, npc: 'Valerius', item: 'Sabit Bulan Darah', desc: 'Lembah Tulang' },
                    { floor: 60, npc: 'Sir Roderick', item: 'Zirah Templar', desc: 'Kuil Sekte' },
                    { floor: 70, npc: 'Putri Lilith', item: 'Amulet Darah', desc: 'Kastil Drakula' },
                    { floor: 80, npc: 'Celestine', item: 'Tongkat Bintang', desc: 'Observatorium' },
                    { floor: 90, npc: 'Morrigan', item: 'Bilah Nether Abyss', desc: 'Ngarai Kehampaan' },
                    { floor: 100, npc: 'Lord Malakar & Vladimir', item: 'Rapier Mawar Hitam & God Slayer', desc: 'Puncak Takhta 100' },
                  ].map((m, idx) => {
                    const isUnlocked = maxFloorReached >= m.floor;
                    const floorsRemaining = Math.max(0, m.floor - maxFloorReached);
                    const progress = Math.min(100, Math.floor((maxFloorReached / m.floor) * 100));

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isUnlocked
                            ? 'bg-amber-950/20 border-amber-500/60 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                            : 'bg-slate-950/80 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400">
                                Lantai {m.floor}
                              </span>
                              <span className="font-bold text-xs sm:text-sm text-white">
                                {m.npc}
                              </span>
                            </div>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                              isUnlocked ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-900 text-slate-400 border border-slate-700'
                            }`}>
                              {isUnlocked ? '✓ TERBUKA / DIKLAIM' : `${floorsRemaining} lantai lagi`}
                            </span>
                          </div>

                          <div className="text-xs text-slate-300 flex items-center gap-1.5">
                            <span className="text-amber-300 font-semibold">Hadiah Pusaka:</span>
                            <span className="font-mono text-amber-200">{m.item}</span>
                            <span className="text-slate-500">• {m.desc}</span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                            <div
                              className={`h-full transition-all duration-500 ${
                                isUnlocked ? 'bg-gradient-to-r from-amber-500 to-emerald-400' : 'bg-amber-600'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Left Column: 10 Tiers Selector */}
                <div className="md:col-span-5 space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>10 Wilayah Menara</span>
                    <span className="font-mono text-[10px] text-amber-400">10 Lantai / Wilayah</span>
                  </div>

                  <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                    {DUNGEON_TIERS.map((tier) => {
                      const isUnlocked = maxFloorReached >= tier.floorRange[0];
                      const isSelected =
                        selectedFloor >= tier.floorRange[0] &&
                        selectedFloor <= tier.floorRange[1];

                      return (
                        <button
                          key={tier.tier}
                          type="button"
                          disabled={!isUnlocked}
                          onClick={() => {
                            const targetFloor = Math.min(
                              tier.floorRange[1],
                              Math.max(tier.floorRange[0], maxFloorReached)
                            );
                            handleFloorSelect(targetFloor);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-950/40 border-amber-500/80 text-amber-100 shadow-md'
                              : isUnlocked
                              ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                              : 'bg-slate-950/50 border-slate-900/80 text-slate-600 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono"
                              style={{
                                backgroundColor: tier.bgColor,
                                border: `1px solid ${tier.wallColor}`,
                                color: tier.torchColor,
                              }}
                            >
                              T{tier.tier}
                            </div>
                            <div>
                              <div className="text-xs font-bold flex items-center gap-1.5">
                                <span>{tier.name}</span>
                                {tier.tier === 10 && (
                                  <Crown className="w-3 h-3 text-amber-400 inline" />
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Lantai {tier.floorRange[0]} - {tier.floorRange[1]}
                              </div>
                            </div>
                          </div>

                          {isUnlocked ? (
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Floor Details & Boss Preview */}
                <div className="md:col-span-7 flex flex-col justify-between p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
                  <div>
                    {/* Selected Tier Banner */}
                    <div
                      className="p-3.5 rounded-xl border mb-3"
                      style={{
                        backgroundColor: selectedTier.bgColor,
                        borderColor: selectedTier.wallColor,
                      }}
                    >
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span style={{ color: selectedTier.torchColor }}>
                          {selectedTier.subtitle}
                        </span>
                        <span>Wilayah #{selectedTier.tier}</span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        {selectedTier.name}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {selectedTier.description}
                      </p>
                    </div>

                    {/* Floor Quick Jumper Buttons */}
                    <div className="space-y-1.5 mb-4">
                      <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                        <span>Pilih Lantai Masuk:</span>
                        <span className="font-mono text-amber-300 font-bold">
                          Lantai {selectedFloor}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {Array.from(
                          { length: selectedTier.floorRange[1] - selectedTier.floorRange[0] + 1 },
                          (_, idx) => {
                            const fNum = selectedTier.floorRange[0] + idx;
                            const isUnlocked = fNum <= maxFloorReached;
                            const isCurrent = fNum === selectedFloor;
                            const isBoss = fNum % 10 === 0;

                            return (
                              <button
                                key={fNum}
                                type="button"
                                disabled={!isUnlocked}
                                onClick={() => handleFloorSelect(fNum)}
                                className={`py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center gap-1 ${
                                  isCurrent
                                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                                    : isUnlocked
                                    ? isBoss
                                      ? 'bg-rose-950/80 text-rose-300 border border-rose-700 hover:border-rose-500'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                    : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed'
                                }`}
                              >
                                {isBoss && <Skull className="w-3 h-3 text-rose-400" />}
                                <span>{fNum}</span>
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Boss & Skill Reward Info */}
                    <div className="p-3 rounded-lg bg-slate-950/80 border border-rose-900/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                          <Skull className="w-4 h-4" />
                          <span>Bos Wilayah (Lantai {selectedTier.floorRange[1]}):</span>
                        </div>
                        <span className="text-[10px] font-mono text-rose-300 font-bold">
                          HP: {selectedTier.boss.hp} | ATK: {selectedTier.boss.atk}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-200">
                        {selectedTier.boss.name}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>Jurus Khusus:</span>
                        <span className="font-mono text-amber-300">{selectedTier.boss.specialMove}</span>
                      </div>

                      {/* Milestone Skill Reward */}
                      {selectedTier.boss.rewardSkillId && DUNGEON_COMBAT_SKILLS[selectedTier.boss.rewardSkillId] && (
                        <div className="pt-2 mt-1 border-t border-slate-800 text-[11px] flex items-center justify-between">
                          <span className="text-amber-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            Hadiah Kemenangan Bos:
                          </span>
                          <span className="font-bold text-slate-200 font-mono">
                            {DUNGEON_COMBAT_SKILLS[selectedTier.boss.rewardSkillId].name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enter Dungeon CTA */}
                  <button
                    id="start-dungeon-floor-btn"
                    type="button"
                    onClick={handleStart}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm tracking-wide shadow-xl shadow-amber-600/30 flex items-center justify-center gap-2 transition active:scale-[0.99]"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>MASUKI LANTAI {selectedFloor} MENARA SEKARANG</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
