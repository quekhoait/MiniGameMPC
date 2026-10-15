import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, X, Sparkles, Crown, Skull, Heart, Zap, Swords } from 'lucide-react';
import { soundFX } from '../utils/audio';

const FOX_IMAGE_URL = 'https://res.cloudinary.com/ds11ggie4/image/upload/v1791990958/c%C3%A1o_bay-removebg-preview_sz7uol.png';

export default function WinnerModal({
  winner,
  top5 = [],
  isOpen,
  onClose,
  onRestart,
  onEditNames
}) {
  useEffect(() => {
    if (isOpen && winner) {
      soundFX.playVictory();

      // Launch victory fireworks
      const duration = 4.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 35, spread: 360, ticks: 70, zIndex: 9999 };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 60 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: Math.random() * 0.3 + 0.1, y: Math.random() - 0.2 },
          colors: ['#f97316', '#ef4444', '#eab308', '#3b82f6', '#10b981']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: Math.random() * 0.3 + 0.6, y: Math.random() - 0.2 },
          colors: ['#f97316', '#ef4444', '#eab308', '#ec4899', '#8b5cf6']
        });
      }, 350);

      return () => clearInterval(interval);
    }
  }, [isOpen, winner]);

  if (!isOpen || !winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(245,158,11,0.35)] text-center my-auto">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          title="Đóng modal để quan sát chiến trường"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Crown Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/30 to-amber-500/20 border border-amber-400/60 text-amber-300 font-orbitron text-xs font-black tracking-widest uppercase mb-4 animate-bounce">
          <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>VÔ ĐỊCH BATTLE ROYALE</span>
          <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
        </div>

        {/* Winner Avatar with Golden Halo */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-300 blur-xl opacity-70 animate-pulse" />
          <div className="relative w-full h-full rounded-2xl bg-slate-950/90 border-2 border-yellow-400/90 p-3 shadow-2xl flex items-center justify-center overflow-hidden">
            <img
              src={FOX_IMAGE_URL}
              alt="Cáo Vô Địch"
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] transform hover:scale-110 transition duration-300"
            />
          </div>
          <div className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-3 py-0.5 rounded-full font-black text-xs uppercase shadow-md flex items-center gap-1">
            <Sparkles className="w-3 h-3 fill-current" />
            <span>TOP 1 SURVIVOR</span>
          </div>
        </div>

        {/* Winner Name */}
        <div className="mb-5">
          <p className="text-xs sm:text-sm uppercase tracking-widest font-semibold text-slate-400 mb-1">
            CHIẾN BINH SINH TỒN CUỐI CÙNG
          </p>
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400 tracking-tight drop-shadow-md break-words py-1">
            {winner.name}
          </h1>
          <div className="mt-1 text-xs text-slate-400 font-mono">
            Mã định danh ID: #{winner.id}
          </div>
        </div>

        {/* Winner Combat Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6 max-w-lg mx-auto">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
            <div className="flex items-center justify-center gap-1 text-rose-400 text-[11px] font-bold mb-1">
              <Skull className="w-3.5 h-3.5" />
              <span>HẠ GỤC</span>
            </div>
            <div className="font-orbitron font-black text-xl text-white">
              {winner.kills || 0}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
            <div className="flex items-center justify-center gap-1 text-emerald-400 text-[11px] font-bold mb-1">
              <Heart className="w-3.5 h-3.5" />
              <span>MÁU CÒN</span>
            </div>
            <div className="font-orbitron font-black text-xl text-white">
              {Math.round(winner.hp || 0)} <span className="text-[10px] text-slate-400">/ 100</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
            <div className="flex items-center justify-center gap-1 text-amber-400 text-[11px] font-bold mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>SÁT THƯƠNG</span>
            </div>
            <div className="font-orbitron font-black text-xl text-white">
              {winner.damageDealt || 0}
            </div>
          </div>
        </div>

        {/* TOP 5 Survival Leaderboard */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>BẢNG VÀNG TOP 5 SINH TỒN</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">KILLS / SÁT THƯƠNG</span>
          </div>

          <div className="space-y-1.5 pr-1">
            {(top5 || []).slice(0, 5).map((player, index) => {
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition ${
                    isFirst
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/50 text-amber-200 font-bold'
                      : isSecond
                      ? 'bg-slate-800/80 border border-slate-600/50 text-slate-200 font-semibold'
                      : isThird
                      ? 'bg-slate-800/50 border border-amber-800/40 text-amber-300/90 font-medium'
                      : 'bg-slate-900/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 text-center font-orbitron font-bold">
                      {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : `#${index + 1}`}
                    </div>
                    <div className="truncate">
                      <span className="text-white">{player.name}</span>
                      <span className="ml-1.5 text-[10px] text-slate-500">ID #{player.id}</span>
                      {player.isAlive ? (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Sống sót ({Math.round(player.hp)} HP)
                        </span>
                      ) : (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Đã loại
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="font-mono text-right font-semibold text-slate-300 text-[11px] shrink-0">
                    <span className="text-rose-400">{player.kills || 0} ⚔️</span>
                    <span className="mx-1 text-slate-600">|</span>
                    <span className="text-amber-400">{player.damageDealt || 0} dmg</span>
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
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-600 via-red-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-orbitron font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>CHƠI LẠI TRẬN MỚI</span>
          </button>

          <button
            type="button"
            onClick={onEditNames}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm transition cursor-pointer"
          >
            Nhập danh sách mới
          </button>
        </div>
      </div>
    </div>
  );
}
