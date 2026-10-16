// StageHUD.jsx - Minimalist cinematic cues on stage and menu exit button
import React from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { useGrandDrawStore } from '../store/useGrandDrawStore.js';
import { grandAudio } from '../audio/grandDrawAudio.js';

export default function StageHUD({ onBack }) {
  const remainingPool = useGrandDrawStore(state => state.remainingPool);
  const [isMuted, setIsMuted] = React.useState(false);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    grandAudio.setMuted(next);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between">
      {/* Top Hover Detection Zone: Auto-hides buttons until cursor moves near top */}
      <div className="group pointer-events-auto w-full pt-4 px-4 sm:px-6 pb-8 transition-all">
        {/* Subtle golden hint bar when hidden */}
        <div className="w-16 h-1 mx-auto rounded-full bg-amber-400/30 group-hover:opacity-0 transition-opacity duration-300 shadow-[0_0_10px_rgba(212,175,55,0.4)]" />

        {/* Top Controls Bar: Hidden by default (opacity-0), reveals on hover */}
        <div className="flex items-center justify-between w-full opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out">
          {/* Back to Game Selection Menu */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/75 hover:bg-black/90 border border-[#B8893B]/50 hover:border-[#F2D28A] text-amber-200/90 hover:text-amber-100 text-xs font-['Cinzel',serif] tracking-wider shadow-2xl backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Menu Chọn Game
          </button>

          {/* Center Stage Title & Pool Badge */}
          <div className="flex items-center gap-3">
            <div className="px-5 py-2 rounded-full bg-black/75 border border-[#B8893B]/60 text-[#F3E2C4] font-['Cinzel',serif] text-xs font-bold tracking-[0.2em] uppercase shadow-2xl backdrop-blur-md flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              GRAND DRAW GALA • CÒN LẠI {remainingPool.length} BÓNG
            </div>
          </div>

          {/* Audio Mute quick toggle */}
          <button
            onClick={toggleMute}
            className="p-2.5 rounded-xl bg-black/75 hover:bg-black/90 border border-[#B8893B]/50 hover:border-[#F2D28A] text-amber-300 hover:text-amber-100 shadow-2xl backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

