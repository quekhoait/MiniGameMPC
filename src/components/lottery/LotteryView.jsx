// LotteryView.jsx - Master View for GRAND DRAW Cinematic 3D Lottery Game
import React, { useEffect } from 'react';
import LotteryCanvas3D from './LotteryCanvas3D.jsx';
import StageHUD from './ui/StageHUD.jsx';
import EntryModal from './ui/EntryModal.jsx';
import SettingsModal from './ui/SettingsModal.jsx';
import HistoryModal from './ui/HistoryModal.jsx';
import TicketReveal from './ui/TicketReveal.jsx';
import { useGrandDrawStore } from './store/useGrandDrawStore.js';
import { grandAudio } from './audio/grandDrawAudio.js';

export default function LotteryView({ isFullscreen = false, onBackToMenu }) {
  const activeModal = useGrandDrawStore(state => state.activeModal);

  // Initialize audio on first user interaction
  useEffect(() => {
    const handleGesture = () => {
      grandAudio.ensureContext();
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
    window.addEventListener('pointerdown', handleGesture);
    window.addEventListener('keydown', handleGesture);
    return () => {
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      grandAudio.stopSpinMusic();
    };
  }, []);

  return (
    <div className={`relative w-full ${isFullscreen ? 'h-screen' : 'h-[86vh] min-h-[640px]'} rounded-2xl overflow-hidden bg-[#07070A] border border-[#B8893B]/40 shadow-2xl flex flex-col`}>
      {/* 3D Cinematic Scene */}
      <div className="absolute inset-0 z-0">
        <LotteryCanvas3D />
      </div>

      {/* Stage HUD (Header cues, Menu exit button, prompt pill) */}
      <StageHUD onBack={onBackToMenu} />

      {/* 2D Overlay Modals */}
      <EntryModal />
      <SettingsModal />
      <HistoryModal />
      <TicketReveal />
    </div>
  );
}
