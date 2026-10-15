import React, { useEffect, useState } from 'react';
import { Timer, Zap, Trophy } from 'lucide-react';
import { soundFX } from '../utils/audio';

export default function Countdown({
  countdownPhase, // null | 3 | 2 | 1 | 'GO'
  raceTime,       // current elapsed seconds (0 -> 10.0)
  totalDuration = 10.0,
  isRacing = false,
  leader = null
}) {
  const [animKey, setAnimKey] = useState(0);

  // Play audio on countdownPhase change
  useEffect(() => {
    if (countdownPhase === 3 || countdownPhase === 2 || countdownPhase === 1) {
      soundFX.playCountdownBeep(countdownPhase === 1 ? 660 : 520, 0.2);
      setAnimKey(prev => prev + 1);
    } else if (countdownPhase === 'GO') {
      soundFX.playStartHorn();
      setAnimKey(prev => prev + 1);
    }
  }, [countdownPhase]);

  const remaining = Math.max(0, totalDuration - raceTime);
  const formattedSeconds = remaining.toFixed(2);
  const progressPercent = Math.min(100, (raceTime / totalDuration) * 100);

  return (
    <>
      {/* 3, 2, 1, GO! Fullscreen Overlay Animation */}
      {countdownPhase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-sm">
          <div
            key={animKey}
            className={`font-orbitron font-black text-center select-none transform transition-all duration-300 ${
              countdownPhase === 'GO'
                ? 'text-7xl sm:text-9xl md:text-[14rem] text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-600 animate-bounce drop-shadow-[0_0_50px_rgba(245,158,11,0.9)]'
                : 'text-7xl sm:text-9xl md:text-[12rem] text-transparent bg-clip-text bg-gradient-to-b from-white via-orange-300 to-orange-600 animate-pulse drop-shadow-[0_0_40px_rgba(234,88,12,0.8)] scale-110'
            }`}
          >
            {countdownPhase}
          </div>
        </div>
      )}

      {/* Racing Live HUD Bar */}
      {isRacing && (
        <div className="w-full my-1">
          <div className="w-full bg-slate-900/90 border border-orange-500/50 rounded-2xl p-3 sm:p-4 shadow-xl shadow-orange-950/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
            {/* Countdown Clock (10.0s -> 0.0s) */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600/30 border border-orange-500/60 flex items-center justify-center text-orange-400">
                <Timer className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
              <div>
                <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Thời Gian Đua (Chính Xác 10s)
                </div>
                <div className="font-orbitron font-black text-2xl sm:text-3xl text-orange-400 tracking-tight flex items-baseline gap-1">
                  <span>{formattedSeconds}</span>
                  <span className="text-sm font-normal text-slate-400">s</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex-1 min-w-[200px] max-w-md mx-2">
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>XUẤT PHÁT</span>
                <span className="text-orange-400 font-bold">{Math.round(progressPercent)}%</span>
                <span>VẠCH ĐÍCH</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/80 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 rounded-full transition-all duration-75 relative shadow-[0_0_12px_rgba(251,191,36,0.7)]"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>
            </div>

            {/* Current Top 1 Leader Badge */}
            {leader && (
              <div className="flex items-center gap-2.5 bg-slate-950/80 border border-amber-500/50 px-3.5 py-1.5 rounded-xl shadow-inner">
                <Trophy className="w-4 h-4 text-yellow-400 shrink-0 animate-bounce" />
                <div className="text-right">
                  <div className="text-[10px] text-amber-400/90 font-bold uppercase tracking-wider">
                    DẪN ĐẦU TẠM THỜI
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white max-w-[130px] truncate">
                    {leader.name}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

