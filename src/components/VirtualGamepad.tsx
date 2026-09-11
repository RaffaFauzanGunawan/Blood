import React from 'react';
import { Sword, Hand, Backpack, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Shield, Zap, Sparkles } from 'lucide-react';

interface VirtualGamepadProps {
  onDirectionChange: (dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => void;
  onAttack: () => void;
  onParry: () => void;
  onDefend: (active: boolean) => void;
  onWeaponSkill: () => void;
  onDungeonSkill: () => void;
  onInteract: () => void;
  onOpenInventory: () => void;
}

export const VirtualGamepad: React.FC<VirtualGamepadProps> = ({
  onDirectionChange,
  onAttack,
  onParry,
  onDefend,
  onWeaponSkill,
  onDungeonSkill,
  onInteract,
  onOpenInventory,
}) => {
  return (
    <div className="flex md:hidden items-center justify-between px-1.5 sm:px-3 py-1 sm:py-1.5 bg-slate-950/95 border-t border-slate-800/80 select-none overflow-x-auto touch-none shrink-0">
      {/* Directional Pad */}
      <div className="relative w-18 h-18 sm:w-26 sm:h-26 grid grid-cols-3 grid-rows-3 gap-0.5 shrink-0">
        {/* Up */}
        <button
          id="vpad-up"
          onPointerDown={() => onDirectionChange('up', true)}
          onPointerUp={() => onDirectionChange('up', false)}
          onPointerLeave={() => onDirectionChange('up', false)}
          className="col-start-2 row-start-1 bg-slate-800/90 active:bg-amber-600 rounded flex items-center justify-center text-slate-300 border border-slate-700/80 shadow-sm"
        >
          <ChevronUp className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        </button>
        {/* Left */}
        <button
          id="vpad-left"
          onPointerDown={() => onDirectionChange('left', true)}
          onPointerUp={() => onDirectionChange('left', false)}
          onPointerLeave={() => onDirectionChange('left', false)}
          className="col-start-1 row-start-2 bg-slate-800/90 active:bg-amber-600 rounded flex items-center justify-center text-slate-300 border border-slate-700/80 shadow-sm"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        </button>
        {/* Center */}
        <div className="col-start-2 row-start-2 bg-slate-950/80 rounded border border-slate-800/80 flex items-center justify-center text-[6px] sm:text-[8px] text-slate-600 font-mono">
          PAD
        </div>
        {/* Right */}
        <button
          id="vpad-right"
          onPointerDown={() => onDirectionChange('right', true)}
          onPointerUp={() => onDirectionChange('right', false)}
          onPointerLeave={() => onDirectionChange('right', false)}
          className="col-start-3 row-start-2 bg-slate-800/90 active:bg-amber-600 rounded flex items-center justify-center text-slate-300 border border-slate-700/80 shadow-sm"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        </button>
        {/* Down */}
        <button
          id="vpad-down"
          onPointerDown={() => onDirectionChange('down', true)}
          onPointerUp={() => onDirectionChange('down', false)}
          onPointerLeave={() => onDirectionChange('down', false)}
          className="col-start-2 row-start-3 bg-slate-800/90 active:bg-amber-600 rounded flex items-center justify-center text-slate-300 border border-slate-700/80 shadow-sm"
        >
          <ChevronDown className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Combat & Interaction Action Buttons */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Weapon Skill (R) */}
        <button
          id="vpad-weapon-skill"
          onClick={onWeaponSkill}
          className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-amber-950/90 active:bg-amber-600 border border-amber-500/60 flex flex-col items-center justify-center text-amber-300 shadow-sm"
          title="Skill Senjata [R]"
        >
          <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="text-[6px] sm:text-[7px] font-mono font-bold leading-none">SKL</span>
        </button>

        {/* Dungeon Smite Skill (F) */}
        <button
          id="vpad-dungeon-skill"
          onClick={onDungeonSkill}
          className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-sky-950/90 active:bg-sky-600 border border-sky-500/60 flex flex-col items-center justify-center text-sky-300 shadow-sm"
          title="Skill Dungeon Smite [F]"
        >
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="text-[6px] sm:text-[7px] font-mono font-bold leading-none">SMT</span>
        </button>

        {/* Parry Button (Q/C) */}
        <button
          id="vpad-parry"
          onClick={onParry}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-950/90 active:bg-yellow-600 border border-yellow-400 flex flex-col items-center justify-center text-yellow-300 shadow-sm"
          title="Tangkis / Parry [Q/C]"
        >
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
          <span className="text-[6px] sm:text-[7px] font-mono font-bold leading-none">PARRY</span>
        </button>

        {/* Guard / Defend Button (Shift) */}
        <button
          id="vpad-defend"
          onPointerDown={() => onDefend(true)}
          onPointerUp={() => onDefend(false)}
          onPointerLeave={() => onDefend(false)}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-950/90 active:bg-blue-600 border border-blue-400 flex flex-col items-center justify-center text-blue-300 shadow-sm"
          title="Tahan Tameng Guard [Shift]"
        >
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
          <span className="text-[6px] sm:text-[7px] font-mono font-bold leading-none">GUARD</span>
        </button>

        {/* Interact button (E) */}
        <button
          id="vpad-interact"
          onClick={onInteract}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-800/90 active:bg-amber-600 border border-amber-400 flex flex-col items-center justify-center text-amber-100 shadow-sm"
          title="Interaksi [E]"
        >
          <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-[6px] sm:text-[8px] font-mono font-bold leading-none">E</span>
        </button>

        {/* Attack button (J) */}
        <button
          id="vpad-attack"
          onClick={onAttack}
          className="w-9.5 h-9.5 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-rose-600 to-red-700 active:from-red-500 active:to-red-600 border-2 border-amber-300 flex flex-col items-center justify-center text-white shadow-md shadow-red-950"
          title="Tebas Pedang [J]"
        >
          <Sword className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[7px] sm:text-[8px] font-mono font-bold leading-none">ATK</span>
        </button>

        {/* Inventory button */}
        <button
          id="vpad-inventory"
          onClick={onOpenInventory}
          className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-800/90 active:bg-slate-700 border border-slate-700 flex flex-col items-center justify-center text-amber-300 shadow-sm"
          title="Inventaris [I]"
        >
          <Backpack className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="text-[6px] sm:text-[7px] font-mono leading-none">BAG</span>
        </button>
      </div>
    </div>
  );
};
