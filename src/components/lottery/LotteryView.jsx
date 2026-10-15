// LotteryView.jsx - Complete 3D Lottery Game View Component
import React, { useState, useEffect, useRef } from 'react';
import { LotteryEngine } from '../../utils/lotteryEngine';
import { lotteryAudio } from '../../utils/lotteryAudio';
import LotteryCanvas3D from './LotteryCanvas3D';
import LotteryControls from './LotteryControls';
import WinnerAnnouncementModal from './WinnerAnnouncementModal';
import HistoryDrawer from './HistoryDrawer';
import StudentImportModal from './StudentImportModal';

export default function LotteryView({ isFullscreen = false }) {
  const engineRef = useRef(new LotteryEngine());
  const engine = engineRef.current;

  const [gameState, setGameState] = useState(engine.getState());
  const [isMuted, setIsMuted] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

  // Subscribe to engine state updates
  useEffect(() => {
    const unsubscribe = engine.subscribe((state) => {
      setGameState(state);
      if (state.phase === 'ANNOUNCING' && state.currentWinner) {
        setIsWinnerModalOpen(true);
      }
    });
    return () => {
      unsubscribe();
      lotteryAudio.stopDrumSpin();
    };
  }, [engine]);

  // Handle Mute toggle
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    lotteryAudio.setMuted(nextMuted);
  };

  // Start spin
  const handleStartSpin = () => {
    setIsWinnerModalOpen(false);
    engine.startSpin();
  };

  // Stop spin / choose ball
  const handleStopSpin = () => {
    engine.stopAndDrawWinner();
  };

  // Continue after winner reveal
  const handleContinueAfterWinner = () => {
    setIsWinnerModalOpen(false);
    engine.confirmWinnerAndContinue();
    if (gameState.remainingCount > 0) {
      engine.startSpin();
    }
  };

  // Save new student roster
  const handleSaveStudents = (newStudents) => {
    engine.setStudents(newStudents, true);
  };

  // Reset entire session
  const handleResetSession = () => {
    engine.resetSession();
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* 3D Canvas Battlefield for Lottery Balls */}
      <div className="relative w-full">
        <LotteryCanvas3D
          engine={engine}
          gameState={gameState}
          onOpenWinnerModal={() => setIsWinnerModalOpen(true)}
        />
      </div>

      {/* Control Toolbar */}
      <LotteryControls
        engine={engine}
        gameState={gameState}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onStartSpin={handleStartSpin}
        onStopSpin={handleStopSpin}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onResetSession={handleResetSession}
      />

      {/* Winner Announcement Hologram Modal */}
      <WinnerAnnouncementModal
        winner={gameState.currentWinner}
        isOpen={isWinnerModalOpen}
        onClose={() => setIsWinnerModalOpen(false)}
        onContinue={handleContinueAfterWinner}
        isAutoSpinning={gameState.isAutoSpinning}
      />

      {/* History Slide-out Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={engine.history}
        onResetSession={handleResetSession}
      />

      {/* Student List Import & Editor Modal */}
      <StudentImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSaveStudents={handleSaveStudents}
        currentCount={gameState.totalStudents}
      />
    </div>
  );
}

