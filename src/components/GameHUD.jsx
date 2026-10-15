import React, { useEffect } from 'react';
import { Shield, Skull, Zap, Swords, Flame, Heart, Crown } from 'lucide-react';
import { soundFX } from '../utils/audio';

export default function GameHUD({
  phase, // 'IDLE' | 'LOBBY' | 'BATTLE' | 'FINISHED'
  lobbyTime = 0,
  battleTime = 0,
  lobbyDuration = 10,
  battleDuration = 10,
  aliveCount = 0,
  totalFoxes = 0,
  isRapidFire = false,
  isDuelMode = false,
  isCompact = false // True in fullscreen mode
}) {
  const isLobby = phase === 'LOBBY';
  const isBattle = phase === 'BATTLE';

  // Sound beep when in last 3 seconds of lobby
  const lastBeepRef = React.useRef(-1);
  useEffect(() => {
    if (isLobby) {
      const remaining = Math.max(0, lobbyDuration - lobbyTime);
      const wholeSec = Math.ceil(remaining);
      if (wholeSec <= 3 && wholeSec >= 1 && wholeSec !== lastBeepRef.current) {
        lastBeepRef.current = wholeSec;
        soundFX.playCountdownBeep(wholeSec === 1 ? 750 : 540);
      }
    } else {
      lastBeepRef.current = -1;
    }
  }, [isLobby, lobbyTime, lobbyDuration]);

  if (phase === 'IDLE') return null;

  const lobbyRemaining = Math.max(0, lobbyDuration - lobbyTime);
  const battleRemaining = Math.max(0, battleDuration - battleTime);

  const curDuration = isLobby ? lobbyDuration : battleDuration;
  const curRemaining = isLobby ? lobbyRemaining : battleRemaining;
  const progressPercent = Math.min(100, Math.max(0, ((curDuration - curRemaining) / curDuration) * 100));

  const eliminatedCount = Math.max(0, totalFoxes - aliveCount);

  // =========================================================================
  // FULLSCREEN COMPACT SLEEK GLASS PILL (DOES NOT OBSTRUCT BATTLEFIELD)
  // =========================================================================
  if (isCompact) {
    return (
      <div className="w-full flex items-center justify-center">
        <div className={`px-4 sm:px-6 py-1.5 rounded-full backdrop-blur-xl border transition-all duration-300 shadow-2xl flex items-center gap-3 sm:gap-6 ${
          isDuelMode
            ? 'bg-slate-950/85 border-amber-500/80 shadow-amber-950/60 ring-1 ring-amber-400/50'
            : isRapidFire
            ? 'bg-slate-950/85 border-rose-500/80 shadow-rose-950/60'
            : isLobby
            ? 'bg-slate-950/80 border-cyan-500/60 shadow-cyan-950/40'
            : 'bg-slate-950/85 border-red-500/70 shadow-red-950/50'
        }`}>
          {/* Phase Dot & Tag */}
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isLobby ? 'bg-cyan-400' : 'bg-red-500 animate-ping'}`} />
            <span className={`text-[11px] font-black uppercase tracking-wider ${isLobby ? 'text-cyan-300' : 'text-red-300'}`}>
              {isLobby ? `SẢNH (${lobbyDuration}S)` : `CHIẾN ĐẤU (${battleDuration}S)`}
            </span>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-baseline gap-1">
            <span className={`font-orbitron font-black text-xl sm:text-2xl tracking-tight ${
              isDuelMode ? 'text-amber-400' : isRapidFire ? 'text-rose-400' : isLobby ? 'text-cyan-400' : 'text-red-400'
            }`}>
              {curRemaining.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">giây</span>
          </div>

          {/* Mini Progress Bar */}
          <div className="w-20 sm:w-28 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                isDuelMode
                  ? 'bg-amber-400'
                  : isRapidFire
                  ? 'bg-rose-500'
                  : isLobby
                  ? 'bg-cyan-400'
                  : 'bg-red-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Status Badges */}
          {isDuelMode && (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-400 animate-pulse hidden md:inline-flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              1V1 DUEL
            </span>
          )}
          {isRapidFire && !isDuelMode && (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-400 animate-pulse hidden md:inline-flex items-center gap-1">
              <Zap className="w-3 h-3 text-rose-400" />
              &lt;150 BẮN DỒN DẬP
            </span>
          )}

          {/* Alive Count */}
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
            <Heart className={`w-3.5 h-3.5 ${isDuelMode ? 'text-amber-400 fill-amber-400' : 'text-emerald-400 fill-emerald-400'} animate-pulse`} />
            <span className="text-white font-orbitron text-sm">{aliveCount}</span>
            <span className="text-[10px] text-slate-400 font-normal">/{totalFoxes}</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STANDARD VIEW
  // =========================================================================
  return (
    <div className="w-full my-1">
      <div className={`w-full rounded-2xl p-3 sm:p-4 backdrop-blur-xl border transition-all duration-300 shadow-2xl flex flex-wrap items-center justify-between gap-4 ${
        isDuelMode
          ? 'bg-slate-900/95 border-amber-500/80 shadow-amber-950/60 ring-1 ring-amber-400/50'
          : isRapidFire
          ? 'bg-slate-900/95 border-rose-500/80 shadow-rose-950/60 ring-1 ring-rose-500/40'
          : isLobby
          ? 'bg-slate-900/90 border-cyan-500/50 shadow-cyan-950/40'
          : 'bg-slate-900/95 border-red-500/60 shadow-red-950/50'
      }`}>
        
        {/* Left: Phase Title, Dynamic Status, & Timer */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg ${
            isDuelMode
              ? 'bg-amber-500/20 border-amber-400 text-amber-400 animate-bounce'
              : isRapidFire
              ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
              : isLobby
              ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-400'
              : 'bg-red-500/20 border-red-500/60 text-red-500 animate-pulse'
          }`}>
            {isDuelMode ? (
              <Crown className="w-6 h-6 text-amber-300" />
            ) : isRapidFire ? (
              <Zap className="w-6 h-6 text-rose-400" />
            ) : isLobby ? (
              <Shield className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
            ) : (
              <Swords className="w-6 h-6 animate-bounce" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                isLobby
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/40'
              }`}>
                {isLobby ? `GIAI ĐOẠN 1: SẢNH CHỜ (${lobbyDuration}S)` : `GIAI ĐOẠN 2: CHIẾN ĐẤU (${battleDuration}S)`}
              </span>

              {isDuelMode && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-400 animate-pulse">
                  <Flame className="w-3 h-3 fill-current text-amber-400" />
                  1V1 DUEL (0.2S CUỐI WINNER)
                </span>
              )}

              {isRapidFire && !isDuelMode && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-400 animate-pulse">
                  <Zap className="w-3 h-3 fill-current text-rose-400" />
                  TĂNG TỐC ĐỘ BẮN & BAY (&lt;150 CÁO)
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`font-orbitron font-black text-2xl sm:text-3xl tracking-tight ${
                isDuelMode
                  ? 'text-amber-400'
                  : isRapidFire
                  ? 'text-rose-400'
                  : isLobby
                  ? 'text-cyan-400'
                  : 'text-red-400'
              }`}>
                {curRemaining.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-slate-400">giây</span>

              <span className="text-xs text-slate-400 ml-2 hidden lg:inline">
                {isLobby
                  ? '(Cáo bay tự do - Chưa bắn nhau)'
                  : isDuelMode
                  ? '(2 Cáo cuối đối kháng vờn nhau sinh tử!)'
                  : isRapidFire
                  ? '(Dưới 150 cáo: Xả đạn dồn dập - Chậm lại kịch tính!)'
                  : '(Tự động nhắm bắn & loại đối thủ)'}
              </span>
            </div>
          </div>
        </div>

        {/* Center Progress Bar */}
        <div className="flex-1 min-w-[180px] max-w-md mx-2">
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>{isLobby ? `TIẾN ĐỘ SẢNH (${lobbyDuration}S)` : `TIẾN ĐỘ TRẬN CHIẾN (${battleDuration}S)`}</span>
            <span className={`font-bold ${isDuelMode ? 'text-amber-400' : isLobby ? 'text-cyan-400' : 'text-red-400'}`}>
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-75 relative ${
                isDuelMode
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-400 shadow-[0_0_15px_rgba(251,191,36,0.9)]'
                  : isRapidFire
                  ? 'bg-gradient-to-r from-rose-600 via-red-500 to-amber-400 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                  : isLobby
                  ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300 shadow-[0_0_12px_rgba(34,211,238,0.7)]'
                  : 'bg-gradient-to-r from-orange-600 via-red-500 to-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right: Live Alive & Eliminated Counts */}
        <div className="flex items-center gap-2.5">
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/80 border shadow-inner ${
            isDuelMode
              ? 'border-amber-400 text-amber-400 ring-1 ring-amber-400/40'
              : 'border-emerald-500/40'
          }`}>
            <Heart className={`w-4 h-4 ${isDuelMode ? 'text-amber-400 fill-amber-400' : 'text-emerald-400 fill-emerald-400'} animate-pulse`} />
            <div>
              <div className={`text-[9px] font-bold uppercase tracking-wider ${isDuelMode ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isDuelMode ? 'TOP 2 DUEL' : 'CÒN SỐNG'}
              </div>
              <div className="font-orbitron font-black text-sm text-white">
                {aliveCount} <span className="text-[10px] text-slate-400 font-normal">/ {totalFoxes}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-rose-500/30 shadow-inner">
            <Skull className="w-4 h-4 text-rose-400" />
            <div>
              <div className="text-[9px] text-rose-400 font-bold uppercase tracking-wider">ĐÃ LOẠI</div>
              <div className="font-orbitron font-bold text-sm text-slate-300">
                {eliminatedCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
