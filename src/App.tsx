import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameState,
  PlayerState,
  Enemy,
  Bullet,
  EnemyBullet,
  Asteroid,
  DropItem,
  Particle,
  FloatingText,
  MegabombShockwave,
  GameStats,
  WeaponType,
  BossSkillType
} from './game/types';
import {
  checkCircleCollision,
  calculateDamage,
  getBulletPattern,
  accumulateHeat,
  coolDownHeat,
  addFoodToRoastMeter,
  applyDrumstickLifeBonus,
  calculateScoreWithCombo,
  determineBossPhase,
  BOSS_SKILL_COOLDOWN_SECONDS,
  tickBossSkillCycleTimer,
  pickNextBossSkill,
  handleBulletRicochet,
  WEAPON_GIFT_DROP_CHANCE,
  WEAPON_DEFS
} from './game/rules';
import { soundManager } from './game/audio';
import { GameRenderer, Star, createStars } from './game/renderer';
import { spawnWaveEnemies, getWaveInfo } from './game/waves';
import { HUD } from './components/HUD';
import { TitleScreen } from './components/TitleScreen';
import { PauseModal, GameOverModal, VictoryModal } from './components/Modals';

const INITIAL_PLAYER: PlayerState = {
  x: 400,
  y: 650,
  targetX: 400,
  targetY: 650,
  vx: 0,
  vy: 0,
  width: 52,
  height: 52,
  lives: 3,
  missiles: 3,
  weaponType: 'ion',
  weaponPower: 1,
  heat: 0,
  isOverheated: false,
  overheatCooldownTimer: 0,
  invulnerableTimer: 2,
  score: 0,
  highScore: 0,
  roastMeter: 0,
  roastTotal: 0,
  combo: 0,
  comboTimer: 0,
  shipColor: '#ef4444'
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Discrete UI State for React
  const [gameState, setGameState] = useState<GameState>('title');
  const [hudPlayer, setHudPlayer] = useState<PlayerState>(INITIAL_PLAYER);
  const [currentWave, setCurrentWave] = useState(1);
  const [waveTitle, setWaveTitle] = useState("First Contact: Scout Flock");
  const [waveAnnouncement, setWaveAnnouncement] = useState<string | null>(null);
  const [activeBoss, setActiveBoss] = useState<Enemy | null>(null);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);
  const [endStats, setEndStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    waveReached: 1,
    chickensDefeated: 0,
    roastCollected: 0,
    missilesFired: 0,
    accuracy: 0,
    shotsFired: 0,
    shotsHit: 0,
    gameTimeSeconds: 0
  });

  // Mutable Game Loop State in Refs (Decoupled from React 60 FPS)
  const stateRef = useRef<{
    gameState: GameState;
    player: PlayerState;
    enemies: Enemy[];
    asteroids: Asteroid[];
    bullets: Bullet[];
    enemyBullets: EnemyBullet[];
    drops: DropItem[];
    particles: Particle[];
    floatingTexts: FloatingText[];
    shockwave: MegabombShockwave;
    stars: Star[];
    wave: number;
    waveTransitionTimer: number;
    waveAnnounceText: string | null;
    shotsFired: number;
    shotsHit: number;
    chickensDefeated: number;
    missilesFired: number;
    gameStartTime: number;
    lastTime: number;
    nextBulletId: number;
    nextEnemyBulletId: number;
    nextEnemyId: number;
    nextDropId: number;
    nextParticleId: number;
    nextTextId: number;
    keysHeld: Set<string>;
    isMouseDown: boolean;
    mousePos: { x: number; y: number };
    shootTimer: number;
    hitstopTimer: number;
    lastHudSync: number;
  }>({
    gameState: 'title',
    player: { ...INITIAL_PLAYER },
    enemies: [],
    asteroids: [],
    bullets: [],
    enemyBullets: [],
    drops: [],
    particles: [],
    floatingTexts: [],
    shockwave: { x: 0, y: 0, radius: 0, maxRadius: 800, alpha: 0, active: false },
    stars: [],
    wave: 1,
    waveTransitionTimer: 0,
    waveAnnounceText: null,
    shotsFired: 0,
    shotsHit: 0,
    chickensDefeated: 0,
    missilesFired: 0,
    gameStartTime: 0,
    lastTime: performance.now(),
    nextBulletId: 1,
    nextEnemyBulletId: 1,
    nextEnemyId: 100,
    nextDropId: 1,
    nextParticleId: 1,
    nextTextId: 1,
    keysHeld: new Set(),
    isMouseDown: false,
    mousePos: { x: 400, y: 650 },
    shootTimer: 0,
    hitstopTimer: 0,
    lastHudSync: 0
  });

  // Sync dataset.state to document.body
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Load high score from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ci5_high_score');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val)) {
          stateRef.current.player.highScore = val;
          setHudPlayer((prev) => ({ ...prev, highScore: val }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save high score helper
  const updateHighScore = useCallback((score: number) => {
    if (score > stateRef.current.player.highScore) {
      stateRef.current.player.highScore = score;
      try {
        localStorage.setItem('ci5_high_score', String(score));
      } catch {
        // ignore
      }
    }
  }, []);

  // Spawn Floating Text helper
  const addFloatingText = (text: string, x: number, y: number, color: string = '#facc15') => {
    const s = stateRef.current;
    s.floatingTexts.push({
      id: s.nextTextId++,
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -50,
      life: 0.8
    });
  };

  // Spawn Particles helper
  const spawnExplosionParticles = (
    x: number,
    y: number,
    count: number,
    isDark: boolean = false
  ) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 160;
      const isFeather = Math.random() < 0.65;
      s.particles.push({
        id: s.nextParticleId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: isFeather
          ? (isDark ? '#334155' : (Math.random() < 0.8 ? '#f8fafc' : '#ef4444'))
          : (Math.random() < 0.5 ? '#f59e0b' : '#ef4444'),
        size: isFeather ? (6 + Math.random() * 8) : (3 + Math.random() * 4),
        alpha: 1,
        life: 0.6 + Math.random() * 0.6,
        maxLife: 1.2,
        shape: isFeather ? 'feather' : 'spark',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 6
      });
    }
  };

  // Start / Init Wave
  const startWave = useCallback((waveNum: number) => {
    const canvas = canvasRef.current;
    let w = canvas ? canvas.width : 800;
    let h = canvas ? canvas.height : 800;

    if (canvas && canvas.parentElement) {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = 1;
      if (rect.width > 0 && rect.height > 0) {
        w = Math.floor(rect.width * dpr);
        h = Math.floor(rect.height * dpr);
        canvas.width = w;
        canvas.height = h;
      }
    }

    const waveInfo = getWaveInfo(waveNum);
    const { enemies, asteroids } = spawnWaveEnemies(waveNum, w, h);

    const s = stateRef.current;
    s.wave = waveNum;
    s.enemies = enemies;
    s.asteroids = asteroids;
    s.bullets = [];
    s.enemyBullets = [];
    s.waveTransitionTimer = 2.2;
    s.waveAnnounceText = `WAVE ${waveNum}: ${waveInfo.title.toUpperCase()}`;

    // Center player initially
    if (waveNum === 1) {
      s.player.x = w / 2;
      s.player.y = h - 120;
      s.player.targetX = w / 2;
      s.player.targetY = h - 120;
    }

    setCurrentWave(waveNum);
    setWaveTitle(waveInfo.title);
    setWaveAnnouncement(`WAVE ${waveNum}: ${waveInfo.title.toUpperCase()}`);
    setTimeout(() => {
      setWaveAnnouncement(null);
    }, 2400);

    if (waveNum > 1) {
      soundManager.playWaveVictory();
    }

    // Find if boss is in this wave
    const boss = enemies.find((e) => e.type === 'boss' || e.type === 'saucer') || null;
    setActiveBoss(boss);
  }, []);

  // Fire Megabomb Nuclear Missile
  const fireMegabomb = useCallback(() => {
    const s = stateRef.current;
    if (s.player.missiles <= 0 || s.gameState !== 'playing') return;

    s.player.missiles--;
    s.missilesFired++;
    soundManager.playMissileLaunch();

    setTimeout(() => {
      soundManager.playNukeExplosion();
      // Shockwave triggered
      s.shockwave = {
        x: s.player.x,
        y: s.player.y,
        radius: 10,
        maxRadius: Math.max(canvasRef.current?.width || 800, canvasRef.current?.height || 800) * 1.4,
        alpha: 1,
        active: true
      };

      // Wipe all enemy bullets
      s.enemyBullets = [];

      // Wipe or damage all enemies
      s.enemies.forEach((enemy) => {
        enemy.hp -= 800;
        spawnExplosionParticles(enemy.x, enemy.y, 16, enemy.type === 'dark_trooper' || enemy.type === 'boss');
      });

      // Break asteroids
      s.asteroids.forEach((ast) => {
        ast.hp -= 500;
      });

      addFloatingText('NUCLEAR MEGAPACKAGE DETONATED!', s.player.x, s.player.y - 40, '#ef4444');
    }, 250);
  }, []);

  // Launch Game
  const handleStartGame = useCallback((shipColor: string) => {
    const s = stateRef.current;
    s.player = {
      ...INITIAL_PLAYER,
      highScore: s.player.highScore,
      shipColor
    };
    s.shotsFired = 0;
    s.shotsHit = 0;
    s.chickensDefeated = 0;
    s.missilesFired = 0;
    s.gameStartTime = performance.now();
    s.gameState = 'playing';
    setGameState('playing');
    startWave(1);
  }, [startWave]);

  // Restart Current Game
  const handleRestart = useCallback(() => {
    handleStartGame(stateRef.current.player.shipColor);
  }, [handleStartGame]);

  // Pause / Resume Handlers
  const handleTogglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'playing') {
        stateRef.current.gameState = 'paused';
        return 'paused';
      }
      if (prev === 'paused') {
        stateRef.current.gameState = 'playing';
        stateRef.current.lastTime = performance.now();
        return 'playing';
      }
      return prev;
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  // Auto-start query parameter support (?autostart=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      handleStartGame('#ef4444');
    }
  }, [handleStartGame]);

  // Keyboard and Window Input Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      soundManager.resumeOnInteraction();
      const code = e.code;
      const s = stateRef.current;

      // Title screen quick start with Space or Enter
      if (s.gameState === 'title' && (code === 'Space' || code === 'Enter')) {
        e.preventDefault();
        handleStartGame(s.player.shipColor);
        return;
      }

      // Game Over / Victory quick restart
      if ((s.gameState === 'gameover' || s.gameState === 'victory') && (code === 'Space' || code === 'Enter')) {
        e.preventDefault();
        handleRestart();
        return;
      }

      // Pause toggle
      if (code === 'KeyP' || code === 'Escape') {
        e.preventDefault();
        handleTogglePause();
        return;
      }

      // Mute toggle with M
      if (code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      // Megabomb missile fire with Shift
      if ((code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyB') && s.gameState === 'playing') {
        e.preventDefault();
        fireMegabomb();
        return;
      }

      s.keysHeld.add(code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keysHeld.delete(e.code);
    };

    const onBlur = () => {
      stateRef.current.keysHeld.clear();
      stateRef.current.isMouseDown = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [handleStartGame, handleRestart, handleTogglePause, handleToggleMute, fireMegabomb]);

  // Main Canvas Setup & Resize Observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = 1;
      const oldW = canvas.width;
      const newW = Math.floor(rect.width * dpr);
      const newH = Math.floor(rect.height * dpr);
      canvas.width = newW;
      canvas.height = newH;

      if (oldW > 0 && Math.abs(oldW - newW) > 15) {
        const ratio = newW / oldW;
        stateRef.current.enemies.forEach((e) => {
          e.x *= ratio;
          e.targetX *= ratio;
        });
        stateRef.current.asteroids.forEach((a) => {
          a.x *= ratio;
        });
        stateRef.current.player.x *= ratio;
        stateRef.current.player.targetX *= ratio;
      }

      // Re-create background stars to match canvas bounds
      stateRef.current.stars = createStars(120, canvas.width, canvas.height);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // Pointer Aiming & Shooting Events on Canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    soundManager.resumeOnInteraction();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const s = stateRef.current;
    s.mousePos = { x, y };

    if (e.button === 2) {
      // Right Click: Launch Nuclear Missile
      e.preventDefault();
      fireMegabomb();
      return;
    }

    s.isMouseDown = true;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    stateRef.current.mousePos = { x, y };
  };

  const handlePointerUp = () => {
    stateRef.current.isMouseDown = false;
  };

  // Main 60 FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new GameRenderer(ctx);
    let animId: number;

    const loop = (timestamp: number) => {
      animId = requestAnimationFrame(loop);

      const s = stateRef.current;
      const rawDt = (timestamp - s.lastTime) / 1000;
      if (rawDt < 0.016) {
        return; // Limit frame rate to ~60fps to yield CPU to browser compositor
      }
      s.lastTime = timestamp;
      const dt = Math.min(rawDt, 0.05);
      const gameTime = timestamp / 1000;

      const width = canvas.width;
      const height = canvas.height;

      // Always render animated starry space backdrop
      renderer.drawBackground(s.stars, width, height, dt, gameTime);

      // If Paused, just render current frame without advancing simulation
      if (s.gameState === 'paused') {
        renderer.drawPlayer(s.player, gameTime);
        s.enemies.forEach((e) => renderer.drawEnemy(e, gameTime, s.player.x, s.player.y));
        s.asteroids.forEach((a) => renderer.drawAsteroid(a));
        s.bullets.forEach((b) => renderer.drawBullet(b, gameTime));
        s.enemyBullets.forEach((eb) => renderer.drawEnemyBullet(eb));
        s.drops.forEach((d) => renderer.drawDropItem(d));
        return;
      }

      // If in Title state, draw ambient space tour with occasional floating preview
      if (s.gameState === 'title') {
        return;
      }

      // Simulation Step (Playing or ending)
      const p = s.player;

      // 1. Player Movement (Smooth follow mouse or WASD keys)
      const keys = s.keysHeld;
      const kbSpeed = 520;
      let targetX = p.targetX;
      let targetY = p.targetY;

      const hasKbInput =
        keys.has('KeyA') ||
        keys.has('ArrowLeft') ||
        keys.has('KeyD') ||
        keys.has('ArrowRight') ||
        keys.has('KeyW') ||
        keys.has('ArrowUp') ||
        keys.has('KeyS') ||
        keys.has('ArrowDown');

      if (hasKbInput) {
        if (keys.has('KeyA') || keys.has('ArrowLeft')) targetX -= kbSpeed * dt;
        if (keys.has('KeyD') || keys.has('ArrowRight')) targetX += kbSpeed * dt;
        if (keys.has('KeyW') || keys.has('ArrowUp')) targetY -= kbSpeed * dt;
        if (keys.has('KeyS') || keys.has('ArrowDown')) targetY += kbSpeed * dt;
      } else {
        // Follow mouse position with smooth dampening
        targetX = s.mousePos.x;
        targetY = s.mousePos.y;
      }

      // Clamp target within viewport bounds
      targetX = Math.max(30, Math.min(width - 30, targetX));
      targetY = Math.max(height * 0.15, Math.min(height - 40, targetY));

      p.targetX = targetX;
      p.targetY = targetY;

      // Smooth interpolation to target
      const moveFactor = 1 - Math.exp(-22 * dt);
      p.vx = (targetX - p.x) / dt;
      p.vy = (targetY - p.y) / dt;
      p.x += (targetX - p.x) * moveFactor;
      p.y += (targetY - p.y) * moveFactor;

      // Invulnerability timer countdown
      if (p.invulnerableTimer > 0) {
        p.invulnerableTimer = Math.max(0, p.invulnerableTimer - dt);
      }

      // Combo streak timeout countdown
      if (p.combo > 0) {
        p.comboTimer -= dt;
        if (p.comboTimer <= 0) {
          p.combo = 0;
        }
      }

      // 2. Weapon Heat Dissipation
      const weaponDef = WEAPON_DEFS[p.weaponType];
      const coolResult = coolDownHeat(p.heat, p.isOverheated, weaponDef.coolingRate, dt);
      p.heat = coolResult.newHeat;
      p.isOverheated = coolResult.isOverheated;

      // 3. Player Firing (Mouse held down or Spacebar pressed)
      const isFiring = s.isMouseDown || keys.has('Space');
      s.shootTimer += dt * 1000;

      if (isFiring && !p.isOverheated && s.shootTimer >= weaponDef.cooldownMs && s.gameState === 'playing') {
        s.shootTimer = 0;
        s.shotsFired++;

        // Sound
        soundManager.playShoot(p.weaponType, p.weaponPower);

        // Heat accumulation
        const heatResult = accumulateHeat(p.heat, p.weaponType, p.weaponPower);
        p.heat = heatResult.newHeat;
        if (heatResult.becameOverheated) {
          p.isOverheated = true;
          soundManager.playOverheatAlarm();
          addFloatingText('OVERHEAT!', p.x, p.y - 30, '#ef4444');
        }

        // Spawn bullets from weapon pattern
        const offsets = getBulletPattern(p.weaponType, p.weaponPower);
        const damage = calculateDamage(p.weaponType, p.weaponPower);

        for (const offset of offsets) {
          s.bullets.push({
            id: s.nextBulletId++,
            x: p.x + offset.dx,
            y: p.y + offset.dy,
            startX: p.x + offset.dx,
            vx: offset.vx,
            vy: offset.vy,
            damage,
            weaponType: p.weaponType,
            color: weaponDef.color,
            radius: offset.radius || (p.weaponType === 'neutron' ? 6 : (p.weaponType === 'heavy_plasma' ? 14 : (p.weaponType === 'cannon' ? 15 : 4))),
            piercing: offset.piercing,
            wavePhase: offset.wavePhase,
            waveFreq: offset.waveFreq,
            waveAmp: offset.waveAmp,
            branchSeed: offset.branchSeed,
            heavySplash: offset.heavySplash,
            isCannon: offset.isCannon,
            isGatling: offset.isGatling,
            bouncesLeft: offset.bouncesLeft,
            maxBounces: offset.maxBounces,
            bornTime: gameTime
          });
        }
      }

      // 4. Update Player Bullets
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        if (b.wavePhase !== undefined) {
          const age = gameTime - (b.bornTime || gameTime);
          b.x = (b.startX ?? b.x) + Math.sin(age * (b.waveFreq || 14) + b.wavePhase) * (b.waveAmp || 30);
          b.y += b.vy * dt;
        } else {
          b.x += b.vx * dt;
          b.y += b.vy * dt;
        }

        // Ricochet Bouncing Flak logic off arena borders
        if (b.bouncesLeft !== undefined && b.bouncesLeft > 0) {
          const didBounce = handleBulletRicochet(b, width, height);
          if (didBounce) {
            soundManager.playRicochetBounce();
            for (let sp = 0; sp < 6; sp++) {
              const ang = Math.random() * Math.PI * 2;
              s.particles.push({
                id: s.nextParticleId++,
                x: b.x,
                y: b.y,
                vx: Math.cos(ang) * 90,
                vy: Math.sin(ang) * 90,
                color: '#38bdf8',
                size: 3.5,
                alpha: 1,
                life: 0.22,
                maxLife: 0.22,
                shape: 'spark'
              });
            }
          }
        }

        // Offscreen check
        const hasBounces = (b.bouncesLeft !== undefined && b.bouncesLeft > 0);
        if (b.y > height + 60 || (!hasBounces && b.y < -40) || (!hasBounces && (b.x < -60 || b.x > width + 60))) {
          s.bullets.splice(i, 1);
          continue;
        }

        // Bullet vs Enemy collision
        let bulletRemoved = false;
        for (const enemy of s.enemies) {
          if (checkCircleCollision(b.x, b.y, b.radius, enemy.x, enemy.y, enemy.width * 0.45)) {
            s.shotsHit++;

            // Boss Energy Shield Deflection check
            if (enemy.type === 'boss' && enemy.bossSkillState?.shieldActive) {
              soundManager.playShieldDeflect();
              for (let sp = 0; sp < 8; sp++) {
                const ang = Math.random() * Math.PI * 2;
                s.particles.push({
                  id: s.nextParticleId++,
                  x: b.x,
                  y: b.y,
                  vx: Math.cos(ang) * 110,
                  vy: Math.sin(ang) * 110,
                  color: '#22d3ee',
                  size: 4,
                  alpha: 1,
                  life: 0.3,
                  maxLife: 0.3,
                  shape: 'spark'
                });
              }
              if (!b.piercing) {
                s.bullets.splice(i, 1);
                bulletRemoved = true;
                break;
              }
              continue;
            }

            enemy.hp -= b.damage;
            soundManager.playChickenHit();

            // Boss Retaliation Check ("Phản đòn / Bắn lại") - rate limited so rapid guns don't spawn 15+ lasers/sec
            if (
              enemy.type === 'boss' &&
              enemy.bossSkillState?.currentSkill === 'retaliation_burst' &&
              (enemy.bossSkillState.retaliationCooldown ?? 0) <= 0
            ) {
              enemy.bossSkillState.retaliationCooldown = 0.35;
              const dx = p.x - enemy.x;
              const dy = p.y - enemy.y;
              const dist = Math.hypot(dx, dy) || 1;
              const retSpeed = 300;
              s.enemyBullets.push({
                id: s.nextEnemyBulletId++,
                x: enemy.x + (Math.random() - 0.5) * 30,
                y: enemy.y + 40,
                vx: (dx / dist) * retSpeed + (Math.random() - 0.5) * 40,
                vy: (dy / dist) * retSpeed,
                type: 'dark_laser',
                radius: 6
              });
              soundManager.playEggDrop();
            }

            // Heavy plasma or Dreadnought cannon splash damage to nearby flock
            if (b.isCannon || b.heavySplash) {
              const splashRad = b.isCannon ? 100 : 80;
              const splashFactor = b.isCannon ? 0.65 : 0.5;
              const sparkColor = b.isCannon ? '#ea580c' : '#22c55e';

              for (const other of s.enemies) {
                if (other !== enemy && checkCircleCollision(b.x, b.y, splashRad, other.x, other.y, other.width * 0.45)) {
                  other.hp -= Math.round(b.damage * splashFactor);
                }
              }
              for (let sp = 0; sp < (b.isCannon ? 16 : 10); sp++) {
                const ang = Math.random() * Math.PI * 2;
                const spd = 60 + Math.random() * 140;
                s.particles.push({
                  id: s.nextParticleId++,
                  x: b.x,
                  y: b.y,
                  vx: Math.cos(ang) * spd,
                  vy: Math.sin(ang) * spd,
                  color: sparkColor,
                  size: 4 + Math.random() * 4,
                  alpha: 1,
                  life: 0.35,
                  maxLife: 0.35,
                  shape: 'spark'
                });
              }
            }

            // Spawn standard impact sparks
            for (let sp = 0; sp < 3; sp++) {
              s.particles.push({
                id: s.nextParticleId++,
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 80,
                vy: (Math.random() - 0.5) * 80,
                color: b.color,
                size: 3,
                alpha: 1,
                life: 0.25,
                maxLife: 0.25,
                shape: 'spark'
              });
            }

            // Ricochet Bouncing Flak logic: bounce off enemy toward nearby flock!
            if (b.weaponType === 'ricochet' && b.bouncesLeft !== undefined && b.bouncesLeft > 0) {
              b.bouncesLeft--;
              soundManager.playRicochetBounce();

              let nearest: Enemy | null = null;
              let minDist = 400;
              for (const other of s.enemies) {
                if (other !== enemy) {
                  const d = Math.hypot(other.x - b.x, other.y - b.y);
                  if (d < minDist) {
                    minDist = d;
                    nearest = other;
                  }
                }
              }

              if (nearest) {
                const ang = Math.atan2(nearest.y - b.y, nearest.x - b.x);
                b.vx = Math.cos(ang) * 720;
                b.vy = Math.sin(ang) * 720;
              } else {
                b.vx = -b.vx + (Math.random() - 0.5) * 120;
                b.vy = -Math.abs(b.vy);
              }
            } else if (!b.piercing) {
              s.bullets.splice(i, 1);
              bulletRemoved = true;
              break;
            }
          }
        }
        if (bulletRemoved) continue;

        // Bullet vs Asteroid collision
        for (const ast of s.asteroids) {
          if (checkCircleCollision(b.x, b.y, b.radius, ast.x, ast.y, ast.radius)) {
            s.shotsHit++;
            ast.hp -= b.damage;
            if (!b.piercing) {
              s.bullets.splice(i, 1);
              break;
            }
          }
        }
      }

      // 5. Update Enemies & Spawning Projectiles
      for (let i = s.enemies.length - 1; i >= 0; i--) {
        const enemy = s.enemies[i];
        enemy.phaseTimer += dt;

        // Enemy movement patterns
        switch (enemy.patternType) {
          case 'grid': {
            // Smooth entrance to target, then gentle formation swaying
            const toX = enemy.targetX + Math.sin(gameTime * 2 + enemy.phaseTimer) * 35;
            const toY = enemy.targetY + Math.cos(gameTime * 2) * 12;
            enemy.x += (toX - enemy.x) * (1 - Math.exp(-6 * dt));
            enemy.y += (toY - enemy.y) * (1 - Math.exp(-6 * dt));
            break;
          }
          case 'swoop': {
            // Rapid sine weaving downwards and cycling back
            enemy.y += 130 * dt;
            enemy.x += Math.sin(enemy.y * 0.015 + enemy.phaseTimer) * 220 * dt;
            if (enemy.y > height + 50) {
              enemy.y = -50;
            }
            break;
          }
          case 'hover': {
            // Hovering heavy bomber sway
            const toX = enemy.targetX + Math.sin(gameTime * 1.5 + enemy.phaseTimer) * 60;
            enemy.x += (toX - enemy.x) * (1 - Math.exp(-4 * dt));
            enemy.y += (enemy.targetY - enemy.y) * (1 - Math.exp(-4 * dt));
            break;
          }
          case 'dive': {
            // Swoop and periodic dive toward player
            enemy.x += (enemy.targetX - enemy.x) * (1 - Math.exp(-4 * dt));
            enemy.y += (enemy.targetY - enemy.y) * (1 - Math.exp(-4 * dt));
            if (Math.sin(gameTime * 2 + enemy.phaseTimer) > 0.85) {
              enemy.y += 180 * dt;
            }
            break;
          }
          case 'boss': {
            // Boss Movement & Multi-Skill AI System
            if (!enemy.bossSkillState) {
              enemy.bossSkillState = {
                currentSkill: 'none',
                skillTimer: BOSS_SKILL_COOLDOWN_SECONDS, // 4 seconds per skill
                skillDuration: 0,
                telegraphTimer: 0,
                shieldActive: false,
                spiralAngle: 0,
                dashPhase: 'idle'
              };
            }

            const skill = enemy.bossSkillState;
            enemy.bossPhase = determineBossPhase(enemy.hp, enemy.maxHp);

            // 1. Normal Hovering (unless diving in ramming dash)
            if (skill.currentSkill !== 'ramming_dash' || skill.dashPhase === 'idle' || skill.dashPhase === 'charge') {
              const targetX = width / 2 + Math.sin(gameTime * 1.2) * (width * 0.28);
              enemy.x += (targetX - enemy.x) * (1 - Math.exp(-3 * dt));
              enemy.y += (enemy.targetY - enemy.y) * (1 - Math.exp(-3 * dt));
            }

            // 2. Full 4-Second Cooldown Between Boss Skills
            if ((skill.retaliationCooldown ?? 0) > 0) {
              skill.retaliationCooldown = Math.max(0, (skill.retaliationCooldown ?? 0) - dt);
            }
            const cycleTick = tickBossSkillCycleTimer(skill.skillTimer, dt, skill.currentSkill);
            skill.skillTimer = cycleTick.nextTimer;

            if (cycleTick.shouldTrigger) {
              const appearance = enemy.bossAppearance || 'emperor';
              let pool: BossSkillType[] = [
                'spiral_vortex',
                'cluster_bomb',
                'laser_sweep',
                'ramming_dash',
                'energy_shield',
                'summon_minions',
                'feather_nova',
                'meteor_rain',
                'retaliation_burst',
                'gravity_vortex'
              ];

              if (appearance === 'saucer') {
                pool = ['laser_sweep', 'energy_shield', 'cluster_bomb', 'gravity_vortex', 'retaliation_burst'];
              } else if (appearance === 'iron_rooster') {
                pool = ['ramming_dash', 'cluster_bomb', 'feather_nova', 'retaliation_burst', 'meteor_rain'];
              } else if (appearance === 'death_egg') {
                pool = ['spiral_vortex', 'cluster_bomb', 'laser_sweep', 'meteor_rain', 'gravity_vortex'];
              } else if (appearance === 'hive_queen') {
                pool = ['summon_minions', 'feather_nova', 'spiral_vortex', 'retaliation_burst'];
              } else if (appearance === 'asteroid_golem') {
                pool = ['ramming_dash', 'cluster_bomb', 'energy_shield', 'meteor_rain', 'retaliation_burst'];
              } else if (appearance === 'sun_blocker') {
                pool = ['laser_sweep', 'gravity_vortex', 'feather_nova', 'meteor_rain', 'retaliation_burst', 'spiral_vortex'];
              } else {
                pool = ['laser_sweep', 'retaliation_burst', 'feather_nova', 'spiral_vortex', 'energy_shield', 'cluster_bomb'];
              }

              const chosen = pickNextBossSkill(pool, skill.lastSkill);
              skill.lastSkill = chosen;
              skill.currentSkill = chosen;
              skill.telegraphTimer =
                chosen === 'laser_sweep' || chosen === 'ramming_dash' ? 0.55 :
                chosen === 'meteor_rain' ? 0.5 :
                chosen === 'retaliation_burst' ? 0.45 : 0;
              skill.skillDuration =
                chosen === 'spiral_vortex' ? 2.6 :
                chosen === 'energy_shield' ? 2.8 :
                chosen === 'laser_sweep' ? 2.0 :
                chosen === 'feather_nova' ? 2.5 :
                chosen === 'meteor_rain' ? 2.5 :
                chosen === 'retaliation_burst' ? 2.8 :
                chosen === 'gravity_vortex' ? 2.6 :
                chosen === 'ramming_dash' ? 2.5 : 1.5;
              skill.shieldActive = chosen === 'energy_shield';
              skill.retaliationActive = chosen === 'retaliation_burst';
              skill.spiralAngle = 0;
              skill.vortexAngle = 0;
              skill.dashPhase = chosen === 'ramming_dash' ? 'charge' : 'idle';
              skill.targetDashX = p.x;
              skill.targetDashY = height - 120;
              skill.homeX = enemy.x;
              skill.homeY = enemy.targetY;

              if (chosen === 'laser_sweep' || chosen === 'ramming_dash' || chosen === 'meteor_rain') {
                soundManager.playBossCharge();
              } else if (chosen === 'energy_shield') {
                soundManager.playShieldDeflect();
              } else if (chosen === 'retaliation_burst') {
                soundManager.playBossCharge();
                addFloatingText('PHẢN ĐÒN / COUNTER STANCE!', enemy.x, enemy.y - 45, '#c084fc');
              }
            }

            if (skill.currentSkill !== 'none') {
              // 3. Active Skill Execution
              if (skill.telegraphTimer > 0) {
                skill.telegraphTimer -= dt;
                if (skill.currentSkill === 'laser_sweep') {
                  const dx = p.x - enemy.x;
                  const dy = p.y - enemy.y;
                  skill.laserSweepAngle = Math.atan2(dx, dy);
                }
              } else {
                skill.skillDuration -= dt;

                switch (skill.currentSkill) {
                  case 'spiral_vortex': {
                    // Spiral bullet hell: 2 opposing streams at readable speed
                    if (Math.floor(gameTime * 6) !== Math.floor((gameTime - dt) * 6)) {
                      const spAng = skill.spiralAngle || 0;
                      for (let sp = 0; sp < 2; sp++) {
                        const a = spAng + sp * Math.PI;
                        s.enemyBullets.push({
                          id: s.nextEnemyBulletId++,
                          x: enemy.x + Math.sin(a) * 35,
                          y: enemy.y + Math.cos(a) * 35,
                          vx: Math.sin(a) * 195,
                          vy: Math.cos(a) * 195,
                          type: 'feather_blast',
                          radius: 5
                        });
                      }
                      skill.spiralAngle = (spAng + 0.42) % (Math.PI * 2);
                      soundManager.playEggDrop();
                    }
                    break;
                  }

                  case 'feather_nova': {
                    // 360-degree rotating starburst of razor feathers
                    if (Math.floor(gameTime * 2.5) !== Math.floor((gameTime - dt) * 2.5)) {
                      const petals = 8;
                      const baseAng = skill.spiralAngle || 0;
                      for (let fn = 0; fn < petals; fn++) {
                        const ang = baseAng + (fn * Math.PI * 2) / petals;
                        s.enemyBullets.push({
                          id: s.nextEnemyBulletId++,
                          x: enemy.x + Math.sin(ang) * 35,
                          y: enemy.y + Math.cos(ang) * 35,
                          vx: Math.sin(ang) * 200,
                          vy: Math.cos(ang) * 200,
                          type: 'feather_blast',
                          radius: 6
                        });
                      }
                      skill.spiralAngle = (baseAng + 0.35) % (Math.PI * 2);
                      soundManager.playEggDrop();
                    }
                    break;
                  }

                  case 'meteor_rain': {
                    // Apocalyptic dark eggs raining from the sky
                    if (Math.floor(gameTime * 2) !== Math.floor((gameTime - dt) * 2)) {
                      const dropX = Math.random() * (width - 120) + 60;
                      s.enemyBullets.push({
                        id: s.nextEnemyBulletId++,
                        x: dropX,
                        y: -30,
                        vx: (Math.random() - 0.5) * 50,
                        vy: 260,
                        type: 'cluster_egg',
                        isCluster: true,
                        splitTimer: 1.1,
                        radius: 12
                      });
                      soundManager.playEggDrop();
                    }
                    break;
                  }

                  case 'retaliation_burst': {
                    // Retaliatory Stance: periodic aimed spikes + rate-limited counter-fire on impact
                    skill.retaliationActive = true;
                    if (Math.floor(gameTime * 1.5) !== Math.floor((gameTime - dt) * 1.5)) {
                      const dx = p.x - enemy.x;
                      const dy = p.y - enemy.y;
                      const dist = Math.hypot(dx, dy) || 1;
                      const spd = 250;
                      s.enemyBullets.push({
                        id: s.nextEnemyBulletId++,
                        x: enemy.x,
                        y: enemy.y + 40,
                        vx: (dx / dist) * spd,
                        vy: (dy / dist) * spd,
                        type: 'dark_laser',
                        radius: 6
                      });
                      soundManager.playEggDrop();
                    }
                    break;
                  }

                  case 'gravity_vortex': {
                    // Gravitational attraction toward boss
                    const pullDx = enemy.x - p.x;
                    const pullDy = (enemy.y + 110) - p.y;
                    const pullDist = Math.hypot(pullDx, pullDy) || 1;
                    if (pullDist < 460) {
                      p.x += (pullDx / pullDist) * 85 * dt;
                      p.y += (pullDy / pullDist) * 65 * dt;
                    }
                    // Eject pulsing plasma disks
                    if (Math.floor(gameTime * 2.5) !== Math.floor((gameTime - dt) * 2.5)) {
                      const va = (skill.vortexAngle || 0) + 0.55;
                      skill.vortexAngle = va;
                      [-va, va].forEach((ang) => {
                        s.enemyBullets.push({
                          id: s.nextEnemyBulletId++,
                          x: enemy.x,
                          y: enemy.y + 35,
                          vx: Math.sin(ang) * 190,
                          vy: Math.cos(ang) * 180,
                          type: 'plasma_bomb',
                          radius: 7
                        });
                      });
                      soundManager.playEggDrop();
                    }
                    break;
                  }

                  case 'cluster_bomb': {
                    if (skill.skillDuration > 1.2) {
                      skill.skillDuration = 1.0;
                      [-40, 40].forEach((ox) => {
                        s.enemyBullets.push({
                          id: s.nextEnemyBulletId++,
                          x: enemy.x + ox,
                          y: enemy.y + 35,
                          vx: (ox / 40) * 45,
                          vy: 165,
                          type: 'cluster_egg',
                          isCluster: true,
                          splitTimer: 0.9,
                          radius: 9
                        });
                      });
                      soundManager.playEggDrop();
                    }
                    break;
                  }

                  case 'laser_sweep': {
                    if (skill.laserSweepAngle !== undefined) {
                      skill.laserSweepAngle += 0.45 * dt * (enemy.x > width / 2 ? -1 : 1);
                      if (Math.floor(gameTime * 7) !== Math.floor((gameTime - dt) * 7)) {
                        soundManager.playBossLaser();
                      }
                      // Ray cast damage against player
                      const ang = skill.laserSweepAngle;
                      const lDirX = Math.sin(ang);
                      const lDirY = Math.cos(ang);
                      const toPX = p.x - enemy.x;
                      const toPY = p.y - (enemy.y + 35);
                      const proj = toPX * lDirX + toPY * lDirY;
                      if (proj > 0 && proj < 1100) {
                        const perpX = toPX - proj * lDirX;
                        const perpY = toPY - proj * lDirY;
                        if (Math.hypot(perpX, perpY) < 28 && p.invulnerableTimer <= 0) {
                          soundManager.playPlayerHurt();
                          spawnExplosionParticles(p.x, p.y, 20, false);
                          p.lives--;
                          p.invulnerableTimer = 2.5;
                          p.heat = 0;
                          p.isOverheated = false;
                          p.weaponPower = Math.max(1, p.weaponPower - 1);
                          addFloatingText('LASER HIT!', p.x, p.y - 40, '#ef4444');
                        }
                      }
                    }
                    break;
                  }

                  case 'ramming_dash': {
                    if (skill.dashPhase === 'charge') {
                      skill.dashPhase = 'strike';
                      soundManager.playBossDash();
                    } else if (skill.dashPhase === 'strike') {
                      enemy.y += 680 * dt;
                      enemy.x += ((skill.targetDashX || width / 2) - enemy.x) * (1 - Math.exp(-4 * dt));
                      if (enemy.y >= height - 90) {
                        skill.dashPhase = 'recover';
                      }
                    } else if (skill.dashPhase === 'recover') {
                      enemy.y += ((skill.homeY || 140) - enemy.y) * (1 - Math.exp(-3 * dt));
                      enemy.x += ((width / 2) - enemy.x) * (1 - Math.exp(-2.5 * dt));
                      if (Math.abs(enemy.y - (skill.homeY || 140)) < 25) {
                        skill.skillDuration = 0;
                      }
                    }
                    break;
                  }

                  case 'summon_minions': {
                    if (skill.skillDuration > 1.2) {
                      skill.skillDuration = 1.0;
                      [-120, 0, 120].forEach((ox, idx) => {
                        s.enemies.push({
                          id: s.nextEnemyId++,
                          type: idx === 1 ? 'dark_trooper' : 'scout',
                          x: enemy.x + ox,
                          y: enemy.y + 60,
                          targetX: Math.max(60, Math.min(width - 60, enemy.x + ox)),
                          targetY: Math.min(height * 0.45, enemy.y + 90),
                          vx: 0,
                          vy: 0,
                          width: 44,
                          height: 44,
                          hp: 70,
                          maxHp: 70,
                          shootCooldown: 1.5 + Math.random(),
                          wingPhase: Math.random() * Math.PI,
                          wingSpeed: 10,
                          patternType: 'hover',
                          phaseTimer: 0,
                          angle: 0,
                          scoreValue: 250
                        });
                      });
                      soundManager.playChickenSquawk();
                    }
                    break;
                  }
                }

                if (skill.skillDuration <= 0) {
                  skill.currentSkill = 'none';
                  skill.shieldActive = false;
                  skill.retaliationActive = false;
                  skill.telegraphTimer = 0;
                  skill.dashPhase = 'idle';
                }
              }
            }
            break;
          }
        }

        // Enemy Egg / Laser Shooting
        enemy.shootCooldown -= dt;
        if (enemy.shootCooldown <= 0 && enemy.y > 0 && enemy.y < height - 100) {
          if (enemy.type === 'boss') {
            // Boss regular fire only when not executing aggressive channel skills
            const currentSkill = enemy.bossSkillState?.currentSkill || 'none';
            if (currentSkill === 'none' || currentSkill === 'energy_shield') {
              enemy.shootCooldown = enemy.bossPhase === 3 ? 1.3 : 1.7;
              const angs = enemy.bossPhase === 1 ? [-0.22, 0, 0.22] : [-0.3, -0.15, 0, 0.15, 0.3];
              for (const ang of angs) {
                s.enemyBullets.push({
                  id: s.nextEnemyBulletId++,
                  x: enemy.x + Math.sin(ang) * 40,
                  y: enemy.y + 50,
                  vx: Math.sin(ang) * 170,
                  vy: Math.cos(ang) * 205,
                  type: 'dark_laser',
                  radius: 5
                });
              }
              soundManager.playEggDrop();
            }
          } else if (enemy.type === 'dark_trooper') {
            enemy.shootCooldown = 2.2 + Math.random() * 2;
            s.enemyBullets.push({
              id: s.nextEnemyBulletId++,
              x: enemy.x,
              y: enemy.y + 16,
              vx: (Math.random() - 0.5) * 40,
              vy: 240,
              type: 'dark_laser',
              radius: 4
            });
            soundManager.playEggDrop();
          } else {
            enemy.shootCooldown = 2.5 + Math.random() * 3.5;
            s.enemyBullets.push({
              id: s.nextEnemyBulletId++,
              x: enemy.x,
              y: enemy.y + 16,
              vx: (Math.random() - 0.5) * 20,
              vy: 190,
              type: 'egg',
              radius: 5,
              wobble: (Math.random() - 0.5) * 0.4
            });
            soundManager.playEggDrop();
          }
        }

        // Defeat Check
        if (enemy.hp <= 0) {
          s.chickensDefeated++;
          soundManager.playChickenSquawk();

          // Spawn feathers and particles
          spawnExplosionParticles(
            enemy.x,
            enemy.y,
            enemy.type === 'boss' ? 45 : 14,
            enemy.type === 'dark_trooper' || enemy.type === 'boss'
          );

          // Update Score & Combo
          p.combo++;
          p.comboTimer = 2.5;
          const pointsEarned = calculateScoreWithCombo(enemy.scoreValue, p.combo);
          p.score += pointsEarned;
          updateHighScore(p.score);
          addFloatingText(`+${pointsEarned}`, enemy.x, enemy.y, '#fde047');

          // Item Drop Logic
          const dropRand = Math.random();
          // Drop roasted drumstick
          if (dropRand < 0.65 || enemy.type === 'boss') {
            const isTurkey = dropRand < 0.1 || enemy.type === 'boss';
            s.drops.push({
              id: s.nextDropId++,
              x: enemy.x,
              y: enemy.y,
              vx: (Math.random() - 0.5) * 60,
              vy: 80 + Math.random() * 50,
              type: isTurkey ? 'turkey' : 'drumstick',
              value: isTurkey ? 30 : 10,
              radius: isTurkey ? 16 : 12,
              rotation: Math.random() * Math.PI,
              rotationSpeed: (Math.random() - 0.5) * 4
            });
          }

          // Weapon Upgrade Present Box (🎁)
          // USER REQUIREMENT: Tỉ lệ rơi hộp đạn giảm xuống còn 12%
          const allWeapons: WeaponType[] = [
            'ion',
            'neutron',
            'vulcan',
            'laser',
            'lightning',
            'heavy_plasma',
            'wave',
            'gatling',
            'cannon',
            'ricochet'
          ];
          const shouldDropGift = Math.random() < WEAPON_GIFT_DROP_CHANCE || enemy.type === 'saucer' || enemy.type === 'boss';

          if (shouldDropGift) {
            const giftCount = enemy.type === 'boss' ? 2 : 1;
            for (let g = 0; g < giftCount; g++) {
              const chosenWeapon = allWeapons[Math.floor(Math.random() * allWeapons.length)];
              s.drops.push({
                id: s.nextDropId++,
                x: enemy.x + (g === 1 ? 30 : -10),
                y: enemy.y,
                vx: (Math.random() - 0.5) * 40,
                vy: 90,
                type: 'gift',
                weaponGiftType: chosenWeapon,
                value: 1,
                radius: 14,
                rotation: 0,
                rotationSpeed: 0
              });
            }
          }

          // Cooling cell drop if player is high heat
          if (p.heat > 50 && Math.random() < 0.3) {
            s.drops.push({
              id: s.nextDropId++,
              x: enemy.x,
              y: enemy.y,
              vx: (Math.random() - 0.5) * 30,
              vy: 95,
              type: 'cooling_cell',
              value: 50,
              radius: 12,
              rotation: 0,
              rotationSpeed: 0
            });
          }

          s.enemies.splice(i, 1);
        }
      }

      // 6. Update Asteroids
      for (let i = s.asteroids.length - 1; i >= 0; i--) {
        const ast = s.asteroids[i];
        ast.x += ast.vx * dt;
        ast.y += ast.vy * dt;
        ast.rotation += ast.rotationSpeed * dt;

        if (ast.y > height + 80) {
          s.asteroids.splice(i, 1);
          continue;
        }

        // Asteroid destroyed
        if (ast.hp <= 0) {
          spawnExplosionParticles(ast.x, ast.y, 10, false);
          soundManager.playChickenHit();
          p.score += 75;
          s.asteroids.splice(i, 1);

          // Small drumstick drop
          if (Math.random() < 0.4) {
            s.drops.push({
              id: s.nextDropId++,
              x: ast.x,
              y: ast.y,
              vx: (Math.random() - 0.5) * 50,
              vy: 85,
              type: 'drumstick',
              value: 10,
              radius: 12,
              rotation: 0,
              rotationSpeed: 2
            });
          }
        }
      }

      // 7. Update Enemy Bullets & Check Player Damage
      for (let i = s.enemyBullets.length - 1; i >= 0; i--) {
        const eb = s.enemyBullets[i];
        eb.x += eb.vx * dt;
        eb.y += eb.vy * dt;

        // Cluster Egg Fragmentation Check
        if (eb.isCluster && eb.splitTimer !== undefined) {
          eb.splitTimer -= dt;
          if (eb.splitTimer <= 0) {
            // Split into 6 glowing fragment eggs radiating in all directions
            for (let c = 0; c < 6; c++) {
              const ang = (c * Math.PI) / 3;
              s.enemyBullets.push({
                id: s.nextEnemyBulletId++,
                x: eb.x,
                y: eb.y,
                vx: Math.sin(ang) * 160,
                vy: Math.cos(ang) * 140 + 70,
                type: 'egg',
                radius: 5,
                wobble: (Math.random() - 0.5) * 0.4
              });
            }
            soundManager.playChickenSquawk();
            for (let sp = 0; sp < 12; sp++) {
              const ang = Math.random() * Math.PI * 2;
              s.particles.push({
                id: s.nextParticleId++,
                x: eb.x,
                y: eb.y,
                vx: Math.cos(ang) * 120,
                vy: Math.sin(ang) * 120,
                color: '#f59e0b',
                size: 3.5,
                alpha: 1,
                life: 0.3,
                maxLife: 0.3,
                shape: 'spark'
              });
            }
            s.enemyBullets.splice(i, 1);
            continue;
          }
        }

        if (eb.y > height + 20) {
          s.enemyBullets.splice(i, 1);
          continue;
        }

        // Check collision with player
        if (p.invulnerableTimer <= 0 && checkCircleCollision(eb.x, eb.y, eb.radius, p.x, p.y, p.width * 0.4)) {
          soundManager.playEggSplatter();
          soundManager.playPlayerHurt();
          spawnExplosionParticles(p.x, p.y, 20, false);
          s.enemyBullets.splice(i, 1);

          p.lives--;
          p.invulnerableTimer = 2.5;
          p.heat = 0;
          p.isOverheated = false;
          p.weaponPower = Math.max(1, p.weaponPower - 1);
          addFloatingText('SHIP HIT!', p.x, p.y - 40, '#ef4444');

          if (p.lives <= 0) {
            // GAME OVER
            s.gameState = 'gameover';
            setGameState('gameover');
            const totalShots = Math.max(1, s.shotsFired);
            const accuracy = Math.min(100, Math.round((s.shotsHit / totalShots) * 100));
            setEndStats({
              score: p.score,
              highScore: p.highScore,
              waveReached: s.wave,
              chickensDefeated: s.chickensDefeated,
              roastCollected: p.roastTotal,
              missilesFired: s.missilesFired,
              accuracy,
              shotsFired: s.shotsFired,
              shotsHit: s.shotsHit,
              gameTimeSeconds: Math.round((performance.now() - s.gameStartTime) / 1000)
            });
          }
        }
      }

      // 8. Update Drops & Pickups
      for (let i = s.drops.length - 1; i >= 0; i--) {
        const drop = s.drops[i];
        drop.x += drop.vx * dt;
        drop.y += drop.vy * dt;
        drop.rotation += drop.rotationSpeed * dt;

        // Gravitational attraction toward player when close (magnet effect)
        const distToPlayer = Math.hypot(p.x - drop.x, p.y - drop.y);
        if (distToPlayer < 120) {
          drop.vx += ((p.x - drop.x) / distToPlayer) * 350 * dt;
          drop.vy += ((p.y - drop.y) / distToPlayer) * 350 * dt;
        }

        if (drop.y > height + 30) {
          s.drops.splice(i, 1);
          continue;
        }

        // Collected by player
        if (checkCircleCollision(drop.x, drop.y, drop.radius, p.x, p.y, p.width * 0.45)) {
          if (drop.type === 'drumstick' || drop.type === 'turkey' || drop.type === 'burger') {
            soundManager.playDrumstickMunch();
            const lifeResult = applyDrumstickLifeBonus(p.roastTotal, 1, p.lives);
            p.roastTotal = lifeResult.newRoastTotal;
            p.lives = lifeResult.newLives;

            const feastResult = addFoodToRoastMeter(p.roastMeter, drop.value);
            p.roastMeter = feastResult.newMeter;

            if (lifeResult.lifeAwarded) {
              soundManager.playPowerUp();
              addFloatingText('100 ĐÙI GÀ: +1 MẠNG!', p.x, p.y - 70, '#22d3ee');
            }

            if (feastResult.bonusAwarded === 'missile') {
              p.missiles = Math.min(4, p.missiles + 1);
              soundManager.playPowerUp();
              addFloatingText('ROAST FEAST: +1 MISSILE!', p.x, p.y - 50, '#facc15');
            } else if (!lifeResult.lifeAwarded) {
              addFloatingText(`+${drop.value * 10} ROAST`, drop.x, drop.y, '#f59e0b');
            }
          } else if (drop.type === 'gift') {
            soundManager.playPowerUp();
            if (drop.weaponGiftType && drop.weaponGiftType === p.weaponType) {
              p.weaponPower = Math.min(10, p.weaponPower + 1);
              addFloatingText(`POWER UP: LV.${p.weaponPower}!`, p.x, p.y - 40, '#22c55e');
            } else if (drop.weaponGiftType) {
              p.weaponType = drop.weaponGiftType;
              p.weaponPower = Math.max(1, p.weaponPower);
              addFloatingText(`WEAPON: ${WEAPON_DEFS[drop.weaponGiftType].name.toUpperCase()}!`, p.x, p.y - 40, WEAPON_DEFS[drop.weaponGiftType].color);
            }
          } else if (drop.type === 'cooling_cell') {
            soundManager.playPowerUp();
            p.heat = Math.max(0, p.heat - 50);
            p.isOverheated = false;
            addFloatingText('CRYO COOLING APPLIED!', p.x, p.y - 40, '#38bdf8');
          }

          s.drops.splice(i, 1);
        }
      }

      // 9. Update Shockwave
      if (s.shockwave.active) {
        s.shockwave.radius += 1200 * dt;
        s.shockwave.alpha = Math.max(0, 1 - s.shockwave.radius / s.shockwave.maxRadius);
        if (s.shockwave.radius >= s.shockwave.maxRadius) {
          s.shockwave.active = false;
        }
      }

      // 10. Update Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        pt.alpha = Math.max(0, pt.life / pt.maxLife);
        if (pt.rotation !== undefined && pt.rotationSpeed !== undefined) {
          pt.rotation += pt.rotationSpeed * dt;
        }
        if (pt.life <= 0) {
          s.particles.splice(i, 1);
        }
      }

      // 11. Update Floating Texts
      for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
        const ft = s.floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.life -= dt;
        ft.alpha = Math.max(0, ft.life / 0.8);
        if (ft.life <= 0) {
          s.floatingTexts.splice(i, 1);
        }
      }

      // 12. Check Wave Progression
      if (s.enemies.length === 0 && s.asteroids.length === 0 && s.gameState === 'playing') {
        if (s.wave >= 100) {
          // VICTORY - ALL 100 WAVES CLEARED!
          s.gameState = 'victory';
          setGameState('victory');
          const totalShots = Math.max(1, s.shotsFired);
          const accuracy = Math.min(100, Math.round((s.shotsHit / totalShots) * 100));
          setEndStats({
            score: p.score,
            highScore: p.highScore,
            waveReached: 100,
            chickensDefeated: s.chickensDefeated,
            roastCollected: p.roastTotal,
            missilesFired: s.missilesFired,
            accuracy,
            shotsFired: s.shotsFired,
            shotsHit: s.shotsHit,
            gameTimeSeconds: Math.round((performance.now() - s.gameStartTime) / 1000)
          });
        } else {
          startWave(s.wave + 1);
        }
      }

      // Render Active Game Entities
      renderer.drawPlayer(p, gameTime);
      s.enemies.forEach((e) => renderer.drawEnemy(e, gameTime, p.x, p.y));
      s.asteroids.forEach((a) => renderer.drawAsteroid(a));
      s.bullets.forEach((b) => renderer.drawBullet(b, gameTime));
      s.enemyBullets.forEach((eb) => renderer.drawEnemyBullet(eb));
      s.drops.forEach((d) => renderer.drawDropItem(d));
      s.particles.forEach((pt) => renderer.drawParticle(pt));
      s.floatingTexts.forEach((ft) => renderer.drawFloatingText(ft));
      renderer.drawShockwave(s.shockwave);

      // Sync High-Level HUD state throttled to ~10Hz (every 100ms) to avoid 60Hz React reconciliation stalls
      if (!s.lastHudSync || timestamp - s.lastHudSync > 100) {
        s.lastHudSync = timestamp;
        setHudPlayer({ ...p });
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [startWave, updateHighScore]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 60 FPS Isolated Canvas */}
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full block cursor-crosshair touch-none"
      />

      {/* Playing HUD Overlay */}
      {gameState === 'playing' && (
        <HUD
          player={hudPlayer}
          currentWave={currentWave}
          waveTitle={waveTitle}
          waveAnnouncement={waveAnnouncement}
          boss={activeBoss}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handleTogglePause}
          onFireMissile={fireMegabomb}
        />
      )}

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          highScore={hudPlayer.highScore}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleTogglePause}
          onRestart={handleRestart}
          onHome={() => {
            stateRef.current.gameState = 'title';
            setGameState('title');
          }}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          stats={endStats}
          onRestart={handleRestart}
          onHome={() => {
            stateRef.current.gameState = 'title';
            setGameState('title');
          }}
        />
      )}

      {/* Victory Modal */}
      {gameState === 'victory' && (
        <VictoryModal
          stats={endStats}
          onRestart={handleRestart}
          onHome={() => {
            stateRef.current.gameState = 'title';
            setGameState('title');
          }}
        />
      )}
    </div>
  );
}
