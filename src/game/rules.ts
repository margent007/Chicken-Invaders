import { WeaponType, WeaponDef, DropItem, BossSkillType } from './types';

export const WEAPON_DEFS: Record<WeaponType, WeaponDef> = {
  ion: {
    type: 'ion',
    name: 'Ion Blaster',
    color: '#ff2a2a',
    glowColor: 'rgba(255, 60, 60, 0.85)',
    cooldownMs: 140,
    baseDamage: 19,
    heatPerShot: 3.5,
    coolingRate: 26,
    description: 'Iconic red spread plasma bolts. Balanced heat and wide screen coverage.'
  },
  neutron: {
    type: 'neutron',
    name: 'Neutron Gun',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.85)',
    cooldownMs: 80,
    baseDamage: 11,
    heatPerShot: 2.2,
    coolingRate: 28,
    description: 'Ultra-rapid green energy pulse stream. Shreds unarmored flocks.'
  },
  vulcan: {
    type: 'vulcan',
    name: 'Vulcan Chaingun',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.85)',
    cooldownMs: 100,
    baseDamage: 16,
    heatPerShot: 2.8,
    coolingRate: 24,
    description: 'Twin high-velocity armor-piercing kinetic rounds with heavy impact.'
  },
  laser: {
    type: 'laser',
    name: 'Plasma Utensil Beam',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.85)',
    cooldownMs: 150,
    baseDamage: 27,
    heatPerShot: 4.5,
    coolingRate: 22,
    description: 'Dark-side piercing energy ray. Penetrates through lines of chickens.'
  },
  lightning: {
    type: 'lightning',
    name: 'Tesla Chain Lightning',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.9)',
    cooldownMs: 180,
    baseDamage: 32,
    heatPerShot: 5.2,
    coolingRate: 24,
    description: 'Crackling electric lightning fork. Splits into multiple branching shock bolts!'
  },
  heavy_plasma: {
    type: 'heavy_plasma',
    name: 'Heavy Emerald Plasma',
    color: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.95)',
    cooldownMs: 240,
    baseDamage: 70, // Massive damage, slower travel speed
    heatPerShot: 6.5,
    coolingRate: 20,
    description: 'Slow-moving supermassive emerald plasma orb. Devastating explosion upon impact!'
  },
  wave: {
    type: 'wave',
    name: 'Hyper Wave Blaster',
    color: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.85)',
    cooldownMs: 130,
    baseDamage: 24,
    heatPerShot: 3.8,
    coolingRate: 25,
    description: 'Undulating sinusoidal ribbons of energy that weave and pierce through targets.'
  },
  gatling: {
    type: 'gatling',
    name: 'Súng Sáu Nòng (Hexa-Gatling)',
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.9)',
    cooldownMs: 65, // Ultra rapid fire
    baseDamage: 14,
    heatPerShot: 1.6,
    coolingRate: 32,
    description: 'Súng 6 nòng xoay liên thanh cực nhanh. Bắn ra luồng đạn động năng quét sạch đàn gà!'
  },
  cannon: {
    type: 'cannon',
    name: 'Đạn Đại Bác (Siege Cannon)',
    color: '#ea580c',
    glowColor: 'rgba(234, 88, 12, 0.95)',
    cooldownMs: 280, // Heavy artillery shot
    baseDamage: 95, // Huge single-hit explosive damage
    heatPerShot: 7.2,
    coolingRate: 18,
    description: 'Đại bác hạm đội bắn đạn nổ công phá cực lớn. Tạo sóng xung kích lan tỏa tiêu diệt mục tiêu lân cận!'
  },
  ricochet: {
    type: 'ricochet',
    name: 'Đạn Bắn Lại (Prism Ricochet)',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.9)',
    cooldownMs: 120,
    baseDamage: 25,
    heatPerShot: 3.2,
    coolingRate: 26,
    description: 'Đạn tinh thể phản xạ bật nảy liên tục qua các góc màn hình và nảy chuyền giữa các mục tiêu!'
  }
};

/**
 * Standard drop probability for weapon gift boxes (12% per user requirement).
 */
export const WEAPON_GIFT_DROP_CHANCE = 0.12;

/**
 * Checks circular bounding collision between two entities.
 */
export function checkCircleCollision(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const distSq = dx * dx + dy * dy;
  const radSum = r1 + r2;
  return distSq <= radSum * radSum;
}

/**
 * Calculates weapon damage based on weapon type and power level (1-10).
 */
export function calculateDamage(weaponType: WeaponType, powerLevel: number): number {
  const clampedPower = Math.max(1, Math.min(10, powerLevel));
  const base = WEAPON_DEFS[weaponType].baseDamage;
  // Power level gives progressive damage multiplier
  const multiplier = 1 + (clampedPower - 1) * 0.30;
  return Math.round(base * multiplier);
}

export interface BulletOffset {
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  piercing?: boolean;
  wavePhase?: number;
  waveFreq?: number;
  waveAmp?: number;
  branchSeed?: number;
  heavySplash?: boolean;
  isCannon?: boolean;
  isGatling?: boolean;
  bouncesLeft?: number;
  maxBounces?: number;
  radius?: number;
}

/**
 * Generates bullet layout patterns based on weapon type and power level.
 */
export function getBulletPattern(weaponType: WeaponType, power: number): BulletOffset[] {
  const speed = 720;
  const clampedPower = Math.max(1, Math.min(10, power));
  const results: BulletOffset[] = [];

  switch (weaponType) {
    case 'ion': {
      const bulletCount = Math.min(1 + Math.floor(clampedPower * 0.7), 7);
      const angleSpread = 0.08 + clampedPower * 0.015;
      const halfCount = (bulletCount - 1) / 2;

      for (let i = 0; i < bulletCount; i++) {
        const angle = (i - halfCount) * angleSpread;
        const dx = (i - halfCount) * 10;
        results.push({
          dx,
          dy: -15,
          vx: Math.sin(angle) * speed * 0.85,
          vy: -Math.cos(angle) * speed
        });
      }
      break;
    }

    case 'neutron': {
      if (clampedPower < 3) {
        results.push({ dx: 0, dy: -18, vx: 0, vy: -speed * 1.15 });
      } else if (clampedPower < 6) {
        results.push({ dx: -8, dy: -18, vx: -20, vy: -speed * 1.15 });
        results.push({ dx: 8, dy: -18, vx: 20, vy: -speed * 1.15 });
      } else {
        results.push({ dx: -12, dy: -15, vx: -40, vy: -speed * 1.15 });
        results.push({ dx: 0, dy: -20, vx: 0, vy: -speed * 1.18 });
        results.push({ dx: 12, dy: -15, vx: 40, vy: -speed * 1.15 });
      }
      break;
    }

    case 'vulcan': {
      results.push({ dx: -10, dy: -14, vx: 0, vy: -speed * 1.05 });
      results.push({ dx: 10, dy: -14, vx: 0, vy: -speed * 1.05 });
      if (clampedPower >= 4) {
        results.push({ dx: -18, dy: -10, vx: -50, vy: -speed });
        results.push({ dx: 18, dy: -10, vx: 50, vy: -speed });
      }
      if (clampedPower >= 8) {
        results.push({ dx: -24, dy: -6, vx: -100, vy: -speed * 0.95 });
        results.push({ dx: 24, dy: -6, vx: 100, vy: -speed * 0.95 });
      }
      break;
    }

    case 'laser': {
      results.push({ dx: 0, dy: -22, vx: 0, vy: -speed * 1.3, piercing: true });
      if (clampedPower >= 4) {
        results.push({ dx: -14, dy: -18, vx: -15, vy: -speed * 1.3, piercing: true });
        results.push({ dx: 14, dy: -18, vx: 15, vy: -speed * 1.3, piercing: true });
      }
      if (clampedPower >= 7) {
        results.push({ dx: -22, dy: -12, vx: -35, vy: -speed * 1.25, piercing: true });
        results.push({ dx: 22, dy: -12, vx: 35, vy: -speed * 1.25, piercing: true });
      }
      break;
    }

    case 'lightning': {
      // Branching tesla forks: 2 to 6 branching bolts with electric zig-zags
      const boltCount = Math.min(2 + Math.floor(clampedPower * 0.5), 6);
      const halfBolt = (boltCount - 1) / 2;
      for (let i = 0; i < boltCount; i++) {
        const spreadAngle = (i - halfBolt) * 0.16;
        results.push({
          dx: (i - halfBolt) * 12,
          dy: -18,
          vx: Math.sin(spreadAngle) * speed * 0.9,
          vy: -Math.cos(spreadAngle) * speed * 1.1,
          branchSeed: Math.random() * 100,
          radius: 6,
          piercing: clampedPower >= 6
        });
      }
      break;
    }

    case 'heavy_plasma': {
      // Slower (340 speed), massive emerald orbs with wide splash radius
      const orbSpeed = 360;
      results.push({
        dx: 0,
        dy: -25,
        vx: 0,
        vy: -orbSpeed,
        heavySplash: true,
        radius: 12 + Math.min(clampedPower, 10) * 1.5
      });
      if (clampedPower >= 5) {
        results.push({
          dx: -20,
          dy: -15,
          vx: -35,
          vy: -orbSpeed * 0.95,
          heavySplash: true,
          radius: 10 + Math.min(clampedPower, 10)
        });
        results.push({
          dx: 20,
          dy: -15,
          vx: 35,
          vy: -orbSpeed * 0.95,
          heavySplash: true,
          radius: 10 + Math.min(clampedPower, 10)
        });
      }
      break;
    }

    case 'wave': {
      // Undulating sinusoidal wave streams
      // Left and right oscillating phase pairs
      const waveSpeed = 680;
      const amp = 30 + clampedPower * 4;
      results.push({
        dx: -12,
        dy: -18,
        vx: 0,
        vy: -waveSpeed,
        piercing: true,
        wavePhase: 0,
        waveFreq: 14,
        waveAmp: amp,
        radius: 6
      });
      results.push({
        dx: 12,
        dy: -18,
        vx: 0,
        vy: -waveSpeed,
        piercing: true,
        wavePhase: Math.PI,
        waveFreq: 14,
        waveAmp: amp,
        radius: 6
      });
      if (clampedPower >= 6) {
        results.push({
          dx: 0,
          dy: -24,
          vx: 0,
          vy: -waveSpeed * 1.1,
          piercing: true,
          wavePhase: Math.PI / 2,
          waveFreq: 18,
          waveAmp: amp * 0.6,
          radius: 7
        });
      }
      break;
    }

    case 'gatling': {
      // 6-Barreled Rotary Gatling: High rate of fire, rhythmic alternating barrel offsets
      const gatlingSpeed = 820;
      // Barrel offsets for up to 6 barrels: [-18, -11, -4, 4, 11, 18]
      const barrelXOffsets = [-18, -11, -4, 4, 11, 18];
      const count = Math.min(6, 2 + Math.floor(clampedPower * 0.5));
      const startIndex = Math.floor((6 - count) / 2);

      for (let i = 0; i < count; i++) {
        const barrelIndex = startIndex + i;
        const dx = barrelXOffsets[barrelIndex];
        const dy = -16 - (i % 2 === 0 ? 0 : 4); // Alternating muzzle depth
        const spreadVx = dx * 1.2; // Slight kinetic spread
        results.push({
          dx,
          dy,
          vx: spreadVx,
          vy: -gatlingSpeed,
          isGatling: true,
          radius: 4.5
        });
      }
      break;
    }

    case 'cannon': {
      // Dreadnought Siege Artillery Cannon: Heavy armor-piercing shell
      const cannonSpeed = 520;
      const baseRadius = 14 + Math.min(clampedPower, 10) * 1.2;
      results.push({
        dx: 0,
        dy: -24,
        vx: 0,
        vy: -cannonSpeed,
        isCannon: true,
        heavySplash: true,
        radius: baseRadius
      });

      if (clampedPower >= 5) {
        results.push({
          dx: -22,
          dy: -18,
          vx: -30,
          vy: -cannonSpeed * 0.96,
          isCannon: true,
          heavySplash: true,
          radius: baseRadius * 0.85
        });
        results.push({
          dx: 22,
          dy: -18,
          vx: 30,
          vy: -cannonSpeed * 0.96,
          isCannon: true,
          heavySplash: true,
          radius: baseRadius * 0.85
        });
      }

      if (clampedPower >= 8) {
        results.push({
          dx: -36,
          dy: -12,
          vx: -60,
          vy: -cannonSpeed * 0.92,
          isCannon: true,
          heavySplash: true,
          radius: baseRadius * 0.75
        });
        results.push({
          dx: 36,
          dy: -12,
          vx: 60,
          vy: -cannonSpeed * 0.92,
          isCannon: true,
          heavySplash: true,
          radius: baseRadius * 0.75
        });
      }
      break;
    }

    case 'ricochet': {
      // Bouncing Flak Blaster: Crystalline bolts that bounce off walls
      const ricochetSpeed = 740;
      const bounces = clampedPower >= 6 ? 4 : 3;
      const bulletCount = clampedPower < 4 ? 2 : clampedPower < 8 ? 3 : 5;

      if (bulletCount === 2) {
        results.push({
          dx: -12,
          dy: -18,
          vx: -140,
          vy: -ricochetSpeed * 0.95,
          bouncesLeft: bounces,
          maxBounces: bounces,
          radius: 5.5
        });
        results.push({
          dx: 12,
          dy: -18,
          vx: 140,
          vy: -ricochetSpeed * 0.95,
          bouncesLeft: bounces,
          maxBounces: bounces,
          radius: 5.5
        });
      } else if (bulletCount === 3) {
        results.push({
          dx: 0,
          dy: -20,
          vx: 0,
          vy: -ricochetSpeed,
          bouncesLeft: bounces,
          maxBounces: bounces,
          radius: 6
        });
        results.push({
          dx: -16,
          dy: -16,
          vx: -180,
          vy: -ricochetSpeed * 0.9,
          bouncesLeft: bounces,
          maxBounces: bounces,
          radius: 5.5
        });
        results.push({
          dx: 16,
          dy: -16,
          vx: 180,
          vy: -ricochetSpeed * 0.9,
          bouncesLeft: bounces,
          maxBounces: bounces,
          radius: 5.5
        });
      } else {
        // 5 bouncing shards
        const angles = [-0.35, -0.18, 0, 0.18, 0.35];
        for (let i = 0; i < 5; i++) {
          const ang = angles[i];
          results.push({
            dx: (i - 2) * 10,
            dy: -18,
            vx: Math.sin(ang) * ricochetSpeed,
            vy: -Math.cos(ang) * ricochetSpeed,
            bouncesLeft: bounces,
            maxBounces: bounces,
            radius: 5.5
          });
        }
      }
      break;
    }
  }

  return results;
}

/**
 * Handles ricochet logic when a bouncing bullet touches arena borders.
 * Returns true if a bounce occurred.
 */
export function handleBulletRicochet(
  bullet: { x: number; y: number; vx: number; vy: number; radius: number; bouncesLeft?: number },
  screenWidth: number,
  screenHeight: number
): boolean {
  if (bullet.bouncesLeft === undefined || bullet.bouncesLeft <= 0) return false;
  let bounced = false;

  // Left boundary
  if (bullet.x - bullet.radius <= 8 && bullet.vx < 0) {
    bullet.vx = Math.abs(bullet.vx);
    bullet.bouncesLeft--;
    bounced = true;
  }
  // Right boundary
  else if (bullet.x + bullet.radius >= screenWidth - 8 && bullet.vx > 0) {
    bullet.vx = -Math.abs(bullet.vx);
    bullet.bouncesLeft--;
    bounced = true;
  }

  // Top boundary (reflect downward toward enemy flock)
  if (bullet.y - bullet.radius <= 12 && bullet.vy < 0) {
    bullet.vy = Math.abs(bullet.vy) * 0.92;
    bullet.bouncesLeft--;
    bounced = true;
  }

  return bounced;
}

/**
 * Simulates heat accumulation from firing a shot.
 */
export function accumulateHeat(
  currentHeat: number,
  weaponType: WeaponType,
  powerLevel: number
): { newHeat: number; becameOverheated: boolean } {
  const baseHeat = WEAPON_DEFS[weaponType].heatPerShot;
  const powerModifier = 1 + (powerLevel - 1) * 0.08;
  const added = baseHeat * powerModifier;
  const nextHeat = Math.min(100, currentHeat + added);
  const becameOverheated = nextHeat >= 100;

  return {
    newHeat: nextHeat,
    becameOverheated
  };
}

/**
 * Simulates weapon cooling over time (dt in seconds).
 */
export function coolDownHeat(
  currentHeat: number,
  isOverheated: boolean,
  coolingRatePercentPerSec: number,
  dt: number
): { newHeat: number; isOverheated: boolean } {
  const effectiveRate = isOverheated ? coolingRatePercentPerSec * 1.25 : coolingRatePercentPerSec;
  const cooled = Math.max(0, currentHeat - effectiveRate * dt);

  let stillOverheated = isOverheated;
  if (isOverheated && cooled <= 15) {
    stillOverheated = false;
  }

  return {
    newHeat: Math.round(cooled * 10) / 10,
    isOverheated: stillOverheated
  };
}

/**
 * Handles collecting roast chicken drumsticks / food items.
 */
export function addFoodToRoastMeter(
  currentMeter: number,
  foodValue: number
): {
  newMeter: number;
  bonusAwarded: 'none' | 'missile' | 'life';
  overflowPoints: number;
} {
  const METER_MAX = 50;
  const combined = currentMeter + foodValue;

  if (combined >= METER_MAX) {
    const overflow = combined % METER_MAX;
    return {
      newMeter: overflow,
      bonusAwarded: 'missile',
      overflowPoints: overflow
    };
  }

  return {
    newMeter: combined,
    bonusAwarded: 'none',
    overflowPoints: 0
  };
}

export const MAX_LIVES = 10;
export const DRUMSTICKS_PER_EXTRA_LIFE = 100;

/**
 * Tracks collected drumsticks and awards +1 life per 100 drumsticks, capped at MAX_LIVES (10).
 */
export function applyDrumstickLifeBonus(
  currentRoastTotal: number,
  drumsticksGained: number,
  currentLives: number
): {
  newRoastTotal: number;
  newLives: number;
  lifeAwarded: boolean;
  progressToNextLife: number;
} {
  const safeGained = Math.max(0, Math.floor(drumsticksGained));
  const newRoastTotal = currentRoastTotal + safeGained;
  const prevMilestones = Math.floor(currentRoastTotal / DRUMSTICKS_PER_EXTRA_LIFE);
  const nextMilestones = Math.floor(newRoastTotal / DRUMSTICKS_PER_EXTRA_LIFE);
  const potentialLivesEarned = Math.max(0, nextMilestones - prevMilestones);

  const clampedCurrentLives = Math.max(0, Math.min(MAX_LIVES, currentLives));
  const newLives = Math.min(MAX_LIVES, clampedCurrentLives + potentialLivesEarned);
  const lifeAwarded = newLives > clampedCurrentLives;

  return {
    newRoastTotal,
    newLives,
    lifeAwarded,
    progressToNextLife: newRoastTotal % DRUMSTICKS_PER_EXTRA_LIFE
  };
}

/**
 * Calculates score including combo streak bonus.
 */
export function calculateScoreWithCombo(baseScore: number, comboStreak: number): number {
  const multiplier = 1 + Math.min(5, Math.floor(comboStreak / 5) * 0.25);
  return Math.round(baseScore * multiplier);
}

/**
 * Determines boss phase from HP percentage (1: 100-66%, 2: 66-33%, 3: 33-0%).
 */
export function determineBossPhase(hp: number, maxHp: number): 1 | 2 | 3 {
  const ratio = Math.max(0, hp) / maxHp;
  if (ratio > 0.66) return 1;
  if (ratio > 0.33) return 2;
  return 3;
}

export const BOSS_SKILL_COOLDOWN_SECONDS = 4;

/**
 * Returns the cooldown interval (in seconds) between boss skill casts.
 */
export function getBossSkillCooldown(): number {
  return BOSS_SKILL_COOLDOWN_SECONDS;
}

/**
 * Advances the boss skill cooldown timer ONLY while idle ('none').
 * Guarantees a full 4-second pause between consecutive boss skills.
 */
export function tickBossSkillCycleTimer(
  skillTimer: number,
  dt: number,
  currentSkill: BossSkillType = 'none'
): { nextTimer: number; shouldTrigger: boolean } {
  if (currentSkill !== 'none') {
    return {
      nextTimer: BOSS_SKILL_COOLDOWN_SECONDS,
      shouldTrigger: false
    };
  }

  const next = skillTimer - dt;
  if (next <= 0) {
    return {
      nextTimer: BOSS_SKILL_COOLDOWN_SECONDS,
      shouldTrigger: true
    };
  }

  return {
    nextTimer: next,
    shouldTrigger: false
  };
}

/**
 * Picks the next boss skill from the pool, avoiding repeating the previous skill when alternatives exist.
 */
export function pickNextBossSkill(
  pool: BossSkillType[],
  previousSkill?: BossSkillType,
  rng: () => number = Math.random
): BossSkillType {
  if (pool.length === 0) return 'none';
  const filtered = previousSkill && pool.length > 1
    ? pool.filter((s) => s !== previousSkill)
    : pool;
  const candidates = filtered.length > 0 ? filtered : pool;
  const index = Math.min(candidates.length - 1, Math.floor(rng() * candidates.length));
  return candidates[index];
}
