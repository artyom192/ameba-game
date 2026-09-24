import { BLOCKS, TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from './constants';
import { EntityManager, Enemy } from './entities';
import { Player } from './player';
import { BlockId, DeathEffect, DroppedItem, Item } from './types';
import { World } from './world';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public setSize(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  public render(
    world: World,
    player: Player,
    entities: EntityManager,
    camera: { x: number; y: number },
    mouseWorld: { x: number; y: number; tx: number; ty: number },
    dt: number,
    zoom: number = 1.0
  ) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Parallax Background based on player depth
    this.renderParallaxBackground(camera);

    const viewW = this.width / zoom;
    const viewH = this.height / zoom;

    ctx.save();
    // Apply zoom
    ctx.scale(zoom, zoom);
    // Translate by Camera
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));

    // 2. Visible Tile Range Calculation
    const startTx = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 2);
    const endTx = Math.min(world.width - 1, Math.ceil((camera.x + viewW) / TILE_SIZE) + 2);
    const startTy = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 2);
    const endTy = Math.min(world.height - 1, Math.ceil((camera.y + viewH) / TILE_SIZE) + 2);

    // 3. Render Background Tiles (Underground depth walls)
    for (let ty = startTy; ty <= endTy; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        const bg = world.backgroundTiles[ty][tx];
        const fg = world.getBlock(tx, ty);
        if (bg && fg === 'air') {
          this.renderBackgroundTile(tx, ty, bg);
        }
      }
    }

    // 4. Render Foreground Solid Tiles
    for (let ty = startTy; ty <= endTy; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        const blockId = world.getBlock(tx, ty);
        if (blockId !== 'air') {
          this.renderTile(tx, ty, blockId, world);
        }
      }
    }

    // 5. Render Block Mining Cracks
    if (world.currentMining) {
      this.renderMiningCracks(world.currentMining.tileX, world.currentMining.tileY, world.currentMining.progress);
    }

    // 6. Ghost Preview & Tile Highlight under cursor
    this.renderCursorHighlight(world, player, mouseWorld);

    // 7. Dropped Items
    for (const drop of entities.droppedItems) {
      this.renderDroppedItem(drop);
    }

    // 8. Projectiles
    for (const proj of entities.projectiles) {
      this.renderProjectile(proj);
    }

    // 9. Enemies & Bosses
    for (const enemy of entities.enemies) {
      this.renderEnemy(enemy);
    }

    // 9.5 Dying Enemies & Boss Death Animations
    for (const death of entities.deathEffects) {
      this.renderDeathEffect(death);
    }

    // 10. Player (Amoeba)
    this.renderPlayer(player, mouseWorld);

    // 11. Particles
    for (const p of entities.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.restore();
    }

    // 12. Floating Numbers
    for (const ft of entities.floatingTexts) {
      ctx.save();
      ctx.font = 'bold 13px Silkscreen, monospace';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // 13. Bio-luminescent Lighting Mask (Darkness in deep caves & abyss)
    this.renderLighting(player, world, camera, entities, viewW, viewH);

    ctx.restore();
  }

  /**
   * Parallax Background that blends smoothly between surface, caves, and abyss
   */
  private renderParallaxBackground(camera: { x: number; y: number }) {
    const ctx = this.ctx;
    const playerWorldY = camera.y;

    // Determine environmental layer
    // 0 - 650: Surface sky & hills
    // 650 - 1300: Cavern rock
    // 1300+: The Abyss
    if (playerWorldY < 750) {
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.7, '#bae6fd');
      skyGrad.addColorStop(1, '#86efac');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.width, this.height);

      // Clouds (Parallax 0.1)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      const cloudOffset = -(camera.x * 0.1);
      for (let i = 0; i < 6; i++) {
        const cx = ((cloudOffset + i * 260) % (this.width + 300)) - 100;
        const cy = 40 + (i % 3) * 30;
        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, Math.PI * 2);
        ctx.arc(cx + 25, cy - 8, 26, 0, Math.PI * 2);
        ctx.arc(cx + 50, cy, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant Hills (Parallax 0.25)
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.moveTo(0, this.height);
      const hillOffset = -(camera.x * 0.25);
      for (let x = 0; x <= this.width + 40; x += 40) {
        const h = Math.sin((x - hillOffset) * 0.005) * 60 + 160;
        ctx.lineTo(x, this.height - h);
      }
      ctx.lineTo(this.width, this.height);
      ctx.fill();
    } else if (playerWorldY < 1400) {
      // Cavern backdrop
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, this.width, this.height);

      // Rocky silhouettes
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, this.height);
      const cavernOffset = -(camera.x * 0.3);
      for (let x = 0; x <= this.width + 50; x += 50) {
        const h = Math.sin((x - cavernOffset) * 0.01) * 80 + 120;
        ctx.lineTo(x, this.height - h);
      }
      ctx.lineTo(this.width, this.height);
      ctx.fill();
    } else {
      // The Abyss backdrop (Deep violet/indigo with pulsating glow)
      const abyssGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      abyssGrad.addColorStop(0, '#090514');
      abyssGrad.addColorStop(1, '#1e1035');
      ctx.fillStyle = abyssGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  private renderBackgroundTile(tx: number, ty: number, bg: BlockId) {
    const ctx = this.ctx;
    const px = tx * TILE_SIZE;
    const py = ty * TILE_SIZE;

    ctx.fillStyle = bg === 'abyss_stone' ? '#110c22' : '#232b38';
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Subtle dark mortar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(px, py, TILE_SIZE, 1);
    ctx.fillRect(px, py, 1, TILE_SIZE);
  }

  private renderTile(tx: number, ty: number, blockId: BlockId, world: World) {
    const ctx = this.ctx;
    const cfg = BLOCKS[blockId];
    if (!cfg) return;

    const px = tx * TILE_SIZE;
    const py = ty * TILE_SIZE;

    // Base color
    ctx.fillStyle = cfg.color;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Detailed tile graphics
    switch (blockId) {
      case 'grass': {
        // Lush grass top fringe
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(px, py, TILE_SIZE, 5);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(px + 3, py + 5, 4, 3);
        ctx.fillRect(px + 12, py + 5, 5, 2);
        ctx.fillRect(px + 18, py + 5, 3, 3);
        // Dirt bottom
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px, py + 8, TILE_SIZE, TILE_SIZE - 8);
        ctx.fillStyle = '#5c2b09';
        ctx.fillRect(px + 4, py + 12, 3, 3);
        ctx.fillRect(px + 14, py + 16, 4, 3);
        break;
      }

      case 'dirt': {
        ctx.fillStyle = '#713f12';
        ctx.fillRect(px + 3, py + 4, 4, 3);
        ctx.fillRect(px + 13, py + 11, 4, 4);
        ctx.fillRect(px + 7, py + 16, 3, 3);
        break;
      }

      case 'stone': {
        // Stone texture with rocky specks
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + 2, py + 2, 7, 5);
        ctx.fillRect(px + 11, py + 10, 8, 6);
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + 2, py + 15, 6, 4);
        ctx.fillRect(px + 14, py + 3, 4, 4);
        break;
      }

      case 'sand': {
        ctx.fillStyle = '#eab308';
        ctx.fillRect(px, py + 4, TILE_SIZE, 2);
        ctx.fillRect(px + 4, py + 12, 8, 2);
        break;
      }

      case 'wood': {
        // Wood grain
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px + 4, py, 2, TILE_SIZE);
        ctx.fillRect(px + 14, py, 2, TILE_SIZE);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(px, py + 8, TILE_SIZE, 2);
        break;
      }

      case 'leaves': {
        ctx.fillStyle = '#15803d';
        ctx.fillRect(px + 2, py + 2, 6, 6);
        ctx.fillRect(px + 12, py + 10, 8, 8);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(px + 10, py + 4, 4, 4);
        break;
      }

      case 'copper_ore': {
        ctx.fillStyle = '#475569';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        // Copper nuggets
        ctx.fillStyle = '#f97316';
        ctx.fillRect(px + 4, py + 4, 5, 4);
        ctx.fillRect(px + 12, py + 11, 6, 5);
        ctx.fillStyle = '#fdba74';
        ctx.fillRect(px + 5, py + 5, 2, 2);
        ctx.fillRect(px + 14, py + 12, 2, 2);
        break;
      }

      case 'iron_ore': {
        ctx.fillStyle = '#334155';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        // Iron deposits
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(px + 5, py + 5, 5, 5);
        ctx.fillRect(px + 13, py + 12, 6, 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 6, py + 6, 2, 2);
        break;
      }

      case 'brick': {
        // Brick mortar pattern
        ctx.fillStyle = '#475569';
        ctx.fillRect(px, py + 11, TILE_SIZE, 2);
        ctx.fillRect(px + 11, py, 2, 11);
        ctx.fillRect(px + 4, py + 13, 2, 11);
        ctx.fillRect(px + 18, py + 13, 2, 11);
        break;
      }

      case 'crystal': {
        // Glowing bio-crystal
        ctx.fillStyle = '#0891b2';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.moveTo(px + 12, py + 2);
        ctx.lineTo(px + 22, py + 12);
        ctx.lineTo(px + 12, py + 22);
        ctx.lineTo(px + 2, py + 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#cffafe';
        ctx.fillRect(px + 10, py + 9, 4, 4);
        break;
      }

      case 'abyss_stone': {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(px + 3, py + 3, 3, 3);
        ctx.fillRect(px + 14, py + 9, 4, 2);
        ctx.fillRect(px + 8, py + 16, 5, 2);
        break;
      }

      case 'altar': {
        // Mystical altar
        ctx.fillStyle = '#581c87';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        ctx.fillStyle = '#f3e8ff';
        ctx.fillRect(px + 9, py + 9, 6, 6);
        break;
      }
    }

    // Border edge highlight for solid feel
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
  }

  private renderMiningCracks(tx: number, ty: number, progress: number) {
    const ctx = this.ctx;
    const px = tx * TILE_SIZE;
    const py = ty * TILE_SIZE;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.lineWidth = 1.5;

    const stages = Math.min(5, Math.floor(progress * 5) + 1);
    ctx.beginPath();
    if (stages >= 1) {
      ctx.moveTo(px + 4, py + 4);
      ctx.lineTo(px + 12, py + 10);
    }
    if (stages >= 2) {
      ctx.lineTo(px + 18, py + 6);
      ctx.moveTo(px + 12, py + 10);
      ctx.lineTo(px + 10, py + 18);
    }
    if (stages >= 3) {
      ctx.moveTo(px + 8, py + 12);
      ctx.lineTo(px + 3, py + 19);
      ctx.moveTo(px + 15, py + 14);
      ctx.lineTo(px + 21, py + 18);
    }
    if (stages >= 4) {
      ctx.moveTo(px + 2, py + 10);
      ctx.lineTo(px + 22, py + 12);
    }
    ctx.stroke();
    ctx.restore();
  }

  private renderCursorHighlight(
    world: World,
    player: Player,
    mouseWorld: { x: number; y: number; tx: number; ty: number }
  ) {
    const ctx = this.ctx;
    const tx = mouseWorld.tx;
    const ty = mouseWorld.ty;
    const px = tx * TILE_SIZE;
    const py = ty * TILE_SIZE;

    const playerCenter = player.getCenter();
    const inReach = world.isInReach(playerCenter.x, playerCenter.y, tx, ty);
    const selectedItem = player.getSelectedItem();

    ctx.save();
    if (inReach) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);

      // Ghost preview if placing block
      if (selectedItem?.item.blockId) {
        const canPlace = world.canPlaceBlock(tx, ty, player.getRect(), playerCenter.x, playerCenter.y);
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = canPlace ? (BLOCKS[selectedItem.item.blockId]?.color || '#4ade80') : 'rgba(239, 68, 68, 0.6)';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = canPlace ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }
    } else {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    }
    ctx.restore();
  }

  /**
   * Original Amoeba Character Rendering
   */
  private renderPlayer(player: Player, mouseWorld: { x: number; y: number }) {
    const ctx = this.ctx;
    const center = player.getCenter();

    ctx.save();
    ctx.translate(center.x, center.y);

    // Squash & Stretch
    ctx.scale(player.scaleX * (player.facing > 0 ? 1 : -1), player.scaleY);

    // If invulnerable / hurt, flash red & white
    const isHurt = player.invulnTimer > 0;
    if (isHurt && Math.floor(player.invulnTimer / 60) % 2 === 0) {
      ctx.fillStyle = '#ff8888';
    } else {
      ctx.fillStyle = '#06b6d4'; // Amoeba vibrant bio-cyan
    }

    // 1. Organic amoeba body shape (cute rounded wobbling blob)
    const r = player.width / 2;
    const wobble = Math.sin(player.wobbleTimer) * 1.5;

    ctx.beginPath();
    ctx.ellipse(0, 0, r + wobble * 0.5, r - wobble * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Outer membrane translucent glow
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Floating Nucleus (inner glowing core)
    ctx.fillStyle = '#ec4899'; // Bright pink/magenta nucleus
    ctx.beginPath();
    ctx.arc(player.nucleusOffset.x, player.nucleusOffset.y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Nucleus highlight
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.arc(player.nucleusOffset.x - 1.2, player.nucleusOffset.y - 1.2, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 4. Reactive Amoeba Eyespots (looking at cursor)
    const angleToMouse = Math.atan2(mouseWorld.y - center.y, mouseWorld.x - center.y);
    const lookX = Math.cos(angleToMouse) * 2.5;
    const lookY = Math.sin(angleToMouse) * 2;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(3 + lookX * 0.5, -2 + lookY * 0.5, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(3 + lookX, -2 + lookY, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // 5. Weapon Swing Arc & Held Item
    this.renderPlayerWeapon(player);

    ctx.restore();
  }

  private renderPlayerWeapon(player: Player) {
    const selected = player.getSelectedItem();
    if (!selected) return;

    const ctx = this.ctx;
    const item = selected.item;

    if (item.iconType === 'axe') {
      this.renderAxe(item, player.isAttacking, player.swingProgress);
      return;
    }

    if (item.type === 'weapon' || item.type === 'tool') {
      ctx.save();
      if (player.isAttacking) {
        // Dynamic slash arc
        const progress = player.swingProgress;
        const startAngle = -Math.PI * 0.4;
        const currentAngle = startAngle + progress * Math.PI * 0.8;

        ctx.rotate(currentAngle);

        // Blade trail energy
        ctx.strokeStyle = item.color || '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 24, startAngle, currentAngle);
        ctx.stroke();

        // Weapon sprite
        ctx.fillStyle = item.color;
        ctx.fillRect(8, -2, 16, 4);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(20, -1, 6, 2);
      } else {
        // Idle held tool/weapon
        ctx.translate(6, 2);
        ctx.rotate(Math.PI * 0.2);
        ctx.fillStyle = item.color;
        ctx.fillRect(0, -2, 12, 3);
      }
      ctx.restore();
    } else if (item.blockId) {
      // Render held block or swinging block as melee weapon
      ctx.save();
      if (player.isAttacking) {
        // Heavy overhead smash arc with block
        const progress = player.swingProgress;
        const startAngle = -Math.PI * 0.45;
        const currentAngle = startAngle + progress * Math.PI * 0.9;

        ctx.rotate(currentAngle);

        // Heavy kinetic impact trail
        ctx.strokeStyle = item.color || '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 24, startAngle, currentAngle);
        ctx.stroke();

        // Block sprite held by pseudopod
        ctx.fillStyle = item.color;
        ctx.fillRect(12, -7, 14, 14);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(12, -7, 14, 14);

        // Block top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(13, -6, 12, 3);
      } else {
        // Idle held block in front of amoeba
        ctx.translate(8, 0);
        ctx.fillStyle = item.color;
        ctx.fillRect(0, -6, 12, 12);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, -6, 12, 12);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(1, -5, 10, 2);
      }
      ctx.restore();
    }
  }

  private renderEnemy(e: Enemy) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
    ctx.scale(e.scaleX * e.facing, e.scaleY);

    const isHurt = e.hurtTimer > 0;
    const fillColor = isHurt ? '#ffffff' : e.color;

    switch (e.type) {
      case 'slime': {
        // Green slime blob
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, e.width / 2, e.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, -4, 3, 4);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(3, -3, 2, 2);
        break;
      }

      case 'spore_bat': {
        // Winged spore bat
        ctx.fillStyle = fillColor;
        // Body
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        // Wings
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.moveTo(-4, -2);
        ctx.lineTo(-12, -10);
        ctx.lineTo(-4, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(4, -2);
        ctx.lineTo(12, -10);
        ctx.lineTo(4, 0);
        ctx.fill();
        // Glowing red eyes
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(1, -2, 2, 2);
        break;
      }

      case 'cavern_crawler': {
        // Armored insect crawler
        ctx.fillStyle = fillColor;
        ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
        // Shell segments
        ctx.fillStyle = '#9f1239';
        ctx.fillRect(-e.width / 2 + 3, -e.height / 2 + 2, 6, e.height - 4);
        ctx.fillRect(-e.width / 2 + 12, -e.height / 2 + 2, 6, e.height - 4);
        // Legs
        ctx.fillStyle = '#4c0519';
        ctx.fillRect(-e.width / 2 + 2, e.height / 2, 3, 4);
        ctx.fillRect(0, e.height / 2, 3, 4);
        ctx.fillRect(e.width / 2 - 5, e.height / 2, 3, 4);
        break;
      }

      case 'king_gel': {
        // Giant pulsing slime boss
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, e.width / 2, e.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Membrane
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Golden Crown
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(-16, -e.height / 2 + 2);
        ctx.lineTo(-16, -e.height / 2 - 14);
        ctx.lineTo(-8, -e.height / 2 - 8);
        ctx.lineTo(0, -e.height / 2 - 18);
        ctx.lineTo(8, -e.height / 2 - 8);
        ctx.lineTo(16, -e.height / 2 - 14);
        ctx.lineTo(16, -e.height / 2 + 2);
        ctx.closePath();
        ctx.fill();

        // Crown jewels
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-2, -e.height / 2 - 6, 4, 4);

        // Giant Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, -8, 8, 10);
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(7, -5, 5, 5);
        break;
      }

      case 'crystal_colossus': {
        // Ancient floating crystal guardian
        ctx.fillStyle = fillColor;
        // Central Diamond Monolith
        ctx.beginPath();
        ctx.moveTo(0, -e.height / 2);
        ctx.lineTo(e.width / 2, 0);
        ctx.lineTo(0, e.height / 2);
        ctx.lineTo(-e.width / 2, 0);
        ctx.closePath();
        ctx.fill();

        // Inner glowing eye
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(2, -2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Orbiting crystal spikes
        const orbitTime = Date.now() * 0.003;
        for (let i = 0; i < 4; i++) {
          const orbitAngle = orbitTime + (i * Math.PI) / 2;
          const ox = Math.cos(orbitAngle) * 44;
          const oy = Math.sin(orbitAngle) * 44;
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(ox - 5, oy - 5, 10, 10);
        }
        break;
      }
    }

    ctx.restore();

    // Enemy Health Bar (if damaged or boss)
    if (e.hp < e.maxHp && !e.isBoss) {
      const barW = e.width + 10;
      const barH = 4;
      const barX = e.x + e.width / 2 - barW / 2;
      const barY = e.y - 8;

      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(barX, barY, (e.hp / e.maxHp) * barW, barH);
    }
  }

  private renderAxe(item: Item, isAttacking: boolean, progress: number) {
    const ctx = this.ctx;
    ctx.save();

    if (isAttacking) {
      // Devastating overhead power chop arc
      const startAngle = -Math.PI * 0.48;
      const currentAngle = startAngle + progress * Math.PI * 0.96;

      ctx.rotate(currentAngle);

      // Cleave energy slash arc
      const slashGrad = ctx.createLinearGradient(0, -30, 30, 30);
      slashGrad.addColorStop(0, '#ffffff');
      slashGrad.addColorStop(0.5, item.color || '#38bdf8');
      slashGrad.addColorStop(1, 'transparent');

      ctx.strokeStyle = slashGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 26, startAngle, currentAngle);
      ctx.stroke();

      // Outer luminous wind shockwave
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 31, startAngle + 0.1, currentAngle);
      ctx.stroke();
    } else {
      // Idle held axe: ready at 25 degrees
      ctx.translate(6, 2);
      ctx.rotate(Math.PI * 0.18);
    }

    // --- DRAW DETAILED BATTLE AXE ---
    const isCopper = item.id === 'copper_axe';
    const isAbyss = item.id === 'abyss_axe';

    // 1. Sturdy wooden handle (shaft)
    ctx.fillStyle = isAbyss ? '#1e1b4b' : isCopper ? '#7c2d12' : '#78350f';
    ctx.fillRect(4, -2.5, 20, 4);

    // Dark grip wrap
    ctx.fillStyle = isAbyss ? '#312e81' : isCopper ? '#431407' : '#451a03';
    ctx.fillRect(8, -2.5, 7, 4);

    // Pommel end cap / ring
    ctx.fillStyle = isAbyss ? '#c084fc' : isCopper ? '#fb923c' : '#d97706';
    ctx.fillRect(4, -3, 2, 5);

    // 2. Axe Head Collar (reinforced eye socket)
    ctx.fillStyle = isAbyss ? '#4c1d95' : isCopper ? '#9a3412' : '#334155';
    ctx.fillRect(17, -4.5, 5, 8);

    // 3. Forged Crescent Battleaxe Blade
    const bladeColor = isAbyss ? '#8b5cf6' : isCopper ? '#ea580c' : '#64748b';
    const edgeColor = isAbyss ? '#e0e7ff' : isCopper ? '#fed7aa' : '#f8fafc';

    // Main crescent cutting blade body
    ctx.fillStyle = bladeColor;
    ctx.beginPath();
    ctx.moveTo(19, -3.5);
    ctx.lineTo(26, -11); // Upper horn
    ctx.quadraticCurveTo(24, 0, 27, 9); // Curved bearded blade edge
    ctx.lineTo(19, 3.5);
    ctx.closePath();
    ctx.fill();

    // Top armor-piercing wedge spike
    ctx.fillStyle = isAbyss ? '#a855f7' : isCopper ? '#c2410c' : '#475569';
    ctx.beginPath();
    ctx.moveTo(22, -2.5);
    ctx.lineTo(25.5, -2);
    ctx.lineTo(22, -1.5);
    ctx.fill();

    // Razor-sharp cutting edge highlight
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(26, -11);
    ctx.quadraticCurveTo(24, 0, 27, 9);
    ctx.stroke();

    // Gleaming shine dot on blade
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(24.5, -4, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Glowing rune on abyss axe
    if (isAbyss) {
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 6;
      ctx.fillRect(21, -1, 2, 2);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  private renderDeathEffect(d: DeathEffect) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rotation);
    ctx.scale(d.scale * d.facing, d.scale);

    const progress = d.age / d.maxDuration;
    // Violent damage flash: flickers between pure white and red/original color
    const isFlashing = Math.floor(d.age / 45) % 2 === 0;
    const bodyColor = isFlashing ? '#ffffff' : (progress > 0.5 ? '#ef4444' : d.color);

    ctx.globalAlpha = Math.max(0, 1 - Math.pow(progress, 2.5));

    // Render dying silhouette
    if (d.enemyType === 'slime' || d.enemyType === 'king_gel') {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      const wobble = Math.sin(d.age * 0.05) * 4;
      ctx.ellipse(0, 0, d.width / 2 + wobble, d.height / 2 - wobble, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bursting X eyes
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, -4); ctx.lineTo(-1, -1);
      ctx.moveTo(-1, -4); ctx.lineTo(-4, -1);
      ctx.moveTo(1, -4); ctx.lineTo(4, -1);
      ctx.moveTo(4, -4); ctx.lineTo(1, -1);
      ctx.stroke();
    } else if (d.enemyType === 'spore_bat') {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();

      // Flapping decaying wings
      ctx.fillStyle = isFlashing ? '#ffffff' : '#a855f7';
      ctx.beginPath();
      ctx.moveTo(-3, 0); ctx.lineTo(-12, -8 + Math.sin(d.age * 0.06) * 5); ctx.lineTo(-4, 4);
      ctx.moveTo(3, 0); ctx.lineTo(12, -8 + Math.sin(d.age * 0.06) * 5); ctx.lineTo(4, 4);
      ctx.fill();
    } else {
      // General monster death silhouette
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.roundRect(-d.width / 2, -d.height / 2, d.width, d.height, 4);
      ctx.fill();
    }

    // Expanding shockwave pulse ring
    const ringRadius = progress * (d.isBoss ? 55 : 32);
    ctx.strokeStyle = isFlashing ? '#ffffff' : d.color;
    ctx.lineWidth = Math.max(1, 3 * (1 - progress));
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private renderDroppedItem(drop: DroppedItem) {
    const ctx = this.ctx;
    const bounce = drop.onGround ? Math.sin(drop.age * 0.007) * 3 : 0;
    const px = drop.x;
    const py = drop.y + bounce;

    ctx.save();

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(px, drop.y + 7, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing aura ring around dropped item
    const auraGrad = ctx.createRadialGradient(px, py, 2, px, py, 14);
    auraGrad.addColorStop(0, `${drop.item.color}88`);
    auraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fill();

    // Draw specific item icon
    if (drop.item.iconType === 'axe') {
      // Mini axe on ground
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(0.5);
      // Handle
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-6, -1, 12, 2);
      // Head
      ctx.fillStyle = drop.item.color || '#64748b';
      ctx.beginPath();
      ctx.moveTo(2, -4);
      ctx.lineTo(6, -4);
      ctx.lineTo(6, 4);
      ctx.lineTo(2, 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    } else if (drop.item.iconType === 'drop') {
      // Slime gel droplet
      ctx.fillStyle = drop.item.color;
      ctx.beginPath();
      ctx.ellipse(px, py + 1, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px - 1.5, py - 1, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (drop.item.iconType === 'crystal' || drop.item.iconType === 'core') {
      // Glowing crystal / core
      ctx.fillStyle = drop.item.color;
      ctx.beginPath();
      ctx.moveTo(px, py - 5);
      ctx.lineTo(px + 4, py);
      ctx.lineTo(px, py + 5);
      ctx.lineTo(px - 4, py);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (drop.item.blockId) {
      // Miniature cube
      ctx.fillStyle = drop.item.color;
      ctx.fillRect(px - 4, py - 4, 8, 8);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 4, py - 4, 8, 8);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(px - 3, py - 3, 6, 2);
    } else {
      // General shiny item gem
      ctx.fillStyle = drop.item.color || '#fbbf24';
      ctx.fillRect(px - 4, py - 4, 8, 8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 4, py - 4, 8, 8);
    }

    ctx.restore();
  }

  private renderProjectile(proj: { x: number; y: number; radius: number; color: string; glowColor?: string }) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = proj.color;
    if (proj.glowColor) {
      ctx.shadowColor = proj.glowColor;
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Cavern & Abyss Lighting Mask
   */
  private renderLighting(
    player: Player,
    world: World,
    camera: { x: number; y: number },
    entities: EntityManager,
    viewW: number,
    viewH: number
  ) {
    if (camera.y < 600) return; // Full daylight on surface

    const ctx = this.ctx;
    const playerCenter = player.getCenter();

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';

    // Ambient darkness factor increases with depth
    const depthDarkness = Math.min(0.92, (camera.y - 600) / 1000);
    ctx.fillStyle = `rgba(5, 7, 20, ${depthDarkness})`;
    ctx.fillRect(camera.x - 50, camera.y - 50, viewW + 100, viewH + 100);

    ctx.globalCompositeOperation = 'destination-out';

    // Player bio-luminescence halo
    const playerLight = ctx.createRadialGradient(
      playerCenter.x,
      playerCenter.y,
      15,
      playerCenter.x,
      playerCenter.y,
      130
    );
    playerLight.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    playerLight.addColorStop(0.6, 'rgba(0, 0, 0, 0.7)');
    playerLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = playerLight;
    ctx.beginPath();
    ctx.arc(playerCenter.x, playerCenter.y, 130, 0, Math.PI * 2);
    ctx.fill();

    // Crystals and Boss lights
    for (const enemy of entities.enemies) {
      if (enemy.isBoss) {
        const bossLight = ctx.createRadialGradient(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          20,
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          180
        );
        bossLight.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        bossLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = bossLight;
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 180, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
