// WinnerAnnouncementModal.jsx - Grand Television-Style Winner Announcement
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, X, RotateCcw, CheckCircle2, User, GraduationCap, Clock } from 'lucide-react';

export default function WinnerAnnouncementModal({
  winner,
  isOpen,
  onClose,
  onContinue,
  isAutoSpinning = false
}) {
  useEffect(() => {
    if (isOpen && winner) {
      // Launch golden celebratory fireworks
      const duration = 3.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 35, spread: 360, ticks: 70, zIndex: 9999 };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: Math.random() * 0.3 + 0.1, y: Math.random() - 0.2 },
          colors: ['#f59e0b', '#fbbf24', '#eab308', '#3b82f6', '#10b981']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: Math.random() * 0.3 + 0.6, y: Math.random() - 0.2 },
          colors: ['#f59e0b', '#ef4444', '#eab308', '#8b5cf6', '#06b6d4']
        });
      }, 350);

      return () => clearInterval(interval);
    }
  }, [isOpen, winner]);

  if (!isOpen || !winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_90px_rgba(245,158,11,0.45)] text-center my-auto">
        
        {/* Close Button to inspect 3D ball in stage */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          title="Đóng để xem sân khấu 3D"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Crown & Order Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/30 to-amber-500/20 border border-amber-400/70 text-amber-300 font-orbitron text-xs font-black tracking-widest uppercase mb-4 animate-bounce">
          <Trophy className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>KẾT QUẢ QUẢ CẦU #{winner.order}</span>
          <Trophy className="w-4 h-4 text-amber-400 fill-amber-400" />
        </div>

        {/* 3D Holographic MSSV Reveal Box */}
        <div className="relative py-4 px-6 mb-5 rounded-2xl bg-gradient-to-b from-amber-500/10 via-slate-950/90 to-slate-950/90 border border-amber-400/60 shadow-inner">
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-1 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>MÃ SỐ SINH VIÊN TRÚNG THƯỞNG</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />
          </p>

          <h1 className="text-4xl sm:text-6xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400 tracking-wider drop-shadow-[0_0_30px_rgba(245,158,11,0.6)] py-1 select-all">
            {winner.mssv}
          </h1>
        </div>

        {/* Student Details Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-w-md mx-auto text-left">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Họ và Tên</div>
              <div className="text-sm font-bold text-white truncate">{winner.name || 'Sinh viên'}</div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Lớp / Khoa</div>
              <div className="text-sm font-bold text-white truncate">{winner.classGroup || 'Không xác định'}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-mono mb-6">
          <Clock className="w-3.5 h-3.5" />
          <span>Thời gian rút bóng: {winner.time} ({winner.date})</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-orbitron font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isAutoSpinning ? 'TIẾP TỤC TỰ ĐỘNG' : 'QUAY TIẾP LƯỢT MỚI'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Xác nhận kết quả</span>
          </button>
        </div>
      </div>
    </div>
  );
}

