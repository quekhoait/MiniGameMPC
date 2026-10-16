// StageHUD.jsx - Minimalist cinematic cues on stage and menu exit button
import React from 'react';
import { ArrowLeft, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useGrandDrawStore, PHASES } from '../store/useGrandDrawStore.js';
import { grandAudio } from '../audio/grandDrawAudio.js';

export default function StageHUD({ onBack }) {
  const phase = useGrandDrawStore(state => state.phase);
  const remainingPool = useGrandDrawStore(state => state.remainingPool);
  const activeModal = useGrandDrawStore(state => state.activeModal);
  const setActiveModal = useGrandDrawStore(state => state.setActiveModal);
  const [isMuted, setIsMuted] = React.useState(false);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    grandAudio.setMuted(next);
  };

  // Helper prompt message based on stage phase
  const getStagePrompt = () => {
    switch (phase) {
      case PHASES.EDITING:
        return 'Bảng danh sách đang mở. Hãy kiểm tra hoặc dán danh sách rồi bấm "Tiến hành quay số".';
      case PHASES.PACKING:
        return 'Các quả cầu đang tự nạp vào lồng...';
      case PHASES.LOADING_CAGE:
        return 'Đang khóa nắp lồng cầu...';
      case PHASES.IDLE_READY:
        return '👉 Chạm vào CẦN QUAY ĐỒNG THAU hoặc CÁO MAY MẮN để bắt đầu quay số';
      case PHASES.SPINNING:
        return '🌀 Lồng quay đang đảo hỗn loạn...';
      case PHASES.DECELERATING:
        return 'Lồng quay đang giảm tốc... Chuẩn bị xả bóng!';
      case PHASES.DISPENSING:
        return 'Quả cầu may mắn đang lăn ra đĩa nhung...';
      case PHASES.BALL_PRESENTED:
        return '✨ CHẠM VÀO QUẢ CẦU VÀNG để tách vỏ và mở vé trúng thưởng!';
      case PHASES.OPENING:
        return '✨ Quả cầu đang tách vỏ...';
      case PHASES.TICKET_SHOWN:
        return 'Chúc mừng người chiến thắng!';
      case PHASES.FINISHED:
        return 'Đã quay hết danh sách người tham gia! Chạm vào Bìa kẹp để thêm mới.';
      default:
        return '';
    }
  };

  const promptText = getStagePrompt();

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

      {/* Bottom Center Dynamic Prompt Cue (Discreet & Elegant) */}
      {promptText && !activeModal && (
        <div className="w-full flex justify-center mb-5 p-4 pointer-events-none">
          <div className="pointer-events-auto max-w-lg px-6 py-2.5 rounded-2xl bg-black/75 border border-[#B8893B]/50 text-amber-100 font-['Cinzel',serif] text-xs sm:text-sm text-center shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-[#D4AF37] flex-shrink-0 animate-pulse" />
            <span className="tracking-wide">{promptText}</span>
          </div>
        </div>
      )}
    </div>
  );
}

