import React, { useState, useEffect, useRef } from 'react';
import { GameEngine } from './utils/gameEngine';
import { soundFX } from './utils/audio';
import NameInput from './components/NameInput';
import GameCanvas from './components/GameCanvas';
import GameHUD from './components/GameHUD';
import GameControls from './components/GameControls';
import WinnerModal from './components/WinnerModal';
import { Sparkles, Maximize, Minimize, Volume2, VolumeX, RotateCcw, Play } from 'lucide-react';

const FOX_AVATAR = 'https://res.cloudinary.com/ds11ggie4/image/upload/v1791990958/c%C3%A1o_bay-removebg-preview_sz7uol.png';

export default function App() {
  // Engine singleton
  const engineRef = useRef(new GameEngine());
  const engine = engineRef.current;

  // Configurable Durations (3s - 60s for Lobby, 5s - 60s for Battle)
  const [lobbyDuration, setLobbyDuration] = useState(10);
  const [battleDuration, setBattleDuration] = useState(10);

  // Battle State tracking
  const [hudState, setHudState] = useState({
    phase: 'IDLE', // 'IDLE' | 'LOBBY' | 'BATTLE' | 'FINISHED'
    lobbyTime: 0,
    battleTime: 0,
    lobbyDuration: 10,
    battleDuration: 10,
    aliveCount: 0,
    totalFoxes: 0,
    isRapidFire: false,
    isDuelMode: false
  });

  // Participants & Results (Top 5 Survivors)
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [top5, setTop5] = useState([]);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

  // Settings
  const [speedScale, setSpeedScale] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditingNames, setIsEditingNames] = useState(false);

  // Update speed scale
  const handleUpdateSpeedScale = (val) => {
    const clamped = Math.max(0.3, Math.min(2.0, Number(val)));
    setSpeedScale(clamped);
    engine.setSpeedScale(clamped);
  };

  // Listen to browser fullscreen changes (e.g. user presses ESC)
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Update lobby duration
  const handleUpdateLobbyDuration = (val) => {
    const clamped = Math.min(60, Math.max(3, val));
    setLobbyDuration(clamped);
    engine.setDurations(clamped, battleDuration);
    setHudState(prev => ({ ...prev, lobbyDuration: clamped }));
  };

  // Update battle duration
  const handleUpdateBattleDuration = (val) => {
    const clamped = Math.min(60, Math.max(5, val));
    setBattleDuration(clamped);
    engine.setDurations(lobbyDuration, clamped);
    setHudState(prev => ({ ...prev, battleDuration: clamped }));
  };

  // Load initial players from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('fox_battle_names') || localStorage.getItem('fox_race_names');
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
        const h = Math.round(window.innerHeight * 0.88) || 750;
        engine.initFoxes(loadedPlayers, w, h);
        engine.setDurations(lobbyDuration, battleDuration);
        setHudState(prev => ({
          ...prev,
          aliveCount: loadedPlayers.length,
          totalFoxes: loadedPlayers.length,
          lobbyDuration,
          battleDuration
        }));
      }
    }
  }, [engine]);

  // Handle fleet creation from NameInput
  const handleFoxesReady = (newPlayers) => {
    setPlayers(newPlayers);
    const w = window.innerWidth || 1400;
    const h = Math.round(window.innerHeight * 0.88) || 750;
    engine.initFoxes(newPlayers, w, h);
    engine.setDurations(lobbyDuration, battleDuration);
    setHudState({
      phase: 'IDLE',
      lobbyTime: 0,
      battleTime: 0,
      lobbyDuration,
      battleDuration,
      aliveCount: newPlayers.length,
      totalFoxes: newPlayers.length,
      isRapidFire: false,
      isDuelMode: false
    });
    setIsEditingNames(false);
  };

  // Start Battle procedure (Phase 1: Configured Lobby -> Phase 2: Configured Combat)
  const handleStartGame = () => {
    if (players.length < 2) return;
    if (hudState.phase === 'LOBBY' || hudState.phase === 'BATTLE') return;

    soundFX.resume();
    engine.setDurations(lobbyDuration, battleDuration);
    engine.startLobby();
    setHudState({
      phase: 'LOBBY',
      lobbyTime: 0,
      battleTime: 0,
      lobbyDuration,
      battleDuration,
      aliveCount: players.length,
      totalFoxes: players.length,
      isRapidFire: false,
      isDuelMode: false
    });
    setIsEditingNames(false);
    setIsWinnerModalOpen(false);
  };

  // Time update callback from Engine (stable ref to prevent canvas re-mounts)
  const handleTimeUpdate = React.useCallback((state) => {
    setHudState(state);
  }, []);

  // Called when Battle ends - only top 5 survivors are saved
  const handleBattleFinish = React.useCallback((finalWinner, finalTop5) => {
    setWinner(finalWinner);
    setTop5(finalTop5);
    setIsWinnerModalOpen(true);
    setHudState(prev => ({ ...prev, phase: 'FINISHED' }));
  }, []);

  // Restart match with same players
  const handleRestartGame = () => {
    engine.reset();
    engine.setDurations(lobbyDuration, battleDuration);
    setWinner(null);
    setTop5([]);
    setIsWinnerModalOpen(false);
    setHudState({
      phase: 'IDLE',
      lobbyTime: 0,
      battleTime: 0,
      lobbyDuration,
      battleDuration,
      aliveCount: players.length,
      totalFoxes: players.length,
      isRapidFire: false,
      isDuelMode: false
    });
  };

  // Edit list of names
  const handleEditNames = () => {
    if (hudState.phase === 'LOBBY' || hudState.phase === 'BATTLE') return;
    setIsEditingNames(true);
    setIsWinnerModalOpen(false);
  };

  // Toggle Sound FX
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundFX.setMuted(nextMuted);
  };

  // Toggle Fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Fullscreen error: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // =========================================================================
  // FULLSCREEN MODE VIEW: 100% Canvas, Sleek Floating HUD, No Header, No Tools
  // =========================================================================
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-slate-950 overflow-hidden z-40 select-none">
        {/* Fullscreen 2D Canvas Battlefield */}
        <GameCanvas
          engine={engine}
          isFullscreen={true}
          onTimeUpdate={handleTimeUpdate}
          onBattleFinish={handleBattleFinish}
        />

        {/* Floating Slim Compact HUD Bar (Only ~36px height, does not block foxes!) */}
        <div className="fixed top-2.5 left-4 right-20 z-50 pointer-events-none">
          <GameHUD
            phase={hudState.phase}
            lobbyTime={hudState.lobbyTime}
            battleTime={hudState.battleTime}
            lobbyDuration={hudState.lobbyDuration || lobbyDuration}
            battleDuration={hudState.battleDuration || battleDuration}
            aliveCount={hudState.aliveCount}
            totalFoxes={hudState.totalFoxes}
            isRapidFire={hudState.isRapidFire}
            isDuelMode={hudState.isDuelMode}
            isCompact={true}
          />
        </div>

        {/* Floating Top Right Controls */}
        <div className="fixed top-2.5 right-3 z-50 flex items-center gap-1.5 pointer-events-auto">
          {/* Mute Toggle */}
          <button
            type="button"
            onClick={handleToggleMute}
            className="p-2 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-slate-700/70 text-slate-300 hover:text-white shadow-lg backdrop-blur-md transition cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Start Battle Button if Idle */}
          {hudState.phase === 'IDLE' && players.length >= 2 && (
            <button
              type="button"
              onClick={handleStartGame}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-orbitron font-bold text-xs tracking-wider shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>BẮT ĐẦU</span>
            </button>
          )}

          {/* Replay Button if Finished */}
          {hudState.phase === 'FINISHED' && (
            <button
              type="button"
              onClick={handleRestartGame}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900/85 hover:bg-slate-800 border border-orange-500/80 text-orange-400 font-bold text-xs shadow-lg backdrop-blur-md transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Chơi lại</span>
            </button>
          )}

          {/* Exit Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-orange-500/70 text-orange-400 hover:text-orange-300 shadow-lg backdrop-blur-md transition cursor-pointer"
            title="Thu nhỏ màn hình (hoặc bấm ESC)"
          >
            <Minimize className="w-4 h-4" />
          </button>
        </div>

        {/* Winner Celebration Modal */}
        <WinnerModal
          winner={winner}
          top5={top5}
          isOpen={isWinnerModalOpen}
          onClose={() => setIsWinnerModalOpen(false)}
          onRestart={handleRestartGame}
          onEditNames={handleEditNames}
        />
      </div>
    );
  }

  // =========================================================================
  // STANDARD VIEW: Header, Controls, Canvas, Roster
  // =========================================================================
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Top Branding Bar */}
      <header className="w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5">
        <div className="w-full flex items-center justify-between gap-4">
          
          {/* Logo & Game Title */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 p-0.5 shadow-lg shadow-red-500/30 flex items-center justify-center overflow-hidden">
              <img
                src={FOX_AVATAR}
                alt="Fox Avatar"
                className="w-full h-full object-contain filter drop-shadow hover:scale-110 transition duration-300"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-orbitron font-black text-lg sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-amber-300 tracking-wider">
                  FOX BATTLE ROYALE
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 uppercase">
                  Đại Chiến 400 Cáo Bay
                </span>
                <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  60 FPS 2D ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Tự chỉnh Sảnh (≤60s) • Chiến Đấu (≤60s) • &lt;150 Bắn & Bay Nhanh • Top 5 Sinh Tồn
              </p>
            </div>
          </div>

          {/* Fullscreen Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition shadow-sm cursor-pointer"
              title="Toàn màn hình livestream (Ẩn header & công cụ)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4 text-orange-400" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Screen */}
      <main className="flex-1 w-full px-2 sm:px-4 md:px-6 py-3 flex flex-col gap-3">
        
        {/* Battle Royale HUD Timer & Stats */}
        <GameHUD
          phase={hudState.phase}
          lobbyTime={hudState.lobbyTime}
          battleTime={hudState.battleTime}
          lobbyDuration={hudState.lobbyDuration || lobbyDuration}
          battleDuration={hudState.battleDuration || battleDuration}
          aliveCount={hudState.aliveCount}
          totalFoxes={hudState.totalFoxes}
          isRapidFire={hudState.isRapidFire}
          isDuelMode={hudState.isDuelMode}
        />

        {/* Name Input screen when no players or editing */}
        {players.length === 0 || isEditingNames ? (
          <div className="my-auto py-8">
            <NameInput onFoxesReady={handleFoxesReady} initialNames={players} />
          </div>
        ) : (
          <>
            {/* 2D Canvas Battlefield */}
            <div className="relative w-full">
              <GameCanvas
                engine={engine}
                isFullscreen={false}
                onTimeUpdate={handleTimeUpdate}
                onBattleFinish={handleBattleFinish}
              />
            </div>

            {/* Battle Controls Toolbar with Configurable Time Sliders */}
            <GameControls
              phase={hudState.phase}
              foxCount={players.length}
              hasFoxes={players.length >= 2}
              isMuted={isMuted}
              speedScale={speedScale}
              onUpdateSpeedScale={handleUpdateSpeedScale}
              lobbyDuration={lobbyDuration}
              battleDuration={battleDuration}
              onUpdateLobbyDuration={handleUpdateLobbyDuration}
              onUpdateBattleDuration={handleUpdateBattleDuration}
              onToggleMute={handleToggleMute}
              onStartGame={handleStartGame}
              onRestartGame={handleRestartGame}
              onEditNames={handleEditNames}
            />

            {/* Bottom Collapsible: Quick roster review */}
            {hudState.phase === 'IDLE' && (
              <div className="mt-2">
                <details className="group bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden transition-all">
                  <summary className="px-5 py-3 cursor-pointer font-bold text-xs uppercase text-slate-300 hover:text-white flex items-center justify-between select-none">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-orange-400" />
                      Danh sách {players.length} chiến binh tham chiến
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

      {/* Winner Celebration Modal */}
      <WinnerModal
        winner={winner}
        top5={top5}
        isOpen={isWinnerModalOpen}
        onClose={() => setIsWinnerModalOpen(false)}
        onRestart={handleRestartGame}
        onEditNames={handleEditNames}
      />

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-2.5 text-center text-xs text-slate-500">
        <p>FOX BATTLE ROYALE – ĐẠI CHIẾN 400 CÁO BAY • 60 FPS Engine • Tự Chọn Thời Gian (≤60s)</p>
      </footer>
    </div>
  );
}
