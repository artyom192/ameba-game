import { GRAVITY, ITEMS, TILE_SIZE } from './constants';
import { soundManager } from './audio';
import { DeathEffect, DroppedItem, FloatingText, Item, Particle, Projectile, Rect } from './types';
import { World } from './world';

export type EnemyType = 'slime' | 'spore_bat' | 'cavern_crawler' | 'king_gel' | 'crystal_colossus';

export interface Enemy {
  id: string;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  damage: number;
  color: string;
  isBoss: boolean;
  facing: number;
  onGround: boolean;
  hurtTimer: number; // Flash white when hit
  aiTimer: number;
  state: string;
  scaleX: number;
  scaleY: number;
  dropItems: { itemId: string; minCount: number; maxCount: number }[];
}

export class EntityManager {
  public enemies: Enemy[] = [];
  public deathEffects: DeathEffect[] = [];
  public droppedItems: DroppedItem[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public projectiles: Projectile[] = [];

  private nextId = 1;

  public getId(prefix = 'ent'): string {
    return `${prefix}_${this.nextId++}`;
  }

  // Spawn standard enemies
  public spawnEnemy(type: EnemyType, x: number, y: number): Enemy {
    let enemy: Enemy;

    switch (type) {
      case 'slime':
        enemy = {
          id: this.getId('slime'),
          type: 'slime',
          name: 'Зеленый Слизень',
          x,
          y,
          vx: 0,
          vy: 0,
          width: 24,
          height: 18,
          hp: 25,
          maxHp: 25,
          damage: 8,
          color: '#22c55e',
          isBoss: false,
          facing: 1,
          onGround: false,
          hurtTimer: 0,
          aiTimer: 0,
          state: 'idle',
          scaleX: 1,
          scaleY: 1,
          dropItems: [{ itemId: 'slime_gel', minCount: 1, maxCount: 3 }],
        };
        break;

      case 'spore_bat':
        enemy = {
          id: this.getId('bat'),
          type: 'spore_bat',
          name: 'Спорокрыл',
          x,
          y,
          vx: 0,
          vy: 0,
          width: 22,
          height: 18,
          hp: 35,
          maxHp: 35,
          damage: 12,
          color: '#c084fc',
          isBoss: false,
          facing: 1,
          onGround: false,
          hurtTimer: 0,
          aiTimer: 0,
          state: 'fly',
          scaleX: 1,
          scaleY: 1,
          dropItems: [
            { itemId: 'spore', minCount: 1, maxCount: 2 },
            { itemId: 'slime_gel', minCount: 0, maxCount: 1 },
          ],
        };
        break;

      case 'cavern_crawler':
        enemy = {
          id: this.getId('crawler'),
          type: 'cavern_crawler',
          name: 'Пещерный Панцирник',
          x,
          y,
          vx: 0,
          vy: 0,
          width: 28,
          height: 20,
          hp: 60,
          maxHp: 60,
          damage: 16,
          color: '#f43f5e',
          isBoss: false,
          facing: 1,
          onGround: false,
          hurtTimer: 0,
          aiTimer: 0,
          state: 'crawl',
          scaleX: 1,
          scaleY: 1,
          dropItems: [
            { itemId: 'chitin', minCount: 1, maxCount: 2 },
            { itemId: 'copper_ore', minCount: 1, maxCount: 3 },
          ],
        };
        break;

      case 'king_gel':
        enemy = {
          id: this.getId('boss_king'),
          type: 'king_gel',
          name: 'Королевский Гель',
          x,
          y,
          vx: 0,
          vy: 0,
          width: 64,
          height: 52,
          hp: 450,
          maxHp: 450,
          damage: 22,
          color: '#3b82f6',
          isBoss: true,
          facing: 1,
          onGround: false,
          hurtTimer: 0,
          aiTimer: 0,
          state: 'idle',
          scaleX: 1,
          scaleY: 1,
          dropItems: [
            { itemId: 'royal_core', minCount: 1, maxCount: 1 },
            { itemId: 'slime_gel', minCount: 12, maxCount: 20 },
            { itemId: 'copper_ore', minCount: 6, maxCount: 12 },
          ],
        };
        break;

      case 'crystal_colossus':
        enemy = {
          id: this.getId('boss_colossus'),
          type: 'crystal_colossus',
          name: 'Кристальный Колосс',
          x,
          y,
          vx: 0,
          vy: 0,
          width: 72,
          height: 72,
          hp: 850,
          maxHp: 850,
          damage: 28,
          color: '#8b5cf6',
          isBoss: true,
          facing: 1,
          onGround: false,
          hurtTimer: 0,
          aiTimer: 0,
          state: 'float',
          scaleX: 1,
          scaleY: 1,
          dropItems: [
            { itemId: 'abyss_heart', minCount: 1, maxCount: 1 },
            { itemId: 'crystal', minCount: 8, maxCount: 14 },
            { itemId: 'chitin', minCount: 5, maxCount: 9 },
          ],
        };
        break;
    }

    this.enemies.push(enemy);
    return enemy;
  }

  // Populate initial world mobs in their natural biomes
  public initWorldSpawns() {
    this.enemies = [];

    // Surface slimes
    this.spawnEnemy('slime', 38 * TILE_SIZE, 22 * TILE_SIZE);
    this.spawnEnemy('slime', 56 * TILE_SIZE, 20 * TILE_SIZE);
    this.spawnEnemy('slime', 75 * TILE_SIZE, 20 * TILE_SIZE);
    this.spawnEnemy('slime', 105 * TILE_SIZE, 22 * TILE_SIZE);

    // Bats in forest and underground entrance
    this.spawnEnemy('spore_bat', 64 * TILE_SIZE, 16 * TILE_SIZE);
    this.spawnEnemy('spore_bat', 32 * TILE_SIZE, 36 * TILE_SIZE);
    this.spawnEnemy('spore_bat', 68 * TILE_SIZE, 42 * TILE_SIZE);

    // Underground Crawlers
    this.spawnEnemy('cavern_crawler', 40 * TILE_SIZE, 46 * TILE_SIZE);
    this.spawnEnemy('cavern_crawler', 72 * TILE_SIZE, 48 * TILE_SIZE);
    this.spawnEnemy('cavern_crawler', 98 * TILE_SIZE, 46 * TILE_SIZE);

    // Deep Crystal Caverns monsters
    this.spawnEnemy('spore_bat', 42 * TILE_SIZE, 62 * TILE_SIZE);
    this.spawnEnemy('cavern_crawler', 64 * TILE_SIZE, 68 * TILE_SIZE);
    this.spawnEnemy('cavern_crawler', 88 * TILE_SIZE, 66 * TILE_SIZE);
    this.spawnEnemy('spore_bat', 114 * TILE_SIZE, 65 * TILE_SIZE);
  }

  public getActiveBoss(): Enemy | null {
    return this.enemies.find((e) => e.isBoss && e.hp > 0) || null;
  }

  public update(dt: number, playerCenter: { x: number; y: number }, world: World) {
    const dtSec = dt / 1000;

    // 1. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;

      // Particle trail
      if (Math.random() < 0.4) {
        this.addParticle(p.x, p.y, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, p.color, 3, 200);
      }

      // Check tile collision
      const tx = Math.floor(p.x / TILE_SIZE);
      const ty = Math.floor(p.y / TILE_SIZE);
      if (world.isSolid(tx, ty) || p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // 2. Update Enemies AI & Physics
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.hurtTimer > 0) e.hurtTimer -= dt;
      e.aiTimer += dt;

      // Recovery scale
      e.scaleX += (1.0 - e.scaleX) * 0.1;
      e.scaleY += (1.0 - e.scaleY) * 0.1;

      const distToPlayer = Math.hypot(playerCenter.x - (e.x + e.width / 2), playerCenter.y - (e.y + e.height / 2));

      // AI Behavior
      switch (e.type) {
        case 'slime': {
          e.vy += GRAVITY;
          if (e.onGround && e.aiTimer > 1800 && distToPlayer < 380) {
            e.aiTimer = 0;
            const dir = playerCenter.x > e.x ? 1 : -1;
            e.facing = dir;
            e.vx = dir * (2.2 + Math.random() * 0.8);
            e.vy = -6.5;
            e.scaleX = 0.7;
            e.scaleY = 1.35;
          }
          if (e.onGround) {
            e.vx *= 0.85;
          }
          break;
        }

        case 'spore_bat': {
          // Floating sinusoidal hovering towards player
          if (distToPlayer < 450) {
            const angle = Math.atan2(playerCenter.y - (e.y + e.height / 2), playerCenter.x - (e.x + e.width / 2));
            e.vx += Math.cos(angle) * 0.15;
            e.vy += Math.sin(angle) * 0.12;
            e.facing = playerCenter.x > e.x ? 1 : -1;
          }
          // Air damping
          e.vx *= 0.94;
          e.vy *= 0.94;
          e.scaleY = 0.8 + Math.sin(e.aiTimer * 0.015) * 0.3; // Wing flap animation
          break;
        }

        case 'cavern_crawler': {
          e.vy += GRAVITY;
          if (distToPlayer < 350) {
            const dir = playerCenter.x > e.x ? 1 : -1;
            e.facing = dir;
            e.vx += dir * 0.25;
            if (Math.abs(e.vx) > 1.8) e.vx = dir * 1.8;

            // Small hop over obstacles
            const aheadTx = Math.floor((e.x + (dir > 0 ? e.width + 4 : -4)) / TILE_SIZE);
            const aheadTy = Math.floor((e.y + e.height - 4) / TILE_SIZE);
            if (e.onGround && world.isSolid(aheadTx, aheadTy)) {
              e.vy = -5.0;
            }
          }
          if (e.onGround) e.vx *= 0.9;
          break;
        }

        case 'king_gel': {
          // Boss 1 AI: High bounce, slams, shoots mini gel globules
          e.vy += GRAVITY * 0.9;

          if (e.onGround && e.aiTimer > 2000) {
            e.aiTimer = 0;
            const dir = playerCenter.x > e.x + e.width / 2 ? 1 : -1;
            e.facing = dir;
            // Leap high towards player
            e.vx = dir * 3.5;
            e.vy = -9.5;
            e.scaleX = 0.65;
            e.scaleY = 1.45;

            // Shoot slime burst
            this.projectiles.push({
              id: this.getId('proj'),
              x: e.x + e.width / 2,
              y: e.y + 10,
              vx: dir * 3 + (Math.random() - 0.5) * 1.5,
              vy: -4,
              radius: 6,
              color: '#38bdf8',
              glowColor: '#0284c7',
              damage: 12,
              life: 2500,
              isHostile: true,
            });
          }
          if (e.onGround) {
            e.vx *= 0.88;
          }
          break;
        }

        case 'crystal_colossus': {
          // Boss 2 AI: Levitates, teleports/dashes, casts crystal barrages
          const targetX = playerCenter.x + Math.sin(e.aiTimer * 0.002) * 120;
          const targetY = playerCenter.y - 100 + Math.cos(e.aiTimer * 0.003) * 60;

          const dx = targetX - (e.x + e.width / 2);
          const dy = targetY - (e.y + e.height / 2);

          e.vx += dx * 0.004;
          e.vy += dy * 0.004;
          e.vx *= 0.94;
          e.vy *= 0.94;

          e.facing = playerCenter.x > e.x ? 1 : -1;

          // Attack cycle every 2.4s
          if (e.aiTimer > 2400) {
            e.aiTimer = 0;
            // Radial burst of 3 crystal spikes
            const baseAngle = Math.atan2(playerCenter.y - (e.y + e.height / 2), playerCenter.x - (e.x + e.width / 2));
            for (let offset = -0.3; offset <= 0.3; offset += 0.3) {
              this.projectiles.push({
                id: this.getId('proj'),
                x: e.x + e.width / 2,
                y: e.y + e.height / 2,
                vx: Math.cos(baseAngle + offset) * 4.2,
                vy: Math.sin(baseAngle + offset) * 4.2,
                radius: 7,
                color: '#c084fc',
                glowColor: '#a855f7',
                damage: 16,
                life: 3000,
                isHostile: true,
              });
            }
          }
          break;
        }
      }

      // Physics & Solid Collision for ground-based mobs
      if (e.type !== 'spore_bat' && e.type !== 'crystal_colossus') {
        this.moveEnemy(e, world);
      } else {
        e.x += e.vx;
        e.y += e.vy;
      }
    }

    // 3. Update Death Animations (dying mobs, flying corpse, soul motes)
    for (let i = this.deathEffects.length - 1; i >= 0; i--) {
      const d = this.deathEffects[i];
      d.age += dt;

      // Physics
      d.x += d.vx;
      d.y += d.vy;
      d.vy += GRAVITY * 0.55;
      d.vx *= 0.94;
      d.rotation += d.rotSpeed * dt;

      // Scale effect: swell then collapse
      const progress = d.age / d.maxDuration;
      if (progress < 0.35) {
        d.scale = 1.0 + progress * 0.9;
      } else {
        d.scale = Math.max(0.05, 1.3 - (progress - 0.35) * 2.0);
      }

      // Emits smoke and spark trails while dying
      if (Math.random() < 0.4) {
        this.addParticle(
          d.x + (Math.random() - 0.5) * d.width * 0.5,
          d.y + (Math.random() - 0.5) * d.height * 0.5,
          (Math.random() - 0.5) * 1.5,
          -1.0 - Math.random() * 1.2,
          d.color,
          2.5,
          350,
          -0.02
        );
      }

      // Soul wisp ascending
      if (Math.random() < 0.15) {
        this.addParticle(
          d.x + (Math.random() - 0.5) * 8,
          d.y,
          (Math.random() - 0.5) * 0.8,
          -1.8 - Math.random() * 0.8,
          '#e0e7ff',
          3.2,
          500,
          -0.04
        );
      }

      if (d.age >= d.maxDuration) {
        // Final pop explosion at death completion!
        this.createSplatter(d.x, d.y, d.color, d.isBoss ? 35 : 12);
        // Expanding ring particles
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * Math.PI * 2;
          this.addParticle(
            d.x,
            d.y,
            Math.cos(ang) * 3.5,
            Math.sin(ang) * 3.5,
            '#ffffff',
            2.5,
            240,
            0
          );
        }
        this.deathEffects.splice(i, 1);
      }
    }

    // 4. Update Dropped Items (Physical bouncing & manual pickup)
    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const drop = this.droppedItems[i];
      drop.age += dt;
      if (drop.pickupDelay > 0) {
        drop.pickupDelay -= dt;
      }

      // Physics
      drop.vy += GRAVITY * 0.7;
      drop.x += drop.vx;
      drop.y += drop.vy;

      // Tile floor collision with bounce
      const tx = Math.floor(drop.x / TILE_SIZE);
      const ty = Math.floor((drop.y + 6) / TILE_SIZE);
      if (world.isSolid(tx, ty)) {
        drop.y = ty * TILE_SIZE - 6;
        if (drop.vy > 1.2) {
          drop.vy = -drop.vy * 0.42;
          drop.vx *= 0.68;
          drop.bounces++;
          if (drop.bounces <= 2) {
            soundManager.playItemBounce();
          }
        } else {
          drop.vy = 0;
          drop.vx *= 0.82;
          drop.onGround = true;
        }
      } else {
        drop.onGround = false;
        drop.vx *= 0.96;
      }

      // Tile wall collision
      const checkWallTx = Math.floor((drop.x + (drop.vx > 0 ? 5 : -5)) / TILE_SIZE);
      const checkWallTy = Math.floor(drop.y / TILE_SIZE);
      if (world.isSolid(checkWallTx, checkWallTy)) {
        drop.vx = -drop.vx * 0.5;
      }

      // Manual Pickup: Only when initial scatter delay elapsed AND player approaches close!
      const dx = playerCenter.x - drop.x;
      const dy = playerCenter.y - drop.y;
      const dist = Math.hypot(dx, dy);

      if (drop.pickupDelay <= 0 && dist < 30) {
        // Draw smoothly towards player when in pickup zone
        drop.vx += (dx / dist) * 2.8;
        drop.vy += (dy / dist) * 2.8;
      }
    }

    // 5. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) {
        p.vy += p.gravity;
      }
      p.alpha = 1 - p.life / p.maxLife;
    }

    // 6. Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dt;
      ft.y -= 0.6;
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private moveEnemy(e: Enemy, world: World) {
    // X axis
    e.x += e.vx;
    const rectX: Rect = { x: e.x, y: e.y, w: e.width, h: e.height };
    if (world.checkRectCollision(rectX)) {
      if (e.vx > 0) {
        e.x = Math.floor((e.x + e.width) / TILE_SIZE) * TILE_SIZE - e.width - 0.01;
      } else if (e.vx < 0) {
        e.x = (Math.floor(e.x / TILE_SIZE) + 1) * TILE_SIZE + 0.01;
      }
      e.vx = 0;
    }

    // Y axis
    e.y += e.vy;
    const rectY: Rect = { x: e.x, y: e.y, w: e.width, h: e.height };
    if (world.checkRectCollision(rectY)) {
      if (e.vy > 0) {
        e.y = Math.floor((e.y + e.height) / TILE_SIZE) * TILE_SIZE - e.height - 0.01;
        e.onGround = true;
      } else if (e.vy < 0) {
        e.y = (Math.floor(e.y / TILE_SIZE) + 1) * TILE_SIZE + 0.01;
      }
      e.vy = 0;
    } else {
      e.onGround = false;
    }
  }

  public damageEnemy(enemy: Enemy, damage: number, knockX: number, knockY: number): boolean {
    enemy.hp -= damage;
    enemy.hurtTimer = 200;
    enemy.vx += knockX;
    enemy.vy += knockY;
    enemy.scaleX = 1.3;
    enemy.scaleY = 0.7;

    // Floating damage text
    this.addFloatingText(`-${damage}`, enemy.x + enemy.width / 2, enemy.y - 10, '#ef4444');

    // Splatter particles
    this.createSplatter(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 8);

    if (enemy.hp <= 0) {
      // Enemy killed! Trigger death animation and physical drops
      this.triggerEnemyDeath(enemy, knockX, knockY);
      const index = this.enemies.indexOf(enemy);
      if (index !== -1) {
        this.enemies.splice(index, 1);
      }
      return true;
    }
    return false;
  }

  public triggerEnemyDeath(enemy: Enemy, knockX: number, knockY: number) {
    const isBoss = enemy.isBoss;
    const duration = isBoss ? 1100 : 480;

    // 1. Create death animation effect
    this.deathEffects.push({
      id: this.getId('death'),
      enemyType: enemy.type,
      name: enemy.name,
      x: enemy.x + enemy.width / 2,
      y: enemy.y + enemy.height / 2,
      vx: knockX * 0.75 + (Math.random() - 0.5) * 2,
      vy: Math.min(-3.2, knockY * 0.75 - 2.5),
      width: enemy.width,
      height: enemy.height,
      color: enemy.color,
      isBoss,
      age: 0,
      maxDuration: duration,
      rotation: 0,
      rotSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.018 + Math.random() * 0.015),
      facing: enemy.facing,
      scale: 1.0,
    });

    soundManager.playEnemyDeath(isBoss);

    // 2. Initial biological splatter
    this.createSplatter(
      enemy.x + enemy.width / 2,
      enemy.y + enemy.height / 2,
      enemy.color,
      isBoss ? 35 : 14
    );

    // 3. Ethereal spirit / soul ascending
    for (let s = 0; s < (isBoss ? 6 : 2); s++) {
      this.addParticle(
        enemy.x + enemy.width / 2 + (Math.random() - 0.5) * 12,
        enemy.y + enemy.height / 2,
        (Math.random() - 0.5) * 1.2,
        -1.8 - Math.random() * 1.2,
        '#e0e7ff',
        isBoss ? 4.5 : 3.0,
        700,
        -0.05
      );
    }

    // 4. Physical loot explosion! Loot scatters into the world with physics
    for (const drop of enemy.dropItems) {
      const count = Math.floor(Math.random() * (drop.maxCount - drop.minCount + 1)) + drop.minCount;
      if (count > 0 && ITEMS[drop.itemId]) {
        for (let c = 0; c < count; c++) {
          const spreadAngle = (Math.random() - 0.5) * 1.5 - Math.PI / 2;
          const speed = 3.6 + Math.random() * 3.2;
          this.spawnDroppedItem(
            ITEMS[drop.itemId],
            1,
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2 - 4,
            Math.cos(spreadAngle) * speed + (knockX > 0 ? 1 : -1) * 1.2,
            Math.sin(spreadAngle) * speed
          );
        }
      }
    }
  }

  public spawnDroppedItem(
    item: Item,
    count: number,
    x: number,
    y: number,
    vx = (Math.random() - 0.5) * 3.5,
    vy = -3 - Math.random() * 2.5
  ) {
    this.droppedItems.push({
      id: this.getId('drop'),
      item,
      count,
      x,
      y,
      vx,
      vy,
      age: 0,
      pickupDelay: 600, // Short delay so loot flies out before being picked up
      bounces: 0,
      onGround: false,
    });
  }

  public addParticle(x: number, y: number, vx: number, vy: number, color: string, size: number, maxLife: number, gravity = 0.15) {
    this.particles.push({
      x,
      y,
      vx,
      vy,
      color,
      size,
      life: 0,
      maxLife,
      alpha: 1,
      gravity,
    });
  }

  public createSplatter(x: number, y: number, color: string, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.addParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        2 + Math.random() * 3,
        400 + Math.random() * 300,
        0.2
      );
    }
  }

  public addFloatingText(text: string, x: number, y: number, color: string) {
    this.floatingTexts.push({
      id: this.getId('ft'),
      text,
      x,
      y,
      color,
      life: 0,
      maxLife: 700,
    });
  }
}
