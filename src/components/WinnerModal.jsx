import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Medal, RotateCcw, X, Sparkles, Flame, Crown } from 'lucide-react';
import { soundFX } from '../utils/audio';

const FOX_IMAGE_URL = 'https://res.cloudinary.com/ds11ggie4/image/upload/v1791990958/c%C3%A1o_bay-removebg-preview_sz7uol.png';

export default function WinnerModal({
  winner,
  top10 = [],
  isOpen,
  onClose,
  onRestart
}) {
  useEffect(() => {
    if (isOpen && winner) {
      // Play triumph fanfare
      soundFX.playVictory();

      // Launch grand celebratory confetti
      const duration = 4.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#f97316', '#eab308', '#ec4899', '#3b82f6', '#10b981']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#f97316', '#eab308', '#ec4899', '#3b82f6', '#10b981']
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [isOpen, winner]);

  if (!isOpen || !winner) return null;

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(245,158,11,0.35)] text-center my-auto">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          title="Đóng modal để xem sân đua"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Floating Crown Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/30 to-amber-500/20 border border-amber-400/60 text-amber-300 font-orbitron text-xs font-black tracking-widest uppercase mb-4 animate-bounce">
          <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>NHÀ VÔ ĐỊCH FOX RACE</span>
          <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
        </div>

        {/* Winner Avatar with Golden Halo */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-300 blur-xl opacity-70 animate-pulse" />
          <div className="relative w-full h-full rounded-2xl bg-slate-950/90 border-2 border-yellow-400/90 p-3 shadow-2xl flex items-center justify-center overflow-hidden">
            <img
              src={FOX_IMAGE_URL}
              alt="Cáo Vô Địch"
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] -scale-x-100 transform hover:scale-110 transition duration-300"
            />
          </div>
          <div className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-3 py-0.5 rounded-full font-black text-xs uppercase shadow-md flex items-center gap-1">
            <Sparkles className="w-3 h-3 fill-current" />
            <span>TOP 1</span>
          </div>
        </div>

        {/* Winner Name - GIẢI NHẤT SIÊU LỚN */}
        <div className="mb-6">
          <p className="text-xs sm:text-sm uppercase tracking-widest font-semibold text-slate-400 mb-1">
            CHIẾN THẮNG NGOẠN MỤC
          </p>
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400 tracking-tight drop-shadow-md break-words py-1">
            {winner.name}
          </h1>
          <div className="mt-1 flex items-center justify-center gap-3 text-xs text-slate-400 font-mono">
            <span>Mã ID: #{winner.id}</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">Tiến trình: {Math.round(winner.distance)}m</span>
          </div>
        </div>

        {/* TOP 10 Leaderboard */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>BẢNG XẾP HẠNG TOP 10 CHUNG CUỘC</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">KHOẢNG CÁCH</span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {top10.map((player, index) => {
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                    isFirst
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/50 text-amber-200 font-bold'
                      : isSecond
                      ? 'bg-slate-800/80 border border-slate-600/50 text-slate-200 font-semibold'
                      : isThird
                      ? 'bg-slate-800/50 border border-amber-800/40 text-amber-300/90 font-medium'
                      : 'bg-slate-900/40 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 text-center font-orbitron font-bold">
                      {isFirst ? (
                        <span className="text-yellow-400 text-sm">🥇</span>
                      ) : isSecond ? (
                        <span className="text-slate-300 text-sm">🥈</span>
                      ) : isThird ? (
                        <span className="text-amber-600 text-sm">🥉</span>
                      ) : (
                        `#${index + 1}`
                      )}
                    </div>
                    <div className="truncate">
                      <span className="text-white">{player.name}</span>
                      <span className="ml-1.5 text-[10px] text-slate-500">ID #{player.id}</span>
                    </div>
                  </div>

                  <div className="font-mono text-right font-semibold text-slate-300 text-[11px]">
                    {Math.round(player.distance)}m
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-slate-950 font-orbitron font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ĐUA LẠI NGAY</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm transition"
          >
            Xem lại đường đua
          </button>
        </div>
      </div>
    </div>
  );
}

