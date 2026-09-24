import { soundManager } from './audio';
import { BLOCKS, ITEMS, RECIPES, TILE_SIZE } from './constants';
import { EntityManager } from './entities';
import { Player } from './player';
import { Renderer } from './renderer';
import { Item, Recipe } from './types';
import { World } from './world';

export interface EngineCallbacks {
  onInventoryToggle?: (open: boolean) => void;
  onGameOver?: () => void;
  onVictory?: (bossName: string) => void;
  onNotification?: (msg: string) => void;
  onZoomChange?: (zoom: number) => void;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public renderer: Renderer;
  public world: World;
  public player: Player;
  public entities: EntityManager;

  // Viewport & Camera
  public camera = { x: 0, y: 0 };
  public screenWidth: number = 800;
  public screenHeight: number = 600;

  // Zoom
  public zoom: number = 1.0;
  public minZoom: number = 0.5;
  public maxZoom: number = 2.4;

  // Input states
  public keys: Record<string, boolean> = {};
  public mouseScreen = { x: 0, y: 0 };
  public mouseWorld = { x: 0, y: 0, tx: 0, ty: 0 };
  public isLmbDown: boolean = false;
  public isRmbDown: boolean = false;
  public buildCooldownTimer: number = 0;

  // Running state
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public isInventoryOpen: boolean = false;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  public callbacks: EngineCallbacks = {};

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.renderer = new Renderer(this.ctx);
    this.callbacks = callbacks;

    this.world = new World();
    this.player = new Player();
    this.entities = new EntityManager();

    this.setupListeners();
    this.resize();
    this.initGame();
  }

  private hasTriggeredGameOver: boolean = false;

  public initGame() {
    this.hasTriggeredGameOver = false;
    this.world = new World();
    this.player = new Player();
    this.entities = new EntityManager();
    this.entities.initWorldSpawns();

    // Position player nicely on surface ground
    this.player.x = 25 * TILE_SIZE;
    this.player.y = 20 * TILE_SIZE;

    this.camera.x = this.player.x - this.screenWidth / 2;
    this.camera.y = this.player.y - this.screenHeight / 2;
  }

  public resize() {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.screenWidth = parent.clientWidth;
      this.screenHeight = parent.clientHeight;
    } else {
      this.screenWidth = window.innerWidth;
      this.screenHeight = window.innerHeight;
    }

    this.canvas.width = this.screenWidth;
    this.canvas.height = this.screenHeight;
    this.renderer.setSize(this.screenWidth, this.screenHeight);
  }

  private setupListeners() {
    // Keyboard
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Mouse
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  public cleanup() {
    this.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('wheel', this.handleWheel);
  }

  public setZoom(newZoom: number): number {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, Math.round(newZoom * 100) / 100));
    this.updateMouseWorldCoords();
    this.callbacks.onZoomChange?.(this.zoom);
    return this.zoom;
  }

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    this.setZoom(this.zoom * factor);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    // Toggle Inventory with E
    if (e.code === 'KeyE') {
      this.toggleInventory();
      return;
    }

    // Zoom shortcuts
    if (e.code === 'Equal' || e.code === 'NumpadAdd') {
      this.setZoom(this.zoom + 0.15);
      return;
    }
    if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
      this.setZoom(this.zoom - 0.15);
      return;
    }
    if (e.code === 'Digit0' && (e.ctrlKey || e.metaKey)) {
      this.setZoom(1.0);
      return;
    }

    // Hotbar selection with 1-9
    if (e.code.startsWith('Digit')) {
      const digit = parseInt(e.code.replace('Digit', ''), 10);
      if (digit >= 1 && digit <= 9) {
        this.player.setSelectedSlot(digit - 1);
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (this.isInventoryOpen) return;

    if (e.button === 0) {
      this.isLmbDown = true;
      this.onLeftClick();
    } else if (e.button === 2) {
      this.isRmbDown = true;
      this.onRightClick();
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isLmbDown = false;
      this.world.currentMining = null;
    } else if (e.button === 2) {
      this.isRmbDown = false;
    }
  };

  public updateMouseWorldCoords() {
    this.mouseWorld.x = this.camera.x + this.mouseScreen.x / this.zoom;
    this.mouseWorld.y = this.camera.y + this.mouseScreen.y / this.zoom;
    this.mouseWorld.tx = Math.floor(this.mouseWorld.x / TILE_SIZE);
    this.mouseWorld.ty = Math.floor(this.mouseWorld.y / TILE_SIZE);
  }

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseScreen.x = e.clientX - rect.left;
    this.mouseScreen.y = e.clientY - rect.top;

    this.updateMouseWorldCoords();

    // Place block immediately while dragging RMB
    if (this.isRmbDown && !this.isInventoryOpen) {
      this.tryPlaceBlock(this.mouseWorld.tx, this.mouseWorld.ty);
    }
  };

  public toggleInventory(force?: boolean) {
    this.isInventoryOpen = force !== undefined ? force : !this.isInventoryOpen;
    this.isLmbDown = false;
    this.isRmbDown = false;
    this.world.currentMining = null;
    if (this.callbacks.onInventoryToggle) {
      this.callbacks.onInventoryToggle(this.isInventoryOpen);
    }
  }

  private onLeftClick() {
    const selected = this.player.getSelectedItem();
    const playerCenter = this.player.getCenter();
    const angle = Math.atan2(this.mouseWorld.y - playerCenter.y, this.mouseWorld.x - playerCenter.x);

    // 1. If holding an AXE: Devastating cleaving battleaxe chop!
    if (selected?.item.iconType === 'axe') {
      this.player.triggerAttack(angle, selected.item.attackSpeed || 320);
      soundManager.playAxeSwing();
      this.performAxeAttack(selected.item);

      // Also if clicked on a tree or leaves block within reach, instantly chop it down!
      const tx = this.mouseWorld.tx;
      const ty = this.mouseWorld.ty;
      const block = this.world.getBlock(tx, ty);
      if ((block === 'wood' || block === 'leaves') && this.world.isInReach(playerCenter.x, playerCenter.y, tx, ty)) {
        const blockCfg = BLOCKS[block];
        this.world.setBlock(tx, ty, 'air');
        soundManager.playBlockBreak();
        if (blockCfg?.dropItemId && ITEMS[blockCfg.dropItemId]) {
          this.entities.spawnDroppedItem(
            ITEMS[blockCfg.dropItemId],
            blockCfg.dropCount || 1,
            tx * TILE_SIZE + 12,
            ty * TILE_SIZE + 12
          );
        }
      }
      return;
    }

    // 2. If holding a sword or other weapon, trigger weapon slash attack
    if (selected?.item.type === 'weapon') {
      this.player.triggerAttack(angle, selected.item.attackSpeed || 280);
      this.performWeaponAttack(selected.item);
      return;
    }

    // 3. If holding a BLOCK, can hit enemies with the block!
    if (selected?.item.blockId) {
      const blockCfg = BLOCKS[selected.item.blockId];
      // Harder blocks deal more damage! Dirt: 8, Wood: 10, Stone: 13, Ore: 15, Crystal: 18, Abyss Stone: 24
      const blockDamage = Math.max(7, Math.round(8 + (blockCfg?.hardness || 1) * 4));
      const hitEnemy = this.performBlockAttack(blockDamage, selected.item.color);

      if (hitEnemy) {
        this.player.triggerAttack(angle, 250);
        return;
      }

      // If clicked on open air without hitting enemy, swing the block in air
      if (this.world.getBlock(this.mouseWorld.tx, this.mouseWorld.ty) === 'air') {
        this.player.triggerAttack(angle, 250);
        return;
      }
    }

    // 3. Otherwise if solid tile in reach, start mining block
    const tx = this.mouseWorld.tx;
    const ty = this.mouseWorld.ty;
    const block = this.world.getBlock(tx, ty);

    if (block !== 'air' && this.world.isInReach(playerCenter.x, playerCenter.y, tx, ty)) {
      const blockCfg = BLOCKS[block];
      let pickPower = selected?.item.pickaxePower || 0.6;
      if (selected?.item.type === 'tool' && selected.item.axePower && (block === 'wood' || block === 'leaves')) {
        pickPower = selected.item.axePower * 1.5;
      }
      const totalTime = Math.max(120, (blockCfg.hardness * 650) / pickPower);

      this.world.currentMining = {
        tileX: tx,
        tileY: ty,
        progress: 0,
        totalTime,
        currentTime: 0,
      };
      soundManager.playMineHit();
    }
  }

  public tryPlaceBlock(tx: number, ty: number): boolean {
    const selected = this.player.getSelectedItem();
    if (!selected || !selected.item.blockId) return false;

    const playerCenter = this.player.getCenter();
    if (this.world.canPlaceBlock(tx, ty, this.player.getRect(), playerCenter.x, playerCenter.y)) {
      this.world.setBlock(tx, ty, selected.item.blockId);
      this.player.consumeSelectedItem(1);
      soundManager.playBlockPlace();
      this.entities.addParticle(
        tx * TILE_SIZE + 12,
        ty * TILE_SIZE + 12,
        (Math.random() - 0.5) * 2,
        -1.2,
        selected.item.color,
        3.5,
        280
      );
      return true;
    }
    return false;
  }

  private updateBuilding(dt: number) {
    if (!this.isRmbDown || this.isInventoryOpen) return;
    const selected = this.player.getSelectedItem();
    if (!selected || !selected.item.blockId) return;

    this.buildCooldownTimer -= dt;
    if (this.buildCooldownTimer <= 0) {
      const placed = this.tryPlaceBlock(this.mouseWorld.tx, this.mouseWorld.ty);
      if (placed) {
        this.buildCooldownTimer = 110;
      }
    }
  }

  private onRightClick() {
    const selected = this.player.getSelectedItem();
    if (!selected) return;

    const playerCenter = this.player.getCenter();

    // 1. Building Block
    if (selected.item.blockId) {
      this.tryPlaceBlock(this.mouseWorld.tx, this.mouseWorld.ty);
      this.buildCooldownTimer = 110;
      return;
    }

    // 2. Consumable (Healing Gel)
    if (selected.item.type === 'consumable' && selected.item.healAmount) {
      if (this.player.hp < this.player.maxHp) {
        this.player.heal(selected.item.healAmount);
        this.player.consumeSelectedItem(1);
        soundManager.playPickup();
        this.entities.addFloatingText(`+${selected.item.healAmount} HP`, playerCenter.x, playerCenter.y - 15, '#4ade80');
      }
      return;
    }

    // 3. Summon Boss Items
    if (selected.item.type === 'summon') {
      if (selected.item.id === 'boss_summon_1') {
        // Spawn King Gel above player
        this.entities.spawnEnemy('king_gel', playerCenter.x - 32, playerCenter.y - 180);
        this.player.consumeSelectedItem(1);
        soundManager.playBossRoar();
        this.callbacks.onNotification?.('Призван Королевский Гель!');
      } else if (selected.item.id === 'boss_summon_2') {
        // Spawn Crystal Colossus
        this.entities.spawnEnemy('crystal_colossus', playerCenter.x - 36, playerCenter.y - 200);
        this.player.consumeSelectedItem(1);
        soundManager.playBossRoar();
        this.callbacks.onNotification?.('Пробудился Кристальный Колосс!');
      }
    }
  }

  private performAxeAttack(axe: Item) {
    const playerCenter = this.player.getCenter();
    const range = axe.range || 58;
    const damage = axe.damage || 22;

    for (const enemy of this.entities.enemies) {
      const ec = { x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height / 2 };
      const dist = Math.hypot(ec.x - playerCenter.x, ec.y - playerCenter.y);

      if (dist <= range + enemy.width / 2) {
        const dirToEnemy = ec.x > playerCenter.x ? 1 : -1;
        if (dirToEnemy === this.player.facing || dist < 32) {
          // Massive axe cleave knockback
          const knockX = dirToEnemy * 6.5;
          const killed = this.entities.damageEnemy(enemy, damage, knockX, -4.5);
          soundManager.playAxeHit();

          // Axe chop impact sparks & wood splinters
          for (let p = 0; p < 12; p++) {
            this.entities.addParticle(
              ec.x,
              ec.y,
              (Math.random() - 0.5) * 6 + dirToEnemy * 3,
              (Math.random() - 0.5) * 5 - 2,
              p % 2 === 0 ? '#fbbf24' : axe.color,
              3.2,
              320
            );
          }

          if (killed && enemy.isBoss) {
            soundManager.playBossDefeat();
            this.callbacks.onVictory?.(enemy.name);
          }
        }
      }
    }
  }

  private performWeaponAttack(weapon: { damage?: number; range?: number; color: string }) {
    const playerCenter = this.player.getCenter();
    const range = weapon.range || 50;
    const damage = weapon.damage || 8;

    for (const enemy of this.entities.enemies) {
      const ec = { x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height / 2 };
      const dist = Math.hypot(ec.x - playerCenter.x, ec.y - playerCenter.y);

      if (dist <= range + enemy.width / 2) {
        // Check facing direction alignment
        const dirToEnemy = ec.x > playerCenter.x ? 1 : -1;
        if (dirToEnemy === this.player.facing || dist < 25) {
          const knockX = dirToEnemy * 3.5;
          const killed = this.entities.damageEnemy(enemy, damage, knockX, -3.2);
          soundManager.playEnemyHurt();

          if (killed && enemy.isBoss) {
            soundManager.playBossDefeat();
            this.callbacks.onVictory?.(enemy.name);
          }
        }
      }
    }
  }

  private performBlockAttack(damage: number, color: string): boolean {
    const playerCenter = this.player.getCenter();
    const range = 56;
    let hitAny = false;

    for (const enemy of this.entities.enemies) {
      const ec = { x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height / 2 };
      const dist = Math.hypot(ec.x - playerCenter.x, ec.y - playerCenter.y);

      if (dist <= range + enemy.width / 2) {
        const dirToEnemy = ec.x > playerCenter.x ? 1 : -1;
        if (dirToEnemy === this.player.facing || dist < 28) {
          const knockX = dirToEnemy * 4.4;
          const killed = this.entities.damageEnemy(enemy, damage, knockX, -3.8);
          hitAny = true;
          soundManager.playEnemyHurt();

          // Kinetic block debris particles on impact
          for (let p = 0; p < 7; p++) {
            this.entities.addParticle(
              ec.x,
              ec.y,
              (Math.random() - 0.5) * 6 + dirToEnemy * 2,
              (Math.random() - 0.5) * 5 - 2,
              color,
              3.5,
              320
            );
          }

          if (killed && enemy.isBoss) {
            soundManager.playBossDefeat();
            this.callbacks.onVictory?.(enemy.name);
          }
        }
      }
    }
    return hitAny;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    soundManager.startMusic();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (time: number) => {
    if (!this.isRunning) return;

    let dt = time - this.lastTime;
    if (dt > 100) dt = 100; // Clamp delta time to avoid large jumps
    this.lastTime = time;

    this.update(dt);
    this.render(dt);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    if (this.isPaused) return;

    // 1. Player Input
    const moveLeft = this.keys['KeyA'] || this.keys['ArrowLeft'] || false;
    const moveRight = this.keys['KeyD'] || this.keys['ArrowRight'] || false;
    const jump = this.keys['Space'] || this.keys['KeyW'] || this.keys['ArrowUp'] || false;

    if (!this.isInventoryOpen) {
      this.player.update(dt, moveLeft, moveRight, jump, this.world);
    }

    // Check Death
    if (this.player.isDead) {
      if (!this.hasTriggeredGameOver) {
        this.hasTriggeredGameOver = true;
        this.callbacks.onGameOver?.();
      }
      return;
    }

    // 2. Update Mouse Coordinates in World
    this.updateMouseWorldCoords();

    // 2.5. Continuous Melee Attack while LMB is held down
    if (this.isLmbDown && !this.isInventoryOpen && this.player.attackTimer <= 0) {
      const selected = this.player.getSelectedItem();
      if (selected?.item.type === 'weapon') {
        this.onLeftClick();
      } else if (selected?.item.blockId) {
        const playerCenter = this.player.getCenter();
        const hasEnemyNearby = this.entities.enemies.some((e) => {
          const ec = { x: e.x + e.width / 2, y: e.y + e.height / 2 };
          return Math.hypot(ec.x - playerCenter.x, ec.y - playerCenter.y) < 68;
        });
        if (hasEnemyNearby) {
          this.onLeftClick();
        }
      }
    }

    // 3. Continuous Mining while LMB is held down
    this.updateMining(dt);

    // 3.5. Continuous Building while RMB is held down
    this.updateBuilding(dt);

    // 4. Update Entities (Mobs, Bosses, Drops, Projectiles, Particles)
    const playerCenter = this.player.getCenter();
    this.entities.update(dt, playerCenter, this.world);

    // 5. Check Projectile Collisions with Player
    for (let i = this.entities.projectiles.length - 1; i >= 0; i--) {
      const p = this.entities.projectiles[i];
      if (p.isHostile) {
        const dist = Math.hypot(p.x - playerCenter.x, p.y - playerCenter.y);
        if (dist < p.radius + this.player.width / 2) {
          this.player.takeDamage(p.damage, p.vx * 0.8, -2.5);
          this.entities.projectiles.splice(i, 1);
        }
      }
    }

    // 6. Check Enemy Touch Damage on Player
    for (const enemy of this.entities.enemies) {
      const pRect = this.player.getRect();
      const eRect = { x: enemy.x, y: enemy.y, w: enemy.width, h: enemy.height };

      const overlaps =
        pRect.x < eRect.x + eRect.w &&
        pRect.x + pRect.w > eRect.x &&
        pRect.y < eRect.y + eRect.h &&
        pRect.y + pRect.h > eRect.y;

      if (overlaps) {
        const knockDir = playerCenter.x > enemy.x + enemy.width / 2 ? 1 : -1;
        this.player.takeDamage(enemy.damage, knockDir * 4, -4);
      }
    }

    // 7. Collect Dropped Items (Player approaches to pick them up)
    for (let i = this.entities.droppedItems.length - 1; i >= 0; i--) {
      const drop = this.entities.droppedItems[i];
      if (drop.pickupDelay > 0) continue; // Must scatter first

      const dist = Math.hypot(drop.x - playerCenter.x, drop.y - playerCenter.y);
      if (dist < 22) {
        const added = this.player.addItem(drop.item, drop.count);
        if (added) {
          soundManager.playPickup();
          this.entities.addFloatingText(`+${drop.count} ${drop.item.name}`, drop.x, drop.y - 12, drop.item.color);

          // Collection sparkles
          for (let s = 0; s < 5; s++) {
            this.entities.addParticle(
              drop.x,
              drop.y,
              (Math.random() - 0.5) * 3,
              (Math.random() - 0.5) * 3 - 1,
              drop.item.color,
              2.5,
              220,
              0.05
            );
          }
          this.entities.droppedItems.splice(i, 1);
        }
      }
    }

    // 8. Smooth Camera Follow Player with Zoom factor
    const viewW = this.screenWidth / this.zoom;
    const viewH = this.screenHeight / this.zoom;
    const targetCamX = playerCenter.x - viewW / 2;
    const targetCamY = playerCenter.y - viewH / 2;

    this.camera.x += (targetCamX - this.camera.x) * 0.14;
    this.camera.y += (targetCamY - this.camera.y) * 0.14;

    // Clamp camera within world bounds
    const maxCamX = Math.max(0, this.world.width * TILE_SIZE - viewW);
    const maxCamY = Math.max(0, this.world.height * TILE_SIZE - viewH);

    this.camera.x = Math.max(0, Math.min(maxCamX, this.camera.x));
    this.camera.y = Math.max(0, Math.min(maxCamY, this.camera.y));
  }

  private updateMining(dt: number) {
    if (!this.isLmbDown || this.isInventoryOpen) {
      this.world.currentMining = null;
      return;
    }

    const tx = this.mouseWorld.tx;
    const ty = this.mouseWorld.ty;
    const playerCenter = this.player.getCenter();

    // Must be in reach
    if (!this.world.isInReach(playerCenter.x, playerCenter.y, tx, ty)) {
      this.world.currentMining = null;
      return;
    }

    const blockId = this.world.getBlock(tx, ty);
    if (blockId === 'air') {
      this.world.currentMining = null;
      return;
    }

    // Continue or start mining this block
    if (
      !this.world.currentMining ||
      this.world.currentMining.tileX !== tx ||
      this.world.currentMining.tileY !== ty
    ) {
      const blockCfg = BLOCKS[blockId];
      const selected = this.player.getSelectedItem();
      let power = selected?.item.pickaxePower || 0.6;
      if (selected?.item.type === 'tool' && selected.item.axePower && (blockId === 'wood' || blockId === 'leaves')) {
        power = selected.item.axePower * 1.5;
      }
      const totalTime = Math.max(120, (blockCfg.hardness * 650) / power);

      this.world.currentMining = {
        tileX: tx,
        tileY: ty,
        progress: 0,
        totalTime,
        currentTime: 0,
      };
    }

    const m = this.world.currentMining;
    m.currentTime += dt;
    m.progress = Math.min(1.0, m.currentTime / m.totalTime);

    // Spurt mining dust particles
    if (Math.random() < 0.25) {
      const blockCfg = BLOCKS[blockId];
      this.entities.addParticle(
        tx * TILE_SIZE + Math.random() * TILE_SIZE,
        ty * TILE_SIZE + Math.random() * TILE_SIZE,
        (Math.random() - 0.5) * 2,
        -Math.random() * 2,
        blockCfg.color,
        2.5,
        300
      );
      soundManager.playMineHit();
    }

    // Complete mining!
    if (m.progress >= 1.0) {
      const blockCfg = BLOCKS[blockId];
      this.world.setBlock(tx, ty, 'air');
      soundManager.playBlockBreak();

      // Spawn loot drops
      if (blockCfg.dropItemId && ITEMS[blockCfg.dropItemId]) {
        this.entities.spawnDroppedItem(
          ITEMS[blockCfg.dropItemId],
          blockCfg.dropCount || 1,
          tx * TILE_SIZE + 12,
          ty * TILE_SIZE + 12
        );
      }

      this.world.currentMining = null;
    }
  }

  private render(dt: number) {
    this.renderer.render(
      this.world,
      this.player,
      this.entities,
      this.camera,
      this.mouseWorld,
      dt,
      this.zoom
    );
  }

  public craftRecipe(recipe: Recipe): boolean {
    // 1. Verify player has all ingredients
    for (const req of recipe.ingredients) {
      let countFound = 0;
      for (const slot of this.player.inventory) {
        if (slot && slot.item.id === req.itemId) {
          countFound += slot.count;
        }
      }
      if (countFound < req.count) return false;
    }

    // 2. Consume ingredients
    for (const req of recipe.ingredients) {
      let needed = req.count;
      for (let i = 0; i < this.player.inventory.length; i++) {
        const slot = this.player.inventory[i];
        if (slot && slot.item.id === req.itemId) {
          const take = Math.min(slot.count, needed);
          slot.count -= take;
          needed -= take;
          if (slot.count <= 0) {
            this.player.inventory[i] = null;
          }
          if (needed <= 0) break;
        }
      }
    }

    // 3. Add crafted item to player
    const resultItem = ITEMS[recipe.result.itemId];
    if (resultItem) {
      this.player.addItem(resultItem, recipe.result.count);
      soundManager.playCraft();
      this.callbacks.onNotification?.(`Создано: ${recipe.name}!`);
      return true;
    }
    return false;
  }
}
