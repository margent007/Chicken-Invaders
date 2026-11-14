import {
  PlayerState,
  Enemy,
  Bullet,
  EnemyBullet,
  Asteroid,
  DropItem,
  Particle,
  FloatingText,
  MegabombShockwave,
  BossAppearance
} from './types';
import { WEAPON_DEFS } from './rules';

// Star background item
export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
  color: string;
}

export function createStars(count: number, width: number, height: number): Star[] {
  const stars: Star[] = [];
  const colors = ['#ffffff', '#e0f2fe', '#fef08a', '#e9d5ff', '#93c5fd'];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() < 0.85 ? (0.8 + Math.random() * 1.4) : (2.2 + Math.random() * 1.5),
      speed: 30 + Math.random() * 140,
      alpha: 0.3 + Math.random() * 0.7,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
  return stars;
}

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  // Draw space background with parallax stars and Dark Side Egg Station
  public drawBackground(
    stars: Star[],
    width: number,
    height: number,
    dt: number,
    gameTime: number
  ) {
    const ctx = this.ctx;

    // Deep space gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#040714');
    bgGrad.addColorStop(0.5, '#070b1e');
    bgGrad.addColorStop(1, '#020308');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Cosmic nebulae
    ctx.save();
    const neb1 = ctx.createRadialGradient(width * 0.25, height * 0.3, 10, width * 0.25, height * 0.3, 340);
    neb1.addColorStop(0, 'rgba(88, 28, 135, 0.16)');
    neb1.addColorStop(0.6, 'rgba(67, 56, 202, 0.08)');
    neb1.addColorStop(1, 'transparent');
    ctx.fillStyle = neb1;
    ctx.fillRect(0, 0, width, height);

    const neb2 = ctx.createRadialGradient(width * 0.75, height * 0.65, 20, width * 0.75, height * 0.65, 380);
    neb2.addColorStop(0, 'rgba(225, 29, 72, 0.14)');
    neb2.addColorStop(0.5, 'rgba(14, 116, 144, 0.08)');
    neb2.addColorStop(1, 'transparent');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, width, height);

    // Distant Darkness Egg Station (Death Star silhouette)
    const eggX = width * 0.82;
    const eggY = height * 0.18;
    const eggR = 55;

    const coronaGrad = ctx.createRadialGradient(eggX - 10, eggY - 10, 10, eggX, eggY, eggR * 1.5);
    coronaGrad.addColorStop(0, 'rgba(251, 191, 36, 0.25)');
    coronaGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.15)');
    coronaGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coronaGrad;
    ctx.beginPath();
    ctx.arc(eggX, eggY, eggR * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(eggX, eggY, eggR * 0.85, eggR, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(eggX - 12, eggY - 12, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Stars parallax
    ctx.save();
    for (const star of stars) {
      star.y += star.speed * dt;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.alpha * (0.8 + 0.2 * Math.sin(gameTime * 3 + star.x));
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.restore();
  }

  // Draw Player Spaceship
  public drawPlayer(player: PlayerState, gameTime: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(player.x, player.y);

    if (player.invulnerableTimer > 0) {
      if (Math.floor(gameTime * 20) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }
    }

    const flameFlicker = 0.8 + 0.4 * Math.sin(gameTime * 40);
    const flameLength = (player.vy < -10 ? 32 : 22) * flameFlicker;

    // Left Thruster
    const thrusterGrad = ctx.createLinearGradient(0, 20, 0, 20 + flameLength);
    thrusterGrad.addColorStop(0, '#67e8f9');
    thrusterGrad.addColorStop(0.3, '#3b82f6');
    thrusterGrad.addColorStop(0.8, '#ef4444');
    thrusterGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = thrusterGrad;

    ctx.beginPath();
    ctx.moveTo(-14, 20);
    ctx.lineTo(-10, 20 + flameLength);
    ctx.lineTo(-6, 20);
    ctx.fill();

    // Right Thruster
    ctx.beginPath();
    ctx.moveTo(6, 20);
    ctx.lineTo(10, 20 + flameLength);
    ctx.lineTo(14, 20);
    ctx.fill();

    // Central Booster
    ctx.beginPath();
    ctx.moveTo(-4, 22);
    ctx.lineTo(0, 22 + flameLength * 1.3);
    ctx.lineTo(4, 22);
    ctx.fill();

    // Wing Cannons with Weapon Glow
    const weaponGlow = WEAPON_DEFS[player.weaponType].glowColor;
    ctx.shadowColor = weaponGlow;
    ctx.shadowBlur = 12;
    ctx.fillStyle = WEAPON_DEFS[player.weaponType].color;
    ctx.fillRect(-22, -2, 4, 16);
    ctx.fillRect(18, -2, 4, 16);
    ctx.shadowBlur = 0;

    // Ship Hull
    const hullGrad = ctx.createLinearGradient(0, -32, 0, 24);
    hullGrad.addColorStop(0, '#f8fafc');
    hullGrad.addColorStop(0.6, '#cbd5e1');
    hullGrad.addColorStop(1, '#64748b');

    ctx.fillStyle = hullGrad;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(12, -8);
    ctx.lineTo(26, 12);
    ctx.lineTo(18, 22);
    ctx.lineTo(8, 18);
    ctx.lineTo(0, 24);
    ctx.lineTo(-8, 18);
    ctx.lineTo(-18, 22);
    ctx.lineTo(-26, 12);
    ctx.lineTo(-12, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Custom hull wing stripes
    ctx.fillStyle = player.shipColor || '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-20, 10);
    ctx.lineTo(-8, -2);
    ctx.lineTo(-6, 4);
    ctx.lineTo(-16, 16);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(20, 10);
    ctx.lineTo(8, -2);
    ctx.lineTo(6, 4);
    ctx.lineTo(16, 16);
    ctx.closePath();
    ctx.fill();

    // Cockpit Canopy
    const cockpitGrad = ctx.createLinearGradient(0, -18, 0, 4);
    cockpitGrad.addColorStop(0, '#a5f3fc');
    cockpitGrad.addColorStop(0.5, '#0284c7');
    cockpitGrad.addColorStop(1, '#082f49');

    ctx.fillStyle = cockpitGrad;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, -6, 6, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cockpit specular shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(-2, -10, 2, 6, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Overheat warning ring
    if (player.isOverheated && Math.floor(gameTime * 15) % 2 === 0) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw Enemies & Bosses
  public drawEnemy(enemy: Enemy, gameTime: number, playerX: number, playerY: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.angle);

    const wingCycle = Math.sin(gameTime * enemy.wingSpeed + enemy.wingPhase);

    if (enemy.type === 'boss') {
      this.drawDiverseBoss(ctx, enemy, gameTime);
      if (enemy.bossSkillState) {
        this.drawBossSkillOverlays(ctx, enemy, gameTime);
      }
    } else {
      switch (enemy.type) {
        case 'scout':
          this.drawClassicChicken(ctx, wingCycle, playerX - enemy.x, playerY - enemy.y);
          break;
        case 'dark_trooper':
          this.drawDarkTrooperChicken(ctx, wingCycle, playerX - enemy.x, playerY - enemy.y);
          break;
        case 'armored':
          this.drawArmoredChicken(ctx, wingCycle, playerX - enemy.x, playerY - enemy.y);
          break;
        case 'bomber':
          this.drawBomberChicken(ctx, wingCycle, playerX - enemy.x, playerY - enemy.y);
          break;
        case 'saucer':
          this.drawSaucerChicken(ctx, wingCycle, gameTime);
          break;
      }
    }

    // Health bar for tougher standard enemies (boss has its own prominent HUD bar)
    if (enemy.maxHp > 60 && enemy.hp < enemy.maxHp && enemy.type !== 'boss') {
      const barW = enemy.width;
      const barH = 5;
      const barY = -enemy.height / 2 - 10;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-barW / 2, barY, barW, barH);
      const ratio = Math.max(0, enemy.hp) / enemy.maxHp;
      ctx.fillStyle = ratio > 0.4 ? '#22c55e' : '#ef4444';
      ctx.fillRect(-barW / 2, barY, barW * ratio, barH);
    }

    ctx.restore();
  }

  // Draw Diverse Bosses based on bossAppearance
  private drawDiverseBoss(ctx: CanvasRenderingContext2D, boss: Enemy, gameTime: number) {
    const appearance: BossAppearance = boss.bossAppearance || 'emperor';
    const phase = boss.bossPhase || 1;

    switch (appearance) {
      case 'iron_rooster':
        this.drawIronRoosterBoss(ctx, boss, gameTime);
        break;
      case 'death_egg':
        this.drawDeathEggBoss(ctx, boss, gameTime);
        break;
      case 'hive_queen':
        this.drawHiveQueenBoss(ctx, boss, gameTime);
        break;
      case 'asteroid_golem':
        this.drawAsteroidGolemBoss(ctx, boss, gameTime);
        break;
      case 'sun_blocker':
        this.drawSunBlockerBoss(ctx, boss, gameTime);
        break;
      case 'saucer':
        this.drawDreadnoughtSaucerBoss(ctx, boss, gameTime);
        break;
      case 'emperor':
      default:
        this.drawDarkCluckEmperor(ctx, boss, gameTime);
        break;
    }
  }

  // Visual Overlays for Boss Skills (Shield, Laser Sweep, Warning Telegraphs, Rocket Dash)
  private drawBossSkillOverlays(ctx: CanvasRenderingContext2D, boss: Enemy, gameTime: number) {
    const skill = boss.bossSkillState;
    if (!skill) return;

    // 1. Reflective Forcefield Energy Shield
    if (skill.shieldActive) {
      ctx.save();
      const r = Math.max(boss.width, boss.height) * 0.72;
      const shieldPulse = 1 + Math.sin(gameTime * 12) * 0.05;

      // Hexagonal Outer Barrier
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3 + gameTime * 0.8;
        const hx = Math.cos(ang) * r * shieldPulse;
        const hy = Math.sin(ang) * r * shieldPulse;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();

      // Semi-transparent interior energy fill
      ctx.fillStyle = 'rgba(6, 182, 212, 0.16)';
      ctx.fill();

      // Rotating inner crystal rings
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Telegraph Warning Phase (Charging up before attack)
    if (skill.telegraphTimer > 0) {
      ctx.save();
      const flash = Math.sin(gameTime * 35) > 0 ? 1 : 0.3;

      if (skill.currentSkill === 'laser_sweep') {
        // Red warning targeting line
        const sweepAngle = skill.laserSweepAngle || 0;
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + flash * 0.5})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(0, 40);
        ctx.lineTo(Math.sin(sweepAngle) * 900, Math.cos(sweepAngle) * 900);
        ctx.stroke();
        ctx.setLineDash([]);

        // Muzzle charging plasma sphere
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#fee2e2';
        ctx.beginPath();
        ctx.arc(0, 40, 8 + Math.sin(gameTime * 20) * 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (skill.currentSkill === 'ramming_dash') {
        // Danger cone warning downwards
        ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + flash * 0.15})`;
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(-120, 600);
        ctx.lineTo(120, 600);
        ctx.closePath();
        ctx.fill();

        // Flashing Warning Reticle
        ctx.strokeStyle = `rgba(254, 240, 138, ${flash})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.stroke();
      } else if (skill.currentSkill === 'spiral_vortex') {
        // Spiral Vortex particle swirling indicator
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.5 + flash * 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const a = gameTime * 8 + (i * Math.PI * 2) / 3;
          ctx.arc(0, 0, 50 + i * 15, a, a + 1.2);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Active Orbital Laser Sweep Beam
    if (skill.currentSkill === 'laser_sweep' && skill.telegraphTimer <= 0) {
      ctx.save();
      const sweepAngle = skill.laserSweepAngle || 0;
      const beamLength = 1200;
      const endX = Math.sin(sweepAngle) * beamLength;
      const endY = Math.cos(sweepAngle) * beamLength;

      // Outer laser corona
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 28;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.moveTo(0, 35);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Inner white-hot laser core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(0, 35);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Active Ramming Dash Thruster Flames
    if (skill.currentSkill === 'ramming_dash' && skill.dashPhase === 'strike') {
      ctx.save();
      const flameH = 90 + Math.random() * 30;
      const flameGrad = ctx.createLinearGradient(0, -20, 0, -20 - flameH);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.3, '#f59e0b');
      flameGrad.addColorStop(0.8, '#ef4444');
      flameGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-35, -15);
      ctx.lineTo(0, -15 - flameH);
      ctx.lineTo(35, -15);
      ctx.fill();
      ctx.restore();
    }

    // 5. Retaliation Counter Stance ("Phản đòn / Bắn lại")
    if (skill.currentSkill === 'retaliation_burst') {
      ctx.save();
      const r = Math.max(boss.width, boss.height) * 0.68;
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 2.5;

      // Crackling spiked retaliation barrier
      ctx.beginPath();
      const spikes = 12;
      for (let s = 0; s < spikes; s++) {
        const ang = (s * Math.PI * 2) / spikes + gameTime * 2.5;
        const rad = r + (s % 2 === 0 ? 12 : -4) + Math.sin(gameTime * 25 + s) * 5;
        const sx = Math.cos(ang) * rad;
        const sy = Math.sin(ang) * rad;
        if (s === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.stroke();

      // Flashing core
      ctx.fillStyle = 'rgba(192, 132, 252, 0.18)';
      ctx.fill();
      ctx.restore();
    }

    // 6. Gravity Singularity Vortex
    if (skill.currentSkill === 'gravity_vortex') {
      ctx.save();
      const vAngle = skill.vortexAngle || (gameTime * 4);
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 20;

      for (let arm = 0; arm < 3; arm++) {
        const baseA = vAngle + (arm * Math.PI * 2) / 3;
        ctx.strokeStyle = arm === 0 ? '#a855f7' : arm === 1 ? '#06b6d4' : '#6366f1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let rad = 20; rad < 90; rad += 10) {
          const a = baseA + rad * 0.04;
          const gx = Math.cos(a) * rad;
          const gy = Math.sin(a) * rad;
          if (rad === 20) ctx.moveTo(gx, gy);
          else ctx.lineTo(gx, gy);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 1. Classic White Chicken
  private drawClassicChicken(
    ctx: CanvasRenderingContext2D,
    wingCycle: number,
    dxToPlayer: number,
    dyToPlayer: number
  ) {
    const wingYOffset = wingCycle * 6;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;

    // Left Wing
    ctx.beginPath();
    ctx.ellipse(-20, wingYOffset, 12, 7, -0.3 + wingCycle * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right Wing
    ctx.beginPath();
    ctx.ellipse(20, wingYOffset, 12, 7, 0.3 - wingCycle * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Body
    const bodyGrad = ctx.createRadialGradient(-3, -3, 3, 0, 2, 22);
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.7, '#f1f5f9');
    bodyGrad.addColorStop(1, '#cbd5e1');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 2, 18, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Red Comb
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(-5, -19, 4.5, 0, Math.PI * 2);
    ctx.arc(0, -22, 5.5, 0, Math.PI * 2);
    ctx.arc(5, -19, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Red Wattle
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(0, 9, 3.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Yellow Beak
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Googly Eyes
    const angleToPlayer = Math.atan2(dyToPlayer, dxToPlayer);
    const px = Math.cos(angleToPlayer) * 2;
    const py = Math.sin(angleToPlayer) * 2;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.arc(-7, -7, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-7 + px, -7 + py, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.arc(7, -7, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(7 + px, -7 + py, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Feet
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-9, 21, 5, 4);
    ctx.fillRect(4, 21, 5, 4);
  }

  // 2. Dark Cluck Trooper
  private drawDarkTrooperChicken(
    ctx: CanvasRenderingContext2D,
    wingCycle: number,
    dxToPlayer: number,
    dyToPlayer: number
  ) {
    const wingYOffset = wingCycle * 6;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(-22, wingYOffset, 14, 8, -0.4 + wingCycle * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(22, wingYOffset, 14, 8, 0.4 - wingCycle * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const bodyGrad = ctx.createRadialGradient(-3, -3, 3, 0, 2, 22);
    bodyGrad.addColorStop(0, '#334155');
    bodyGrad.addColorStop(0.7, '#1e293b');
    bodyGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 2, 20, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Vader Helmet
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-16, 2);
    ctx.lineTo(-20, -10);
    ctx.quadraticCurveTo(-14, -28, 0, -28);
    ctx.quadraticCurveTo(14, -28, 20, -10);
    ctx.lineTo(16, 2);
    ctx.quadraticCurveTo(0, -6, -16, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ventilator mask
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(-7, 10);
    ctx.lineTo(7, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing Red Eye Lenses
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.ellipse(-7, -9, 5, 3.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(7, -9, 5, 3.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Chest box
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-8, 14, 16, 8);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-6, 16, 3, 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-1, 16, 3, 4);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(4, 16, 3, 4);
  }

  // 3. Armored Chicken
  private drawArmoredChicken(
    ctx: CanvasRenderingContext2D,
    wingCycle: number,
    dxToPlayer: number,
    dyToPlayer: number
  ) {
    this.drawClassicChicken(ctx, wingCycle, dxToPlayer, dyToPlayer);
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -12, 16, Math.PI, 0);
    ctx.lineTo(16, -10);
    ctx.lineTo(10, -5);
    ctx.lineTo(5, -12);
    ctx.lineTo(0, -4);
    ctx.lineTo(-6, -11);
    ctx.lineTo(-11, -5);
    ctx.lineTo(-16, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 4. Bomber Chicken
  private drawBomberChicken(
    ctx: CanvasRenderingContext2D,
    wingCycle: number,
    dxToPlayer: number,
    dyToPlayer: number
  ) {
    const wingYOffset = wingCycle * 5;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.ellipse(-26, wingYOffset, 16, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(26, wingYOffset, 16, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const bodyGrad = ctx.createRadialGradient(-4, -4, 4, 0, 4, 28);
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.7, '#e2e8f0');
    bodyGrad.addColorStop(1, '#94a3b8');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 4, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(-8, -24, 6, 0, Math.PI * 2);
    ctx.arc(0, -28, 8, 0, Math.PI * 2);
    ctx.arc(8, -24, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-10, -8, 7, 0, Math.PI * 2);
    ctx.arc(10, -8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.arc(-9, -8, 3.5, 0, Math.PI * 2);
    ctx.arc(9, -8, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();

    // Large glowing egg
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 26, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // 5. Saucer Chicken (Minion / Mini-boss)
  private drawSaucerChicken(
    ctx: CanvasRenderingContext2D,
    wingCycle: number,
    gameTime: number
  ) {
    const domeGrad = ctx.createLinearGradient(0, -35, 0, 0);
    domeGrad.addColorStop(0, '#bae6fd');
    domeGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(0, -12, 28, Math.PI, 0);
    ctx.fill();

    ctx.save();
    ctx.scale(0.65, 0.65);
    ctx.translate(0, -26);
    this.drawDarkTrooperChicken(ctx, wingCycle, 0, 100);
    ctx.restore();

    const rimGrad = ctx.createLinearGradient(0, -10, 0, 30);
    rimGrad.addColorStop(0, '#64748b');
    rimGrad.addColorStop(0.5, '#1e293b');
    rimGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = rimGrad;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 8, 65, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const numLights = 10;
    for (let i = 0; i < numLights; i++) {
      const ang = (i / numLights) * Math.PI * 2 + gameTime * 3;
      const lx = Math.cos(ang) * 52;
      const ly = Math.sin(ang) * 16 + 8;
      const lightOn = Math.sin(ang * 2) > 0;

      ctx.fillStyle = lightOn ? '#ef4444' : '#38bdf8';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // --- 7 DIVERSE BOSS RENDERING METHODS ---

  // Boss 1: Dreadnought Command Saucer
  private drawDreadnoughtSaucerBoss(ctx: CanvasRenderingContext2D, boss: Enemy, gameTime: number) {
    const phase = boss.bossPhase || 1;
    const pulse = Math.sin(gameTime * 4);

    // Revolving plasma shields
    const shields = phase === 3 ? 6 : 4;
    for (let i = 0; i < shields; i++) {
      const ang = (i / shields) * Math.PI * 2 + gameTime * 2.5;
      const sx = Math.cos(ang) * 88;
      const sy = Math.sin(ang) * 44;
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 10, 6, ang, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Heavy Saucer Dome
    const domeGrad = ctx.createRadialGradient(-10, -25, 4, 0, -10, 50);
    domeGrad.addColorStop(0, '#e0f2fe');
    domeGrad.addColorStop(0.6, '#0284c7');
    domeGrad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(0, -15, 45, Math.PI, 0);
    ctx.fill();

    // Dark Emperor Pilot inside
    ctx.save();
    ctx.scale(0.85, 0.85);
    ctx.translate(0, -32);
    this.drawDarkTrooperChicken(ctx, Math.sin(gameTime * 6), 0, 100);
    ctx.restore();

    // Metallic Titanium Saucer Hull
    const hullGrad = ctx.createLinearGradient(0, -15, 0, 45);
    hullGrad.addColorStop(0, '#94a3b8');
    hullGrad.addColorStop(0.4, '#334155');
    hullGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = hullGrad;
    ctx.strokeStyle = phase === 3 ? '#ef4444' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 12, 92, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dual Heavy Egg Launch Cannons
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-55, 10, 14, 25);
    ctx.fillRect(41, 10, 14, 25);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-52, 32, 8, 5);
    ctx.fillRect(44, 32, 8, 5);
  }

  // Boss 2: The Mechanical Iron Rooster
  private drawIronRoosterBoss(ctx: CanvasRenderingContext2D, boss: Enemy, gameTime: number) {
    const flap = Math.sin(gameTime * 8) * 12;

    // Steam exhaust chimneys spitting smoke
    ctx.fillStyle = '#475569';
    ctx.fillRect(-45, -45, 12, 30);
    ctx.fillRect(33, -45, 12, 30);

    // Heavy Cybernetic Wings (Steel plates with rivet holes)
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2.5;

    // Left Wing
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.lineTo(-95, -20 + flap);
    ctx.lineTo(-110, 30 + flap);
    ctx.lineTo(-45, 45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Wing
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(95, -20 + flap);
    ctx.lineTo(110, 30 + flap);
    ctx.lineTo(45, 45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Steel Rooster Body
    const bodyGrad = ctx.createRadialGradient(-10, -5, 10, 0, 10, 65);
    bodyGrad.addColorStop(0, '#94a3b8');
    bodyGrad.addColorStop(0.7, '#475569');
    bodyGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 10, 55, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing orange energy furnace core
    const furnaceGrad = ctx.createRadialGradient(0, 22, 2, 0, 22, 20);
    furnaceGrad.addColorStop(0, '#fff7ed');
    furnaceGrad.addColorStop(0.4, '#f97316');
    furnaceGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = furnaceGrad;
    ctx.beginPath();
    ctx.arc(0, 22, 18, 0, Math.PI * 2);
    ctx.fill();

    // Titanium Comb (Sawblade teeth)
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-25, -50);
    ctx.lineTo(-30, -75);
    ctx.lineTo(-12, -65);
    ctx.lineTo(0, -80);
    ctx.lineTo(12, -65);
    ctx.lineTo(30, -75);
    ctx.lineTo(25, -50);
    ctx.closePath();
    ctx.fill();

    // Iron Beak
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(-14, -15);
    ctx.lineTo(14, -15);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dual Cybernetic Eyes (Laser sensors)
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-15, -26, 7, 0, Math.PI * 2);
    ctx.arc(15, -26, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Boss 3: The Death Egg Dreadnought
  private drawDeathEggBoss(ctx: CanvasRenderingContext2D, boss: Enemy, gameTime: number) {
    const pulse = Math.sin(gameTime * 3);

    // Orbital Solar Shield Panels rotating around the egg
    const panelCount = 6;
    for (let p = 0; p < panelCount; p++) {
      const ang = (p / panelCount) * Math.PI * 2 + gameTime * 1.5;
      const px = Math.cos(ang) * 98;
      const py = Math.sin(ang) * 45;
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.fillRect(px - 14, py - 8, 28, 16);
      ctx.strokeRect(px - 14, py - 8, 28, 16);
    }

    // Massive Armored Planetoid Egg
    const eggGrad = ctx.createRadialGradient(-15, -20, 10, 0, 0, 75);
    eggGrad.addColorStop(0, '#475569');
    eggGrad.addColorStop(0.5, '#1e293b');
    eggGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = eggGrad;
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 5, 68, 85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Equatorial Superweapon Trench
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 10, 68, 15, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Giant Red Superlaser Eye (Death Star dish)
    const dishGrad = ctx.createRadialGradient(-18, -25, 2, -18, -25, 24);
    dishGrad.addColorStop(0, '#ffffff');
    dishGrad.addColorStop(0.4, '#ef4444');
    dishGrad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = dishGrad;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(-18, -25, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Boss 4: Imperial Hive Queen
  private drawHiveQueenBoss(ctx: CanvasRenderingContext2D, boss: Enemy, gameTime: number) {
    const flap = Math.sin(gameTime * 7) * 8;

    // Royal Feather Mantle (Golden feathers)
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;

    // Wing Left
    ctx.beginPath();
    ctx.ellipse(-52, flap, 36, 18, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wing Right
    ctx.beginPath();
    ctx.ellipse(52, flap, 36, 18, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Massive Plump Queen Hen Body
    const queenGrad = ctx.createRadialGradient(-10, -5, 10, 0, 10, 65);
    queenGrad.addColorStop(0, '#ffffff');
    queenGrad.addColorStop(0.6, '#fef08a');
    queenGrad.addColorStop(1, '#ca8a04');
    ctx.fillStyle = queenGrad;
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 12, 58, 65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Golden Imperial Crown
    ctx.fillStyle = '#eab308';
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-28, -55);
    ctx.lineTo(-32, -80);
    ctx.lineTo(-14, -68);
    ctx.lineTo(0, -85);
    ctx.lineTo(14, -68);
    ctx.lineTo(32, -80);
    ctx.lineTo(28, -55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ruby Crown Jewels
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-16, -62, 4, 0, Math.PI * 2);
    ctx.arc(0, -66, 5, 0, Math.PI * 2);
    ctx.arc(16, -62, 4, 0, Math.PI * 2);
    ctx.fill();

    // Royal Beak & Eyes
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-12, -15);
    ctx.lineTo(12, -15);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-14, -26, 9, 0, Math.PI * 2);
    ctx.arc(14, -26, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#854d0e';
    ctx.beginPath();
    ctx.arc(-14, -26, 4, 0, Math.PI * 2);
    ctx.arc(14, -26, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Boss 5: Asteroid Cyber-Golem
  private drawAsteroidGolemBoss(ctx: CanvasRenderingContext2D, boss: Enemy, gameTime: number) {
    // Jagged Rocky Asteroid Shell with cybernetic machinery
    const rockGrad = ctx.createRadialGradient(-15, -15, 10, 0, 0, 75);
    rockGrad.addColorStop(0, '#64748b');
    rockGrad.addColorStop(0.6, '#334155');
    rockGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = rockGrad;
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(-65, -35);
    ctx.lineTo(-45, -70);
    ctx.lineTo(0, -75);
    ctx.lineTo(45, -65);
    ctx.lineTo(70, -30);
    ctx.lineTo(75, 25);
    ctx.lineTo(40, 70);
    ctx.lineTo(-30, 75);
    ctx.lineTo(-70, 35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cybernetic Chicken Faceplate embedded in rock
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -10, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing Cyan Visor
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 12;
    ctx.fillRect(-22, -18, 44, 8);
    ctx.shadowBlur = 0;

    // Twin Heavy Plasma Pods on left/right rock flanks
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-75, 0, 16, 35);
    ctx.fillRect(59, 0, 16, 35);
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(-72, 30, 10, 8);
    ctx.fillRect(62, 30, 10, 8);
  }

  // Boss 6: The Dark Cluck Emperor (Classic Cluck of the Dark Side)
  private drawDarkCluckEmperor(
    ctx: CanvasRenderingContext2D,
    boss: Enemy,
    gameTime: number
  ) {
    const phase = boss.bossPhase || 1;
    const pulse = Math.sin(gameTime * 5);

    // Rotating Darkness Solar Shield Satellites
    const shieldCount = phase === 1 ? 4 : (phase === 2 ? 6 : 8);
    for (let s = 0; s < shieldCount; s++) {
      const sAngle = (s / shieldCount) * Math.PI * 2 + gameTime * (phase === 3 ? 3.5 : 1.8);
      const sDist = 95 + pulse * 5;
      const sx = Math.cos(sAngle) * sDist;
      const sy = Math.sin(sAngle) * sDist * 0.7;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(sAngle + Math.PI / 2);

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = phase === 3 ? '#ef4444' : '#a855f7';
      ctx.lineWidth = 2;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(-16, -8);
      ctx.lineTo(16, -8);
      ctx.lineTo(22, 10);
      ctx.lineTo(0, 16);
      ctx.lineTo(-22, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Red Lightsaber Blade Wings
    const wingFlap = Math.sin(gameTime * 8) * 10;
    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(-45, 0);
    ctx.lineTo(-85, -25 + wingFlap);
    ctx.lineTo(-105, 20 + wingFlap);
    ctx.lineTo(-50, 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(45, 0);
    ctx.lineTo(85, -25 + wingFlap);
    ctx.lineTo(105, 20 + wingFlap);
    ctx.lineTo(50, 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Imperial Armor Body
    const bossGrad = ctx.createRadialGradient(-10, -10, 10, 0, 15, 75);
    bossGrad.addColorStop(0, '#1e293b');
    bossGrad.addColorStop(0.6, '#0f172a');
    bossGrad.addColorStop(1, '#020617');

    ctx.fillStyle = bossGrad;
    ctx.strokeStyle = phase === 3 ? '#ef4444' : '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 10, 52, 60, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Helmet & Crown
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-36, 0);
    ctx.lineTo(-44, -35);
    ctx.quadraticCurveTo(-25, -65, 0, -68);
    ctx.quadraticCurveTo(25, -65, 44, -35);
    ctx.lineTo(36, 0);
    ctx.quadraticCurveTo(0, -15, -36, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#eab308';
    ctx.strokeStyle = '#ca8a04';
    ctx.beginPath();
    ctx.moveTo(-20, -66);
    ctx.lineTo(-24, -80);
    ctx.lineTo(-10, -72);
    ctx.lineTo(0, -84);
    ctx.lineTo(10, -72);
    ctx.lineTo(24, -80);
    ctx.lineTo(20, -66);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing Red Visor
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.ellipse(0, -32, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Glowing Darkness Cannon Core
    const coreGrad = ctx.createRadialGradient(0, 25, 2, 0, 25, 24);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, phase === 3 ? '#ef4444' : '#a855f7');
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 25, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Boss 7: The Sun-Blocker Darkness Superweapon (Wave 100 Final Boss)
  private drawSunBlockerBoss(ctx: CanvasRenderingContext2D, boss: Enemy, gameTime: number) {
    const pulse = Math.sin(gameTime * 6);

    // Giant Corona of Eclipse Darkness
    const eclipseGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 140);
    eclipseGrad.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
    eclipseGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.25)');
    eclipseGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = eclipseGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 140, 0, Math.PI * 2);
    ctx.fill();

    // 8 Massive Solar Blocker Feather Wings
    for (let w = 0; w < 8; w++) {
      const ang = (w / 8) * Math.PI * 2 + gameTime * 0.8;
      const wx = Math.cos(ang) * (105 + pulse * 6);
      const wy = Math.sin(ang) * (105 + pulse * 6);

      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(ang + Math.PI / 2);
      ctx.fillStyle = '#020617';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.fillRect(-18, -12, 36, 24);
      ctx.strokeRect(-18, -12, 36, 24);
      ctx.restore();
    }

    // Colossal Central Battlestation Core
    const coreGrad = ctx.createRadialGradient(-20, -20, 10, 0, 0, 85);
    coreGrad.addColorStop(0, '#334155');
    coreGrad.addColorStop(0.5, '#0f172a');
    coreGrad.addColorStop(1, '#020617');
    ctx.fillStyle = coreGrad;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 78, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Emperor Helm on Top
    ctx.save();
    ctx.scale(1.1, 1.1);
    ctx.translate(0, -18);
    this.drawDarkTrooperChicken(ctx, 0, 0, 100);
    ctx.restore();

    // Central Apocalyptic Eye
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 22, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 22, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Draw Asteroids
  public drawAsteroid(ast: Asteroid) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(ast.x, ast.y);
    ctx.rotate(ast.rotation);

    const grad = ctx.createRadialGradient(-ast.radius * 0.3, -ast.radius * 0.3, 2, 0, 0, ast.radius);
    grad.addColorStop(0, '#64748b');
    grad.addColorStop(0.6, '#475569');
    grad.addColorStop(1, '#1e293b');

    ctx.fillStyle = grad;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    if (ast.points.length > 0) {
      ctx.moveTo(ast.points[0].x, ast.points[0].y);
      for (let i = 1; i < ast.points.length; i++) {
        ctx.lineTo(ast.points[i].x, ast.points[i].y);
      }
      ctx.closePath();
    } else {
      ctx.arc(0, 0, ast.radius, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();

    // Craters
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.beginPath();
    ctx.arc(-ast.radius * 0.2, -ast.radius * 0.2, ast.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ast.radius * 0.3, ast.radius * 0.3, ast.radius * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw Player Bullets (7 diverse weapons with stunning visual FX)
  public drawBullet(bullet: Bullet, gameTime: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(bullet.x, bullet.y);

    switch (bullet.weaponType) {
      case 'ion': {
        // Red glowing plasma bolt with trailing energy ember
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ff3b3b';
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, -2, 2, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'neutron': {
        // Neon green spherical pulse with bright core
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'vulcan': {
        // High speed orange kinetic tracer with dual flame tail
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#fdba74';
        ctx.fillRect(-2.5, -12, 5, 22);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -8, 2, 14);
        break;
      }

      case 'laser': {
        // Deep purple piercing beam
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(-3.5, -24, 7, 36);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1.5, -20, 3, 28);
        break;
      }

      case 'lightning': {
        // Tesla Chain Lightning: Crackling branching electric bolts!
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;

        // Draw dynamic lightning bolt with zig-zag offsets
        const seed = bullet.branchSeed || 1;
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(-4 + Math.sin(gameTime * 30 + seed) * 4, 5);
        ctx.lineTo(4 + Math.cos(gameTime * 25 + seed) * 4, -5);
        ctx.lineTo(0, -18);
        ctx.stroke();

        // White hot electric center
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Spark orb at tip
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -18, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'heavy_plasma': {
        // Slow-moving Supermassive Emerald Bio-Plasma Orb!
        const r = bullet.radius || 14;
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 18;

        // Outer pulsing corona
        const pulse = 1 + Math.sin(gameTime * 20) * 0.15;
        const orbGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r * pulse);
        orbGrad.addColorStop(0, '#ffffff');
        orbGrad.addColorStop(0.3, '#86efac');
        orbGrad.addColorStop(0.7, '#22c55e');
        orbGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Swirling plasma rings
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.85, r * 0.35, gameTime * 8, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'wave': {
        // Undulating Sinusoidal Wave Ribbons
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 12, 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'gatling': {
        // Hexa-Gatling Rotary Tracer: High velocity gold kinetic tracer
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.ellipse(0, 0, 3, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // White kinetic needle tip
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, -3, 1.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'cannon': {
        // Dreadnought Heavy Artillery Shell
        const r = bullet.radius || 15;
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 18;

        // Exhaust rocket fire
        const flameGrad = ctx.createLinearGradient(0, r * 0.4, 0, r * 1.8);
        flameGrad.addColorStop(0, '#ffffff');
        flameGrad.addColorStop(0.3, '#f97316');
        flameGrad.addColorStop(0.8, '#ef4444');
        flameGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, r * 0.3);
        ctx.lineTo(0, r * 1.8);
        ctx.lineTo(r * 0.5, r * 0.3);
        ctx.fill();

        // Armor-Piercing Warhead Body
        const shellGrad = ctx.createLinearGradient(-r, 0, r, 0);
        shellGrad.addColorStop(0, '#78350f');
        shellGrad.addColorStop(0.5, '#fbbf24');
        shellGrad.addColorStop(1, '#9a3412');
        ctx.fillStyle = shellGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // White-hot explosive cap
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -r * 0.3, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'ricochet': {
        // Bouncing Prism Flak Crystalline Shard
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;

        // Diamond Shard
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(0, -11);
        ctx.lineTo(7, 0);
        ctx.lineTo(0, 11);
        ctx.lineTo(-7, 0);
        ctx.closePath();
        ctx.fill();

        // Inner glowing facet
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(3.5, 0);
        ctx.lineTo(0, 6);
        ctx.lineTo(-3.5, 0);
        ctx.closePath();
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }

  // Draw Enemy Bullets / Eggs (High contrast, clearly visible with glowing aura and drop trails)
  public drawEnemyBullet(bullet: EnemyBullet) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(bullet.x, bullet.y);

    if (bullet.type === 'egg') {
      // CLEAR HIGH-CONTRAST CHICKEN EGG
      ctx.rotate(bullet.wobble || 0);

      // 1. High visibility outer warning glow aura
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;

      // 2. Clear golden-brown outline for extreme readability on dark space
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9.5, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Volumetric cream eggshell
      const eggGrad = ctx.createRadialGradient(-3, -4, 2, 0, 2, 12);
      eggGrad.addColorStop(0, '#ffffff');
      eggGrad.addColorStop(0.6, '#fef9c3');
      eggGrad.addColorStop(0.9, '#fde047');
      eggGrad.addColorStop(1, '#eab308');

      ctx.fillStyle = eggGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 11.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 4. Glossy specular shine arc
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(-3, -4, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (bullet.type === 'dark_laser') {
      // Dark side piercing red laser with bright glow
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.2, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (bullet.type === 'cluster_egg') {
      // Armored Heavy Cluster Egg Artillery
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 16;

      // Dark steel eggshell
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flashing internal explosive seams
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.stroke();

      // Blinking center danger core
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Purple feather blast orb
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  // Draw Drop Items (Drumsticks, Turkeys, Weapon Gifts, Missiles)
  public drawDropItem(item: DropItem) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rotation);

    switch (item.type) {
      case 'drumstick': {
        // Roasted Golden Chicken Drumstick 🍗
        const roastGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 12);
        roastGrad.addColorStop(0, '#fde047');
        roastGrad.addColorStop(0.5, '#d97706');
        roastGrad.addColorStop(1, '#92400e');

        ctx.fillStyle = roastGrad;
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.ellipse(-2, -2, 10, 8, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.fillRect(5, -2, 9, 4);

        ctx.beginPath();
        ctx.arc(14, -3, 3, 0, Math.PI * 2);
        ctx.arc(14, 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(-4, -4, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'turkey': {
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.ellipse(-8, -4, 6, 4, -0.4, 0, Math.PI * 2);
        ctx.ellipse(8, -4, 6, 4, 0.4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'burger': {
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(0, -2, 11, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-11, -2, 22, 3);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-10, 1, 20, 4);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-10, 5, 20, 3);
        break;
      }

      case 'gift': {
        // Weapon Upgrade Present Box 🎁
        const giftColor = item.weaponGiftType ? WEAPON_DEFS[item.weaponGiftType].color : '#ef4444';
        const boxGrad = ctx.createLinearGradient(-12, -12, 12, 12);
        boxGrad.addColorStop(0, giftColor);
        boxGrad.addColorStop(1, '#0f172a');

        ctx.fillStyle = boxGrad;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-12, -12, 24, 24);
        ctx.strokeRect(-12, -12, 24, 24);

        ctx.fillStyle = '#facc15';
        ctx.fillRect(-3, -12, 6, 24);
        ctx.fillRect(-12, -3, 24, 6);

        ctx.beginPath();
        ctx.arc(-4, -14, 4, 0, Math.PI * 2);
        ctx.arc(4, -14, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'missile_crate': {
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(6, -4);
        ctx.lineTo(6, 10);
        ctx.lineTo(-6, 10);
        ctx.lineTo(-6, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-10, 6, 20, 4);
        break;
      }

      case 'cooling_cell': {
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.fillRect(-6, -10, 12, 20);
        ctx.strokeRect(-6, -10, 12, 20);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }

  // Draw Particles
  public drawParticle(p: Particle) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x, p.y);

    if (p.shape === 'feather') {
      ctx.rotate(p.rotation || 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.4, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(0, p.size);
      ctx.stroke();
    } else if (p.shape === 'yolk') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw Floating Text
  public drawFloatingText(t: FloatingText) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = t.alpha;
    if (ctx.font !== 'bold 15px sans-serif') {
      ctx.font = 'bold 15px sans-serif';
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = t.color;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  }

  // Draw Megabomb Shockwave
  public drawShockwave(sw: MegabombShockwave) {
    if (!sw.active) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = sw.alpha;

    const shockGrad = ctx.createRadialGradient(sw.x, sw.y, sw.radius * 0.7, sw.x, sw.y, sw.radius);
    shockGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    shockGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.4)');
    shockGrad.addColorStop(0.9, 'rgba(251, 191, 36, 0.8)');
    shockGrad.addColorStop(1, 'rgba(255, 255, 255, 1)');

    ctx.fillStyle = shockGrad;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();
  }
}
