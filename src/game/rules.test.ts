import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkCircleCollision,
  calculateDamage,
  getBulletPattern,
  accumulateHeat,
  coolDownHeat,
  addFoodToRoastMeter,
  applyDrumstickLifeBonus,
  MAX_LIVES,
  DRUMSTICKS_PER_EXTRA_LIFE,
  calculateScoreWithCombo,
  determineBossPhase,
  BOSS_SKILL_COOLDOWN_SECONDS,
  getBossSkillCooldown,
  tickBossSkillCycleTimer,
  pickNextBossSkill,
  handleBulletRicochet,
  WEAPON_GIFT_DROP_CHANCE,
  WEAPON_DEFS
} from './rules';

test('checkCircleCollision accurately detects intersections', () => {
  assert.equal(checkCircleCollision(0, 0, 10, 20, 0, 10), true);
  assert.equal(checkCircleCollision(100, 100, 15, 110, 100, 15), true);
  assert.equal(checkCircleCollision(0, 0, 5, 50, 50, 5), false);
});

test('calculateDamage scales with weapon type and power level across all 10 weapons', () => {
  const baseDamage = WEAPON_DEFS.ion.baseDamage;
  const power1Damage = calculateDamage('ion', 1);
  assert.equal(power1Damage, baseDamage);

  const power5Damage = calculateDamage('ion', 5);
  assert.ok(power5Damage > power1Damage, 'Power 5 should deal more damage than power 1');

  // Test heavy cannon high base damage
  const cannonDamage = calculateDamage('cannon', 1);
  assert.equal(cannonDamage, 95, 'Cannon should have rebalanced artillery damage');

  // Test gatling rapid rate base damage
  const gatlingDamage = calculateDamage('gatling', 1);
  assert.equal(gatlingDamage, 14);

  // Test ricochet damage
  const ricochetDamage = calculateDamage('ricochet', 1);
  assert.equal(ricochetDamage, 25);

  // Clamp check
  const powerOver10 = calculateDamage('ion', 99);
  const power10 = calculateDamage('ion', 10);
  assert.equal(powerOver10, power10);
});

test('getBulletPattern returns appropriate bullet offsets for all 10 weapons', () => {
  const ionBullets = getBulletPattern('ion', 3);
  assert.ok(ionBullets.length >= 2, 'Ion spread should have multiple projectiles');

  const laserBullets = getBulletPattern('laser', 1);
  assert.equal(laserBullets.length, 1);
  assert.equal(laserBullets[0].piercing, true, 'Laser should be piercing');

  // Lightning, Heavy Plasma, Wave
  const lightningBullets = getBulletPattern('lightning', 4);
  assert.ok(lightningBullets.length >= 3, 'Lightning should generate multiple branched forks');

  const heavyPlasmaBullets = getBulletPattern('heavy_plasma', 1);
  assert.equal(heavyPlasmaBullets.length, 1);
  assert.equal(heavyPlasmaBullets[0].heavySplash, true, 'Heavy plasma should have splash flag');

  const waveBullets = getBulletPattern('wave', 2);
  assert.ok(waveBullets.length >= 2, 'Wave blaster should generate dual oscillating ribbons');

  // New Weapons: Gatling, Cannon, Ricochet
  const gatlingBullets = getBulletPattern('gatling', 10);
  assert.equal(gatlingBullets.length, 6, 'Max power Gatling should fire all 6 barrels simultaneously');
  assert.ok(gatlingBullets[0].isGatling, 'Gatling bullet should be flagged as isGatling');

  const cannonBullets = getBulletPattern('cannon', 1);
  assert.equal(cannonBullets.length, 1);
  assert.ok(cannonBullets[0].isCannon, 'Cannon bullet should be flagged as isCannon');
  assert.ok((cannonBullets[0].radius ?? 0) >= 14, 'Cannon shell should have large radius');

  const ricochetBullets = getBulletPattern('ricochet', 3);
  assert.ok(ricochetBullets.length >= 2);
  assert.ok((ricochetBullets[0].bouncesLeft ?? 0) >= 3, 'Ricochet bullet should have at least 3 bounces');
});

test('handleBulletRicochet correctly reflects bullets off arena walls', () => {
  const bulletLeft = { x: 5, y: 300, vx: -200, vy: -500, radius: 6, bouncesLeft: 3 };
  const didBounceLeft = handleBulletRicochet(bulletLeft, 800, 600);
  assert.equal(didBounceLeft, true);
  assert.ok(bulletLeft.vx > 0, 'Horizontal velocity should reverse toward positive');
  assert.equal(bulletLeft.bouncesLeft, 2);

  const bulletTop = { x: 400, y: 10, vx: 50, vy: -400, radius: 6, bouncesLeft: 2 };
  const didBounceTop = handleBulletRicochet(bulletTop, 800, 600);
  assert.equal(didBounceTop, true);
  assert.ok(bulletTop.vy > 0, 'Vertical velocity should reverse downward');
  assert.equal(bulletTop.bouncesLeft, 1);

  // No bounces left
  const bulletNoBounce = { x: 5, y: 300, vx: -200, vy: -500, radius: 6, bouncesLeft: 0 };
  const didBounceExhausted = handleBulletRicochet(bulletNoBounce, 800, 600);
  assert.equal(didBounceExhausted, false);
});

test('WEAPON_GIFT_DROP_CHANCE matches 12% requirement', () => {
  assert.equal(WEAPON_GIFT_DROP_CHANCE, 0.12);
});

test('accumulateHeat and coolDownHeat handle overheat transition and recovery', () => {
  const shot1 = accumulateHeat(0, 'ion', 1);
  assert.ok(shot1.newHeat > 0);
  assert.equal(shot1.becameOverheated, false);

  const overheatShot = accumulateHeat(98, 'heavy_plasma', 5);
  assert.equal(overheatShot.newHeat, 100);
  assert.equal(overheatShot.becameOverheated, true);

  const cool1 = coolDownHeat(100, true, 20, 1);
  assert.ok(cool1.newHeat < 100);
  assert.equal(cool1.isOverheated, true, 'Still overheated above 15%');

  const cool2 = coolDownHeat(14, true, 20, 0.5);
  assert.equal(cool2.isOverheated, false, 'Overheat locks should unlock below 15%');
});

test('addFoodToRoastMeter awards bonuses upon reaching 50 points', () => {
  const r1 = addFoodToRoastMeter(20, 10);
  assert.equal(r1.newMeter, 30);
  assert.equal(r1.bonusAwarded, 'none');

  const r2 = addFoodToRoastMeter(45, 10);
  assert.equal(r2.newMeter, 5);
  assert.equal(r2.bonusAwarded, 'missile');
});

test('calculateScoreWithCombo applies streak bonuses', () => {
  const base = 100;
  const noCombo = calculateScoreWithCombo(base, 0);
  assert.equal(noCombo, 100);

  const highCombo = calculateScoreWithCombo(base, 12);
  assert.ok(highCombo > base, 'Combo should award more points');
});

test('determineBossPhase returns correct phase transitions', () => {
  assert.equal(determineBossPhase(1000, 1000), 1);
  assert.equal(determineBossPhase(500, 1000), 2);
  assert.equal(determineBossPhase(200, 1000), 3);
});

test('applyDrumstickLifeBonus awards +1 life per 100 drumsticks and caps at 10 lives', () => {
  assert.equal(MAX_LIVES, 10);
  assert.equal(DRUMSTICKS_PER_EXTRA_LIFE, 100);

  // Below 100: no life awarded
  const step99 = applyDrumstickLifeBonus(98, 1, 3);
  assert.equal(step99.newRoastTotal, 99);
  assert.equal(step99.newLives, 3);
  assert.equal(step99.lifeAwarded, false);
  assert.equal(step99.progressToNextLife, 99);

  // Reaching 100: awards +1 life
  const step100 = applyDrumstickLifeBonus(99, 1, 3);
  assert.equal(step100.newRoastTotal, 100);
  assert.equal(step100.newLives, 4);
  assert.equal(step100.lifeAwarded, true);
  assert.equal(step100.progressToNextLife, 0);

  // Reaching 200: awards another +1 life
  const step200 = applyDrumstickLifeBonus(199, 1, 4);
  assert.equal(step200.newRoastTotal, 200);
  assert.equal(step200.newLives, 5);
  assert.equal(step200.lifeAwarded, true);

  // Capped at MAX_LIVES (10): does not exceed 10
  const capped = applyDrumstickLifeBonus(999, 1, 10);
  assert.equal(capped.newRoastTotal, 1000);
  assert.equal(capped.newLives, 10);
  assert.equal(capped.lifeAwarded, false);
});

test('getBossSkillCooldown enforces 4 seconds per boss skill', () => {
  assert.equal(BOSS_SKILL_COOLDOWN_SECONDS, 4);
  assert.equal(getBossSkillCooldown(), 4);
});

test('tickBossSkillCycleTimer waits a full 4 seconds while idle and pauses while a skill is active', () => {
  let timer = BOSS_SKILL_COOLDOWN_SECONDS;

  // During active skill, timer stays paused at 4s and does not trigger
  const whileActive = tickBossSkillCycleTimer(timer, 2.0, 'laser_sweep');
  assert.equal(whileActive.shouldTrigger, false);
  assert.equal(whileActive.nextTimer, 4);

  // While idle ('none'), takes full 4 seconds (8 ticks of 0.5s) to trigger
  let triggeredAtTick = -1;
  for (let i = 1; i <= 8; i++) {
    const res = tickBossSkillCycleTimer(timer, 0.5, 'none');
    timer = res.nextTimer;
    if (res.shouldTrigger) {
      triggeredAtTick = i;
    }
  }

  assert.equal(triggeredAtTick, 8, 'Boss must wait full 4 seconds (8 x 0.5s) before triggering');
  assert.equal(timer, 4);
});

test('pickNextBossSkill avoids repeating the previous skill when possible', () => {
  const pool = ['laser_sweep', 'energy_shield', 'cluster_bomb'] as const;
  const chosen = pickNextBossSkill([...pool], 'laser_sweep', () => 0);
  assert.notEqual(chosen, 'laser_sweep');
});
