export type BlockId =
  | 'air'
  | 'grass'
  | 'dirt'
  | 'stone'
  | 'sand'
  | 'wood'
  | 'leaves'
  | 'copper_ore'
  | 'iron_ore'
  | 'brick'
  | 'crystal'
  | 'abyss_stone'
  | 'altar';

export interface BlockConfig {
  id: BlockId;
  name: string;
  hardness: number; // Mining time hits needed
  solid: boolean;
  dropItemId?: string;
  dropCount?: number;
  color: string;
  accentColor?: string;
  detailColor?: string;
  lightEmission?: number; // 0 to 1
}

export type ItemType = 'tool' | 'weapon' | 'block' | 'material' | 'consumable' | 'summon';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  blockId?: BlockId;
  stackable: boolean;
  maxStack: number;
  // Tool stats
  pickaxePower?: number;
  axePower?: number;
  damage?: number;
  attackSpeed?: number; // ms cooldown
  range?: number;
  healAmount?: number;
  iconType: string;
  color: string;
}

export interface ItemStack {
  item: Item;
  count: number;
}

export interface Recipe {
  id: string;
  name: string;
  result: { itemId: string; count: number };
  ingredients: { itemId: string; count: number }[];
  requiresWorkbench?: boolean;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DroppedItem {
  id: string;
  item: Item;
  count: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  pickupDelay: number; // Loot cannot be vacuumed during initial scatter
  bounces: number;
  onGround?: boolean;
  collected?: boolean;
}

export interface DeathEffect {
  id: string;
  enemyType: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  isBoss: boolean;
  age: number;
  maxDuration: number;
  rotation: number;
  rotSpeed: number;
  facing: number;
  scale: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  gravity?: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  glowColor?: string;
  damage: number;
  life: number;
  isHostile: boolean;
}
