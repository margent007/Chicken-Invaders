import React, { useState } from 'react';
import { Volume2, VolumeX, Shield, Zap, Sparkles, Crosshair } from 'lucide-react';
import { WEAPON_DEFS } from '../game/rules';

interface TitleScreenProps {
  onStartGame: (shipColor: string) => void;
  highScore: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

const SHIP_COLORS = [
  { name: 'Crimson Wing', color: '#ef4444' },
  { name: 'Plasma Cyan', color: '#06b6d4' },
  { name: 'Emerald Strike', color: '#10b981' },
  { name: 'Solar Gold', color: '#eab308' },
  { name: 'Void Violet', color: '#a855f7' }
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  highScore,
  isMuted,
  onToggleMute
}) => {
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [activeTab, setActiveTab] = useState<'main' | 'weapons' | 'story'>('main');

  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-between p-4 sm:p-8 bg-slate-950/80 select-none overflow-y-auto">
      {/* Top Header Row */}
      <div className="w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-2.5 py-1 rounded">
            EPISODE V: CLUCK OF THE DARK SIDE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-yellow-400">
            RECORD: <span className="font-bold tabular-nums">{highScore.toLocaleString()}</span>
          </div>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Main Centerpiece */}
      <div className="flex flex-col items-center max-w-2xl text-center my-auto py-6">
        {/* Custom SVG Title Lockup */}
        <div className="relative mb-3 flex flex-col items-center">
          {/* Ominous Imperial Chicken Silhouette / Emblem */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 mb-2">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
              {/* Dark Helmet */}
              <path
                d="M18 55 L25 25 Q35 8 50 8 Q65 8 75 25 L82 55 Q50 45 18 55 Z"
                fill="#090d16"
                stroke="#475569"
                strokeWidth="2"
              />
              {/* Vader Helmet Flares */}
              <path
                d="M15 55 L10 75 L30 65 L22 55 Z"
                fill="#090d16"
                stroke="#334155"
                strokeWidth="1.5"
              />
              <path
                d="M85 55 L90 75 L70 65 L78 55 Z"
                fill="#090d16"
                stroke="#334155"
                strokeWidth="1.5"
              />
              {/* Triangular breathing mask */}
              <polygon points="50,45 38,68 62,68" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
              {/* Glowing Sinister Red Eyes */}
              <ellipse cx="38" cy="36" rx="7" ry="4" transform="rotate(10 38 36)" fill="#ef4444" className="drop-shadow-[0_0_8px_#ef4444]" />
              <ellipse cx="62" cy="36" rx="7" ry="4" transform="rotate(-10 62 36)" fill="#ef4444" className="drop-shadow-[0_0_8px_#ef4444]" />
              {/* Golden Emperor Crown */}
              <polygon points="32,15 28,2 40,8 50,0 60,8 72,2 68,15" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
            </svg>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
            CHICKEN INVADERS 5
          </h1>
          <div className="text-lg sm:text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-red-500 uppercase mt-1 drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]">
            CLUCK OF THE DARK SIDE
          </div>
          <div className="text-xs font-semibold text-amber-400 tracking-wider uppercase mt-1">
            BẮN GÀ 5: CUỘC XÂM LĂNG CỦA BÓNG TỐI
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-lg leading-relaxed">
            Đế chế gà Dark Side đang xây dựng cỗ máy lông vũ khổng lồ nhằm che khuất ánh sáng mặt trời chiếu tới Trái Đất. Hãy xuất kích, bắn phá các binh đoàn gà và giải cứu dải ngân hà!
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('main')}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition ${
              activeTab === 'main'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            LAUNCH MISSION
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weapons')}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition ${
              activeTab === 'weapons'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            WEAPONS ARMORY
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('story')}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition ${
              activeTab === 'story'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            INTEL & COMBAT GUIDE
          </button>
        </div>

        {/* Tab 1: Main Launch */}
        {activeTab === 'main' && (
          <div className="flex flex-col items-center w-full max-w-md bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-2xl">
            {/* Spaceship Customizer */}
            <div className="w-full flex flex-col items-center mb-5">
              <span className="text-[11px] font-mono text-slate-400 mb-2">
                SELECT INTERCEPTOR HULL COATING
              </span>
              <div className="flex items-center gap-3">
                {SHIP_COLORS.map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setSelectedColor(c.color)}
                    style={{ backgroundColor: c.color }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      selectedColor === c.color
                        ? 'scale-125 ring-2 ring-white shadow-[0_0_12px_' + c.color + ']'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Launch Campaign Button */}
            <button
              type="button"
              data-start="true"
              onClick={() => onStartGame(selectedColor)}
              className="w-full py-3.5 px-6 rounded-lg font-black tracking-wider text-base uppercase bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)] hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
            >
              🚀 CHƠI CHIẾN DỊCH / PLAY CAMPAIGN (SPACE / ENTER)
            </button>
          </div>
        )}

        {/* Tab 2: Weapons Armory (7 Weapon Classes) */}
        {activeTab === 'weapons' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg text-left bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 max-h-[360px] overflow-y-auto">
            {Object.values(WEAPON_DEFS).map((w) => (
              <div
                key={w.type}
                className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: w.color, boxShadow: `0 0 8px ${w.color}` }}
                  />
                  <span className="text-xs font-bold text-slate-100">{w.name}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {w.description}
                </p>
                <div className="text-[10px] font-mono text-cyan-400 mt-1">
                  Base Dmg: {w.baseDamage} · Heat: {w.heatPerShot}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Story & Combat Intel */}
        {activeTab === 'story' && (
          <div className="w-full max-w-lg bg-slate-900/70 border border-slate-800 rounded-xl p-4 text-left flex flex-col gap-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <Crosshair className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-100">Roast Feast (Tiệc Thịt Gà):</strong> Thu thập đùi gà nướng 🍗! Đầy thanh 50 điểm nhận +1 Bom hạt nhân Megabomb, và cứ đủ 100 đùi gà sẽ tăng thêm +1 mạng (tối đa 10 mạng)!
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-100">Kho vũ khí 10 hệ đạn & Tỉ lệ rơi 12%:</strong> Nhặt hộp quà màu 🎁 (tỉ lệ xuất hiện 12%) để luân chuyển 10 loại đạn (Súng 6 nòng, Đại bác, Đạn nảy, Tia sét, Plasma nặng, Sóng lượn...) và nâng cấp tối đa lên Level 10!
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-100">Kỹ năng Boss đa dạng (10 kỹ năng khốc liệt):</strong> Khiên năng lượng 🛡️, Quét laser tử thần ⚡, Lao đột kích ⚠️, Bão đạn xoắn ốc 🌀, Trứng nổ chùm 💣, Triệu hồi hộ vệ 🐔, Bão lông vũ 360° 🪶, Mưa thiên thạch trứng lửa ☄️, Phản đòn bắn lại ⚡ và Hố đen hút hấp dẫn 🕳️!
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-100">Bom Hạt Nhân Megabomb:</strong> Chuột phải hoặc phím Shift để phát sóng xung kích xóa sạch mọi trứng gà và sát thương toàn bộ phi đội địch!
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Safe Margin Control Hints */}
      <div className="text-center text-[11px] font-mono text-slate-400">
        Chuột / WASD: Bay · Chuột trái / Space: Bắn · Chuột phải / Shift: Bom hạt nhân Nuke · P: Tạm dừng
      </div>
    </div>
  );
};
