import {
  AIR_FRICTION,
  FRICTION,
  GRAVITY,
  ITEMS,
  JUMP_FORCE,
  MAX_FALL_SPEED,
  MOVE_ACCEL,
  MOVE_SPEED,
  TILE_SIZE,
} from './constants';
import { soundManager } from './audio';
import { Item, ItemStack, Rect } from './types';
import { World } from './world';

export class Player {
  // Dimensions
  public width = 20;
  public height = 20;

  // Position & Velocity
  public x: number = 25 * TILE_SIZE; // Col 25 starting position
  public y: number = 20 * TILE_SIZE;
  public vx: number = 0;
  public vy: number = 0;
  public onGround: boolean = false;
  public facing: number = 1; // 1 = right, -1 = left

  // Stats
  public maxHp: number = 100;
  public hp: number = 100;
  public invulnTimer: number = 0; // ms
  public isDead: boolean = false;

  // Amoeba visuals (Squash & Stretch)
  public scaleX: number = 1.0;
  public scaleY: number = 1.0;
  public wobbleTimer: number = 0;
  public nucleusOffset = { x: 0, y: 0 };

  // Combat
  public attackTimer: number = 0; // Cooldown remaining
  public swingProgress: number = 0; // 0 to 1 during swing
  public isAttacking: boolean = false;
  public swingAngle: number = 0;

  // Inventory
  public hotbarSize: number = 9;
  public bagSize: number = 27; // 3 rows of 9
  public inventory: (ItemStack | null)[] = [];
  public selectedSlot: number = 0;

  constructor() {
    this.initInventory();
    // Position safely on ground at column 25
    this.x = 25 * TILE_SIZE;
    this.y = 18 * TILE_SIZE;
  }

  private initInventory() {
    this.inventory = Array(this.hotbarSize + this.bagSize).fill(null);

    // Starting loadout
    this.inventory[0] = { item: ITEMS['wooden_pickaxe'], count: 1 };
    this.inventory[1] = { item: ITEMS['wooden_sword'], count: 1 };
    this.inventory[2] = { item: ITEMS['wooden_axe'], count: 1 };
    this.inventory[3] = { item: ITEMS['wood'], count: 30 };
    this.inventory[4] = { item: ITEMS['dirt'], count: 30 };
    this.inventory[5] = { item: ITEMS['healing_gel'], count: 5 };
  }

  public getRect(): Rect {
    return {
      x: this.x,
      y: this.y,
      w: this.width,
      h: this.height,
    };
  }

  public getCenter(): { x: number; y: number } {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    };
  }

  public getSelectedItem(): ItemStack | null {
    return this.inventory[this.selectedSlot];
  }

  public setSelectedSlot(slot: number) {
    if (slot >= 0 && slot < this.hotbarSize) {
      this.selectedSlot = slot;
    }
  }

  public addItem(item: Item, count = 1): boolean {
    // 1. Try to add to existing stack if stackable
    if (item.stackable) {
      for (let i = 0; i < this.inventory.length; i++) {
        const slot = this.inventory[i];
        if (slot && slot.item.id === item.id && slot.count < item.maxStack) {
          const space = item.maxStack - slot.count;
          const add = Math.min(space, count);
          slot.count += add;
          count -= add;
          if (count <= 0) return true;
        }
      }
    }

    // 2. Add to first empty slot
    for (let i = 0; i < this.inventory.length; i++) {
      if (!this.inventory[i]) {
        const add = Math.min(item.maxStack || 99, count);
        this.inventory[i] = { item, count: add };
        count -= add;
        if (count <= 0) return true;
      }
    }

    return count === 0;
  }

  public consumeSelectedItem(count = 1): boolean {
    const slot = this.inventory[this.selectedSlot];
    if (!slot || slot.count < count) return false;
    slot.count -= count;
    if (slot.count <= 0) {
      this.inventory[this.selectedSlot] = null;
    }
    return true;
  }

  public takeDamage(amount: number, knockbackX = 0, knockbackY = -3) {
    if (this.invulnTimer > 0 || this.isDead) return;

    this.hp = Math.max(0, this.hp - amount);
    this.invulnTimer = 650; // ms iframe
    this.vx += knockbackX;
    this.vy = knockbackY;
    this.scaleX = 1.35;
    this.scaleY = 0.7;

    soundManager.playPlayerHurt();

    if (this.hp <= 0) {
      this.isDead = true;
    }
  }

  public heal(amount: number) {
    if (this.isDead) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  public update(dt: number, moveLeft: boolean, moveRight: boolean, jump: boolean, world: World) {
    if (this.isDead) return;

    const dtSeconds = dt / 1000;
    this.wobbleTimer += dtSeconds * 8;

    // Invulnerability timer
    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
    }

    // Weapon swing update
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
    }
    if (this.isAttacking) {
      this.swingProgress += dt / 180;
      if (this.swingProgress >= 1.0) {
        this.isAttacking = false;
        this.swingProgress = 0;
      }
    }

    // Horizontal Movement
    if (moveLeft) {
      this.vx -= MOVE_ACCEL;
      this.facing = -1;
    }
    if (moveRight) {
      this.vx += MOVE_ACCEL;
      this.facing = 1;
    }

    // Clamp horizontal speed
    if (this.vx > MOVE_SPEED) this.vx = MOVE_SPEED;
    if (this.vx < -MOVE_SPEED) this.vx = -MOVE_SPEED;

    // Friction
    const friction = this.onGround ? FRICTION : AIR_FRICTION;
    this.vx *= friction;
    if (Math.abs(this.vx) < 0.05) this.vx = 0;

    // Jump
    if (jump && this.onGround) {
      this.vy = JUMP_FORCE;
      this.onGround = false;
      this.scaleX = 0.7;
      this.scaleY = 1.4;
      soundManager.playJump();
    }

    // Gravity
    this.vy += GRAVITY;
    if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;

    // Movement & Collision Physics (Separated X and Y axes)
    this.moveAndCollideX(world);
    this.moveAndCollideY(world);

    // Smooth squash & stretch recovery
    this.scaleX += (1.0 - this.scaleX) * 0.15;
    this.scaleY += (1.0 - this.scaleY) * 0.15;

    // Nucleus lag/follow effect
    const targetNucleusX = -this.vx * 1.5;
    const targetNucleusY = -this.vy * 0.8;
    this.nucleusOffset.x += (targetNucleusX - this.nucleusOffset.x) * 0.2;
    this.nucleusOffset.y += (targetNucleusY - this.nucleusOffset.y) * 0.2;
  }

  private moveAndCollideX(world: World) {
    this.x += this.vx;
    const rect = this.getRect();

    if (world.checkRectCollision(rect)) {
      if (this.vx > 0) {
        // Moving right, snap to left edge of blocking tile
        const rightTile = Math.floor((rect.x + rect.w) / TILE_SIZE);
        this.x = rightTile * TILE_SIZE - this.width - 0.01;
      } else if (this.vx < 0) {
        // Moving left, snap to right edge of blocking tile
        const leftTile = Math.floor(rect.x / TILE_SIZE);
        this.x = (leftTile + 1) * TILE_SIZE + 0.01;
      }
      this.vx = 0;
    }
  }

  private moveAndCollideY(world: World) {
    this.y += this.vy;
    const rect = this.getRect();

    if (world.checkRectCollision(rect)) {
      if (this.vy > 0) {
        // Moving down, landed
        const bottomTile = Math.floor((rect.y + rect.h) / TILE_SIZE);
        this.y = bottomTile * TILE_SIZE - this.height - 0.01;
        if (!this.onGround) {
          // Landing squash
          this.scaleX = 1.35;
          this.scaleY = 0.65;
          soundManager.playLand();
        }
        this.onGround = true;
      } else if (this.vy < 0) {
        // Moving up, bonked head
        const topTile = Math.floor(rect.y / TILE_SIZE);
        this.y = (topTile + 1) * TILE_SIZE + 0.01;
      }
      this.vy = 0;
    } else {
      this.onGround = false;
    }
  }

  public triggerAttack(targetAngle: number, attackCooldown: number) {
    if (this.attackTimer > 0) return;
    this.isAttacking = true;
    this.swingProgress = 0;
    this.swingAngle = targetAngle;
    this.attackTimer = attackCooldown;
    soundManager.playAttack();
  }

  public reset(spawnX: number, spawnY: number) {
    this.x = spawnX;
    this.y = spawnY;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.maxHp;
    this.isDead = false;
    this.invulnTimer = 0;
  }
}
