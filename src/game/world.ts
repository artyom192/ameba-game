import { BLOCKS, REACH_DISTANCE, TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from './constants';
import { BlockId, Rect } from './types';

export interface MiningProgress {
  tileX: number;
  tileY: number;
  progress: number; // 0 to 1
  totalTime: number;
  currentTime: number;
}

export class World {
  public width = WORLD_WIDTH;
  public height = WORLD_HEIGHT;
  public tiles: BlockId[][];
  public backgroundTiles: (BlockId | null)[][]; // For depth behind blocks
  public currentMining: MiningProgress | null = null;

  constructor() {
    this.tiles = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => 'air')
    );
    this.backgroundTiles = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => null)
    );
    this.generateHandcraftedWorld();
  }

  /**
   * Generates a handcrafted, structured world with distinct exploration biomes
   */
  private generateHandcraftedWorld() {
    // 1. Surface terrain heightmap profile
    const surfaceHeights: number[] = [];
    for (let x = 0; x < this.width; x++) {
      let h = 26;
      if (x < 45) {
        // Plains & gentle hills
        h = 26 + Math.round(Math.sin(x * 0.18) * 3);
      } else if (x < 85) {
        // Forest with elevated plateaus
        h = 24 + Math.round(Math.cos(x * 0.15) * 4);
      } else if (x < 115) {
        // Desert with rolling dunes
        h = 25 + Math.round(Math.sin((x - 85) * 0.2) * 3);
      } else {
        // Jagged ruins and abyss cliff
        h = 27 + Math.round(Math.sin(x * 0.25) * 4);
      }
      surfaceHeights.push(Math.max(18, Math.min(32, h)));
    }

    // 2. Fill base layers
    for (let x = 0; x < this.width; x++) {
      const surfaceY = surfaceHeights[x];
      const isDesert = x >= 85 && x <= 112;

      for (let y = surfaceY; y < this.height; y++) {
        if (y === surfaceY) {
          this.tiles[y][x] = isDesert ? 'sand' : 'grass';
        } else if (y < surfaceY + 6) {
          this.tiles[y][x] = isDesert ? 'sand' : 'dirt';
          this.backgroundTiles[y][x] = 'dirt';
        } else if (y < 56) {
          this.tiles[y][x] = 'stone';
          this.backgroundTiles[y][x] = 'stone';
        } else if (y < 76) {
          // Deep caverns
          this.tiles[y][x] = 'stone';
          this.backgroundTiles[y][x] = 'stone';
        } else {
          // Abyss
          this.tiles[y][x] = 'abyss_stone';
          this.backgroundTiles[y][x] = 'abyss_stone';
        }
      }
    }

    // 3. Handcrafted Caverns & Caves (Hollowing out organic caverns)
    const caveChambers = [
      // Surface tunnel in plains
      { cx: 30, cy: 38, rx: 7, ry: 4 },
      { cx: 24, cy: 43, rx: 5, ry: 3 },
      { cx: 36, cy: 45, rx: 6, ry: 4 },

      // Forest underground pocket
      { cx: 60, cy: 37, rx: 8, ry: 5 },
      { cx: 70, cy: 46, rx: 9, ry: 5 },
      { cx: 52, cy: 48, rx: 6, ry: 4 },

      // Desert subterranean sandstone hall
      { cx: 96, cy: 36, rx: 8, ry: 4 },
      { cx: 102, cy: 44, rx: 7, ry: 5 },

      // Deep crystal caverns (large connected exploration zone)
      { cx: 40, cy: 62, rx: 11, ry: 6 },
      { cx: 65, cy: 65, rx: 13, ry: 7 },
      { cx: 88, cy: 64, rx: 12, ry: 6 },
      { cx: 115, cy: 66, rx: 10, ry: 5 },
      { cx: 75, cy: 72, rx: 8, ry: 4 },

      // The Abyss Hall (Late-game Boss 2 arena)
      { cx: 80, cy: 82, rx: 16, ry: 6 },
      { cx: 125, cy: 81, rx: 12, ry: 5 },
    ];

    for (const c of caveChambers) {
      for (let y = Math.max(1, c.cy - c.ry); y <= Math.min(this.height - 2, c.cy + c.ry); y++) {
        for (let x = Math.max(1, c.cx - c.rx); x <= Math.min(this.width - 2, c.cx + c.rx); x++) {
          const dx = (x - c.cx) / c.rx;
          const dy = (y - c.cy) / c.ry;
          if (dx * dx + dy * dy <= 1.0) {
            this.tiles[y][x] = 'air';
          }
        }
      }
    }

    // 4. Ore Veins and Crystal Clusters
    this.placeOreCluster(20, 36, 'copper_ore', 7);
    this.placeOreCluster(42, 41, 'copper_ore', 8);
    this.placeOreCluster(68, 38, 'copper_ore', 9);
    this.placeOreCluster(92, 42, 'copper_ore', 7);
    this.placeOreCluster(34, 52, 'copper_ore', 8);

    this.placeOreCluster(28, 48, 'iron_ore', 6);
    this.placeOreCluster(58, 54, 'iron_ore', 8);
    this.placeOreCluster(82, 53, 'iron_ore', 7);
    this.placeOreCluster(108, 52, 'iron_ore', 8);
    this.placeOreCluster(50, 68, 'iron_ore', 9);

    // Rare Bio-Crystals in deep caves
    this.placeOreCluster(36, 64, 'crystal', 5);
    this.placeOreCluster(62, 67, 'crystal', 7);
    this.placeOreCluster(90, 66, 'crystal', 6);
    this.placeOreCluster(118, 68, 'crystal', 8);
    this.placeOreCluster(74, 82, 'crystal', 9);

    // 5. Build Forest Trees
    const treePositions = [48, 54, 62, 68, 73, 79];
    for (const tx of treePositions) {
      const groundY = surfaceHeights[tx];
      const trunkHeight = 6 + (tx % 4);
      // Trunk
      for (let y = groundY - 1; y >= groundY - trunkHeight; y--) {
        if (y >= 0) this.tiles[y][tx] = 'wood';
      }
      // Foliage
      const topY = groundY - trunkHeight;
      for (let ly = topY - 3; ly <= topY + 1; ly++) {
        const radius = ly <= topY - 2 ? 1 : 2;
        for (let lx = tx - radius; lx <= tx + radius; lx++) {
          if (ly >= 0 && lx >= 0 && lx < this.width) {
            if (this.tiles[ly][lx] === 'air') {
              this.tiles[ly][lx] = 'leaves';
            }
          }
        }
      }
    }

    // 6. Ancient Ruins Structure (Columns 128 to 142)
    const ruinBaseY = surfaceHeights[135];
    for (let x = 126; x <= 145; x++) {
      for (let y = ruinBaseY - 8; y <= ruinBaseY; y++) {
        // Outer frame
        if (x === 126 || x === 145 || y === ruinBaseY - 8 || y === ruinBaseY) {
          this.tiles[y][x] = 'brick';
        }
        // Platforms inside
        if (y === ruinBaseY - 4 && (x < 132 || x > 139)) {
          this.tiles[y][x] = 'brick';
        }
      }
    }
    // Altar inside the ruin
    this.tiles[ruinBaseY - 1][135] = 'altar';
    this.tiles[ruinBaseY - 1][136] = 'altar';

    // 7. Ancient Altar in the Abyss Boss Arena (at x: 80, y: 84)
    this.tiles[84][79] = 'altar';
    this.tiles[84][80] = 'altar';
    this.tiles[84][81] = 'altar';

    // 8. Solid Outer Boundaries
    for (let y = 0; y < this.height; y++) {
      this.tiles[y][0] = 'stone';
      this.tiles[y][this.width - 1] = 'stone';
    }
    for (let x = 0; x < this.width; x++) {
      this.tiles[this.height - 1][x] = 'abyss_stone';
    }
  }

  private placeOreCluster(cx: number, cy: number, ore: BlockId, count: number) {
    let px = cx;
    let py = cy;
    for (let i = 0; i < count; i++) {
      if (px >= 1 && px < this.width - 1 && py >= 1 && py < this.height - 1) {
        if (this.tiles[py][px] !== 'air') {
          this.tiles[py][px] = ore;
        }
      }
      px += Math.floor(Math.random() * 3) - 1;
      py += Math.floor(Math.random() * 3) - 1;
    }
  }

  public getBlock(tx: number, ty: number): BlockId {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) {
      return 'stone'; // Out of bounds is solid
    }
    return this.tiles[ty][tx];
  }

  public setBlock(tx: number, ty: number, blockId: BlockId) {
    if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
      this.tiles[ty][tx] = blockId;
    }
  }

  public isSolid(tx: number, ty: number): boolean {
    const block = this.getBlock(tx, ty);
    return BLOCKS[block]?.solid ?? false;
  }

  /**
   * Checks collision with a bounding box (world coordinates)
   */
  public checkRectCollision(rect: Rect): boolean {
    const minTx = Math.floor(rect.x / TILE_SIZE);
    const maxTx = Math.floor((rect.x + rect.w - 0.01) / TILE_SIZE);
    const minTy = Math.floor(rect.y / TILE_SIZE);
    const maxTy = Math.floor((rect.y + rect.h - 0.01) / TILE_SIZE);

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (this.isSolid(tx, ty)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Distance between a point and a tile center
   */
  public getDistanceToTile(x: number, y: number, tx: number, ty: number): number {
    const tileCenterX = tx * TILE_SIZE + TILE_SIZE / 2;
    const tileCenterY = ty * TILE_SIZE + TILE_SIZE / 2;
    const dx = tileCenterX - x;
    const dy = tileCenterY - y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public isInReach(x: number, y: number, tx: number, ty: number): boolean {
    return this.getDistanceToTile(x, y, tx, ty) <= REACH_DISTANCE;
  }

  /**
   * Checks if block can be placed at (tx, ty)
   */
  public canPlaceBlock(tx: number, ty: number, playerRect: Rect, px: number, py: number): boolean {
    if (tx < 1 || tx >= this.width - 1 || ty < 1 || ty >= this.height - 1) return false;
    if (this.getBlock(tx, ty) !== 'air') return false;
    if (!this.isInReach(px, py, tx, ty)) return false;

    // Check overlap with player bounding box (with 2px inner margin for comfortable edge placement)
    const margin = 2;
    const tileRect: Rect = {
      x: tx * TILE_SIZE + margin,
      y: ty * TILE_SIZE + margin,
      w: TILE_SIZE - margin * 2,
      h: TILE_SIZE - margin * 2,
    };

    const overlapsPlayer =
      tileRect.x < playerRect.x + playerRect.w &&
      tileRect.x + tileRect.w > playerRect.x &&
      tileRect.y < playerRect.y + playerRect.h &&
      tileRect.y + tileRect.h > playerRect.y;

    if (overlapsPlayer) return false;

    // Allow placement if near any existing block (orthogonal or diagonal), background wall, or within reach
    const hasNeighbor =
      this.isSolid(tx + 1, ty) ||
      this.isSolid(tx - 1, ty) ||
      this.isSolid(tx, ty + 1) ||
      this.isSolid(tx, ty - 1) ||
      this.isSolid(tx + 1, ty + 1) ||
      this.isSolid(tx - 1, ty + 1) ||
      this.isSolid(tx + 1, ty - 1) ||
      this.isSolid(tx - 1, ty - 1) ||
      this.backgroundTiles[ty][tx] !== null ||
      this.getDistanceToTile(px, py, tx, ty) <= REACH_DISTANCE;

    return hasNeighbor;
  }
}
