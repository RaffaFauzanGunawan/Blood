import React, { useState } from 'react';
import { ItemData, EquipmentSlots } from '../types/game';
import {
  X,
  Sparkles,
  Shield,
  Heart,
  Coins,
  Package,
  Info,
  Sword,
  Zap,
  Check,
  MinusCircle,
  Award,
} from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: ItemData[];
  onUseItem: (id: string) => void;
  equipment?: EquipmentSlots;
  onEquipItem?: (item: ItemData) => void;
  onUnequipItem?: (slot: 'weapon' | 'armor' | 'accessory') => void;
  playerHp: number;
  maxHp: number;
  playerGold: number;
  playerAttack?: number;
  playerDefense?: number;
  playerSpeed?: number;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onUseItem,
  equipment = { weapon: null, armor: null, accessory: null },
  onEquipItem,
  onUnequipItem,
  playerHp,
  maxHp,
  playerGold,
  playerAttack = 18,
  playerDefense = 0,
  playerSpeed = 105,
}) => {
  const [selectedItem, setSelectedItem] = useState<ItemData | null>(inventory[0] || null);

  if (!isOpen) return null;

  // Check if an item is currently equipped
  const isItemEquipped = (item: ItemData): 'weapon' | 'armor' | 'accessory' | null => {
    if (equipment.weapon?.id === item.id) return 'weapon';
    if (equipment.armor?.id === item.id) return 'armor';
    if (equipment.accessory?.id === item.id) return 'accessory';
    return null;
  };

  const equippedSlot = selectedItem ? isItemEquipped(selectedItem) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        id="inventory-modal"
        className="bg-slate-900 border-2 border-amber-600/80 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl text-slate-100 flex flex-col gap-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-amber-100 tracking-wide font-sans">
                Inventaris &amp; Perlengkapan Petualang
              </h2>
              <p className="text-[11px] text-slate-400">
                Format Arsitektur Godot 4 `ItemData.gd` Resource System
              </p>
            </div>
          </div>
          <button
            id="close-inventory-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Comprehensive Combat Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs">
          {/* Health */}
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400 fill-red-400/20 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400">HP</div>
              <div className="font-bold text-red-300 font-mono">
                {playerHp}/{maxHp}
              </div>
            </div>
          </div>
          {/* Gold */}
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400/20 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400">Emas</div>
              <div className="font-bold text-amber-300 font-mono">{playerGold} G</div>
            </div>
          </div>
          {/* Attack */}
          <div className="flex items-center gap-2">
            <Sword className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400">Serangan (ATK)</div>
              <div className="font-bold text-rose-300 font-mono">{playerAttack}</div>
            </div>
          </div>
          {/* Defense */}
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400">Pertahanan (DEF)</div>
              <div className="font-bold text-sky-300 font-mono">{playerDefense}</div>
            </div>
          </div>
          {/* Speed */}
          <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400">Kecepatan (SPD)</div>
              <div className="font-bold text-emerald-300 font-mono">{playerSpeed}</div>
            </div>
          </div>
        </div>

        {/* EQUIPPED SLOTS BAR */}
        <div className="bg-slate-950/90 border border-amber-900/40 p-3 rounded-xl">
          <div className="text-[11px] font-mono uppercase text-amber-400/90 font-bold mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              Slot Perlengkapan Aktif (Equipment Slots)
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              Statistik otomatis dihitung ulang
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Slot: Senjata (Weapon) */}
            <div
              className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 transition ${
                equipment.weapon
                  ? 'border-rose-700/80 bg-rose-950/30'
                  : 'border-slate-800 bg-slate-900/50 border-dashed'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center text-xl shrink-0 border border-slate-700">
                  {equipment.weapon ? equipment.weapon.icon : '🗡️'}
                </div>
                <div className="truncate">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Senjata</div>
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {equipment.weapon ? equipment.weapon.name : 'Kosong'}
                  </div>
                  {equipment.weapon && equipment.weapon.attack_bonus && (
                    <div className="text-[10px] text-rose-400 font-mono">
                      +{equipment.weapon.attack_bonus} ATK
                    </div>
                  )}
                </div>
              </div>
              {equipment.weapon && onUnequipItem && (
                <button
                  id="unequip-weapon-btn"
                  onClick={() => onUnequipItem('weapon')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-600 text-[10px] font-mono transition shrink-0"
                  title="Lepaskan Senjata"
                >
                  Lepas
                </button>
              )}
            </div>

            {/* Slot: Zirah (Armor) */}
            <div
              className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 transition ${
                equipment.armor
                  ? 'border-sky-700/80 bg-sky-950/30'
                  : 'border-slate-800 bg-slate-900/50 border-dashed'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center text-xl shrink-0 border border-slate-700">
                  {equipment.armor ? equipment.armor.icon : '🛡️'}
                </div>
                <div className="truncate">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Zirah</div>
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {equipment.armor ? equipment.armor.name : 'Kosong'}
                  </div>
                  {equipment.armor && (
                    <div className="text-[10px] text-sky-400 font-mono">
                      {equipment.armor.defense_bonus ? `+${equipment.armor.defense_bonus} DEF ` : ''}
                      {equipment.armor.max_hp_bonus ? `+${equipment.armor.max_hp_bonus} HP` : ''}
                    </div>
                  )}
                </div>
              </div>
              {equipment.armor && onUnequipItem && (
                <button
                  id="unequip-armor-btn"
                  onClick={() => onUnequipItem('armor')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-sky-900/60 text-slate-300 hover:text-sky-200 border border-slate-700 hover:border-sky-600 text-[10px] font-mono transition shrink-0"
                  title="Lepaskan Zirah"
                >
                  Lepas
                </button>
              )}
            </div>

            {/* Slot: Aksesoris (Accessory) */}
            <div
              className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 transition ${
                equipment.accessory
                  ? 'border-purple-700/80 bg-purple-950/30'
                  : 'border-slate-800 bg-slate-900/50 border-dashed'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center text-xl shrink-0 border border-slate-700">
                  {equipment.accessory ? equipment.accessory.icon : '💍'}
                </div>
                <div className="truncate">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Aksesoris</div>
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {equipment.accessory ? equipment.accessory.name : 'Kosong'}
                  </div>
                  {equipment.accessory && (
                    <div className="text-[10px] text-purple-400 font-mono">
                      {equipment.accessory.attack_bonus
                        ? `+${equipment.accessory.attack_bonus} ATK `
                        : ''}
                      {equipment.accessory.speed_bonus
                        ? `+${equipment.accessory.speed_bonus} SPD`
                        : ''}
                    </div>
                  )}
                </div>
              </div>
              {equipment.accessory && onUnequipItem && (
                <button
                  id="unequip-accessory-btn"
                  onClick={() => onUnequipItem('accessory')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-purple-900/60 text-slate-300 hover:text-purple-200 border border-slate-700 hover:border-purple-600 text-[10px] font-mono transition shrink-0"
                  title="Lepaskan Aksesoris"
                >
                  Lepas
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Grid: Item List & Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[220px]">
          {/* Item Slot Grid */}
          <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex flex-col">
            <div className="text-[11px] font-mono uppercase text-slate-400 mb-2 tracking-wider flex items-center justify-between">
              <span>Tas Petualang ({inventory.length}/16)</span>
              <span className="text-amber-500/80">Klik untuk melihat</span>
            </div>
            <div className="grid grid-cols-4 gap-2 flex-1 auto-rows-max">
              {inventory.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const slotEquipped = isItemEquipped(item);
                return (
                  <button
                    key={item.id}
                    id={`inventory-item-${item.id}`}
                    onClick={() => setSelectedItem(item)}
                    className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center p-1 transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/20'
                        : slotEquipped
                        ? 'border-sky-500/80 bg-sky-950/40'
                        : 'border-slate-700 bg-slate-800/80 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-2xl select-none">{item.icon}</span>
                    {/* Stack count badge */}
                    {item.is_stackable && item.count > 1 && (
                      <span className="absolute bottom-1 right-1.5 bg-slate-950/90 text-amber-300 text-[10px] font-mono px-1 rounded font-bold border border-slate-800">
                        x{item.count}
                      </span>
                    )}
                    {/* Equipped Badge Tag */}
                    {slotEquipped && (
                      <span className="absolute top-1 left-1 bg-sky-500 text-slate-950 text-[8px] font-mono px-1 rounded font-extrabold uppercase">
                        EQ
                      </span>
                    )}
                  </button>
                );
              })}
              {/* Empty placeholder slots */}
              {Array.from({ length: Math.max(0, 12 - inventory.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-square rounded-xl border border-dashed border-slate-800/80 bg-slate-900/30 flex items-center justify-center text-slate-700 text-xs"
                >
                  -
                </div>
              ))}
            </div>
          </div>

          {/* Item Inspector (Resource Details) */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            {selectedItem ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl p-2.5 bg-slate-800 rounded-xl border border-slate-700 shadow-inner">
                    {selectedItem.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-200 text-sm sm:text-base flex items-center gap-2">
                      {selectedItem.name}
                      {equippedSlot && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 font-mono">
                          Dipasang
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {selectedItem.category}
                      </span>
                      {selectedItem.equip_slot && (
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800">
                          Slot: {selectedItem.equip_slot}
                        </span>
                      )}
                      {selectedItem.is_stackable && (
                        <span className="text-[10px] font-mono text-emerald-400">
                          Stackable (x{selectedItem.count})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                  {selectedItem.description}
                </p>

                {/* Resource Properties & Stat Bonuses */}
                <div className="space-y-1.5 text-xs bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
                  {selectedItem.heal_amount > 0 && (
                    <div className="flex items-center justify-between text-emerald-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Heart className="w-3.5 h-3.5 text-emerald-400" />
                        Pemulihan (heal_amount):
                      </span>
                      <span className="font-bold">+{selectedItem.heal_amount} HP</span>
                    </div>
                  )}
                  {selectedItem.attack_bonus && selectedItem.attack_bonus > 0 && (
                    <div className="flex items-center justify-between text-rose-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Sword className="w-3.5 h-3.5 text-rose-400" />
                        Bonus Serangan (ATK):
                      </span>
                      <span className="font-bold">+{selectedItem.attack_bonus} ATK</span>
                    </div>
                  )}
                  {selectedItem.defense_bonus && selectedItem.defense_bonus > 0 && (
                    <div className="flex items-center justify-between text-sky-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Shield className="w-3.5 h-3.5 text-sky-400" />
                        Bonus Pertahanan (DEF):
                      </span>
                      <span className="font-bold">+{selectedItem.defense_bonus} DEF</span>
                    </div>
                  )}
                  {selectedItem.max_hp_bonus && selectedItem.max_hp_bonus > 0 && (
                    <div className="flex items-center justify-between text-red-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Heart className="w-3.5 h-3.5 text-red-400" />
                        Bonus Kapasitas HP:
                      </span>
                      <span className="font-bold">+{selectedItem.max_hp_bonus} HP</span>
                    </div>
                  )}
                  {selectedItem.speed_bonus && selectedItem.speed_bonus > 0 && (
                    <div className="flex items-center justify-between text-emerald-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        Bonus Kecepatan Gerak:
                      </span>
                      <span className="font-bold">+{selectedItem.speed_bonus} SPD</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      Estimasi Harga:
                    </span>
                    <span className="font-mono text-amber-300">{selectedItem.value} Gold</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                <Info className="w-8 h-8 mb-2 opacity-50" />
                Pilih sebuah item dari tas untuk melihat detail Resource `ItemData` &amp; opsi perlengkapan
              </div>
            )}

            {/* Action Buttons: Equip / Unequip / Consumable */}
            <div className="mt-3 flex flex-col gap-2">
              {selectedItem && selectedItem.category === 'equipment' && selectedItem.equip_slot && (
                <>
                  {equippedSlot ? (
                    <button
                      id="unequip-selected-btn"
                      onClick={() => onUnequipItem && onUnequipItem(equippedSlot)}
                      className="w-full py-2 px-4 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-medium text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 active:scale-[0.98]"
                    >
                      <MinusCircle className="w-4 h-4" />
                      Lepaskan Perlengkapan ({selectedItem.name})
                    </button>
                  ) : (
                    <button
                      id="equip-selected-btn"
                      onClick={() => onEquipItem && onEquipItem(selectedItem)}
                      className="w-full py-2 px-4 rounded-lg bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-sky-950/40 active:scale-[0.98]"
                    >
                      <Check className="w-4 h-4" />
                      Pasang Perlengkapan ({selectedItem.name})
                    </button>
                  )}
                </>
              )}
              {selectedItem && selectedItem.category === 'consumable' && (
                <button
                  id="use-item-btn"
                  onClick={() => onUseItem(selectedItem.id)}
                  className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Gunakan Item ({selectedItem.name})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer info explaining Godot 4 Resource Architecture */}
        <div className="text-[11px] text-slate-400 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50 flex flex-wrap items-center justify-between gap-2">
          <span>⚙️ Dibuat dengan format arsitektur Resource `ItemData.gd` Godot 4</span>
          <span className="font-mono text-amber-400/90">[I] untuk Tutup Inventaris</span>
        </div>
      </div>
    </div>
  );
};
