// TicketReveal.jsx - Cinematic Royal Gala Ticket Presentation Overlay
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, ArrowRight } from 'lucide-react';
import { useGrandDrawStore, PHASES } from '../store/useGrandDrawStore.js';

export default function TicketReveal() {
  const phase = useGrandDrawStore(state => state.phase);
  const currentWinner = useGrandDrawStore(state => state.currentWinner);
  const nextDraw = useGrandDrawStore(state => state.nextDraw);
  const remainingPool = useGrandDrawStore(state => state.remainingPool);
  const drawHistory = useGrandDrawStore(state => state.drawHistory);

  const isVisible = phase === PHASES.TICKET_SHOWN && Boolean(currentWinner);

  // Trigger celebratory confetti on reveal
  useEffect(() => {
    if (isVisible) {
      // Golden luxury burst
      confetti({
        particleCount: 140,
        spread: 85,
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
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="w-full max-w-xl flex flex-col items-center">
        {/* Luxury Parchment Ticket Card with Royal Serif Typography */}
        <div className="w-full relative bg-[#FBF7EE] text-[#1E1712] rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-4 border-[#C5942B] overflow-hidden select-none animate-scale-up">
          {/* Inner Ornate Gold Stamped Border */}
          <div className="absolute inset-2.5 border-2 border-[#C5942B]/70 rounded-2xl pointer-events-none" />
          <div className="absolute inset-4 border border-dashed border-[#C5942B]/40 rounded-xl pointer-events-none" />

          {/* Ticket Header & Serial */}
          <div className="flex items-center justify-between border-b border-[#C5942B]/50 pb-4 mb-6">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-[#C5942B]" />
              <span className="font-['Cinzel',serif] font-black tracking-[0.25em] text-xs uppercase text-[#73531F]">
                GRAND DRAW GALA
              </span>
            </div>
            <div className="font-mono text-xs font-bold text-[#8C6627] tracking-wider">
              № {String(currentTicketNum).padStart(5, '0')}
            </div>
          </div>

          {/* Ticket Body Content */}
          <div className="text-center py-4">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#C5942B]/20 text-[#6B4B15] font-['Cinzel',serif] text-xs font-bold tracking-[0.18em] uppercase mb-3 border border-[#C5942B]/40">
              {currentWinner.prize || 'Giải Thưởng May Mắn'}
            </span>

            <h1 className="text-3xl sm:text-4xl font-['Playfair_Display',serif] font-bold text-[#8B1A1A] tracking-normal mb-2 drop-shadow-sm leading-tight">
              {currentWinner.title}
            </h1>

            {currentWinner.note && (
              <p className="text-xs text-[#5C4533] font-serif italic max-w-sm mx-auto mb-3">
                {currentWinner.note}
              </p>
            )}

            {/* Verification Watermark */}
            <div className="mt-5 pt-3.5 border-t border-[#C5942B]/40 flex items-center justify-between text-[11px] text-[#735D4C] font-mono">
              <span className="tracking-wider">ĐÃ XÁC THỰC KẾT QUẢ</span>
              <span>{new Date().toLocaleTimeString('vi-VN')}</span>
              <span className="font-bold text-[#8C6627]">CÒN LẠI {remainingPool.length} BÓNG</span>
            </div>
          </div>

          {/* Red Wax Seal Badge Detail */}
          <div className="absolute -bottom-5 -right-5 w-20 h-20 rounded-full bg-[#8A161C] border-2 border-[#D4AF37] flex items-center justify-center text-white/90 shadow-2xl rotate-12 pointer-events-none">
            <Sparkles className="w-7 h-7 text-[#FFD700]" />
          </div>
        </div>

        {/* Action Controls below Ticket: ONLY KEEP "QUAY TIẾP" BUTTON AS REQUESTED */}
        <div className="mt-8 flex justify-center w-full">
          <button
            onClick={nextDraw}
            className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#C5942B] via-[#F3CA68] to-[#C5942B] text-[#251806] font-['Cinzel',serif] font-black text-sm tracking-[0.15em] shadow-[0_10px_35px_rgba(197,148,43,0.45)] hover:brightness-110 active:scale-95 transition-all border border-[#FFE59E]/60 cursor-pointer"
          >
            QUAY TIẾP ({remainingPool.length} BÓNG CÒN LẠI)
            <ArrowRight className="w-5 h-5 text-[#251806]" />
          </button>
        </div>
      </div>
    </div>
  );
}
