import React from 'react';
import { RotateCcw, Home, Play, Trophy, Skull } from 'lucide-react';
import { GameStats } from '../game/types';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart, onHome }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-none select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-2xl font-black tracking-wider text-white uppercase mb-1">
          MISSION PAUSED
        </h2>
        <p className="text-xs text-slate-400 mb-6 font-mono">
          SYSTEMS IN STANDBY
        </p>

        <div className="flex flex-col gap-3 w-full">
          <button
            type="button"
            data-start="true"
            onClick={onResume}
            className="w-full py-3 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition"
          >
            <Play className="w-4 h-4" /> RESUME (P / ESC)
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <RotateCcw className="w-4 h-4" /> RESTART MISSION
          </button>
          <button
            type="button"
            onClick={onHome}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <Home className="w-4 h-4" /> RETURN TO TITLE
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  stats: GameStats;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRestart, onHome }) => {
  const isNewHighScore = stats.score > 0 && stats.score >= stats.highScore;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-none select-none">
      <div className="w-full max-w-md bg-slate-900 border border-red-900/80 rounded-2xl p-6 sm:p-8 shadow-[0_0_40px_rgba(239,68,68,0.3)] flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center mb-3">
          <Skull className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="text-3xl font-black tracking-tight text-white uppercase drop-shadow-[0_0_15px_rgba(239,68,68,0.7)]">
          MISSION FAILED
        </h2>
        <p className="text-xs text-red-400 font-mono mb-5 uppercase tracking-wider">
          The Dark Side chickens prevailed this time
        </p>

        {isNewHighScore && (
          <div className="mb-4 px-3 py-1 bg-yellow-950/80 border border-yellow-500/80 rounded-full flex items-center gap-2 text-yellow-300 text-xs font-bold font-mono animate-bounce">
            <Trophy className="w-3.5 h-3.5" /> NEW HIGH SCORE RECORD!
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">FINAL SCORE</span>
            <span className="text-xl font-bold font-mono text-yellow-400 tabular-nums">
              {stats.score.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">WAVE REACHED</span>
            <span className="text-xl font-bold font-mono text-cyan-400 tabular-nums">
              WAVE {stats.waveReached}
            </span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">CHICKENS ROASTED</span>
            <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
              🍗 {stats.chickensDefeated}
            </span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">FIRE ACCURACY</span>
            <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              {stats.accuracy}%
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="w-full py-3 px-6 rounded-lg font-black tracking-wider text-sm uppercase bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> RETRY MISSION (SPACE / ENTER)
          </button>
          <button
            type="button"
            onClick={onHome}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <Home className="w-4 h-4" /> RETURN TO TITLE
          </button>
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  stats: GameStats;
  onRestart: () => void;
  onHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ stats, onRestart, onHome }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-none select-none">
      <div className="w-full max-w-md bg-slate-900 border border-yellow-500/60 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(234,179,8,0.3)] flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-yellow-950/80 border border-yellow-500/80 flex items-center justify-center mb-3">
          <Trophy className="w-9 h-9 text-yellow-400 drop-shadow-[0_0_10px_#eab308]" />
        </div>

        <h2 className="text-3xl font-black tracking-tight text-white uppercase drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]">
          GALAXY LIBERATED!
        </h2>
        <p className="text-xs text-yellow-400 font-mono mb-5 uppercase tracking-wider">
          The Dark Cluck Emperor is defeated! The sun shines upon Earth once more!
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">LEGENDARY SCORE</span>
            <span className="text-xl font-bold font-mono text-yellow-400 tabular-nums">
              {stats.score.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">WAVES CLEARED</span>
            <span className="text-xl font-bold font-mono text-cyan-400 tabular-nums">
              ALL 100 WAVES
            </span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">CHICKENS FEASTED</span>
            <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
              🍗 {stats.chickensDefeated}
            </span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">ACCURACY</span>
            <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              {stats.accuracy}%
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="w-full py-3.5 px-6 rounded-lg font-black tracking-wider text-sm uppercase bg-gradient-to-r from-yellow-500 via-amber-500 to-red-500 hover:from-yellow-400 hover:to-red-400 text-slate-950 font-mono shadow-[0_0_20px_rgba(250,204,21,0.6)] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> PLAY AGAIN / ENDLESS CAMPAIGN
          </button>
          <button
            type="button"
            onClick={onHome}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <Home className="w-4 h-4" /> RETURN TO TITLE
          </button>
        </div>
      </div>
    </div>
  );
};
