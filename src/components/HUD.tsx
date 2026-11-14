import React from 'react';
import { PlayerState, Enemy } from '../game/types';
import { WEAPON_DEFS, MAX_LIVES, DRUMSTICKS_PER_EXTRA_LIFE } from '../game/rules';
import { Volume2, VolumeX, Pause } from 'lucide-react';

interface HUDProps {
  player: PlayerState;
  currentWave: number;
  waveTitle: string;
  waveAnnouncement: string | null;
  boss: Enemy | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onFireMissile: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  currentWave,
  waveTitle,
  waveAnnouncement,
  boss,
  isMuted,
  onToggleMute,
  onPause,
  onFireMissile
}) => {
  const currentWeaponDef = WEAPON_DEFS[player.weaponType];
  const roastPercent = Math.min(100, Math.round((player.roastMeter / 50) * 100));
  const heatPercent = Math.min(100, Math.round(player.heat));

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-3 sm:p-5">
      {/* Top Bar Cluster */}
      <div className="flex items-start justify-between gap-3 w-full">
        {/* Top-Left: Lives, Missiles & Active Weapon */}
        <div className="flex flex-col gap-2">
          {/* Lives and Missiles */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-700/60 rounded-lg px-3 py-1.5 shadow-lg backdrop-blur-none">
            {/* Spaceship Lives (Up to 10) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">LIVES</span>
              <div className="hidden sm:flex items-center gap-0.5">
                {Array.from({ length: MAX_LIVES }).map((_, i) => (
                  <svg
                    key={i}
                    viewBox="0 0 24 24"
                    className={`w-3.5 h-3.5 transition-all ${
                      i < player.lives
                        ? 'text-cyan-400 fill-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]'
                        : 'text-slate-700 fill-slate-800 opacity-40'
                    }`}
                  >
                    <path d="M12 2L17 12L22 17L18 20L12 18L6 20L2 17L7 12Z" />
                  </svg>
                ))}
              </div>
              <span className="text-[11px] font-mono font-bold text-cyan-300 tabular-nums">
                {player.lives}/{MAX_LIVES}
              </span>
            </div>

            <div className="w-[1px] h-4 bg-slate-700/80" />

            {/* Megabomb Missiles */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">NUKE</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <svg
                    key={i}
                    viewBox="0 0 24 24"
                    className={`w-4 h-4 transition-all ${
                      i < player.missiles
                        ? 'text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                        : 'text-slate-700 fill-slate-800 opacity-40'
                    }`}
                  >
                    <path d="M12 2L15 8V18L18 20V22L12 20L6 22V20L9 18V8Z" />
                  </svg>
                ))}
              </div>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onFireMissile();
                }}
                disabled={player.missiles <= 0}
                className="pointer-events-auto ml-1 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase transition bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 disabled:opacity-40 disabled:pointer-events-none"
                title="Launch Megabomb (Right Click or Shift)"
              >
                FIRE [R-CLICK]
              </button>
            </div>
          </div>

          {/* Weapon Level Card */}
          <div className="flex items-center gap-2.5 bg-slate-950/80 border border-slate-700/60 rounded-lg px-3 py-1.5 shadow-lg w-fit">
            <div
              className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px]"
              style={{
                backgroundColor: currentWeaponDef.color,
                boxShadow: `0 0 8px ${currentWeaponDef.color}`
              }}
            />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                WEAPON SYSTEM
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100">
                  {currentWeaponDef.name}
                </span>
                <span
                  className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded"
                  style={{
                    backgroundColor: `${currentWeaponDef.color}22`,
                    color: currentWeaponDef.color,
                    border: `1px solid ${currentWeaponDef.color}66`
                  }}
                >
                  LV.{player.weaponPower}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top-Center: Score & Wave Info */}
        <div className="flex flex-col items-center">
          <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
            SCORE
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)] tabular-nums">
            {player.score.toLocaleString()}
          </div>

          <div className="mt-1 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-0.5 rounded-full">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
              WAVE {currentWave}
            </span>
            <span className="text-[11px] font-medium text-slate-300 truncate max-w-[200px] sm:max-w-xs">
              {waveTitle}
            </span>
          </div>

          {/* Boss Health Bar if Boss Active */}
          {boss && (
            <div className="mt-2 w-64 sm:w-80 flex flex-col gap-1 bg-slate-950/90 border border-red-500/60 rounded-lg p-2 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                <span className="text-red-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {boss.bossAppearance === 'iron_rooster'
                    ? 'MECHANICAL IRON ROOSTER'
                    : boss.bossAppearance === 'death_egg'
                    ? 'DEATH EGG DREADNOUGHT'
                    : boss.bossAppearance === 'hive_queen'
                    ? 'IMPERIAL HIVE QUEEN'
                    : boss.bossAppearance === 'asteroid_golem'
                    ? 'ASTEROID CYBER-GOLEM'
                    : boss.bossAppearance === 'sun_blocker'
                    ? 'SUN-BLOCKER MACHINE'
                    : boss.bossAppearance === 'saucer'
                    ? 'DREADNOUGHT SAUCER'
                    : 'THE DARK CLUCK EMPEROR'}
                </span>
                <span className="text-slate-300 tabular-nums">
                  {Math.max(0, boss.hp)} / {boss.maxHp} HP
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 transition-all duration-100"
                  style={{
                    width: `${Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100))}%`
                  }}
                />
              </div>
              {boss.bossSkillState && boss.bossSkillState.currentSkill !== 'none' && (
                <div className="flex items-center justify-center gap-1.5 py-0.5 px-2 rounded text-[9px] font-bold font-mono uppercase bg-red-950/90 border border-red-500/70 text-red-200 animate-pulse">
                  {boss.bossSkillState.shieldActive && '🛡️ KHIÊN BẢO VỆ PHẢN ĐÒN'}
                  {boss.bossSkillState.currentSkill === 'laser_sweep' && '⚡ QUÉT TIA LASER TỬ THẦN'}
                  {boss.bossSkillState.currentSkill === 'ramming_dash' && '⚠️ CÚ LAO ĐỘT KÍCH'}
                  {boss.bossSkillState.currentSkill === 'spiral_vortex' && '🌀 BÃO ĐẠN XOẮN ỐC'}
                  {boss.bossSkillState.currentSkill === 'cluster_bomb' && '💣 TRỨNG NỔ CHÙM'}
                  {boss.bossSkillState.currentSkill === 'summon_minions' && '🐔 TRIỆU HỒI ĐỘI HỘ VỆ'}
                  {boss.bossSkillState.currentSkill === 'feather_nova' && '🪶 BÃO LÔNG VŨ XOAY 360°'}
                  {boss.bossSkillState.currentSkill === 'meteor_rain' && '☄️ MƯA THIÊN THẠCH TRỨNG LỬA'}
                  {boss.bossSkillState.currentSkill === 'retaliation_burst' && '⚡ PHẢN ĐÒN (BẮN LẠI)'}
                  {boss.bossSkillState.currentSkill === 'gravity_vortex' && '🕳️ HỐ ĐEN HÚT KHÔNG GIAN'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top-Right: Roast Chicken Meter & Action Controls */}
        <div className="flex flex-col items-end gap-2">
          {/* Controls: Mute, Pause */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              className="pointer-events-auto p-1.5 rounded-md bg-slate-950/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              aria-label="Pause Game"
              className="pointer-events-auto p-1.5 rounded-md bg-slate-950/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <Pause className="w-4 h-4 text-slate-200" />
            </button>
          </div>

          {/* Roast Chicken Feast Meter (Authentic CI5 Feature!) */}
          <div className="flex flex-col items-end bg-slate-950/80 border border-amber-600/50 rounded-lg px-3 py-1.5 shadow-lg w-44 sm:w-52">
            <div className="flex justify-between w-full text-[10px] font-bold">
              <span className="text-amber-400 flex items-center gap-1">
                🍗 ROAST FEAST
              </span>
              <span className="font-mono text-amber-200 tabular-nums">
                {player.roastMeter}/50
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mt-1 border border-amber-950">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-150"
                style={{ width: `${roastPercent}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5">
              Full = +1 Nuclear Missile
            </span>
            <div className="flex justify-between w-full text-[9px] font-mono text-cyan-300 mt-1 pt-1 border-t border-slate-800/80">
              <span>+1 LIFE (MAX {MAX_LIVES})</span>
              <span className="tabular-nums">
                {player.roastTotal % DRUMSTICKS_PER_EXTRA_LIFE}/{DRUMSTICKS_PER_EXTRA_LIFE} 🍗
              </span>
            </div>
          </div>

          {/* Combo indicator if active */}
          {player.combo > 1 && (
            <div className="flex items-center gap-1.5 bg-yellow-950/80 border border-yellow-500/60 px-2 py-0.5 rounded shadow">
              <span className="text-[10px] font-bold text-yellow-300 font-mono">
                {player.combo}x COMBO
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Centered Wave Announcement Banner */}
      {waveAnnouncement && (
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center z-30">
          <div className="text-xl sm:text-3xl font-black tracking-widest text-amber-300 uppercase drop-shadow-[0_0_20px_rgba(245,158,11,0.9)] animate-pulse px-7 py-2.5 bg-slate-950/85 border-2 border-amber-500/80 rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.4)]">
            {waveAnnouncement}
          </div>
        </div>
      )}

      {/* Bottom Area: Heat Gauge Indicator (Bottom Right) */}
      <div className="flex justify-between items-end w-full">
        {/* Bottom Left: Key Control Hint */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/70 border border-slate-800/80 px-2.5 py-1 rounded">
          <span>Mouse / WASD: Fly</span>
          <span>·</span>
          <span>Left-Click / Space: Shoot</span>
          <span>·</span>
          <span>Right-Click: Nuke</span>
          <span>·</span>
          <span>P: Pause</span>
        </div>

        {/* Bottom Right: Weapon Heat Gauge */}
        <div className="flex flex-col items-end bg-slate-950/85 border border-slate-700/60 rounded-lg p-2.5 shadow-xl">
          <div className="flex items-center justify-between w-36 sm:w-44 mb-1">
            <span className="text-[10px] font-bold font-mono tracking-wider text-slate-400">
              WEAPON HEAT
            </span>
            <span
              className={`text-[11px] font-mono font-bold tabular-nums ${
                player.isOverheated
                  ? 'text-red-500 animate-pulse'
                  : heatPercent > 75
                  ? 'text-orange-400'
                  : 'text-slate-300'
              }`}
            >
              {player.isOverheated ? 'OVERHEAT!' : `${heatPercent}%`}
            </span>
          </div>
          <div className="w-36 sm:w-44 h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
            <div
              className={`h-full transition-all duration-75 ${
                player.isOverheated
                  ? 'bg-red-600 animate-pulse'
                  : heatPercent > 75
                  ? 'bg-gradient-to-r from-yellow-500 to-red-500'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500'
              }`}
              style={{ width: `${heatPercent}%` }}
            />
            {/* Danger threshold tick at 85% */}
            <div className="absolute top-0 bottom-0 left-[85%] w-[1px] bg-red-400/80" />
          </div>
        </div>
      </div>
    </div>
  );
};
