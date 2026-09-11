import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Home, Skull } from 'lucide-react';
import { audioManager } from '../game/audio';

interface GameOverProps {
  onRespawn: () => void;
  onReturnToMainMenu: () => void;
  playerLevel: number;
  playerGold: number;
  inDungeon?: boolean;
  dungeonFloor?: number;
  onRetryFloor?: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  onRespawn,
  onReturnToMainMenu,
  playerLevel,
  playerGold,
  inDungeon,
  dungeonFloor,
  onRetryFloor,
}) => {
  return (
    <div id="game-over-overlay" className="absolute inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-[#070509]/95 backdrop-blur-md font-sans select-none text-slate-100">
      {/* Gothic Atmospheric Night Sky & Deep Bleeding Vignette */}
      <div className="absolute inset-0 bg-radial from-[#250810]/70 via-[#0a040b] to-[#040206] pointer-events-none" />

      {/* TOP HEADER BAR (Matching Bloodfall Theme) */}
      <div className="relative z-20 w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#2b080e]/90 border border-[#b91c1c] text-[#f87171] shadow-sm">
            <Skull className="w-3.5 h-3.5 text-red-400" />
            <span className="font-mono text-xs font-bold tracking-wider uppercase">
              KUTUKAN BULAN DARAH
            </span>
          </div>
          <span className="text-xs text-stone-400 font-mono tracking-wide hidden sm:inline">
            v2.4.0 Gothic Open World
          </span>
        </div>

        <div className="px-3 py-1 rounded-full bg-red-950/80 border border-red-800/60 text-xs font-mono text-red-300">
          JIWA TELAH GUGUR
        </div>
      </div>

      {/* CENTER STAGE: Glowing Blood Moon & Game Over Typography */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-xl mx-auto -mt-4">
        {/* Blood Moon Orb with Bleeding Ethereal Halo */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-red-600/40 blur-3xl pointer-events-none animate-pulse [animation-duration:3s]" />
          
          <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-gradient-to-b from-[#b91c1c] via-[#580d1e] to-[#120307] shadow-[0_0_80px_rgba(185,28,28,0.7),inset_0_-15px_30px_rgba(0,0,0,0.9)] relative overflow-hidden border border-red-600/30">
            <div className="absolute top-8 left-10 w-16 h-16 rounded-full bg-red-950/50 blur-sm" />
            <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full bg-black/60 blur-md" />
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs font-bold tracking-[0.35em] text-red-400 drop-shadow-[0_2px_10px_rgba(225,29,72,0.8)] uppercase">
              JIWA TERKUTUK
            </p>
            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl tracking-[0.16em] text-white font-black drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] pt-1">
              BLOODFALL
            </h1>
            <p className="text-[10px] sm:text-xs tracking-[0.32em] text-rose-300/80 font-semibold uppercase pt-1">
              REQUIEM OF THE DAMNED : GAME OVER
            </p>
          </div>
        </div>

        {/* Story Narrative Snippet */}
        <p className="text-xs sm:text-sm text-stone-300/80 italic max-w-md mx-auto mt-5 leading-relaxed">
          "Darahmu terhisap oleh malam abadi Ravenfall... Jiwa pemburu tertidur di pelukan dingin kegelapan."
        </p>

        {/* Character Level & Gold Summary Card */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-4 p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-xs">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-mono text-stone-400">Tingkat Karakter</span>
            <span className="font-bold text-sm text-rose-400 font-mono">Level {playerLevel}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-mono text-stone-400">Emas Tersisa</span>
            <span className="font-bold text-sm text-amber-400 font-mono">{playerGold} G</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-xs space-y-2.5 mt-5">
          {inDungeon && onRetryFloor && (
            <motion.button
              id="retry-floor-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                audioManager.playPotion();
                onRetryFloor();
              }}
              className="w-full py-3 px-6 rounded-xl font-serif text-sm tracking-wider text-white uppercase font-bold flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-800 via-amber-600 to-amber-800 hover:from-amber-600 hover:to-amber-500 shadow-[0_0_25px_rgba(217,119,6,0.6)] border border-amber-400/40 cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>COBA LAGI (LANTAI {dungeonFloor || 1})</span>
            </motion.button>
          )}

          <motion.button
            id="respawn-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              audioManager.playPotion();
              onRespawn();
            }}
            className="w-full py-3.5 px-6 rounded-xl font-serif text-sm tracking-wider text-white uppercase font-bold flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#991b1b] via-[#b91c1c] to-[#991b1b] hover:from-[#b91c1c] hover:to-[#ef4444] shadow-[0_0_30px_rgba(185,28,28,0.7)] border border-red-500/40 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{inDungeon ? 'KELUAR KE SUAKA RAVENFALL' : 'BANGKIT DI SUAKA RAVENFALL'}</span>
          </motion.button>

          <button
            id="return-main-menu-btn"
            onClick={() => {
              audioManager.playSelect();
              onReturnToMainMenu();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
          >
            <Home className="w-3.5 h-3.5 text-stone-400" />
            <span>KEMBALI KE MENU UTAMA</span>
          </button>
        </div>
      </div>

      {/* BOTTOM SILHOUETTE */}
      <div className="w-full pb-4 text-center">
        <span className="text-[10px] font-mono text-stone-600 uppercase tracking-widest">
          ~ Tekan Respawn untuk Memulai Kembali dari Desa Ravenfall ~
        </span>
      </div>
    </div>
  );
};
