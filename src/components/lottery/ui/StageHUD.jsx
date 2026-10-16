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
        return '👉 Chạm vào CẦN QUAY ĐỒNG THAU bên phải để bắt đầu quay số';
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
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full">
        {/* Back to Game Selection Menu */}
        <button
          onClick={onBack}
          className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/80 border border-[#B8893B]/40 text-amber-200/90 hover:text-amber-100 text-xs font-serif tracking-wider shadow-lg backdrop-blur-md transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Menu Chọn Game
        </button>

        {/* Center Stage Title & Pool Badge */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-1.5 rounded-full bg-black/60 border border-[#B8893B]/50 text-[#F3E2C4] font-serif text-xs font-bold tracking-widest uppercase shadow-xl backdrop-blur-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            GRAND DRAW 3D • CÒN LẠI {remainingPool.length} BÓNG
          </div>
        </div>

        {/* Audio Mute quick toggle */}
        <button
          onClick={toggleMute}
          className="pointer-events-auto p-2.5 rounded-xl bg-black/60 hover:bg-black/80 border border-[#B8893B]/40 text-amber-300 hover:text-amber-100 shadow-lg backdrop-blur-md transition-all active:scale-95"
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Center Dynamic Prompt Cue */}
      {promptText && !activeModal && (
        <div className="w-full flex justify-center mb-2">
          <div className="pointer-events-auto max-w-lg px-5 py-2.5 rounded-2xl bg-gradient-to-r from-black/80 via-[#1C1512]/90 to-black/80 border border-[#B8893B]/60 text-amber-100 font-serif text-xs sm:text-sm text-center shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-pulse">
            <Sparkles className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
            <span>{promptText}</span>
          </div>
        </div>
      )}
    </div>
  );
}

