import React from 'react';
import { Play, RotateCcw, Edit3, Volume2, VolumeX, Trophy } from 'lucide-react';
import { soundFX } from '../utils/audio';

export default function RaceControls({
  isRacing,
  isFinished,
  hasFoxes,
  foxCount,
  isMuted,
  onToggleMute,
  onStartRace,
  onRestartRace,
  onEditNames,
  showLiveRanking,
  onToggleLiveRanking
}) {
  return (
    <div className="w-full px-4 py-2 flex flex-wrap items-center justify-between gap-3 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-xl backdrop-blur-md">
      {/* Left side: Stats & Status info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>CHIẾN BINH:</span>
          <span className="font-orbitron font-bold text-orange-400 text-sm">{foxCount} CÁO</span>
        </div>

        {/* Live Top 10 Toggle */}
        <button
          type="button"
          onClick={onToggleLiveRanking}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
            showLiveRanking
              ? 'bg-orange-500/20 border-orange-500/70 text-orange-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span>BXH Trực Tiếp</span>
        </button>
      </div>

      {/* Right side: Action Buttons */}
      <div className="flex items-center gap-2.5">
        {/* Audio Mute/Unmute */}
        <button
          type="button"
          onClick={onToggleMute}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition shadow-sm"
          title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Edit Names Button */}
        <button
          type="button"
          disabled={isRacing}
          onClick={onEditNames}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition disabled:opacity-40 disabled:pointer-events-none"
        >
          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
          <span>Đổi danh sách</span>
        </button>

        {/* Restart Race Button */}
        {(isFinished || isRacing) && (
          <button
            type="button"
            onClick={onRestartRace}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-orange-500/50 hover:border-orange-500 text-orange-400 text-xs font-bold transition shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đua lại</span>
          </button>
        )}

        {/* Main Start Race Button */}
        {!isRacing && !isFinished && hasFoxes && (
          <button
            type="button"
            onClick={onStartRace}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-slate-950 font-orbitron font-black text-sm tracking-wide shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>BẮT ĐẦU CUỘC ĐUA</span>
          </button>
        )}
      </div>
    </div>
  );
}

