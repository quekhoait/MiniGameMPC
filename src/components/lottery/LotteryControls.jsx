// LotteryControls.jsx - Main control toolbar for 3D Lottery Drum
import React from 'react';
import { Play, Square, RotateCcw, Volume2, VolumeX, History, Users, RefreshCw, Sparkles } from 'lucide-react';

export default function LotteryControls({
  engine,
  gameState,
  isMuted,
  onToggleMute,
  onStartSpin,
  onStopSpin,
  onOpenImport,
  onOpenHistory,
  onResetSession
}) {
  const isSpinning = gameState.phase === 'SPINNING_UP' || gameState.phase === 'SPINNING_FAST';
  const isDecelerating = gameState.phase === 'SLOWING_DOWN' || gameState.phase === 'EXTRACTING';
  const isAnnouncing = gameState.phase === 'ANNOUNCING';
  const hasRemaining = gameState.remainingCount > 0;

  const targetCounts = [1, 3, 5, 10];

  return (
    <div className="w-full px-4 py-3 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
      {/* Left side: Config batch target & Auto-spin toggle */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Target winners selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <span className="text-slate-400 pl-2 pr-1 text-[11px] uppercase">Số lượng:</span>
          {targetCounts.map(cnt => (
            <button
              key={cnt}
              type="button"
              disabled={isSpinning || isDecelerating}
              onClick={() => engine.setTargetWinnerCount(cnt)}
              className={`px-2.5 py-1 rounded-lg font-orbitron font-bold transition cursor-pointer ${
                gameState.targetWinnerCount === cnt
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              } disabled:opacity-40 disabled:pointer-events-none`}
            >
              {cnt}
            </button>
          ))}
        </div>

        {/* Auto Spin Toggle */}
        <button
          type="button"
          disabled={!hasRemaining || isDecelerating}
          onClick={() => engine.toggleAutoSpin()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
            gameState.isAutoSpinning
              ? 'bg-emerald-500/20 border-emerald-500/80 text-emerald-300 animate-pulse'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
          } disabled:opacity-40 disabled:pointer-events-none`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${gameState.isAutoSpinning ? 'animate-spin' : ''}`} />
          <span>Quay Tự Động ({gameState.batchDrawnCount}/{gameState.targetWinnerCount})</span>
        </button>
      </div>

      {/* Right side: Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Audio Mute/Unmute */}
        <button
          type="button"
          onClick={onToggleMute}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition shadow-sm cursor-pointer"
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Import Student List */}
        <button
          type="button"
          disabled={isSpinning || isDecelerating}
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Nhập MSSV</span>
        </button>

        {/* View History Drawer */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
        >
          <History className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Lịch Sử</span>
          {gameState.wonCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
              {gameState.wonCount}
            </span>
          )}
        </button>

        {/* Reset session button if items won */}
        {gameState.wonCount > 0 && (
          <button
            type="button"
            disabled={isSpinning || isDecelerating}
            onClick={onResetSession}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition cursor-pointer disabled:opacity-40"
            title="Làm mới phiên quay"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* MAIN SPIN / STOP / CONTINUE ACTION BUTTON */}
        {isSpinning ? (
          <button
            type="button"
            onClick={onStopSpin}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-orbitron font-black text-sm tracking-wide shadow-xl shadow-red-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>DỪNG / CHỌN BÓNG</span>
          </button>
        ) : isDecelerating ? (
          <button
            type="button"
            disabled
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 text-amber-400 font-orbitron font-bold text-sm tracking-wide border border-amber-500/40 opacity-90 cursor-wait"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>ĐANG LẤY BÓNG...</span>
          </button>
        ) : isAnnouncing ? (
          <button
            type="button"
            onClick={onStartSpin}
            disabled={!hasRemaining}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 hover:from-emerald-400 hover:to-orange-400 text-slate-950 font-orbitron font-black text-sm tracking-wide shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>QUAY TIẾP</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={!hasRemaining}
            onClick={onStartSpin}
            className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-orbitron font-black text-sm tracking-wide shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none animate-pulse"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>BẮT ĐẦU QUAY</span>
          </button>
        )}
      </div>
    </div>
  );
}

