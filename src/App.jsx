import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './utils/gameEngine';
import { RaceEngine, RACE_DURATION } from './utils/raceEngine';
import { soundFX } from './utils/audio';
import { lotteryAudio } from './utils/lotteryAudio';
import NameInput from './components/NameInput';
import GameCanvas from './components/GameCanvas';
import GameHUD from './components/GameHUD';
import GameControls from './components/GameControls';
import RaceCanvas from './components/RaceCanvas';
import RaceControls from './components/RaceControls';
import Countdown from './components/Countdown';
import LiveRanking from './components/LiveRanking';
import WinnerModal from './components/WinnerModal';
import LotteryView from './components/lottery/LotteryView';
import { Sparkles, Maximize, Minimize, Volume2, VolumeX, RotateCcw, Play, Swords, Flag, Dices } from 'lucide-react';

const FOX_AVATAR = 'https://res.cloudinary.com/ds11ggie4/image/upload/v1791990958/c%C3%A1o_bay-removebg-preview_sz7uol.png';

export default function App() {
  // Game Mode: 'BATTLE' | 'RACE' | 'LOTTERY'
  const [gameMode, setGameMode] = useState('BATTLE');

  // Engine Singletons
  const battleEngineRef = useRef(new GameEngine());
  const raceEngineRef = useRef(new RaceEngine());
  const battleEngine = battleEngineRef.current;
  const raceEngine = raceEngineRef.current;

  // Battle Royale Configurable Durations (3s - 60s for Lobby, 5s - 60s for Battle)
  const [lobbyDuration, setLobbyDuration] = useState(10);
  const [battleDuration, setBattleDuration] = useState(10);

  // Battle Royale State tracking
  const [hudState, setHudState] = useState({
    phase: 'IDLE', // 'IDLE' | 'LOBBY' | 'BATTLE' | 'FINISHED'
    lobbyTime: 0,
    battleTime: 0,
    lobbyDuration: 10,
    battleDuration: 10,
    aliveCount: 0,
    totalFoxes: 0,
    isRapidFire: false,
    isDuelMode: false,
    isDoorAnimating: false
  });

  // Fox Race State tracking
  const [raceState, setRaceState] = useState({
    isRacing: false,
    isFinished: false,
    raceTime: 0,
    countdownPhase: null, // null | 3 | 2 | 1 | 'GO'
    leader: null,
    top10: []
  });
  const [showLiveRanking, setShowLiveRanking] = useState(true);

  // Shared Participants & Results (Battle & Race)
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [top5, setTop5] = useState([]);
  const [top10, setTop10] = useState([]);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

  // Shared Settings
  const [speedScale, setSpeedScale] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditingNames, setIsEditingNames] = useState(false);

  // Countdown timer reference for Fox Race
  const countdownTimerRef = useRef([]);

  const clearRaceCountdowns = () => {
    countdownTimerRef.current.forEach(id => clearTimeout(id));
    countdownTimerRef.current = [];
  };

  // Update speed scale for Battle Royale
  const handleUpdateSpeedScale = (val) => {
    const clamped = Math.max(0.3, Math.min(2.0, Number(val)));
    setSpeedScale(clamped);
    battleEngine.setSpeedScale(clamped);
  };

  // Listen to browser fullscreen changes
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
    battleEngine.setDurations(clamped, battleDuration);
    setHudState(prev => ({ ...prev, lobbyDuration: clamped }));
  };

  // Update battle duration
  const handleUpdateBattleDuration = (val) => {
    const clamped = Math.min(60, Math.max(5, val));
    setBattleDuration(clamped);
    battleEngine.setDurations(lobbyDuration, clamped);
    setHudState(prev => ({ ...prev, battleDuration: clamped }));
  };

  // Switch Game Mode
  const handleSelectGameMode = (mode) => {
    if (mode === gameMode) return;

    // Stop sounds & lobby music & drum audio
    soundFX.stopLobbyMusic();
    lotteryAudio.stopDrumSpin();
    clearRaceCountdowns();

    // Reset engines to clean idle state
    battleEngine.reset();
    raceEngine.reset();

    setIsWinnerModalOpen(false);
    setWinner(null);
    setTop5([]);
    setTop10([]);

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

    setRaceState({
      isRacing: false,
      isFinished: false,
      raceTime: 0,
      countdownPhase: null,
      leader: null,
      top10: []
    });

    // Re-init current players into newly selected engine if applicable
    const w = window.innerWidth || 1400;
    const h = Math.round(window.innerHeight * 0.88) || 750;
    if (players.length > 0) {
      if (mode === 'BATTLE') {
        battleEngine.initFoxes(players, w, h);
        battleEngine.setDurations(lobbyDuration, battleDuration);
      } else if (mode === 'RACE') {
        raceEngine.initFoxes(players, h, w);
      }
    }

    setGameMode(mode);
  };

  // Load initial players from LocalStorage and init engines
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

        battleEngine.initFoxes(loadedPlayers, w, h);
        battleEngine.setDurations(lobbyDuration, battleDuration);
        raceEngine.initFoxes(loadedPlayers, h, w);

        setHudState(prev => ({
          ...prev,
          aliveCount: loadedPlayers.length,
          totalFoxes: loadedPlayers.length,
          lobbyDuration,
          battleDuration
        }));
      }
    }
  }, [battleEngine, raceEngine]);

  // Handle fleet creation from NameInput
  const handleFoxesReady = (newPlayers) => {
    setPlayers(newPlayers);
    const w = window.innerWidth || 1400;
    const h = Math.round(window.innerHeight * 0.88) || 750;

    battleEngine.initFoxes(newPlayers, w, h);
    battleEngine.setDurations(lobbyDuration, battleDuration);
    raceEngine.initFoxes(newPlayers, h, w);

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

    setRaceState({
      isRacing: false,
      isFinished: false,
      raceTime: 0,
      countdownPhase: null,
      leader: null,
      top10: []
    });

    setIsEditingNames(false);
  };

  // ==========================================
  // BATTLE ROYALE HANDLERS
  // ==========================================
  const handleStartBattle = () => {
    if (players.length < 2) return;
    if (hudState.phase === 'LOBBY' || hudState.phase === 'BATTLE') return;

    soundFX.resume();
    battleEngine.setDurations(lobbyDuration, battleDuration);
    battleEngine.startLobby();
    setHudState({
      phase: 'LOBBY',
      lobbyTime: 0,
      battleTime: 0,
      lobbyDuration,
      battleDuration,
      aliveCount: players.length,
      totalFoxes: players.length,
      isRapidFire: false,
      isDuelMode: false,
      isDoorAnimating: true
    });
    setIsEditingNames(false);
    setIsWinnerModalOpen(false);
  };

  const handleBattleTimeUpdate = useCallback((state) => {
    setHudState(state);
  }, []);

  const handleBattleFinish = useCallback((finalWinner, finalTop5) => {
    setWinner(finalWinner);
    setTop5(finalTop5);
    setIsWinnerModalOpen(true);
    setHudState(prev => ({ ...prev, phase: 'FINISHED' }));
  }, []);

  const handleRestartBattle = () => {
    battleEngine.reset();
    battleEngine.setDurations(lobbyDuration, battleDuration);
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

  // ==========================================
  // FOX RACE (10S SPRINT) HANDLERS
  // ==========================================
  const handleStartRace = () => {
    if (players.length < 2) return;
    if (raceState.isRacing || raceState.countdownPhase) return;

    soundFX.resume();
    setIsEditingNames(false);
    setIsWinnerModalOpen(false);
    clearRaceCountdowns();

    // 3 - 2 - 1 - GO! Countdown Sequence
    setRaceState(prev => ({ ...prev, countdownPhase: 3, isRacing: false, isFinished: false }));

    const t1 = setTimeout(() => {
      setRaceState(prev => ({ ...prev, countdownPhase: 2 }));
    }, 850);

    const t2 = setTimeout(() => {
      setRaceState(prev => ({ ...prev, countdownPhase: 1 }));
    }, 1700);

    const t3 = setTimeout(() => {
      setRaceState(prev => ({ ...prev, countdownPhase: 'GO', isRacing: true }));
      raceEngine.startRace();
    }, 2550);

    const t4 = setTimeout(() => {
      setRaceState(prev => ({ ...prev, countdownPhase: null }));
    }, 3300);

    countdownTimerRef.current = [t1, t2, t3, t4];
  };

  const handleRaceTimeUpdate = useCallback((time) => {
    const leader = raceEngine.top10[0] || null;
    setRaceState(prev => ({
      ...prev,
      raceTime: time,
      leader,
      top10: raceEngine.top10
    }));
  }, [raceEngine]);

  const handleRaceFinish = useCallback((finalWinner, finalTop10) => {
    setWinner(finalWinner);
    setTop10(finalTop10);
    setIsWinnerModalOpen(true);
    setRaceState(prev => ({
      ...prev,
      isRacing: false,
      isFinished: true,
      raceTime: RACE_DURATION,
      leader: finalWinner,
      top10: finalTop10
    }));
  }, []);

  const handleRestartRace = () => {
    clearRaceCountdowns();
    raceEngine.reset();
    setWinner(null);
    setTop10([]);
    setIsWinnerModalOpen(false);
    setRaceState({
      isRacing: false,
      isFinished: false,
      raceTime: 0,
      countdownPhase: null,
      leader: null,
      top10: []
    });
  };

  // Edit list of names
  const handleEditNames = () => {
    if (hudState.phase === 'LOBBY' || hudState.phase === 'BATTLE' || raceState.isRacing) return;
    setIsEditingNames(true);
    setIsWinnerModalOpen(false);
  };

  // Toggle Sound FX
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundFX.setMuted(nextMuted);
    lotteryAudio.setMuted(nextMuted);
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
  // FULLSCREEN MODE VIEW
  // =========================================================================
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-slate-950 overflow-hidden z-40 select-none">
        {gameMode === 'BATTLE' && (
          <>
            {/* Battle Royale Fullscreen Battlefield */}
            <GameCanvas
              engine={battleEngine}
              isFullscreen={true}
              onTimeUpdate={handleBattleTimeUpdate}
              onBattleFinish={handleBattleFinish}
            />

            {/* Floating Slim Compact HUD Bar */}
            <div className="fixed top-2.5 left-4 right-24 z-50 pointer-events-none">
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
                isDoorAnimating={hudState.isDoorAnimating}
                isCompact={true}
              />
            </div>
          </>
        )}

        {gameMode === 'RACE' && (
          <>
            {/* Fox Race Fullscreen Track */}
            <div className="w-full h-full">
              <RaceCanvas
                engine={raceEngine}
                isRacing={raceState.isRacing}
                onTimeUpdate={handleRaceTimeUpdate}
                onRaceFinish={handleRaceFinish}
              />
            </div>

            {/* Countdown Overlay & Racing HUD */}
            <Countdown
              countdownPhase={raceState.countdownPhase}
              raceTime={raceState.raceTime}
              totalDuration={RACE_DURATION}
              isRacing={raceState.isRacing}
              leader={raceState.leader}
            />

            {/* Live Ranking Overlay */}
            <LiveRanking
              top10={raceState.top10}
              isOpen={showLiveRanking}
              onClose={() => setShowLiveRanking(false)}
            />
          </>
        )}

        {gameMode === 'LOTTERY' && (
          <div className="w-full h-full p-3 sm:p-6 flex flex-col justify-between">
            <LotteryView isFullscreen={true} />
          </div>
        )}

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

          {/* Action Button depending on Mode */}
          {gameMode === 'BATTLE' && (
            <>
              {hudState.phase === 'IDLE' && players.length >= 2 && (
                <button
                  type="button"
                  onClick={handleStartBattle}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-orbitron font-bold text-xs tracking-wider shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>BẮT ĐẦU</span>
                </button>
              )}
              {hudState.phase === 'FINISHED' && (
                <button
                  type="button"
                  onClick={handleRestartBattle}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900/85 hover:bg-slate-800 border border-orange-500/80 text-orange-400 font-bold text-xs shadow-lg backdrop-blur-md transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Chơi lại</span>
                </button>
              )}
            </>
          )}

          {gameMode === 'RACE' && (
            <>
              {!raceState.isRacing && !raceState.isFinished && players.length >= 2 && (
                <button
                  type="button"
                  onClick={handleStartRace}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-orbitron font-black text-xs tracking-wider shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>XUẤT PHÁT</span>
                </button>
              )}
              {raceState.isFinished && (
                <button
                  type="button"
                  onClick={handleRestartRace}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900/85 hover:bg-slate-800 border border-orange-500/80 text-orange-400 font-bold text-xs shadow-lg backdrop-blur-md transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đua lại</span>
                </button>
              )}
            </>
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

        {/* Winner Celebration Modal for Battle / Race */}
        {gameMode !== 'LOTTERY' && (
          <WinnerModal
            winner={winner}
            top5={top5}
            top10={top10}
            gameMode={gameMode}
            isOpen={isWinnerModalOpen}
            onClose={() => setIsWinnerModalOpen(false)}
            onRestart={gameMode === 'BATTLE' ? handleRestartBattle : handleRestartRace}
            onEditNames={handleEditNames}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // STANDARD VIEW: Header with Game Mode Selector Tabs, Canvas, Controls
  // =========================================================================
  const isBattleIdle = hudState.phase === 'IDLE';
  const isRaceIdle = !raceState.isRacing;
  const canSwitchMode = isBattleIdle && isRaceIdle;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Top Branding & Game Switcher Bar */}
      <header className="w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5">
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Logo & Game Title */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 p-0.5 shadow-lg shadow-red-500/30 flex items-center justify-center overflow-hidden">
              <img
                src={FOX_AVATAR}
                alt="Game Avatar"
                className="w-full h-full object-contain filter drop-shadow hover:scale-110 transition duration-300"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-orbitron font-black text-lg sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-amber-300 tracking-wider">
                  {gameMode === 'BATTLE' && 'FOX BATTLE ROYALE'}
                  {gameMode === 'RACE' && 'FOX RACE – CUỘC ĐUA CÁO'}
                  {gameMode === 'LOTTERY' && 'LOTTERY BALL 3D – QUAY LỒNG CẦU'}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40 uppercase">
                  {gameMode === 'LOTTERY' ? '3D CAGE' : '400 Cáo Bay'}
                </span>
                <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {gameMode === 'LOTTERY' ? 'THREE.JS 3D' : '60 FPS CANVAS'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {gameMode === 'BATTLE' && 'Lao Vào Đấm Nhau 1v1 • Ngẫu Nhiên Thắng Thua • Không Thanh Máu • Top 5 Sống Sót'}
                {gameMode === 'RACE' && 'Cuộc Đua 10 Giây • Xuất Phát & Vạch Đích • Camera Bám Đuổi • Top 10 Bảng Vàng'}
                {gameMode === 'LOTTERY' && 'Lồng Cầu 3D Chân Thực • 400 Quả Cầu MSSV • Thuật Toán Ngẫu Nhiên Công Bằng • Xuất CSV'}
              </p>
            </div>
          </div>

          {/* Center: GAME MODE SWITCHER MENU (3 GAMES) */}
          <div className="flex flex-wrap items-center justify-center p-1 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner gap-1">
            {/* Game 1: Battle Royale */}
            <button
              type="button"
              disabled={!canSwitchMode}
              onClick={() => handleSelectGameMode('BATTLE')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-orbitron font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                gameMode === 'BATTLE'
                  ? 'bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white shadow-lg shadow-red-600/30 border border-orange-400/50 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              } disabled:opacity-50 disabled:pointer-events-none`}
            >
              <Swords className="w-4 h-4 text-orange-300" />
              <span>ĐẠI CHIẾN BATTLE</span>
            </button>

            {/* Game 2: Fox Race */}
            <button
              type="button"
              disabled={!canSwitchMode}
              onClick={() => handleSelectGameMode('RACE')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-orbitron font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                gameMode === 'RACE'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 border border-yellow-300/60 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              } disabled:opacity-50 disabled:pointer-events-none`}
            >
              <Flag className="w-4 h-4 text-yellow-950" />
              <span>ĐUA CÁO 10S</span>
            </button>

            {/* Game 3: 3D Lottery Ball */}
            <button
              type="button"
              disabled={!canSwitchMode}
              onClick={() => handleSelectGameMode('LOTTERY')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-orbitron font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                gameMode === 'LOTTERY'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 text-white font-black shadow-lg shadow-blue-600/30 border border-blue-400/60 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              } disabled:opacity-50 disabled:pointer-events-none`}
            >
              <Dices className="w-4 h-4 text-amber-300" />
              <span>LỒNG CẦU 3D</span>
            </button>
          </div>

          {/* Top Right: Fullscreen Button */}
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
        
        {/* ======================================================= */}
        {/* MODE 3: 3D LOTTERY BALL MSSV                            */}
        {/* ======================================================= */}
        {gameMode === 'LOTTERY' && (
          <div className="w-full">
            <LotteryView isFullscreen={false} />
          </div>
        )}

        {/* ======================================================= */}
        {/* FOX GAMES (BATTLE ROYALE / RACE)                        */}
        {/* ======================================================= */}
        {gameMode !== 'LOTTERY' && (
          <>
            {players.length === 0 || isEditingNames ? (
              <div className="my-auto py-8">
                <NameInput onFoxesReady={handleFoxesReady} initialNames={players} />
              </div>
            ) : (
              <>
                {/* MODE 1: FOX BATTLE ROYALE */}
                {gameMode === 'BATTLE' && (
                  <>
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
                      isDoorAnimating={hudState.isDoorAnimating}
                    />

                    <div className="relative w-full">
                      <GameCanvas
                        engine={battleEngine}
                        isFullscreen={false}
                        onTimeUpdate={handleBattleTimeUpdate}
                        onBattleFinish={handleBattleFinish}
                      />
                    </div>

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
                      onStartGame={handleStartBattle}
                      onRestartGame={handleRestartBattle}
                      onEditNames={handleEditNames}
                    />
                  </>
                )}

                {/* MODE 2: FOX RACE (10S SPRINT) */}
                {gameMode === 'RACE' && (
                  <>
                    <Countdown
                      countdownPhase={raceState.countdownPhase}
                      raceTime={raceState.raceTime}
                      totalDuration={RACE_DURATION}
                      isRacing={raceState.isRacing}
                      leader={raceState.leader}
                    />

                    <div className="relative w-full">
                      <RaceCanvas
                        engine={raceEngine}
                        isRacing={raceState.isRacing}
                        onTimeUpdate={handleRaceTimeUpdate}
                        onRaceFinish={handleRaceFinish}
                      />

                      <LiveRanking
                        top10={raceState.top10}
                        isOpen={showLiveRanking}
                        onClose={() => setShowLiveRanking(false)}
                      />
                    </div>

                    <RaceControls
                      isRacing={raceState.isRacing}
                      isFinished={raceState.isFinished}
                      hasFoxes={players.length >= 2}
                      foxCount={players.length}
                      isMuted={isMuted}
                      onToggleMute={handleToggleMute}
                      onStartRace={handleStartRace}
                      onRestartRace={handleRestartRace}
                      onEditNames={handleEditNames}
                      showLiveRanking={showLiveRanking}
                      onToggleLiveRanking={() => setShowLiveRanking(prev => !prev)}
                    />
                  </>
                )}

                {/* Collapsible Roster review for Battle and Race */}
                {((gameMode === 'BATTLE' && hudState.phase === 'IDLE') || (gameMode === 'RACE' && !raceState.isRacing)) && (
                  <div className="mt-2">
                    <details className="group bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden transition-all">
                      <summary className="px-5 py-3 cursor-pointer font-bold text-xs uppercase text-slate-300 hover:text-white flex items-center justify-between select-none">
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-orange-400" />
                          Danh sách {players.length} chiến binh ({gameMode === 'BATTLE' ? 'Đại Chiến' : 'Đua Cáo'})
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
          </>
        )}
      </main>

      {/* Winner Celebration Modal for Battle / Race */}
      {gameMode !== 'LOTTERY' && (
        <WinnerModal
          winner={winner}
          top5={top5}
          top10={top10}
          gameMode={gameMode}
          isOpen={isWinnerModalOpen}
          onClose={() => setIsWinnerModalOpen(false)}
          onRestart={gameMode === 'BATTLE' ? handleRestartBattle : handleRestartRace}
          onEditNames={handleEditNames}
        />
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-2.5 text-center text-xs text-slate-500">
        <p>MINI GAME MPC • FOX BATTLE ROYALE • FOX RACE 10S • LOTTERY BALL 3D</p>
      </footer>
    </div>
  );
}
