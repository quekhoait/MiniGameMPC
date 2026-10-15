import React from 'react';
import {
  Play,
  RotateCcw,
  Edit3,
  Volume2,
  VolumeX,
  Swords,
  Clock,
  Zap,
  Flame,
  Minus,
  Plus
} from 'lucide-react';

export default function GameControls({
  phase, // 'IDLE' | 'LOBBY' | 'BATTLE' | 'FINISHED'
  foxCount,
  hasFoxes,
  isMuted,
  speedScale = 1.0,
  onUpdateSpeedScale,
  lobbyDuration,
  battleDuration,
  onUpdateLobbyDuration,
  onUpdateBattleDuration,
  onToggleMute,
  onStartGame,
  onRestartGame,
  onEditNames
}) {
  const isPlaying = phase === 'LOBBY' || phase === 'BATTLE';
  const isFinished = phase === 'FINISHED';

  const lobbyPresets = [5, 10, 15, 30, 60];
  const battlePresets = [10, 15, 20, 30, 60];
  const speedPresets = [
    { label: '0.5x Cực chậm', val: 0.5 },
    { label: '0.75x Chậm', val: 0.75 },
    { label: '1.0x Chuẩn', val: 1.0 },
    { label: '1.25x Nhanh', val: 1.25 }
  ];

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Time & Speed Configuration Panel (Visible before starting match) */}
      {!isPlaying && (
        <div className="w-full p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="font-orbitron font-bold text-xs uppercase text-slate-200 tracking-wider">
                CẤU HÌNH TRẬN ĐẤU (THỜI GIAN & TỐC ĐỘ BAY)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-rose-400">
                <Zap className="w-3 h-3" /> &lt;150 Cáo: Tăng tốc độ bắn (1/3 cuối chậm lại kịch tính)
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:flex items-center gap-1 text-amber-400">
                <Flame className="w-3 h-3" /> Còn 2 Cáo: 1v1 vờn nhau (0.2s chốt thắng)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Sảnh chờ Duration (3s - 60s) */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-300">
                  1. THỜI GIAN SẢNH CHỜ:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateLobbyDuration(Math.max(3, lobbyDuration - 5))}
                    disabled={isFinished}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer disabled:opacity-40"
                    title="Giảm 5s"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-orbitron font-black text-sm text-cyan-400 min-w-[42px] text-center">
                    {lobbyDuration}s
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateLobbyDuration(Math.min(60, lobbyDuration + 5))}
                    disabled={isFinished}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer disabled:opacity-40"
                    title="Tăng 5s"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="3"
                max="60"
                step="1"
                value={lobbyDuration}
                disabled={isFinished}
                onChange={(e) => onUpdateLobbyDuration(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
              />

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="text-[10px] text-slate-500 mr-1">Nhanh:</span>
                {lobbyPresets.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    disabled={isFinished}
                    onClick={() => onUpdateLobbyDuration(sec)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition cursor-pointer disabled:opacity-40 ${
                      lobbyDuration === sec
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Thời gian Chiến đấu Duration (5s - 60s) */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-red-300">
                  2. THỜI GIAN CHIẾN ĐẤU:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateBattleDuration(Math.max(5, battleDuration - 5))}
                    disabled={isFinished}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer disabled:opacity-40"
                    title="Giảm 5s"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-orbitron font-black text-sm text-red-400 min-w-[42px] text-center">
                    {battleDuration}s
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateBattleDuration(Math.min(60, battleDuration + 5))}
                    disabled={isFinished}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer disabled:opacity-40"
                    title="Tăng 5s"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={battleDuration}
                disabled={isFinished}
                onChange={(e) => onUpdateBattleDuration(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500 disabled:opacity-40"
              />

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="text-[10px] text-slate-500 mr-1">Nhanh:</span>
                {battlePresets.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    disabled={isFinished}
                    onClick={() => onUpdateBattleDuration(sec)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition cursor-pointer disabled:opacity-40 ${
                      battleDuration === sec
                        ? 'bg-red-500/20 text-red-300 border border-red-500'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Tốc độ bay của cáo (0.4x - 1.5x) */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-300">
                  3. TỐC ĐỘ BAY CỦA CÁO:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateSpeedScale && onUpdateSpeedScale(Math.max(0.4, Number((speedScale - 0.1).toFixed(2))))}
                    disabled={isFinished}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer disabled:opacity-40"
                    title="Bay chậm hơn"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-orbitron font-black text-sm text-amber-400 min-w-[46px] text-center">
                    {speedScale.toFixed(2)}x
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateSpeedScale && onUpdateSpeedScale(Math.min(1.6, Number((speedScale + 0.1).toFixed(2))))}
                    disabled={isFinished}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer disabled:opacity-40"
                    title="Bay nhanh hơn"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="0.4"
                max="1.5"
                step="0.05"
                value={speedScale}
                disabled={isFinished}
                onChange={(e) => onUpdateSpeedScale && onUpdateSpeedScale(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 disabled:opacity-40"
              />

              {/* Quick Presets */}
              <div className="flex items-center gap-1 mt-2.5 flex-wrap">
                <span className="text-[10px] text-slate-500 mr-0.5">Chọn:</span>
                {speedPresets.map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    disabled={isFinished}
                    onClick={() => onUpdateSpeedScale && onUpdateSpeedScale(preset.val)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer disabled:opacity-40 ${
                      Math.abs(speedScale - preset.val) < 0.05
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                    }`}
                  >
                    {preset.val}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Action Bar */}
      <div className="w-full px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-xl backdrop-blur-md">
        {/* Left side: Fleet count info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <span>CHIẾN TRƯỜNG:</span>
            <span className="font-orbitron font-bold text-orange-400 text-sm">{foxCount} CÁO BAY</span>
          </div>

          {isPlaying && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-semibold animate-pulse">
              <Swords className="w-3.5 h-3.5 text-red-400" />
              <span>{phase === 'LOBBY' ? `Sảnh chờ (${lobbyDuration}s)...` : `Chiến đấu sinh tồn (${battleDuration}s)!`}</span>
            </div>
          )}
        </div>

        {/* Right side: Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Audio Mute/Unmute */}
          <button
            type="button"
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition shadow-sm cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Edit Names Button */}
          <button
            type="button"
            disabled={isPlaying}
            onClick={onEditNames}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Đổi danh sách</span>
          </button>

          {/* Restart Battle Button */}
          {(isFinished || isPlaying) && (
            <button
              type="button"
              onClick={onRestartGame}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-orange-500/60 hover:border-orange-500 text-orange-400 text-xs font-bold transition shadow-md cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chơi lại</span>
            </button>
          )}

          {/* Start Game Button (Lobby -> Battle) */}
          {!isPlaying && !isFinished && hasFoxes && (
            <button
              type="button"
              onClick={onStartGame}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 via-red-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-orbitron font-black text-sm tracking-wide shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>BẮT ĐẦU TRẬN ĐẤU</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
