import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, Navigation, X, Shield, Skull, Zap } from 'lucide-react';
import { WorldChunk } from '../types/game';

interface FastTravelModalProps {
  isOpen: boolean;
  onClose: () => void;
  chunks: WorldChunk[];
  currentChunkId: string;
  onTravel: (chunkId: string) => void;
}

const FastTravelModal: React.FC<FastTravelModalProps> = ({
  isOpen,
  onClose,
  chunks,
  currentChunkId,
  onTravel,
}) => {
  const [selectedChunkId, setSelectedChunkId] = React.useState<string>(currentChunkId);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedChunkId(currentChunkId);
    }
  }, [isOpen, currentChunkId]);

  const selectedChunk = chunks.find((c) => c.id === selectedChunkId) || chunks.find((c) => c.id === currentChunkId) || chunks[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-4xl bg-[#0a0512] border-2 border-purple-900/70 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(139,92,246,0.25)] flex flex-col md:flex-row h-[85vh] md:h-[620px]"
          >
            {/* Left Panel: Domain Info & List */}
            <div className="w-full md:w-2/5 border-r border-purple-900/40 p-5 flex flex-col gap-4 bg-gradient-to-b from-[#160927] to-[#0a0512]">
              <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-900/50 text-purple-300 border border-purple-600/50 shadow-inner">
                    <Map className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-white tracking-wide">Peta Gerbang Realm</h2>
                    <p className="text-[11px] text-purple-300/70">Pilih wilayah tujuan untuk warp</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-purple-900/60 scrollbar-track-transparent">
                {chunks.map((chunk) => {
                  const isSelected = chunk.id === selectedChunkId;
                  const isCurrent = chunk.id === currentChunkId;
                  return (
                    <button
                      key={chunk.id}
                      onClick={() => setSelectedChunkId(chunk.id)}
                      onDoubleClick={() => onTravel(chunk.id)}
                      className={`w-full group text-left p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-purple-950/70 border-purple-500/80 shadow-[0_0_18px_rgba(168,85,247,0.3)] ring-1 ring-purple-400/50'
                          : isCurrent
                          ? 'bg-indigo-950/40 border-indigo-700/50 hover:border-purple-600/50'
                          : 'bg-[#130720]/60 border-white/5 hover:border-purple-800/60 hover:bg-[#1a0b2e]/70'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold truncate ${
                              isSelected ? 'text-purple-200' : isCurrent ? 'text-indigo-300' : 'text-stone-300 group-hover:text-white'
                            }`}
                          >
                            {chunk.name.split(' (')[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/50 text-stone-400 font-mono border border-white/5">
                            {chunk.dangerLevel}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-900/60 text-indigo-300 font-bold border border-indigo-700/50">
                              LOKASI SAAT INI
                            </span>
                          )}
                        </div>
                      </div>
                      <Navigation
                        className={`w-4 h-4 shrink-0 transition-all ${
                          isSelected
                            ? 'text-purple-400 rotate-45 scale-110'
                            : isCurrent
                            ? 'text-indigo-400'
                            : 'text-stone-600 group-hover:text-purple-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Domain Detail View & Action */}
            <div className="flex-1 p-6 md:p-8 relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#120622] via-[#0d0517] to-[#07020d]">
              {/* Background Glows */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 blur-[100px] rounded-full -mr-48 -mt-48 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 blur-[80px] rounded-full -ml-32 -mb-32 pointer-events-none" />

              <AnimatePresence mode="wait">
                {selectedChunk && (
                  <motion.div
                    key={selectedChunk.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="relative z-10 flex flex-col justify-between h-full"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-purple-400 font-mono text-[10px] tracking-widest uppercase font-bold">
                          <Zap className="w-3.5 h-3.5 text-purple-400" />
                          <span>Gerbang Dimensi Teleportasi</span>
                        </div>
                        <h1 className="font-serif text-2xl md:text-3xl font-black text-white leading-tight">
                          {selectedChunk.name}
                        </h1>
                        {selectedChunk.subtitle && (
                          <p className="text-purple-300/80 text-sm font-medium italic">
                            "{selectedChunk.subtitle}"
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 py-4 border-y border-purple-900/40 my-1">
                        <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-black/40 border border-white/5">
                          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Tingkat Bahaya</span>
                          <div className="flex items-center gap-2">
                            <Skull className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-bold text-red-300">
                              {selectedChunk.dangerLevel}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-black/40 border border-white/5">
                          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Status Portal</span>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-bold text-emerald-300">
                              {selectedChunk.id === currentChunkId ? 'Sedang di Sini' : 'Gerbang Terbuka'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-stone-300 text-sm leading-relaxed">
                        Pindah instan ke suaka wilayah ini melalui portal dimensi mistis. Setiap wilayah berdiri sebagai satu map mandiri yang terlindung dari kutukan luar.
                      </p>
                    </div>

                    <div className="pt-6 border-t border-purple-900/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        onClick={() => onTravel(selectedChunk.id)}
                        className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-bold tracking-wide hover:from-purple-500 hover:to-indigo-500 transition-all shadow-[0_0_25px_rgba(147,51,234,0.4)] hover:shadow-[0_0_35px_rgba(147,51,234,0.6)] active:scale-95 cursor-pointer flex items-center justify-center gap-3"
                      >
                        <Zap className="w-5 h-5 fill-white" />
                        <span>WARP KE WILAYAH INI</span>
                      </button>
                      <button
                        onClick={onClose}
                        className="px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white font-medium text-sm transition cursor-pointer text-center"
                      >
                        Tutup
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FastTravelModal;
