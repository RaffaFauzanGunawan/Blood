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
    <div className="flex md:hidden items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-900/95 border-t border-slate-800 select-none overflow-x-auto">
      {/* Directional Pad */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 grid grid-cols-3 grid-rows-3 gap-1 shrink-0">
        {/* Up */}
        <button
          id="vpad-up"
          onPointerDown={() => onDirectionChange('up', true)}
          onPointerUp={() => onDirectionChange('up', false)}
          onPointerLeave={() => onDirectionChange('up', false)}
          className="col-start-2 row-start-1 bg-slate-800 active:bg-amber-600 rounded-md flex items-center justify-center text-slate-300 border border-slate-700"
        >
          <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        {/* Left */}
        <button
          id="vpad-left"
          onPointerDown={() => onDirectionChange('left', true)}
          onPointerUp={() => onDirectionChange('left', false)}
          onPointerLeave={() => onDirectionChange('left', false)}
          className="col-start-1 row-start-2 bg-slate-800 active:bg-amber-600 rounded-md flex items-center justify-center text-slate-300 border border-slate-700"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        {/* Center */}
        <div className="col-start-2 row-start-2 bg-slate-950/60 rounded-md border border-slate-800/80 flex items-center justify-center text-[8px] text-slate-600 font-mono">
          PAD
        </div>
        {/* Right */}
        <button
          id="vpad-right"
          onPointerDown={() => onDirectionChange('right', true)}
          onPointerUp={() => onDirectionChange('right', false)}
          onPointerLeave={() => onDirectionChange('right', false)}
          className="col-start-3 row-start-2 bg-slate-800 active:bg-amber-600 rounded-md flex items-center justify-center text-slate-300 border border-slate-700"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        {/* Down */}
        <button
          id="vpad-down"
          onPointerDown={() => onDirectionChange('down', true)}
          onPointerUp={() => onDirectionChange('down', false)}
          onPointerLeave={() => onDirectionChange('down', false)}
          className="col-start-2 row-start-3 bg-slate-800 active:bg-amber-600 rounded-md flex items-center justify-center text-slate-300 border border-slate-700"
        >
          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Combat & Interaction Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Weapon Skill (R) */}
        <button
          id="vpad-weapon-skill"
          onClick={onWeaponSkill}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-950 active:bg-amber-600 border border-amber-500/70 flex flex-col items-center justify-center text-amber-300 shadow"
          title="Skill Senjata [R]"
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="text-[7px] font-mono font-bold">SKL</span>
        </button>

        {/* Dungeon Smite Skill (F) */}
        <button
          id="vpad-dungeon-skill"
          onClick={onDungeonSkill}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-950 active:bg-sky-600 border border-sky-500/70 flex flex-col items-center justify-center text-sky-300 shadow"
          title="Skill Dungeon Smite [F]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[7px] font-mono font-bold">SMT</span>
        </button>

        {/* Parry Button (Q/C) */}
        <button
          id="vpad-parry"
          onClick={onParry}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-yellow-950 active:bg-yellow-600 border-2 border-yellow-400 flex flex-col items-center justify-center text-yellow-300 shadow-md"
          title="Tangkis / Parry [Q/C]"
        >
          <Shield className="w-4 h-4 text-yellow-400" />
          <span className="text-[7px] font-mono font-bold">PARRY</span>
        </button>

        {/* Guard / Defend Button (Shift) */}
        <button
          id="vpad-defend"
          onPointerDown={() => onDefend(true)}
          onPointerUp={() => onDefend(false)}
          onPointerLeave={() => onDefend(false)}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue-950 active:bg-blue-600 border-2 border-blue-400 flex flex-col items-center justify-center text-blue-300 shadow-md"
          title="Tahan Tameng Guard [Shift]"
        >
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="text-[7px] font-mono font-bold">GUARD</span>
        </button>

        {/* Interact button (E) */}
        <button
          id="vpad-interact"
          onClick={onInteract}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-amber-800 active:bg-amber-600 border border-amber-400 flex flex-col items-center justify-center text-amber-100 shadow"
          title="Interaksi [E]"
        >
          <Hand className="w-4 h-4" />
          <span className="text-[8px] font-mono font-bold">E</span>
        </button>

        {/* Attack button (J) */}
        <button
          id="vpad-attack"
          onClick={onAttack}
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br from-rose-600 to-red-700 active:from-red-500 active:to-red-600 border-2 border-amber-300 flex flex-col items-center justify-center text-white shadow-lg shadow-red-950"
          title="Tebas Pedang [J]"
        >
          <Sword className="w-5 h-5" />
          <span className="text-[8px] font-mono font-bold">ATK</span>
        </button>

        {/* Inventory button */}
        <button
          id="vpad-inventory"
          onClick={onOpenInventory}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800 active:bg-slate-700 border border-slate-700 flex flex-col items-center justify-center text-amber-300 shadow"
          title="Inventaris [I]"
        >
          <Backpack className="w-3.5 h-3.5" />
          <span className="text-[7px] font-mono">BAG</span>
        </button>
      </div>
    </div>
  );
};
