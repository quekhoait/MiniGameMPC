import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RaceEngine } from './utils/raceEngine';
import { soundFX } from './utils/audio';
import NameInput from './components/NameInput';
import RaceCanvas from './components/RaceCanvas';
import RaceControls from './components/RaceControls';
import Countdown from './components/Countdown';
import WinnerModal from './components/WinnerModal';
import LiveRanking from './components/LiveRanking';
import { Sparkles, Maximize, Minimize, Flame, Trophy } from 'lucide-react';

const FOX_AVATAR = 'https://res.cloudinary.com/ds11ggie4/image/upload/v1791990958/c%C3%A1o_bay-removebg-preview_sz7uol.png';

export default function App() {
  // Engine singleton reference
  const engineRef = useRef(new RaceEngine());
  const engine = engineRef.current;

  // Game States: 'SETUP' | 'COUNTDOWN' | 'RACING' | 'FINISHED'
  const [gameState, setGameState] = useState('SETUP');
  const [countdownPhase, setCountdownPhase] = useState(null);
  const [raceTime, setRaceTime] = useState(0);

  // Participants & Results
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [top10, setTop10] = useState([]);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

  // Settings & Toggles
  const [isMuted, setIsMuted] = useState(false);
  const [showLiveRanking, setShowLiveRanking] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load initial players from LocalStorage if available
  useEffect(() => {
    const saved = localStorage.getItem('fox_race_names');
    if (saved) {
      const lines = saved
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .slice(0, 400);

      if (lines.length >= 2) {
        const loadedPlayers = lines.map((name, idx) => ({ id: idx + 1, name }));
        setPlayers(loadedPlayers);
        const w = window.innerWidth || 1400;
        const h = Math.round(window.innerHeight * 0.9) || 800;
        engine.initFoxes(loadedPlayers, h, w);
      }
    }
  }, [engine]);

  // Handle fleet confirmation from NameInput
  const handleFoxesReady = (newPlayers) => {
    setPlayers(newPlayers);
    const w = window.innerWidth || 1400;
    const h = Math.round(window.innerHeight * 0.9) || 800;
    engine.initFoxes(newPlayers, h, w);
    setGameState('SETUP');
  };

  // Start the race procedure with 3, 2, 1, GO!
  const handleStartRace = () => {
    if (players.length < 2) return;
    if (gameState === 'RACING' || gameState === 'COUNTDOWN') return;

    soundFX.resume();
    setGameState('COUNTDOWN');
    setCountdownPhase(3);

    // Sequence 3 -> 2 -> 1 -> GO
    setTimeout(() => {
      setCountdownPhase(2);
    }, 850);

    setTimeout(() => {
      setCountdownPhase(1);
    }, 1700);

    setTimeout(() => {
      setCountdownPhase('GO');
      // Official race starts exactly on GO
      engine.startRace();
      setGameState('RACING');
      setRaceTime(0);
    }, 2550);

    setTimeout(() => {
      setCountdownPhase(null);
    }, 3400);
  };

  // Called during race loop from RaceCanvas
  const handleTimeUpdate = (time) => {
    setRaceTime(time);
    setTop10([...engine.top10]);
  };

  // Called when 10.0 seconds race time reached
  const handleRaceFinish = (finalWinner, finalTop10) => {
    setGameState('FINISHED');
    setWinner(finalWinner);
    setTop10(finalTop10);
    setIsWinnerModalOpen(true);
  };

  // Restart race (reset all foxes to starting line with same players)
  const handleRestartRace = () => {
    engine.reset();
    setGameState('SETUP');
    setCountdownPhase(null);
    setRaceTime(0);
    setWinner(null);
    setTop10([]);
    setIsWinnerModalOpen(false);
  };

  // Open Name Input to edit or paste new names
  const handleEditNames = () => {
    if (gameState === 'RACING') return;
    setGameState('SETUP');
    setIsWinnerModalOpen(false);
  };

  // Toggle Sound FX
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundFX.setMuted(nextMuted);
  };

  // Toggle Fullscreen mode for live presentations & broadcasts
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Top Navigation & Branding Bar */}
      <header className="w-full bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5">
        <div className="w-full flex items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-orange-500/30 flex items-center justify-center overflow-hidden">
              <img
                src={FOX_AVATAR}
                alt="Fox Logo"
                className="w-full h-full object-contain filter drop-shadow -scale-x-100 hover:scale-110 transition duration-300"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-orbitron font-black text-lg sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200 tracking-wider">
                  FOX RACE
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40 uppercase">
                  10s Sprint
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Cuộc Đua Cáo Bay Siêu Tốc (Hỗ trợ 400 Cáo)
              </p>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition shadow-sm"
              title="Toàn màn hình livestream"
            >
              {isFullscreen ? <Minimize className="w-4 h-4 text-orange-400" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Content - 100% Full Width */}
      <main className="flex-1 w-full px-2 sm:px-4 md:px-6 py-3 flex flex-col gap-3">
        
        {/* Race HUD / Countdown Clock */}
        <Countdown
          countdownPhase={countdownPhase}
          raceTime={raceTime}
          totalDuration={10.0}
          isRacing={gameState === 'RACING'}
          leader={top10[0] || null}
        />

        {/* Name Input Setup Screen (When not racing and no players or manually clicked edit) */}
        {players.length === 0 ? (
          <div className="my-auto py-8">
            <NameInput onFoxesReady={handleFoxesReady} initialNames={players} />
          </div>
        ) : (
          <>
            {/* Race Arena / Canvas Container */}
            <div className="relative w-full">
              <RaceCanvas
                engine={engine}
                isRacing={gameState === 'RACING'}
                onTimeUpdate={handleTimeUpdate}
                onRaceFinish={handleRaceFinish}
              />

              {/* Real-time Top 10 Overlay on Canvas */}
              {showLiveRanking && (
                <LiveRanking
                  top10={top10}
                  isOpen={showLiveRanking}
                  onClose={() => setShowLiveRanking(false)}
                />
              )}
            </div>

            {/* Race Controls Toolbar */}
            <RaceControls
              isRacing={gameState === 'RACING'}
              isFinished={gameState === 'FINISHED'}
              hasFoxes={players.length >= 2}
              foxCount={players.length}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onStartRace={handleStartRace}
              onRestartRace={handleRestartRace}
              onEditNames={handleEditNames}
              showLiveRanking={showLiveRanking}
              onToggleLiveRanking={() => setShowLiveRanking(!showLiveRanking)}
            />

            {/* Bottom Collapsible: Edit names or check full participant list */}
            {gameState === 'SETUP' && (
              <div className="mt-4">
                <details className="group bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden transition-all">
                  <summary className="px-5 py-3.5 cursor-pointer font-bold text-xs uppercase text-slate-300 hover:text-white flex items-center justify-between select-none">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-orange-400" />
                      Chỉnh sửa danh sách người chơi ({players.length} người)
                    </span>
                    <span className="text-slate-500 text-xs font-mono group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <div className="p-4 border-t border-slate-800/80">
                    <NameInput onFoxesReady={handleFoxesReady} initialNames={players} />
                  </div>
                </details>
              </div>
            )}
          </>
        )}
      </main>

      {/* Winner Modal */}
      <WinnerModal
        winner={winner}
        top10={top10}
        isOpen={isWinnerModalOpen}
        onClose={() => setIsWinnerModalOpen(false)}
        onRestart={handleRestartRace}
      />

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-3 text-center text-xs text-slate-500">
        <p>FOX RACE – CUỘC ĐUA CÁO BAY • Chuẩn 10.0 Giây • Thuật Toán Mô Phỏng raceEngine</p>
      </footer>
    </div>
  );
}
