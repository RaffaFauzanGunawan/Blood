import fs from 'fs';

const worldDataPath = 'src/game/worldData.ts';
let content = fs.readFileSync(worldDataPath, 'utf-8');

// We need to add the trader and the lost souls.

const traderNPC = `  {
    id: 'npc_trader',
    name: 'Ghazal sang Pedagang Misterius',
    title: 'Penjual Barang Langka',
    affiliation: 'Pengembara Void',
    role: 'merchant',
    mood: 'Misterius & Ramah',
    x: 1650,
    y: 250,
    direction: 'left',
    sprite: 'vladimir',
    dialogueId: 'trader_intro',
    voicePitch: 120,
    lore: 'Pedangang yang melintasi berbagai dimensi untuk menjual barang ajaib.',
    portraitTheme: {
      primaryColor: '#8b5cf6',
      accentColor: '#6d28d9',
      bgStyle: 'cemetery',
      headwear: 'Jubah Hitam & Kacamata Emas',
      eyeGlowColor: '#c084fc',
      quote: '"Aku memiliki apa yang kau butuhkan... asalkan kau punya emasnya."',
    },
  },
`;

let dialogueNPCs = '';
const regions = [
  { id: 'cathedral', x: 200, y: 580 },
  { id: 'ruins', x: 800, y: 500 },
  { id: 'bone_valley', x: 1500, y: 550 },
  { id: 'castle', x: 200, y: 900 },
  { id: 'crypt', x: 800, y: 900 },
  { id: 'white_cross', x: 1450, y: 950 },
  { id: 'rose_garden', x: 150, y: 1250 },
  { id: 'hellfire', x: 850, y: 1250 },
  { id: 'light_sanctuary', x: 1500, y: 1200 },
];

regions.forEach((r, idx) => {
  dialogueNPCs += `  {
    id: 'npc_dialogue_${r.id}',
    name: 'Pengembara Tersesat',
    title: 'Jiwa Tanpa Arah',
    affiliation: 'Korban Ravenfall',
    role: 'lore',
    mood: 'Sedih',
    x: ${r.x},
    y: ${r.y},
    direction: 'down',
    sprite: 'ghost_knight',
    dialogueId: 'dialogue_only_${r.id}',
    voicePitch: 100 + ${idx * 10},
    lore: 'Jiwa yang terjebak dalam putaran waktu di Ravenfall.',
    portraitTheme: {
      primaryColor: '#94a3b8',
      accentColor: '#64748b',
      bgStyle: 'cemetery',
      headwear: 'Helm Hancur',
      eyeGlowColor: '#cbd5e1',
      quote: '"Aku hanya ingin pulang..."',
    },
  },
`;
});

content = content.replace('export const INITIAL_NPCS: NPC[] = [', 'export const INITIAL_NPCS: NPC[] = [\n' + traderNPC + dialogueNPCs);

// Add Dialogues
const traderDialogues = `  trader_intro: {
    speaker: 'Ghazal',
    speakerTitle: 'Pedagang Misterius',
    mood: 'serious',
    text: 'Hehehe, apakah kau membutuhkan sesuatu yang kuat? Aku membawa ramuan dan intisari gelap yang tidak akan kau temukan di desa.',
    options: [
      { text: 'Beli Holy Potion (Memulihkan 100 HP) - 200 Gold', action: 'trade_holy_potion', icon: '🧪' },
      { text: 'Beli Shadow Essence (+10 Attack) - 500 Gold', action: 'trade_shadow_essence', icon: '🌑' },
      { text: 'Tidak, terima kasih.', action: 'close_dialogue', icon: '🏃' },
    ],
  },
`;

let dialogueNodes = '';
regions.forEach((r) => {
  dialogueNodes += `  dialogue_only_${r.id}: {
    speaker: 'Pengembara',
    speakerTitle: 'Jiwa Tanpa Arah',
    mood: 'eerie',
    text: 'Tempat ini sangat mengerikan... Aku tak tahu sudah berapa lama aku terjebak di sini. Tolong, berhati-hatilah.',
    options: [{ text: 'Semoga kau menemukan kedamaian.', action: 'close_dialogue' }],
  },
`;
});

content = content.replace('export const DIALOGUE_TREE: Record<string, DialogueNode> = {', 'export const DIALOGUE_TREE: Record<string, DialogueNode> = {\n' + traderDialogues + dialogueNodes);

fs.writeFileSync(worldDataPath, content);
