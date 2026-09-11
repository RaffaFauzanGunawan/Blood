import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Gamepad2,
  Sword,
  Sparkles,
  Users,
  Volume2,
  X,
  Upload,
  RefreshCw,
  CheckCircle2,
  Bell,
  MapPin,
  Moon,
  Shield,
  Layers,
  Heart,
} from 'lucide-react';
import { audioManager } from '../game/audio';

interface GameplayGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNPCModal?: () => void;
}

export const GameplayGuideModal: React.FC<GameplayGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenNPCModal,
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'gameplay' | 'characters' | 'audio'>('controls');
  const [testSoundRung, setTestSoundRung] = useState(false);
  const [customAudioName, setCustomAudioName] = useState<string | null>(audioManager.customAudioName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTestSound = () => {
    audioManager.unlockAudio();
    audioManager.playTestChime();
    setTestSoundRung(true);
    setTimeout(() => setTestSoundRung(false), 2000);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileName = await audioManager.setCustomAudioFile(file);
      setCustomAudioName(fileName);
      audioManager.playFanfare();
    } catch {
      alert('Format audio tidak dapat diputar. Harap gunakan file audio (.mp3, .wav, .ogg, .m4a) atau video (.mp4).');
    }
  };

  const handleResetAudio = () => {
    audioManager.clearCustomAudio();
    setCustomAudioName(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none font-sans"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-gradient-to-b from-[#140c1a] via-[#0b0711] to-[#060408] border border-amber-900/50 shadow-2xl text-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-amber-950/80 bg-black/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-serif text-amber-200 tracking-wide">
                  Panduan Gameplay &amp; Kontrol Petualangan
                </h2>
                <p className="text-xs text-stone-400 font-mono">
                  Sistem Godot 4 2D RPG Gothic Horror
                </p>
              </div>
            </div>
            <button
              id="close-gameplay-guide-btn"
              onClick={() => {
                audioManager.playSelect();
                onClose();
              }}
              className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-stone-900 bg-stone-950/40 overflow-x-auto">
            <button
              onClick={() => { audioManager.playSelect(); setActiveTab('controls'); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'controls'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950/60'
                  : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Panduan Kontrol</span>
            </button>

            <button
              onClick={() => { audioManager.playSelect(); setActiveTab('gameplay'); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'gameplay'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950/60'
                  : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <Sword className="w-3.5 h-3.5" />
              <span>Sistem Permainan</span>
            </button>

            <button
              onClick={() => { audioManager.playSelect(); setActiveTab('characters'); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'characters'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950/60'
                  : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Tokoh &amp; Karakter</span>
            </button>

            <button
              onClick={() => { audioManager.playSelect(); setActiveTab('audio'); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'audio'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950/60'
                  : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>BGM &amp; Audio</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs leading-relaxed text-stone-300">
            {/* TAB 1: KONTROL */}
            {activeTab === 'controls' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-900/50 text-amber-200">
                  <p className="font-semibold text-sm mb-1 text-amber-100 flex items-center gap-1.5">
                    <Gamepad2 className="w-4 h-4 text-amber-400" />
                    <span>Dukungan Input Lengkap (Keyboard &amp; Gamepad / Sentuh)</span>
                  </p>
                  <p className="text-[11px] text-amber-300/80">
                    Semua tombol aksi telah dioptimalkan dengan respons instan dan animasi gerakan halus 8-arah.
                  </p>
                </div>

                {/* Keyboard Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-stone-900/70 border border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex gap-1">
                        <kbd className="px-2 py-1 rounded bg-stone-800 border border-stone-700 text-stone-200 font-mono font-bold text-xs">W</kbd>
                        <kbd className="px-2 py-1 rounded bg-stone-800 border border-stone-700 text-stone-200 font-mono font-bold text-xs">A</kbd>
                        <kbd className="px-2 py-1 rounded bg-stone-800 border border-stone-700 text-stone-200 font-mono font-bold text-xs">S</kbd>
                        <kbd className="px-2 py-1 rounded bg-stone-800 border border-stone-700 text-stone-200 font-mono font-bold text-xs">D</kbd>
                      </div>
                      <span className="font-medium text-stone-200">/ Tombol Panah</span>
                    </div>
                    <span className="text-stone-400 font-mono text-[11px]">Gerak 8-Arah</span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-900/70 border border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <kbd className="px-3 py-1 rounded bg-red-950 border border-red-800 text-red-300 font-mono font-bold text-xs">J</kbd>
                      <span className="font-medium text-stone-200">Tombol Serang</span>
                    </div>
                    <span className="text-red-300 font-mono text-[11px]">Tebasan Pedang Perak</span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-900/70 border border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 rounded bg-stone-800 border border-stone-700 text-stone-200 font-mono font-bold text-xs">Spasi</kbd>
                      <span className="text-stone-400">/</span>
                      <kbd className="px-2 py-1 rounded bg-stone-800 border border-stone-700 text-stone-200 font-mono font-bold text-xs">K</kbd>
                    </div>
                    <span className="text-sky-300 font-mono text-[11px]">Terjang Menghindar (Dash)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-900/70 border border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 rounded bg-stone-800 border border-stone-700 text-stone-200 font-mono font-bold text-xs">E</kbd>
                      <span className="text-stone-400">/</span>
                      <kbd className="px-2 py-1 rounded bg-stone-800 border border-stone-700 text-stone-200 font-mono font-bold text-xs">F</kbd>
                    </div>
                    <span className="text-amber-300 font-mono text-[11px]">Bicara NPC / Peti</span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-900/70 border border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <kbd className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 text-stone-200 font-mono font-bold text-xs">I</kbd>
                      <span className="font-medium text-stone-200">Inventori</span>
                    </div>
                    <span className="text-stone-400 font-mono text-[11px]">Buka Tas &amp; Perlengkapan</span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-900/70 border border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <kbd className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 text-stone-200 font-mono font-bold text-xs">G</kbd>
                      <span className="font-medium text-stone-200">Pohon Skill</span>
                    </div>
                    <span className="text-stone-400 font-mono text-[11px]">Grimoire Keahlian</span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-900/70 border border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <kbd className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 text-stone-200 font-mono font-bold text-xs">M</kbd>
                      <span className="font-medium text-stone-200">Purnama Darah</span>
                    </div>
                    <span className="text-rose-400 font-mono text-[11px]">Toggle Blood Moon</span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-900/70 border border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <kbd className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 text-stone-200 font-mono font-bold text-xs">H</kbd>
                      <span className="font-medium text-stone-200">Mode Layar</span>
                    </div>
                    <span className="text-stone-400 font-mono text-[11px]">HD 480p vs Piksel 180p</span>
                  </div>
                </div>

                {/* Mobile / Touch Screen Guide */}
                <div className="p-3.5 rounded-xl bg-stone-900/50 border border-stone-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center shrink-0 text-sky-400">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-200 text-xs mb-0.5">Kontrol Layar Sentuh (HP &amp; Tablet)</h4>
                    <p className="text-[11px] text-stone-400">
                      Gunakan D-Pad virtual di sudut kiri bawah layar untuk menggerakkan karakter ke 8 arah. Tombol merah di kanan untuk menebas pedang, tombol biru untuk meluncur (dash), dan tombol bicara untuk berinteraksi dengan penduduk.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SISTEM GAMEPLAY */}
            {activeTab === 'gameplay' && (
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                    <Moon className="w-4 h-4 text-rose-400" />
                    <span>Siklus Purnama Darah (Blood Moon Event)</span>
                  </div>
                  <p className="text-[11px] text-stone-300">
                    Saat langit malam berubah menjadi merah menyala, kekuatan kutukan vampir merajalela. Monster bergerak lebih cepat dan memiliki damage lebih tinggi, namun menjatuhkan permata darah dan bijih perak terkutuk dengan persentase drop rate dua kali lipat.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-2">
                  <div className="flex items-center gap-2 text-sky-300 font-semibold text-sm">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>Kedalaman 2.5D &amp; Y-Sort Engine</span>
                  </div>
                  <p className="text-[11px] text-stone-300">
                    Menggunakan algoritma pengurutan Y-Sort standar Godot Engine sehingga posisi kaki karakter menentukan apakah Anda berada di depan atau di belakang pilar katedral, batu nisan, gerbang besi, atau pohon berkabut.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Penempaan Senjata &amp; Alkimia Ramuan</span>
                  </div>
                  <p className="text-[11px] text-stone-300">
                    Kunjungi Viktor di Bengkel Api Abadi untuk menaikkan level ketajaman pedang atau Eldrin di Rawa Jamur Beracun untuk meracik ramuan pemulih HP dan penambah kecepatan jelajah.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: TOKOH & KARAKTER */}
            {activeTab === 'characters' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-stone-400">
                    Terdapat 12 tokoh unik dengan visual, kostum, dan dialog eksklusif:
                  </p>
                  {onOpenNPCModal && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenNPCModal();
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                    >
                      Buka Roster Lengkap 12 Tokoh &rarr;
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800 flex items-center gap-2.5">
                    <span className="text-xl">🥀</span>
                    <div>
                      <h4 className="font-bold text-red-300">Lady Carmilla</h4>
                      <p className="text-[10px] text-stone-400">Bangsawan gaun merah klan darah malam</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800 flex items-center gap-2.5">
                    <span className="text-xl">⚔️</span>
                    <div>
                      <h4 className="font-bold text-amber-300">Inkuisitor Balthazar</h4>
                      <p className="text-[10px] text-stone-400">Topi pemburu iblis &amp; mantel salib perak</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800 flex items-center gap-2.5">
                    <span className="text-xl">🔨</span>
                    <div>
                      <h4 className="font-bold text-orange-300">Viktor sang Pandai Besi</h4>
                      <p className="text-[10px] text-stone-400">Kacamata las bara &amp; apron kulit tempa</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800 flex items-center gap-2.5">
                    <span className="text-xl">🕯️</span>
                    <div>
                      <h4 className="font-bold text-sky-300">Suster Genevieve</h4>
                      <p className="text-[10px] text-stone-400">Kafan penutup mata suci &amp; salib perak</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800 flex items-center gap-2.5">
                    <span className="text-xl">⚰️</span>
                    <div>
                      <h4 className="font-bold text-stone-300">Morgath si Penjaga Kubur</h4>
                      <p className="text-[10px] text-stone-400">Tudung goni, lentera hijau &amp; sekop tua</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800 flex items-center gap-2.5">
                    <span className="text-xl">👻</span>
                    <div>
                      <h4 className="font-bold text-teal-300">Hantu Ksatria Godfrey</h4>
                      <p className="text-[10px] text-stone-400">Zirah arwah ethereal hijau bercahaya</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800 flex items-center gap-2.5">
                    <span className="text-xl">🌿</span>
                    <div>
                      <h4 className="font-bold text-emerald-300">Eldrin sang Alkemis</h4>
                      <p className="text-[10px] text-stone-400">Monokel emas &amp; sabuk botol racun rawa</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800 flex items-center gap-2.5">
                    <span className="text-xl">🎀</span>
                    <div>
                      <h4 className="font-bold text-rose-300">Seraphina si Boneka Gotik</h4>
                      <p className="text-[10px] text-stone-400">Gaun lolita renda &amp; pemutar mekanik</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: BGM & AUDIO */}
            {activeTab === 'audio' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-stone-900/70 border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-stone-200 text-sm">Status Audio &amp; BGM Latar</h4>
                      <p className="text-[11px] text-stone-400">
                        {customAudioName ? `Memutar File Kustom: ${customAudioName}` : 'Memutar Musik Box 2:04 (12-Bar Melodi Lengkap)'}
                      </p>
                    </div>
                    <button
                      onClick={handleTestSound}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 flex items-center gap-1.5 transition text-xs cursor-pointer"
                    >
                      <Bell className={`w-3.5 h-3.5 ${testSoundRung ? 'animate-bounce text-amber-400' : ''}`} />
                      <span>{testSoundRung ? 'Lonceng Berbunyi!' : 'Tes Denting Suara'}</span>
                    </button>
                  </div>

                  {/* Upload / Tempel Audio Card */}
                  <div className="p-3 rounded-xl bg-black/40 border border-amber-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-amber-200 text-xs">
                        Tempel / Pasang File Audio BGM Sendiri
                      </p>
                      <p className="text-[11px] text-stone-400">
                        Pilih file audio/video (.mp3, .wav, .mp4, .ogg) dari perangkat Anda. Tersimpan permanen di browser!
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAudioUpload}
                        accept="audio/*,video/*,.mp3,.wav,.ogg,.mp4,.m4a,.aac,.webm"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 flex items-center gap-1.5 text-xs font-semibold shadow transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-red-400" />
                        <span>{customAudioName ? 'Ganti File BGM' : 'Pilih File Audio'}</span>
                      </button>

                      {customAudioName && (
                        <button
                          onClick={handleResetAudio}
                          className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-700 text-xs"
                          title="Kembalikan ke Musik Box Bawaan"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer button */}
          <div className="px-5 py-3 border-t border-stone-900 bg-black/50 flex justify-end">
            <button
              onClick={() => {
                audioManager.playSelect();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold transition cursor-pointer"
            >
              Tutup Panduan
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
