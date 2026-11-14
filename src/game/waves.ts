import { Enemy, Asteroid, EnemyType, BossAppearance } from './types';

export interface WaveInfo {
  number: number;
  title: string;
  subtitle: string;
  isBossWave: boolean;
  bossAppearance?: BossAppearance;
}

const BOSS_APPEARANCES: BossAppearance[] = [
  'saucer',         // Wave 5
  'iron_rooster',   // Wave 10
  'death_egg',      // Wave 15
  'hive_queen',     // Wave 20
  'asteroid_golem', // Wave 25
  'emperor',        // Wave 30
  'saucer',         // Wave 35
  'iron_rooster',   // Wave 40
  'death_egg',      // Wave 45
  'hive_queen',     // Wave 50
  'asteroid_golem', // Wave 55
  'emperor',        // Wave 60
  'saucer',         // Wave 65
  'iron_rooster',   // Wave 70
  'death_egg',      // Wave 75
  'hive_queen',     // Wave 80
  'asteroid_golem', // Wave 85
  'emperor',        // Wave 90
  'emperor',        // Wave 95
  'sun_blocker'     // Wave 100
];

const BOSS_TITLES: { title: string; subtitle: string }[] = [
  { title: "BOSS: DREADNOUGHT SAUCER", subtitle: "Defeat the orbiting command saucer before it deploys reinforcements!" },
  { title: "BOSS: MECHANICAL IRON ROOSTER", subtitle: "Heavy cybernetic assault rooster armed with twin egg rocket pods!" },
  { title: "BOSS: THE DEATH EGG DREADNOUGHT", subtitle: "A massive planetoid egg battlestation equipped with dark solar shields!" },
  { title: "BOSS: IMPERIAL HIVE QUEEN", subtitle: "Supreme matriarch of the flock with rapid golden egg barrages!" },
  { title: "BOSS: ASTEROID CYBER-GOLEM", subtitle: "Hollowed-out asteroid fitted with cybernetic thrusters and plasma cannons!" },
  { title: "BOSS: THE DARK CLUCK EMPEROR", subtitle: "Supreme commander of the Dark Side with red plasma saber wings!" },
  { title: "BOSS: SAUCER FLEET ADMIRAL", subtitle: "Elite high-velocity flagship with tractor beams and rotating turrets!" },
  { title: "BOSS: CYBER ROOSTER MARK II", subtitle: "Overclocked steel rooster firing rapid explosive egg cluster rockets!" },
  { title: "BOSS: ORBITAL DEATH EGG TITAN", subtitle: "Dual-ring planetary siege egg blotting out solar radiation!" },
  { title: "BOSS: ASCENDED HIVE QUEEN", subtitle: "Enraged queen hen raining down dense salvos of dark plasma eggs!" },
  { title: "BOSS: TITANIUM ASTEROID COLOSSUS", subtitle: "Armored space rock juggernaut with magnetic defense barriers!" },
  { title: "BOSS: EMPEROR CLUCK: WRATH FORM", subtitle: "The Emperor harnesses pure dark energy with lightning arcs!" },
  { title: "BOSS: MOTHERSHIP CARRIER SAUCER", subtitle: "Massive mothership launching continuous waves of scout drones!" },
  { title: "BOSS: APOCALYPTIC IRON GIGA-ROOSTER", subtitle: "Armored titan equipped with four missile batteries and laser eyes!" },
  { title: "BOSS: ECLIPSE DEATH EGG FORTRESS", subtitle: "Heavy battle fortress constructing the solar shield in deep space!" },
  { title: "BOSS: QUEEN MOTHER OF THE DARK FLOCK", subtitle: "Ancient matriarch unleashing multi-directional egg storms!" },
  { title: "BOSS: METEORIC ANNIHILATOR GOLEM", subtitle: "Superheated asteroid core blasting high-density fireballs!" },
  { title: "BOSS: SUPREME EMPEROR CLUCK", subtitle: "Wielding twin dark side blades and continuous dark energy beams!" },
  { title: "BOSS: THE EMPEROR'S SHADOW AVATAR", subtitle: "Invincible vanguard protecting the central solar blocker machine!" },
  { title: "FINAL BOSS: THE SUN-BLOCKER DARKNESS SUPERWEAPON", subtitle: "Save Earth from permanent cosmic darkness in this ultimate galactic showdown!" }
];

const NORMAL_WAVE_SUBTITLES: string[] = [
  "Scouts in sweeping sinusoidal paths",
  "Clear a safe corridor through dense asteroid belts",
  "Troopers of the Dark Side in military formation",
  "Heavy bombers dropping barrages of falling eggs",
  "High speed sine wave interceptor squadrons",
  "Armored chickens holding hardened defense shells",
  "Elite dive-bombers swooping toward the surface",
  "Mixed armada of troopers and bombers",
  "Cascading wedge formations with rapid flanking",
  "Circular flock formation rotating around the sector",
  "High-velocity asteroid storm with evasive escorts",
  "Imperial Honor Guard with high damage plasma eggs",
  "Spreading V-formation with escort drones",
  "Staggered zig-zag weavers advancing steadily"
];

export function getWaveInfo(waveNum: number): WaveInfo {
  const isBoss = waveNum % 5 === 0;

  if (isBoss) {
    const bossIdx = Math.min(Math.floor(waveNum / 5) - 1, BOSS_TITLES.length - 1);
    const bossInfo = BOSS_TITLES[bossIdx];
    const bossApp = BOSS_APPEARANCES[bossIdx] || 'emperor';
    return {
      number: waveNum,
      title: `${bossInfo.title} (WAVE ${waveNum}/100)`,
      subtitle: bossInfo.subtitle,
      isBossWave: true,
      bossAppearance: bossApp
    };
  }

  const subIdx = (waveNum * 7) % NORMAL_WAVE_SUBTITLES.length;
  const isAsteroidWave = waveNum % 10 === 2 || waveNum % 10 === 7;

  return {
    number: waveNum,
    title: isAsteroidWave 
      ? `Asteroid Field Traverse (Wave ${waveNum}/100)` 
      : `Galactic Cluck Incursion (Wave ${waveNum}/100)`,
    subtitle: NORMAL_WAVE_SUBTITLES[subIdx],
    isBossWave: false
  };
}

/**
 * Generates enemies and obstacles for any wave from 1 to 100.
 */
export function spawnWaveEnemies(
  waveNum: number,
  canvasWidth: number,
  canvasHeight: number
): { enemies: Enemy[]; asteroids: Asteroid[] } {
  const enemies: Enemy[] = [];
  const asteroids: Asteroid[] = [];
  let nextId = 1;

  // Progressive difficulty scaling across 100 waves
  const waveProgress = (waveNum - 1) / 100;
  const hpMultiplier = 1 + waveProgress * 2.2;
  const isBossWave = waveNum % 5 === 0;

  if (isBossWave) {
    // BOSS WAVE (Every 5 waves): Boss HP is DOUBLED (máu trâu gấp 2 lần) as requested!
    const bossIdx = Math.min(Math.floor(waveNum / 5) - 1, BOSS_APPEARANCES.length - 1);
    const appearance = BOSS_APPEARANCES[bossIdx];

    // Base Boss HP doubled: Wave 5 starts at 2800 HP (was 1400), scaling up to 26000 HP for Wave 100
    const baseBossHp = Math.round((2800 + (waveNum / 5 - 1) * 1250) * 2 * (1 + waveProgress * 0.5));
    const baseShield = Math.round((800 + (waveNum / 5 - 1) * 350) * 2);

    enemies.push({
      id: nextId++,
      type: 'boss',
      bossAppearance: appearance,
      x: canvasWidth / 2,
      y: -180,
      targetX: canvasWidth / 2,
      targetY: 155,
      vx: 0,
      vy: 0,
      width: appearance === 'sun_blocker' ? 220 : (appearance === 'death_egg' ? 190 : 165),
      height: appearance === 'sun_blocker' ? 190 : (appearance === 'death_egg' ? 175 : 155),
      hp: baseBossHp,
      maxHp: baseBossHp,
      shootCooldown: Math.max(0.4, 1.0 - waveProgress * 0.4),
      wingPhase: 0,
      wingSpeed: 6,
      patternType: 'boss',
      phaseTimer: 0,
      angle: 0,
      scoreValue: 5000 + waveNum * 250,
      shield: baseShield,
      shieldMax: baseShield,
      bossPhase: 1
    });

    // Boss Wingmen / Escorts (2 to 6 escorts)
    const escortCount = Math.min(2 + Math.floor(waveNum / 20) * 2, 6);
    for (let w = 0; w < escortCount; w++) {
      const isLeft = w % 2 === 0;
      const xOffset = isLeft ? -180 - (w * 35) : 180 + (w * 35);
      enemies.push({
        id: nextId++,
        type: waveNum > 40 ? 'dark_trooper' : 'armored',
        x: canvasWidth / 2 + xOffset,
        y: -100 - w * 35,
        targetX: canvasWidth / 2 + xOffset,
        targetY: 160 + (w % 2) * 45,
        vx: 0,
        vy: 0,
        width: 48,
        height: 48,
        hp: Math.round(90 * hpMultiplier),
        maxHp: Math.round(90 * hpMultiplier),
        shootCooldown: 1.5 + Math.random() * 2,
        wingPhase: 0,
        wingSpeed: 8,
        patternType: 'hover',
        phaseTimer: w * 0.3,
        angle: 0,
        scoreValue: 350
      });
    }

    return { enemies, asteroids };
  }

  // NON-BOSS WAVES: High variety across 100 waves
  const wavePattern = waveNum % 8;

  switch (wavePattern) {
    case 1: {
      // Classic 3-4 rows of Scouts / Troopers in centered grid
      const rows = waveNum > 30 ? 4 : 3;
      const cols = waveNum > 50 ? 8 : 7;
      const gridWidth = Math.min(canvasWidth * 0.74, 680);
      const startX = (canvasWidth - gridWidth) / 2;
      const spacingX = gridWidth / (cols - 1);
      const startY = 135;
      const spacingY = 58;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const isDark = (r + c + waveNum) % 3 === 0;
          const targetX = startX + c * spacingX;
          const targetY = startY + r * spacingY;
          enemies.push({
            id: nextId++,
            type: isDark ? 'dark_trooper' : 'scout',
            x: targetX + (c % 2 === 0 ? -200 : 200),
            y: -70 - r * 50,
            targetX,
            targetY,
            vx: 0,
            vy: 0,
            width: isDark ? 48 : 44,
            height: isDark ? 48 : 44,
            hp: Math.round((isDark ? 65 : 35) * hpMultiplier),
            maxHp: Math.round((isDark ? 65 : 35) * hpMultiplier),
            shootCooldown: 1.5 + Math.random() * 2.5,
            wingPhase: Math.random() * Math.PI * 2,
            wingSpeed: 10,
            patternType: 'grid',
            phaseTimer: c * 0.1,
            angle: 0,
            scoreValue: isDark ? 250 : 100
          });
        }
      }
      break;
    }

    case 2: {
      // Asteroid Field + Interceptors
      const asteroidCount = 14 + Math.min(Math.floor(waveNum / 6), 12);
      for (let i = 0; i < asteroidCount; i++) {
        const radius = 24 + Math.random() * 26;
        const pts: { x: number; y: number }[] = [];
        const numPts = 8 + Math.floor(Math.random() * 5);
        for (let p = 0; p < numPts; p++) {
          const ang = (p / numPts) * Math.PI * 2;
          const dist = radius * (0.75 + Math.random() * 0.4);
          pts.push({ x: Math.cos(ang) * dist, y: Math.sin(ang) * dist });
        }

        asteroids.push({
          id: nextId++,
          x: Math.random() * (canvasWidth - 100) + 50,
          y: -100 - i * 130,
          vx: (Math.random() - 0.5) * 70,
          vy: 85 + Math.random() * 75,
          radius,
          hp: Math.round(radius * 1.5 * hpMultiplier),
          maxHp: Math.round(radius * 1.5 * hpMultiplier),
          rotation: Math.random() * Math.PI,
          rotationSpeed: (Math.random() - 0.5) * 1.5,
          points: pts
        });
      }

      // A few armored chickens flying in asteroid dust
      for (let s = 0; s < 6; s++) {
        enemies.push({
          id: nextId++,
          type: 'armored',
          x: canvasWidth * 0.2 + s * (canvasWidth * 0.6 / 5),
          y: -120 - s * 50,
          targetX: canvasWidth * 0.2 + s * (canvasWidth * 0.6 / 5),
          targetY: 140,
          vx: 0,
          vy: 0,
          width: 44,
          height: 44,
          hp: Math.round(50 * hpMultiplier),
          maxHp: Math.round(50 * hpMultiplier),
          shootCooldown: 2 + Math.random() * 2,
          wingPhase: s,
          wingSpeed: 10,
          patternType: 'grid',
          phaseTimer: s * 0.2,
          angle: 0,
          scoreValue: 150
        });
      }
      break;
    }

    case 3: {
      // Heavy Egg Bombers with Escort Wings
      const bomberCount = 4 + (waveNum > 40 ? 2 : 0);
      const gridWidth = Math.min(canvasWidth * 0.72, 640);
      const startX = (canvasWidth - gridWidth) / 2;
      const spacingX = gridWidth / (bomberCount - 1);

      for (let b = 0; b < bomberCount; b++) {
        const targetX = startX + b * spacingX;
        enemies.push({
          id: nextId++,
          type: 'bomber',
          x: targetX,
          y: -100 - b * 50,
          targetX,
          targetY: 135,
          vx: 0,
          vy: 0,
          width: 58,
          height: 56,
          hp: Math.round(160 * hpMultiplier),
          maxHp: Math.round(160 * hpMultiplier),
          shootCooldown: 1.5 + Math.random() * 1.8,
          wingPhase: Math.random() * Math.PI,
          wingSpeed: 7,
          patternType: 'hover',
          phaseTimer: b * 0.4,
          angle: 0,
          scoreValue: 400
        });
      }

      // Escort row below bombers
      const escortCount = bomberCount * 2;
      const escortSpacing = gridWidth / (escortCount - 1);
      for (let s = 0; s < escortCount; s++) {
        enemies.push({
          id: nextId++,
          type: 'armored',
          x: startX + s * escortSpacing,
          y: -140 - s * 25,
          targetX: startX + s * escortSpacing,
          targetY: 205,
          vx: 0,
          vy: 0,
          width: 44,
          height: 44,
          hp: Math.round(55 * hpMultiplier),
          maxHp: Math.round(55 * hpMultiplier),
          shootCooldown: 1.8 + Math.random() * 2.2,
          wingPhase: Math.random() * Math.PI,
          wingSpeed: 10,
          patternType: 'grid',
          phaseTimer: s * 0.2,
          angle: 0,
          scoreValue: 180
        });
      }
      break;
    }

    case 4: {
      // Rapid Sine-Wave Weavers (fast swooping dive squadrons)
      const count = 16 + (waveNum > 50 ? 6 : 0);
      for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        enemies.push({
          id: nextId++,
          type: i % 3 === 0 ? 'dark_trooper' : 'scout',
          x: canvasWidth / 2 + side * (canvasWidth * 0.45),
          y: -80 - i * 55,
          targetX: canvasWidth / 2,
          targetY: 130 + (i % 5) * 55,
          vx: 0,
          vy: 0,
          width: 44,
          height: 44,
          hp: Math.round(45 * hpMultiplier),
          maxHp: Math.round(45 * hpMultiplier),
          shootCooldown: 1.2 + Math.random() * 2,
          wingPhase: i,
          wingSpeed: 14,
          patternType: 'swoop',
          phaseTimer: i * 0.35,
          angle: 0,
          scoreValue: 160
        });
      }
      break;
    }

    case 5: {
      // V-Formation / Arrowhead Squadron
      const total = 17;
      const apexX = canvasWidth / 2;
      const apexY = 135;
      for (let i = 0; i < total; i++) {
        const arm = i % 2 === 0 ? -1 : 1;
        const step = Math.floor((i + 1) / 2);
        const targetX = apexX + arm * step * (canvasWidth * 0.052);
        const targetY = apexY + step * 38;

        enemies.push({
          id: nextId++,
          type: step <= 2 ? 'dark_trooper' : 'armored',
          x: targetX,
          y: -90 - i * 35,
          targetX,
          targetY,
          vx: 0,
          vy: 0,
          width: 46,
          height: 46,
          hp: Math.round((step <= 2 ? 80 : 55) * hpMultiplier),
          maxHp: Math.round((step <= 2 ? 80 : 55) * hpMultiplier),
          shootCooldown: 1.4 + Math.random() * 2,
          wingPhase: i * 0.4,
          wingSpeed: 9,
          patternType: 'grid',
          phaseTimer: i * 0.1,
          angle: 0,
          scoreValue: 220
        });
      }
      break;
    }

    case 6: {
      // Dive-bomber Infiltration (Imperial Honor Guard)
      const count = 16;
      const cols = 8;
      const gridWidth = Math.min(canvasWidth * 0.74, 680);
      const startX = (canvasWidth - gridWidth) / 2;
      const spacingX = gridWidth / (cols - 1);

      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const targetX = startX + col * spacingX;
        const targetY = 135 + row * 75;

        enemies.push({
          id: nextId++,
          type: 'dark_trooper',
          x: targetX,
          y: -100 - row * 70,
          targetX,
          targetY,
          vx: 0,
          vy: 0,
          width: 48,
          height: 48,
          hp: Math.round(90 * hpMultiplier),
          maxHp: Math.round(90 * hpMultiplier),
          shootCooldown: 0.9 + Math.random() * 1.8,
          wingPhase: i * 0.2,
          wingSpeed: 12,
          patternType: 'dive',
          phaseTimer: i * 0.35,
          angle: 0,
          scoreValue: 280
        });
      }
      break;
    }

    case 7: {
      // Circular Defense Ring
      const ringCount = 14 + (waveNum > 40 ? 4 : 0);
      const ringRadius = Math.min(canvasWidth * 0.28, 220);
      const centerX = canvasWidth / 2;
      const centerY = 190;

      for (let i = 0; i < ringCount; i++) {
        const angle = (i / ringCount) * Math.PI * 2;
        const targetX = centerX + Math.cos(angle) * ringRadius;
        const targetY = centerY + Math.sin(angle) * (ringRadius * 0.55);

        enemies.push({
          id: nextId++,
          type: i % 2 === 0 ? 'dark_trooper' : 'bomber',
          x: targetX,
          y: -80 - i * 30,
          targetX,
          targetY,
          vx: 0,
          vy: 0,
          width: 48,
          height: 48,
          hp: Math.round(85 * hpMultiplier),
          maxHp: Math.round(85 * hpMultiplier),
          shootCooldown: 1.2 + Math.random() * 2,
          wingPhase: i * 0.3,
          wingSpeed: 9,
          patternType: 'hover',
          phaseTimer: i * 0.2,
          angle: 0,
          scoreValue: 260
        });
      }
      break;
    }

    default: {
      // Mixed Armada
      const count = 18;
      const cols = 6;
      const gridWidth = Math.min(canvasWidth * 0.72, 640);
      const startX = (canvasWidth - gridWidth) / 2;
      const spacingX = gridWidth / (cols - 1);

      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const targetX = startX + col * spacingX;
        const targetY = 135 + row * 62;
        const isBomber = row === 0 && (col === 2 || col === 3);

        enemies.push({
          id: nextId++,
          type: isBomber ? 'bomber' : 'dark_trooper',
          x: targetX,
          y: -80 - row * 60 - col * 15,
          targetX,
          targetY,
          vx: 0,
          vy: 0,
          width: isBomber ? 58 : 48,
          height: isBomber ? 56 : 48,
          hp: Math.round((isBomber ? 170 : 75) * hpMultiplier),
          maxHp: Math.round((isBomber ? 170 : 75) * hpMultiplier),
          shootCooldown: 1.0 + Math.random() * 2,
          wingPhase: i * 0.3,
          wingSpeed: 9,
          patternType: 'hover',
          phaseTimer: i * 0.15,
          angle: 0,
          scoreValue: isBomber ? 420 : 250
        });
      }
      break;
    }
  }

  return { enemies, asteroids };
}
