import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SACRED_KNIGHT_OATHS, KnightOath } from '../game/dungeonSystem';
import { audioManager } from '../game/audio';
import { ItemData } from '../types/game';
import {
  Sparkles,
  Shield,
  Sword,
  Hammer,
  Crown,
  CheckCircle,
  LogOut,
  X,
  Zap,
  Flame,
  Star,
} from 'lucide-react';

export interface EnchantingModalProps {
  isOpen: boolean;
  onClose: () => void;
  gold?: number;
  playerGold?: number;
  equipment?: {
    weapon?: ItemData | null;
    armor?: ItemData | null;
  };
  weapon?: ItemData | null;
  armor?: ItemData | null;
  activeOathId: string | null;
  onUpgradeWeapon: () => boolean;
  onUpgradeArmor: () => boolean;
  onSelectOath: (oathId: string) => void;
}

export const EnchantingModal: React.FC<EnchantingModalProps> = ({
  isOpen,
  gold,
  playerGold,
  equipment,
  weapon,
  armor,
  activeOathId,
  onUpgradeWeapon,
  onUpgradeArmor,
  onSelectOath,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'enchant' | 'oaths'>('enchant');

  const currentGold = playerGold ?? gold ?? 0;
  const currentWeapon = equipment?.weapon ?? weapon ?? null;
  const currentArmor = equipment?.armor ?? armor ?? null;

  const weaponUpgradeCost = 50;
  const armorUpgradeCost = 45;

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

  const handleWeaponUpgrade = () => {
    if (currentGold < weaponUpgradeCost) {
      audioManager.playHit();
      return;
    }
    const success = onUpgradeWeapon();
    if (success) {
      audioManager.playUpgrade();
    }
  };

  const handleArmorUpgrade = () => {
    if (currentGold < armorUpgradeCost) {
      audioManager.playHit();
      return;
    }
    const success = onUpgradeArmor();
    if (success) {
      audioManager.playUpgrade();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="enchanting-modal-backdrop"
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
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-950/40 overflow-hidden text-slate-200 font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                  <Hammer className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-amber-100 flex items-center gap-2">
                    <span>Tempaan &amp; Suaka Ksatria Putih</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Enchanting Senjata &amp; Zirah • Sumpah Ksatria Suci
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="close-enchanting-modal-btn"
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

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800/80 bg-slate-900/60 px-6">
            <button
              onClick={() => setActiveTab('enchant')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'enchant'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Enchanting &amp; Tempa Zirah</span>
            </button>
            <button
              onClick={() => setActiveTab('oaths')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'oaths'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>Sumpah Suci Ksatria (Sacred Oaths)</span>
            </button>
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {activeTab === 'enchant' ? (
              <div className="space-y-4">
                {/* Gold Status */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Uang Emas Dimiliki:</span>
                  <span className="font-bold text-amber-400 font-mono text-sm">
                    🪙 {currentGold} Gold
                  </span>
                </div>

                {/* Weapon Enchanting Card */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-center text-rose-400 text-2xl">
                      {currentWeapon?.icon || '🗡️'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-100">
                        {currentWeapon?.name || 'Bilah Perak Ksatria'}
                      </div>
                      <p className="text-xs text-slate-400">
                        Enchanting menambahkan +6 Attack Power dan damage jurus khusus.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleWeaponUpgrade}
                    disabled={currentGold < weaponUpgradeCost}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                      currentGold >= weaponUpgradeCost
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tempa ({weaponUpgradeCost} G)</span>
                  </button>
                </div>

                {/* Armor Enchanting Card */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-sky-950/40 border border-sky-800/60 flex items-center justify-center text-sky-400 text-2xl">
                      {currentArmor?.icon || '🛡️'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-100">
                        {currentArmor?.name || 'Zirah Putih Suci Ksatria'}
                      </div>
                      <p className="text-xs text-slate-400">
                        Memperkuat plat baja putih, menambahkan +4 Defense dan +30 Max HP.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleArmorUpgrade}
                    disabled={currentGold < armorUpgradeCost}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                      currentGold >= armorUpgradeCost
                        ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Perkuat ({armorUpgradeCost} G)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Sacred Oaths Tab */
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Pilih salah satu Sumpah Ksatria Suci untuk memperkuat gaya bertarungmu di dalam Menara 100 Lantai:
                </p>

                <div className="space-y-2.5">
                  {Object.values(SACRED_KNIGHT_OATHS).map((oath) => {
                    const isActive = activeOathId === oath.id;

                    return (
                      <div
                        key={oath.id}
                        className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-4 ${
                          isActive
                            ? 'bg-amber-950/40 border-amber-500/80 shadow-md'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{oath.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-amber-200">
                                {oath.name}
                              </span>
                              {isActive && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                                  AKTIF
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {oath.description}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            audioManager.playSelect();
                            onSelectOath(oath.id);
                          }}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 shadow'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{isActive ? 'Terpilih' : 'Ucapkan Sumpah'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Footer Bar with Close Button */}
          <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              Tip: Tekan [Esc] atau tombol Tutup untuk kembali berpetualang
            </span>
            <button
              id="footer-close-enchanting-btn"
              type="button"
              onClick={() => {
                audioManager.playSelect();
                onClose();
              }}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>TUTUP TEMPAAN (ESC)</span>
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
