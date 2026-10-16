// TicketReveal.jsx - Cinematic Gala Ticket Presentation Overlay
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, ArrowRight, History, Edit3 } from 'lucide-react';
import { useGrandDrawStore, PHASES } from '../store/useGrandDrawStore.js';

export default function TicketReveal() {
  const phase = useGrandDrawStore(state => state.phase);
  const currentWinner = useGrandDrawStore(state => state.currentWinner);
  const nextDraw = useGrandDrawStore(state => state.nextDraw);
  const setActiveModal = useGrandDrawStore(state => state.setActiveModal);
  const remainingPool = useGrandDrawStore(state => state.remainingPool);
  const drawHistory = useGrandDrawStore(state => state.drawHistory);

  const isVisible = phase === PHASES.TICKET_SHOWN && Boolean(currentWinner);

  // Trigger celebratory confetti on reveal
  useEffect(() => {
    if (isVisible) {
      // Golden luxury burst
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#FFDF6D', '#FF3B5C', '#E67E22', '#FFFFFF'],
        ticks: 240
      });

      // Side cannons
      const end = Date.now() + 1500;
      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#D4AF37', '#FFB84D']
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#D4AF37', '#FF3B5C']
        });
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const currentTicketNum = drawHistory[0]?.ticketNumber || 1;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="w-full max-w-xl flex flex-col items-center">
        {/* Parchment Ticket Card */}
        <div className="w-full relative bg-[#F7F2E7] text-[#241A13] rounded-2xl p-7 shadow-2xl border-4 border-[#B8893B] overflow-hidden select-none animate-scale-up">
          {/* Inner Ornate Gold Stamped Border */}
          <div className="absolute inset-2 border-2 border-[#C8A155]/60 rounded-xl pointer-events-none" />
          <div className="absolute inset-3 border border-dashed border-[#C8A155]/40 rounded-lg pointer-events-none" />

          {/* Ticket Header & Serial */}
          <div className="flex items-center justify-between border-b border-[#C8A155]/50 pb-3 mb-5">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#B8893B]" />
              <span className="font-serif font-black tracking-widest text-xs uppercase text-[#73531F]">
                GRAND DRAW GALA
              </span>
            </div>
            <div className="font-mono text-xs font-bold text-[#8C6627]">
              № {String(currentTicketNum).padStart(5, '0')}
            </div>
          </div>

          {/* Ticket Body Content */}
          <div className="text-center py-3">
            <span className="inline-block px-3 py-1 rounded-full bg-[#B8893B]/20 text-[#6B4B15] font-serif text-xs font-semibold tracking-wider uppercase mb-2">
              {currentWinner.prize || 'Giải Thưởng May Mắn'}
            </span>

            <h1 className="text-3xl sm:text-4xl font-serif font-black text-[#8B1A1A] tracking-tight mb-2 drop-shadow-sm">
              {currentWinner.title}
            </h1>

            {currentWinner.note && (
              <p className="text-xs text-[#5C4533] font-serif italic max-w-sm mx-auto mb-3">
                {currentWinner.note}
              </p>
            )}

            {/* Verification Watermark */}
            <div className="mt-4 pt-3 border-t border-[#C8A155]/40 flex items-center justify-between text-[11px] text-[#735D4C] font-mono">
              <span>ĐÃ XÁC THỰC KẾT QUẢ</span>
              <span>{new Date().toLocaleTimeString('vi-VN')}</span>
              <span>CÒN LẠI: {remainingPool.length} BÓNG</span>
            </div>
          </div>

          {/* Red Wax Seal Badge Detail */}
          <div className="absolute -bottom-4 -right-4 w-18 h-18 rounded-full bg-[#8A161C] border-2 border-[#D4AF37] flex items-center justify-center text-white/90 shadow-lg rotate-12 pointer-events-none">
            <Sparkles className="w-6 h-6 text-[#FFD700]" />
          </div>
        </div>

        {/* Action Controls below Ticket */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
          {/* Continue Next Draw */}
          <button
            onClick={nextDraw}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#B8893B] via-[#E5B860] to-[#B8893B] text-[#251806] font-serif font-bold text-sm tracking-wide shadow-xl hover:brightness-110 active:scale-95 transition-all"
          >
            QUAY TIẾP ({remainingPool.length} BÓNG CÒN LẠI)
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* View Draw History in Chest */}
          <button
            onClick={() => setActiveModal('HISTORY')}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1B1513]/90 hover:bg-[#2B211E] border border-amber-900/60 text-amber-200 text-sm font-medium transition-colors shadow-lg"
          >
            <History className="w-4 h-4 text-amber-400" />
            Lịch Sử Đã Trúng
          </button>

          {/* Edit List */}
          <button
            onClick={() => setActiveModal('ENTRY')}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1B1513]/90 hover:bg-[#2B211E] border border-amber-900/60 text-amber-200 text-sm font-medium transition-colors shadow-lg"
          >
            <Edit3 className="w-4 h-4 text-amber-400" />
            Soạn Danh Sách
          </button>
        </div>
      </div>
    </div>
  );
}

