import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DialogueNode } from '../types/game';
import { audioManager } from '../game/audio';
import { RotateCcw, X, ArrowRight } from 'lucide-react';

interface DialogueBoxProps {
  dialogue: DialogueNode | null;
  onOptionSelect: (nextId?: string, action?: string) => void;
  onClose: () => void;
}

// Preset metadata and quotes for characters
interface CharacterPreset {
  name: string;
  affiliation: string;
  title: string;
  moodTag: string;
  quote: string;
}

const getCharacterInfo = (speaker: string, title?: string, affiliation?: string, mood?: string): CharacterPreset => {
  const s = speaker.toLowerCase();
  if (s.includes('dungeon') || s.includes('master')) {
    return {
      name: 'Dungeon Master',
      affiliation: affiliation || 'PENJAGA GERBANG DIMENSI',
      title: title || 'Penjaga Gerbang Menara 100 Lantai',
      moodTag: mood || 'MISTERIUS & BERWIBAWA',
      quote: "Di balik gerbang ini terbentang 100 lantai neraka dan takhta dewa... Apakah pedangmu telah siap?",
    };
  }
  if (s.includes('carmilla') || s.includes('lady')) {
    return {
      name: 'Lady Carmilla',
      affiliation: affiliation || 'KLAN BAYANGAN MALAM',
      title: title || 'Bangsawan Darah Terkutuk',
      moodTag: mood || 'MISTERIUS & MEMIKAT',
      quote: "Malam ini begitu dingin, pemburu... Apakah nadimu masih berdegup hangat?",
    };
  }
  if (s.includes('genevieve') || s.includes('suster') || s.includes('nun')) {
    return {
      name: 'Suster Genevieve',
      affiliation: affiliation || 'KATEDRAL BULAN DARAH',
      title: title || 'Biarawati Buta Pembawa Cahaya Suci',
      moodTag: mood || 'SUCI & LEMBUT',
      quote: "Dalam kegelapan yang paling pekat sekalipun, secercah doa suci takkan pernah padam.",
    };
  }
  if (s.includes('balthazar') || s.includes('inkuisitor')) {
    return {
      name: 'Inkuisitor Balthazar',
      affiliation: affiliation || 'ORDO SALIB PERAK',
      title: title || 'Kepala Ordo Salib Perak',
      moodTag: mood || 'TEGAS & WASPADA',
      quote: "Darah iblis takkan pernah menyucikan tanah para leluhur kita. Bersiaplah!",
    };
  }
  if (s.includes('viktor') || s.includes('besi') || s.includes('smith')) {
    return {
      name: 'Viktor sang Pandai Besi',
      affiliation: affiliation || 'BENGKEL API ABADI',
      title: title || 'Penempa Senjata Perak Terkutuk',
      moodTag: mood || 'KASAR NAMUN SETIA',
      quote: "Bawakan aku logam perak dan pecahan tulang, niscaya kutempa pedang pemotong jiwa!",
    };
  }
  if (s.includes('celestine') || s.includes('astrolog')) {
    return {
      name: 'Celestine sang Astrolog',
      affiliation: affiliation || 'MENARA RERUNTUHAN BINTANG',
      title: title || 'Astrolog Konstelasi Malam',
      moodTag: mood || 'TENANG & MISTIS',
      quote: "Bintang-bintang meramalkan gerhana darah yang belum pernah disaksikan fana...",
    };
  }
  if (s.includes('morrigan') || s.includes('gagak')) {
    return {
      name: 'Morrigan sang Ratu Gagak',
      affiliation: affiliation || 'RAWA KABUT BERACUN',
      title: title || 'Penguasa Rawa Kabut Beracun',
      moodTag: mood || 'GELAP & DINGIN',
      quote: "Gagak-gagakku mencium bau darah segar di udara malam ini, wahai pengelana.",
    };
  }
  if (s.includes('aria') || s.includes('penyair')) {
    return {
      name: 'Aria sang Penyair',
      affiliation: affiliation || 'MUSISI RERUNTUHAN',
      title: title || 'Pengembara Pembawa Biola Terkutuk',
      moodTag: mood || 'MELANKOLIS & PUITIS',
      quote: "Dengarkan alunan dawai ini, ratapan bagi mereka yang tak sempat menyambut fajar.",
    };
  }
  if (s.includes('elena') || s.includes('tabib')) {
    return {
      name: 'Elena sang Tabib',
      affiliation: affiliation || 'SUAKA PENYEMBUHAN',
      title: title || 'Tabib Desa Ravenfall',
      moodTag: mood || 'RAMAH & TULUS',
      quote: "Istirahatlah sejenak. Luka-luka ragamu butuh ramuan penenang sebelum melanjutkan.",
    };
  }
  if (s.includes('vladimir') || s.includes('pelayan') || s.includes('butler')) {
    return {
      name: 'Vladimir sang Pelayan',
      affiliation: affiliation || 'KASTIL BAYANGAN ABADI',
      title: title || 'Kepala Pelayan Istana Drakula',
      moodTag: mood || 'SOPAN & ELEGAN',
      quote: "Selamat datang di suaka malam. Izinkan saya membimbing langkah Anda di istana.",
    };
  }
  if (s.includes('noel') || s.includes('squire') || s.includes('penjaga gerbang')) {
    return {
      name: 'Noel sang Penjaga Gerbang',
      affiliation: affiliation || 'ORDO PENGAWAL SUAKA',
      title: title || 'Squire Muda Penjaga Batas',
      moodTag: mood || 'WASPADA & GAGAH',
      quote: "Pintu gerbang terjaga siang dan malam! Siapkan senjatamu sebelum melangkah keluar!",
    };
  }
  if (s.includes('lilith')) {
    return {
      name: 'Putri Lilith',
      affiliation: affiliation || 'DARAH BANGSAWAN VAMPIRE',
      title: title || 'Tuan Putri Malam Bertaring',
      moodTag: mood || 'MANJA & MENUSUK',
      quote: "Hehe... jangan menatapku seperti itu. Jiwamu terlalu manis untuk dilewatkan begitu saja.",
    };
  }
  if (s.includes('seraphina')) {
    return {
      name: 'Boneka Seraphina',
      affiliation: affiliation || 'BONEKA HIDUP GOTHIC',
      title: title || 'Penjaga Memori Kuno',
      moodTag: mood || 'MISTERIUS & HENING',
      quote: "Putar kunciku... dan kubisikkan rahasia kuno yang terpendam di bawah nisan.",
    };
  }
  if (s.includes('valerius')) {
    return {
      name: 'Pangeran Valerius',
      affiliation: affiliation || 'BANGSAWAN SERIGALA BAYANGAN',
      title: title || 'Pangeran Terbuang Klan Serigala',
      moodTag: mood || 'DINGIN & LIAR',
      quote: "Bulan purnama akan datang. Pastikan pedangmu cukup tajam untuk menembus kulitku.",
    };
  }
  if (s.includes('roderick')) {
    return {
      name: 'Komandan Roderick',
      affiliation: affiliation || 'LEGION CRUSADER BESI',
      title: title || 'Veteran Perang Katakomba',
      moodTag: mood || 'TEGAR & KUAT',
      quote: "Tameng bajaku telah menahan ribuan cakaran iblis. Berdirilah di belakangku jika ragu.",
    };
  }
  if (s.includes('eldrin')) {
    return {
      name: 'Master Eldrin',
      affiliation: affiliation || 'AKADEMI ALKIMIA KUNO',
      title: title || 'Alkemis Tabib Transmutasi',
      moodTag: mood || 'BIJAKSANA & KREATIF',
      quote: "Semua zat memiliki esensi rahasia. Dengan ramuan yang tepat, racun pun menjadi obat mujarab.",
    };
  }

  return {
    name: speaker,
    affiliation: affiliation || 'WARGA TANAH RAVENFALL',
    title: title || 'Pengembara Gothic',
    moodTag: mood || 'NORMAL',
    quote: "Kutukan malam ini semakin pekat... Tetaplah waspada di luar suaka.",
  };
};

export const DialogueBox: React.FC<DialogueBoxProps> = ({ dialogue, onOptionSelect, onClose }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [textSpeed, setTextSpeed] = useState<'normal' | 'fast'>('normal');
  const [soundOn, setSoundOn] = useState(true);

  const charDelay = textSpeed === 'fast' ? 12 : 24;

  const charInfo = dialogue
    ? getCharacterInfo(dialogue.speaker, dialogue.speakerTitle, dialogue.affiliation, dialogue.mood)
    : null;

  useEffect(() => {
    if (!dialogue) {
      setDisplayedText('');
      setCharIndex(0);
      return;
    }
    setDisplayedText('');
    setCharIndex(0);
    const fullText = dialogue.text;
    const interval = setInterval(() => {
      setCharIndex((prev) => {
        if (prev < fullText.length) {
          const next = prev + 1;
          setDisplayedText(fullText.slice(0, next));
          if (next % 3 === 0 && soundOn) {
            audioManager.playBlip();
          }
          return next;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, charDelay);

    return () => clearInterval(interval);
  }, [dialogue, textSpeed, soundOn, charDelay]);

  if (!dialogue || !charInfo) return null;

  const isComplete = charIndex >= dialogue.text.length;

  const handleSkipOrNext = () => {
    if (!isComplete) {
      setDisplayedText(dialogue.text);
      setCharIndex(dialogue.text.length);
    } else if (!dialogue.options || dialogue.options.length === 0) {
      onClose();
    }
  };

  const handleReplay = () => {
    setDisplayedText('');
    setCharIndex(0);
    if (soundOn) audioManager.playBlip();
  };

  const toggleSpeed = () => {
    setTextSpeed((prev) => (prev === 'normal' ? 'fast' : 'normal'));
    if (soundOn) audioManager.playSelect();
  };

  return (
    <div
      id="dialogue-box-overlay"
      className="absolute inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none font-sans"
      onClick={(e) => {
        // Clicking outer background closes dialogue
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Outer Dialogue Modal Container - Responsive max-height prevents iframe cutoffs */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-2xl max-h-[94vh] sm:max-h-[90vh] rounded-2xl bg-[#0c0614]/98 border border-[#4a1d46] shadow-[0_15px_60px_rgba(0,0,0,0.95)] backdrop-blur-xl overflow-hidden flex flex-col relative"
      >
        {/* TOP BAR OF DIALOGUE CARD */}
        <div className="w-full px-4 py-2.5 border-b border-[#28112e] flex items-center justify-between bg-[#11081a] shrink-0">
          {/* Left: Speaker Identity & Affiliation */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-sm sm:text-base font-bold text-white tracking-wide truncate">
                  {charInfo.name}
                </h3>
                <span className="px-1.5 py-0.5 rounded bg-[#330810] border border-[#7f1d1d]/80 text-[#fca5a5] text-[10px] font-mono font-bold tracking-wider uppercase">
                  {charInfo.affiliation}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-400 font-medium truncate">
                {charInfo.title}
              </p>
            </div>
          </div>

          {/* Right: Quick Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="dialogue-speed-btn"
              onClick={toggleSpeed}
              className="px-2 py-0.5 rounded bg-stone-900 border border-amber-800/80 text-amber-300 text-[10px] font-mono hover:bg-stone-800 transition cursor-pointer"
              title="Kecepatan teks"
            >
              {textSpeed === 'fast' ? 'Cepat' : 'Normal'}
            </button>

            <button
              id="dialogue-replay-btn"
              onClick={handleReplay}
              className="p-1 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
              title="Ulangi Teks Dialog"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            <button
              id="dialogue-close-btn"
              onClick={onClose}
              className="p-1 rounded bg-red-950/80 border border-red-700/60 text-red-300 hover:bg-red-900 transition cursor-pointer ml-1"
              title="Tutup Percakapan [ESC]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* LORE QUOTE BAR (NO FACE VISUAL) */}
        {charInfo.quote && (
          <div className="w-full px-4 py-2 bg-gradient-to-r from-[#180d24]/95 via-[#12071c]/95 to-[#180d24]/95 border-b border-[#28112e] flex items-center">
            <p className="text-xs text-purple-200/90 italic font-serif leading-snug">
              "{charInfo.quote}"
            </p>
          </div>
        )}

        {/* BOTTOM DIALOGUE SECTION - Fully visible, responsive options */}
        <div className="w-full p-3.5 sm:p-4 bg-[#0a0410] flex flex-col gap-3 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-purple-800 scrollbar-track-transparent">
          {/* Top Bar of dialogue area: Speaker Mood Pill & Click to Continue Hint */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/70 text-amber-300 text-[11px] font-bold font-mono tracking-wide shadow-sm">
              <span>✨</span>
              <span>{charInfo.name.toUpperCase()} ({charInfo.moodTag})</span>
            </div>

            <span className="text-[10px] font-mono text-stone-400">
              [ESC / Tutup]
            </span>
          </div>

          {/* Incoming Reward / Milestone Banner if applicable */}
          {(dialogue.options?.some(o => o.action?.startsWith('claim_reward_') || o.action === 'blessing' || o.action === 'vampire_gift') || dialogue.text.toLowerCase().includes('lantai') || dialogue.text.toLowerCase().includes('hadiah')) && (
            <div className="px-3 py-1.5 bg-amber-950/80 border border-amber-500/80 rounded-xl flex items-center gap-2 text-amber-200 text-xs font-mono shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <span className="text-base animate-bounce">🎁</span>
              <div className="flex flex-col">
                <span className="font-bold text-amber-300">Milestone Menara & Reward Wilayah</span>
                <span className="text-[10px] text-amber-200/80">Penuhi syarat level / lantai menara untuk mengklaim hadiah dari NPC!</span>
              </div>
            </div>
          )}

          {/* Typewriter Text Box */}
          <div
            onClick={handleSkipOrNext}
            className="min-h-[50px] cursor-pointer text-stone-100 text-xs sm:text-sm leading-relaxed tracking-wide font-sans select-none"
          >
            <p>
              {displayedText}
              {!isComplete && (
                <span className="inline-block w-1.5 h-3.5 ml-1 bg-amber-400 animate-pulse align-middle" />
              )}
            </p>
          </div>

          {/* Interactive Choice Options (If Present) */}
          {isComplete && dialogue.options && dialogue.options.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-purple-950/80">
              {dialogue.options.map((option, idx) => (
                <motion.button
                  key={idx}
                  id={`dialogue-option-${idx}`}
                  whileHover={{ scale: 1.005, x: 3 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    if (soundOn) audioManager.playBlip();
                    onOptionSelect(option.nextId, option.action);
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-purple-950/70 hover:bg-gradient-to-r hover:from-amber-950/90 hover:to-purple-900/90 border border-purple-800/70 hover:border-amber-500/80 text-xs sm:text-sm text-stone-100 font-medium transition-all flex items-center justify-between shadow-sm cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    {option.icon && <span className="text-sm">{option.icon}</span>}
                    <span>{option.text}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-amber-400" />
                </motion.button>
              ))}
            </div>
          )}

          {/* Action indicator when text is complete and no options */}
          {isComplete && (!dialogue.options || dialogue.options.length === 0) && (
            <div className="flex justify-end pt-1">
              <button
                onClick={onClose}
                className="text-xs text-amber-400 hover:text-amber-300 font-mono tracking-wider animate-pulse flex items-center gap-1.5 cursor-pointer"
              >
                <span>[Selesai & Lanjut Petualangan]</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
