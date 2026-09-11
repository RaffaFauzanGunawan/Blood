import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Info,
  X,
  Users,
  Map,
  LogOut,
  FolderDown,
  Sparkles,
  Shield,
  Trash2,
  AlertTriangle,
  Award,
  Sword,
  Coins,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { audioManager } from '../game/audio';
import { SaveData } from '../game/saveSystem';

interface MainMenuProps {
  onStartNewGame: (playerName: string, mode: 'normal' | 'bloodmoon' | 'story') => void;
  onLoadGame: () => void;
  onOpenGuide: () => void;
  hasSaveData: boolean;
  saveData: SaveData | null;
  onDeleteSaveData: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartNewGame,
  onLoadGame,
  onOpenGuide,
  hasSaveData,
  saveData,
  onDeleteSaveData,
}) => {
  const [activeModal, setActiveModal] = useState<
    'none' | 'new_game' | 'load_game' | 'exit_game' | 'npcs' | 'regions'
  >('none');

  // BGM Audio Toggle State
  const [isBgmActive, setIsBgmActive] = useState<boolean>(audioManager.bgmEnabled);

  useEffect(() => {
    // Attempt auto-start BGM on menu display if enabled
    if (audioManager.bgmEnabled) {
      audioManager.toggleBgm(true);
    }
  }, []);

  const handleToggleBGM = () => {
    const nextState = audioManager.toggleBgm();
    setIsBgmActive(nextState);
  };

  // New Game Setup State
  const [newKnightName, setNewKnightName] = useState('Sir Valen');
  const [selectedMode, setSelectedMode] = useState<'normal' | 'bloodmoon' | 'story'>('normal');

  const handleStartNewGameClick = () => {
    audioManager.unlockAudio();
    audioManager.playSelect();
    onStartNewGame(newKnightName.trim() || 'Sir Valen', selectedMode);
  };

  const handleLoadGameClick = () => {
    audioManager.unlockAudio();
    audioManager.playSelect();
    onLoadGame();
  };

  // Generate 18 floating ash/ember particles around the Blood Moon
  const emberParticles = React.useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: Math.random() * 320 - 160,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 5,
    }));
  }, []);

  return (
    <div
      id="main-menu-container"
      className="absolute inset-0 z-50 flex flex-col justify-between overflow-hidden bg-[#070509] font-sans select-none text-slate-100"
    >
      {/* Gothic Atmospheric Night Sky & Deep Vignette */}
      <div className="absolute inset-0 bg-radial from-[#2a0b18] via-[#0d0714] to-[#040206] pointer-events-none" />

      {/* TOP HEADER BAR */}
      <div className="relative z-30 w-full px-6 py-4 flex items-center justify-between">
        {/* Left: Engine Version Badge */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#2b080e]/90 border border-[#b91c1c] text-[#f87171] shadow-[0_0_15px_rgba(185,28,28,0.4)] backdrop-blur-md">
            <span className="text-sm">⚜️</span>
            <span className="font-mono text-xs font-bold tracking-wider uppercase text-amber-200">
              ORDO KESATRIA PUTIH
            </span>
          </div>
          <span className="text-xs text-amber-300/80 font-mono tracking-wide hidden sm:inline">
            Bloodfall: Requiem of the Damned
          </span>
        </div>

        {/* Right: BGM Audio Toggle & Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Test Audio Button */}
          <button
            id="menu-test-audio-btn"
            onClick={() => {
              audioManager.playTestChime();
              setIsBgmActive(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900/90 border border-amber-500/80 text-xs font-mono font-bold text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer backdrop-blur-md active:scale-95"
            title="Klik untuk membunyikan tes suara dan menyalakan BGM"
          >
            <span>🔊</span>
            <span>TES SUARA</span>
          </button>

          {/* BGM Audio Toggle Button */}
          <button
            id="menu-bgm-toggle-btn"
            onClick={handleToggleBGM}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer shadow-lg backdrop-blur-md ${
              isBgmActive
                ? 'bg-amber-950/80 border-amber-500/80 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-stone-900/90 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
            title="Sistem Musik Latar (BGM)"
          >
            {isBgmActive ? (
              <>
                <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>MUSIC: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-stone-500" />
                <span>MUSIC: OFF</span>
              </>
            )}
          </button>

          <button
            id="open-guide-btn"
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-900/60 text-xs font-medium text-amber-300 transition-all cursor-pointer shadow-md"
          >
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Panduan Bermain</span>
          </button>
        </div>
      </div>

      {/* CENTER STAGE: Smooth Animated Glowing Blood Moon & Title */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 -mt-2">
        {/* Animated Crimson Blood Moon Stage */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing Outer Crimson Radial Halo */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.55, 0.85, 0.55],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-72 h-72 sm:w-96 sm:h-96 md:w-[28rem] md:h-[28rem] rounded-full bg-gradient-radial from-red-600/40 via-rose-900/20 to-transparent blur-3xl pointer-events-none"
          />

          {/* Smooth Vertical Floating Blood Moon Sphere */}
          <motion.div
            animate={{
              y: [0, -12, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 rounded-full bg-gradient-to-b from-[#f43f5e] via-[#9f1239] to-[#1e040a] shadow-[0_0_80px_rgba(244,63,94,0.65),inset_0_-18px_35px_rgba(0,0,0,0.85),inset_0_12px_24px_rgba(255,180,180,0.4)] relative overflow-hidden border border-red-400/30 cursor-pointer"
          >
            {/* Slow Smooth Rotating Lunar Surface Texture Craters */}
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 120,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute inset-0 pointer-events-none opacity-80"
            >
              <div className="absolute top-8 left-10 w-16 h-16 rounded-full bg-red-950/50 blur-sm" />
              <div className="absolute bottom-10 right-12 w-24 h-24 rounded-full bg-black/60 blur-md" />
              <div className="absolute top-20 right-8 w-12 h-12 rounded-full bg-rose-950/60 blur-sm" />
              <div className="absolute bottom-16 left-12 w-14 h-14 rounded-full bg-red-950/40 blur-sm" />
            </motion.div>

            {/* Light Sweep Shimmer Effect */}
            <motion.div
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatDelay: 3,
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 pointer-events-none"
            />
          </motion.div>

          {/* Rising Ash/Blood Embers Particles Around Moon */}
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {emberParticles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ y: 80, x: p.x, opacity: 0 }}
                animate={{
                  y: [-20, -160],
                  x: [p.x, p.x + Math.sin(p.id) * 20],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: 'easeOut',
                }}
                style={{ width: p.size, height: p.size }}
                className="absolute rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]"
              />
            ))}
          </div>

          {/* Title Text Centered Over Blood Moon */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <motion.p
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-xs sm:text-sm font-bold tracking-[0.38em] text-red-300 drop-shadow-[0_2px_12px_rgba(225,29,72,0.9)] uppercase font-mono"
            >
              KUTUKAN BULAN DARAH
            </motion.p>
            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl tracking-[0.18em] text-white font-black drop-shadow-[0_6px_35px_rgba(0,0,0,0.95)] select-none pt-1">
              BLOODFALL
            </h1>
            <p className="text-[10px] sm:text-xs tracking-[0.35em] text-amber-200/90 font-bold uppercase pt-1 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
              REQUIEM OF THE DAMNED
            </p>
          </div>
        </div>

        {/* PRIMARY ACTION BUTTONS (GAME BARU, MUAT GAME, KELUAR) - UNIFIED ELEGANT PROPORTIONS */}
        <div className="mt-7 flex flex-col sm:flex-row items-stretch justify-center gap-3.5 w-full max-w-xl z-30 px-2">
          {/* Button 1: Game Baru */}
          <motion.button
            id="start-new-game-btn"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              audioManager.playSelect();
              setActiveModal('new_game');
            }}
            className="flex-1 h-14 sm:h-16 rounded-2xl font-serif text-sm sm:text-base tracking-[0.22em] text-amber-100 uppercase font-extrabold flex items-center justify-center gap-3 bg-gradient-to-r from-[#7f1d1d] via-[#991b1b] to-[#b91c1c] hover:from-[#991b1b] hover:to-[#dc2626] border border-amber-400/70 hover:border-amber-300 shadow-[0_0_28px_rgba(225,29,72,0.55)] cursor-pointer transition-all duration-200 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300/40 group-hover:scale-110 transition-transform" />
            <span>GAME BARU</span>
          </motion.button>

          {/* Button 2: Muat Game */}
          <motion.button
            id="load-game-btn"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              audioManager.playSelect();
              setActiveModal('load_game');
            }}
            className={`flex-1 h-14 sm:h-16 rounded-2xl font-serif text-sm sm:text-base tracking-[0.22em] uppercase font-extrabold flex items-center justify-center gap-3 border transition-all duration-200 cursor-pointer relative overflow-hidden group ${
              hasSaveData
                ? 'bg-gradient-to-r from-[#4c1d95] via-[#5b21b6] to-[#6d28d9] hover:from-[#5b21b6] hover:to-[#7c3aed] border-amber-400/60 hover:border-amber-300 shadow-[0_0_28px_rgba(168,85,247,0.5)] text-amber-100'
                : 'bg-gradient-to-r from-[#1c1917] via-[#292524] to-[#1c1917] border-stone-700/80 hover:border-stone-500 text-stone-300 shadow-md'
            }`}
          >
            <FolderDown className={`w-5 h-5 ${hasSaveData ? 'text-purple-300' : 'text-stone-400'} group-hover:scale-110 transition-transform`} />
            <span>MUAT GAME</span>
            {hasSaveData && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shadow-[0_0_10px_#34d399]" />
            )}
          </motion.button>

          {/* Button 3: Keluar / Exit */}
          <motion.button
            id="exit-game-btn"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              audioManager.playSelect();
              setActiveModal('exit_game');
            }}
            className="flex-1 h-14 sm:h-16 rounded-2xl font-serif text-sm sm:text-base tracking-[0.22em] text-red-200 uppercase font-extrabold flex items-center justify-center gap-3 bg-gradient-to-r from-[#1c1917] via-[#27272a] to-[#1c1917] hover:from-[#2d0e15] hover:to-[#450a0a] border border-red-700/60 hover:border-red-500 shadow-[0_0_22px_rgba(185,28,28,0.35)] cursor-pointer transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
            <span>KELUAR</span>
          </motion.button>
        </div>
      </div>

      {/* BOTTOM ROW: Info Cards */}
      <div className="relative z-20 w-full max-w-2xl mx-auto px-4 pb-6 flex items-center justify-center gap-3">
        <button
          id="menu-card-npc"
          onClick={() => {
            audioManager.playSelect();
            setActiveModal('npcs');
          }}
          className="flex-1 py-2.5 px-3 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 border border-stone-800 hover:border-red-900/60 text-stone-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
        >
          <Users className="w-3.5 h-3.5 text-red-400" />
          <span>7 Tokoh NPC</span>
        </button>

        <button
          id="menu-card-regions"
          onClick={() => {
            audioManager.playSelect();
            setActiveModal('regions');
          }}
          className="flex-1 py-2.5 px-3 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 border border-stone-800 hover:border-red-900/60 text-stone-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
        >
          <Map className="w-3.5 h-3.5 text-sky-400" />
          <span>Peta 9 Region</span>
        </button>

        <button
          id="menu-card-controls"
          onClick={() => {
            audioManager.playSelect();
            onOpenGuide();
          }}
          className="flex-1 py-2.5 px-3 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 border border-stone-800 hover:border-red-900/60 text-stone-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
        >
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>Panduan Kontrol</span>
        </button>
      </div>

      {/* MODAL 1: NEW GAME SETUP */}
      <AnimatePresence>
        {activeModal === 'new_game' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <div className="w-full max-w-md p-6 rounded-2xl bg-[#0e0a14] border border-red-900/70 shadow-2xl text-left space-y-4 relative">
              <div className="flex items-center justify-between border-b border-red-950 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-red-400" />
                  <h3 className="font-serif text-lg font-bold text-red-200 tracking-wide">
                    BUAT GAME BARU
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal('none')}
                  className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-amber-300 font-semibold block">
                  NAMA KSATRIA PUTIH:
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={newKnightName}
                  onChange={(e) => setNewKnightName(e.target.value)}
                  placeholder="Masukkan Nama Ksatria..."
                  className="w-full bg-slate-950 border border-amber-800/80 rounded-lg px-3 py-2 text-sm text-amber-100 font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300 font-semibold block">
                  PILIH MODE PERMAINAN:
                </label>
                <div className="space-y-2">
                  {/* Mode Normal */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode('normal')}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                      selectedMode === 'normal'
                        ? 'bg-red-950/60 border-red-500 text-white'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-stone-200">Mode Normal (Standar)</div>
                      <div className="text-[10px] text-stone-400 leading-relaxed">
                        Pengalaman gothic RPG seimbang. Musuh sedang, checkpoint aktif.
                      </div>
                    </div>
                  </button>

                  {/* Mode Lunatic Bloodmoon */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode('bloodmoon')}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                      selectedMode === 'bloodmoon'
                        ? 'bg-red-950/80 border-red-500 text-white shadow-lg shadow-red-950/50'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-red-300">Mode Lunatic Purnama Darah</div>
                      <div className="text-[10px] text-stone-400 leading-relaxed">
                        Tantangan buas! Musuh memiliki HP &amp; serangan +40% lebih ganas.
                      </div>
                    </div>
                  </button>

                  {/* Mode Story */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode('story')}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                      selectedMode === 'story'
                        ? 'bg-sky-950/60 border-sky-500 text-white'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <Award className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-sky-300">Mode Cerita (Santai)</div>
                      <div className="text-[10px] text-stone-400 leading-relaxed">
                        Akses HP ekstra 150. Cocok bagi pemain yang fokus menikmati narasi.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-red-950">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  id="confirm-new-game-btn"
                  onClick={handleStartNewGameClick}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-serif text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Mulai Petualangan Baru</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: LOAD GAME */}
      <AnimatePresence>
        {activeModal === 'load_game' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <div className="w-full max-w-md p-6 rounded-2xl bg-[#0e0a14] border border-purple-900/70 shadow-2xl text-left space-y-4 relative">
              <div className="flex items-center justify-between border-b border-purple-950 pb-3">
                <div className="flex items-center gap-2">
                  <FolderDown className="w-5 h-5 text-purple-400" />
                  <h3 className="font-serif text-lg font-bold text-purple-200 tracking-wide">
                    MUAT GAME (LOAD GAME)
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal('none')}
                  className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {hasSaveData && saveData ? (
                <div className="space-y-4">
                  {/* Save Slot Preview Card */}
                  <div className="p-4 rounded-xl bg-purple-950/50 border border-purple-600/60 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between border-b border-purple-900/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">⚔️</span>
                        <div>
                          <h4 className="font-bold text-amber-200 text-sm font-serif">
                            {saveData.playerName || 'Sir Valen'}
                          </h4>
                          <span className="text-[10px] text-purple-300 font-mono">
                            Level {saveData.level || 1} • Ksatria Putih
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold">
                        Lantai Max: {saveData.maxFloorReached || 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                      <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded border border-slate-800">
                        <Sword className="w-3.5 h-3.5 text-rose-400" />
                        <span>ATK: {saveData.attackPower || 30}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded border border-slate-800">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>Emas: {saveData.gold || 0}G</span>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1">
                      <span>Tersimpan Pada:</span>
                      <span className="text-purple-300 font-semibold">{saveData.savedAt || 'Baru Saja'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-purple-950">
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteSaveData();
                        setActiveModal('none');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Save</span>
                    </button>

                    <button
                      type="button"
                      id="confirm-load-game-btn"
                      onClick={handleLoadGameClick}
                      className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-800 to-indigo-600 hover:from-purple-700 hover:to-indigo-500 text-white font-serif text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Lanjutkan Permainan</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center mx-auto text-slate-500">
                    <FolderDown className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-stone-400 font-mono">
                    Belum ada file simpanan permainan tersimpan.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveModal('new_game')}
                    className="px-4 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white font-serif text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Mulai Game Baru</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 3: EXIT CONFIRMATION */}
      <AnimatePresence>
        {activeModal === 'exit_game' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <div className="w-full max-w-sm p-6 rounded-2xl bg-[#0e0a14] border border-red-900/80 shadow-2xl text-center space-y-4 relative">
              <div className="w-14 h-14 rounded-full bg-red-950 border border-red-600/60 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_20px_rgba(225,29,72,0.4)]">
                <LogOut className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-red-200">
                  KELUAR DARI PERMAINAN?
                </h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Semua kemajuan karakter Anda tersimpan otomatis di penyimpanan lokal browser.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold border border-stone-800 cursor-pointer"
                >
                  Kembali Ke Menu
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioManager.playSelect();
                    try {
                      window.close();
                    } catch (e) {
                      console.log(e);
                    }
                    setActiveModal('none');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg border border-red-600 cursor-pointer"
                >
                  Selesai Bermain
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 4: NPC Preview Showcase */}
      <AnimatePresence>
        {activeModal === 'npcs' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-2xl bg-[#0e0a14] border border-red-900/60 shadow-2xl text-left space-y-4">
              <div className="flex items-center justify-between border-b border-red-950 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-400" />
                  <h3 className="font-serif text-lg font-bold text-red-200 tracking-wide">
                    Tokoh &amp; Karakter Dunia Ravenfall
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal('none')}
                  className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
                <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/70 to-stone-950/80 border border-red-800/50 flex items-start gap-3 shadow-md">
                  <div className="w-12 h-12 rounded-xl bg-red-950 border border-red-600/60 flex items-center justify-center text-xl shrink-0 shadow-[0_0_15px_rgba(225,29,72,0.3)] relative overflow-hidden">
                    <span className="text-2xl">🥀</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-red-300 font-serif text-sm">Lady Carmilla</h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-950 text-red-400 border border-red-800/40">Vampire Noble</span>
                    </div>
                    <p className="text-[11px] text-stone-300">Penguasa Kastil Bayangan • Klan Darah Malam</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gradient-to-r from-sky-950/70 to-stone-950/80 border border-sky-800/50 flex items-start gap-3 shadow-md">
                  <div className="w-12 h-12 rounded-xl bg-sky-950 border border-sky-500/60 flex items-center justify-center text-xl shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.3)] relative overflow-hidden">
                    <span className="text-2xl">🕯️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-sky-300 font-serif text-sm">Suster Genevieve</h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-sky-950 text-sky-400 border border-sky-800/40">Holy Priestess</span>
                    </div>
                    <p className="text-[11px] text-stone-300">Biarawati Buta Pelindung Katedral Suci</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 5: Regions Overview */}
      <AnimatePresence>
        {activeModal === 'regions' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <div className="w-full max-w-xl p-6 rounded-2xl bg-[#0e0a14] border border-red-900/60 shadow-2xl text-left space-y-4">
              <div className="flex items-center justify-between border-b border-red-950 pb-3">
                <div className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-sky-400" />
                  <h3 className="font-serif text-lg font-bold text-sky-200 tracking-wide">
                    9 Wilayah Open World Ravenfall
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal('none')}
                  className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-stone-300">
                <p className="leading-relaxed">
                  Jelajahi dunia gothic yang terbagi menjadi 9 wilayah tanpa loading screen:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <li className="p-2 rounded bg-stone-950/80 border border-stone-800">
                    <span className="font-bold text-emerald-400">1. Desa Ravenfall:</span> Titik awal perlindungan manusia.
                  </li>
                  <li className="p-2 rounded bg-stone-950/80 border border-stone-800">
                    <span className="font-bold text-amber-400">2. Pemakaman Berkabut:</span> Makam kerangka mayat hidup.
                  </li>
                  <li className="p-2 rounded bg-stone-950/80 border border-stone-800">
                    <span className="font-bold text-sky-400">3. Katedral Bulan Darah:</span> Suaka suci suster Genevieve.
                  </li>
                  <li className="p-2 rounded bg-stone-950/80 border border-stone-800">
                    <span className="font-bold text-purple-400">4. Menara 100 Lantai:</span> Arena pertarungan dungeon.
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
