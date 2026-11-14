export type WeaponType = 
  | 'ion'           // Classic Red Ion Blaster (spread)
  | 'neutron'       // Rapid Green Neutron Stream
  | 'vulcan'        // Heavy Orange Kinetic Chaingun
  | 'laser'         // Piercing Purple Laser Beam
  | 'lightning'     // Branching Cyan Tesla Lightning
  | 'heavy_plasma'  // Slow, high-impact Emerald Plasma Cannon
  | 'wave'          // Undulating Sinusoidal Wave Blaster
  | 'gatling'       // 6-Barreled Rotary Gatling Minigun
  | 'cannon'        // Heavy Dreadnought Siege Artillery Cannon
  | 'ricochet';     // Bouncing Kinetic Flak Blaster

export interface WeaponDef {
  type: WeaponType;
  name: string;
  color: string;
  glowColor: string;
  cooldownMs: number;
  baseDamage: number;
  heatPerShot: number;
  coolingRate: number;
  description: string;
}

export type BossAppearance = 
  | 'saucer'           // Dreadnought Saucer
  | 'emperor'          // Dark Cluck Emperor (Darth Vader)
  | 'iron_rooster'     // Cybernetic Iron Mech Rooster
  | 'death_egg'        // Giant Dark Death Egg Battlestation
  | 'hive_queen'       // Imperial Hive Queen Hen
  | 'asteroid_golem'   // Asteroid Cyber Golem
  | 'sun_blocker';     // The Ultimate Darkness Machine (Wave 100)

export type BossSkillType =
  | 'none'
  | 'spiral_vortex'
  | 'cluster_bomb'
  | 'laser_sweep'
  | 'ramming_dash'
  | 'energy_shield'
  | 'summon_minions'
  | 'feather_nova'
  | 'meteor_rain'
  | 'retaliation_burst'
  | 'gravity_vortex';

export interface BossSkillState {
  currentSkill: BossSkillType;
  skillTimer: number;        // Countdown to next skill trigger
  skillDuration: number;     // Remaining active duration
  telegraphTimer: number;    // Visual warning / charging timer
  shieldActive: boolean;     // Active energy shield
  dashPhase?: 'idle' | 'charge' | 'strike' | 'recover';
  laserSweepAngle?: number;  // Current laser sweep angle
  spiralAngle?: number;      // Spinning angle for spiral hell
  targetDashX?: number;
  targetDashY?: number;
  homeX?: number;
  homeY?: number;
  retaliationActive?: boolean; // Retaliatory counter-attack stance (bắn lại)
  retaliationCooldown?: number;
  meteorCount?: number;
  vortexAngle?: number;
  lastSkill?: BossSkillType;
}

export type EnemyType = 
  | 'scout'          // Regular white chicken
  | 'dark_trooper'   // Darth Vader helmet cluck
  | 'armored'        // Cracked helmet cluck
  | 'bomber'         // Big egg layer
  | 'saucer'         // Flying saucer chicken
  | 'boss';          // Boss chicken

export interface PlayerState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  lives: number;
  missiles: number;
  weaponType: WeaponType;
  weaponPower: number; // 1 to 10
  heat: number;        // 0 to 100
  isOverheated: boolean;
  overheatCooldownTimer: number;
  invulnerableTimer: number;
  score: number;
  highScore: number;
  roastMeter: number;  // 0 to 50, fills from drumsticks
  roastTotal: number;
  combo: number;
  comboTimer: number;
  shipColor: string;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  weaponType: WeaponType;
  color: string;
  radius: number;
  piercing?: boolean;
  wavePhase?: number;    // For sinusoidal wave bullets
  waveFreq?: number;
  waveAmp?: number;
  startX?: number;
  branchSeed?: number;   // For lightning branching
  heavySplash?: boolean; // For heavy plasma
  isCannon?: boolean;    // Heavy artillery shell
  isGatling?: boolean;   // 6-barrel rotary tracer
  bouncesLeft?: number;  // For ricochet bouncing flak
  maxBounces?: number;
  bornTime?: number;
}

export interface EnemyBullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'egg' | 'dark_laser' | 'feather_blast' | 'plasma_bomb' | 'cluster_egg';
  radius: number;
  wobble?: number;
  trailHistory?: { x: number; y: number }[];
  isCluster?: boolean;
  splitTimer?: number;
}

export interface Enemy {
  id: number;
  type: EnemyType;
  bossAppearance?: BossAppearance;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  shootCooldown: number;
  wingPhase: number;
  wingSpeed: number;
  patternType: 'grid' | 'swoop' | 'hover' | 'dive' | 'boss';
  phaseTimer: number;
  angle: number;
  scoreValue: number;
  shield?: number;
  shieldMax?: number;
  bossPhase?: number; // 1, 2, 3
  bossSkillState?: BossSkillState;
}

export interface Asteroid {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  rotation: number;
  rotationSpeed: number;
  points: { x: number; y: number }[];
}

export interface DropItem {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'drumstick' | 'turkey' | 'burger' | 'gift' | 'missile_crate' | 'cooling_cell';
  weaponGiftType?: WeaponType;
  value: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'feather' | 'spark' | 'smoke' | 'yolk' | 'lightning';
  rotation?: number;
  rotationSpeed?: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  life: number;
}

export interface MegabombShockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  active: boolean;
}

export type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

export interface GameStats {
  score: number;
  highScore: number;
  waveReached: number;
  chickensDefeated: number;
  roastCollected: number;
  missilesFired: number;
  accuracy: number;
  shotsFired: number;
  shotsHit: number;
  gameTimeSeconds: number;
}
