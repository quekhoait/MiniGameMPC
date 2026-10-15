import React from 'react';
import { Trophy, Flame } from 'lucide-react';

export default function LiveRanking({ top10 = [], isOpen = true, onClose }) {
  if (!isOpen || top10.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-20 w-64 bg-slate-950/85 border border-slate-700/80 rounded-2xl p-3.5 backdrop-blur-md shadow-2xl transition-all">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <div className="flex items-center gap-1.5 text-amber-400">
          <Trophy className="w-3.5 h-3.5" />
          <span>TOP DẪN ĐẦU TRỰC TIẾP</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">K/CÁCH</span>
      </div>

      <div className="space-y-1">
        {top10.slice(0, 7).map((fox, index) => {
          const isFirst = index === 0;
          return (
            <div
              key={fox.id}
              className={`flex items-center justify-between px-2.5 py-1 rounded-lg text-xs transition ${
                isFirst
                  ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold'
                  : 'bg-slate-900/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className={`w-4 text-center font-orbitron font-bold text-[11px] ${
                  isFirst ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {index + 1}
                </span>
                <span className="truncate max-w-[120px]">{fox.name}</span>
                {fox.isBursting && (
                  <Flame className="w-3 h-3 text-red-500 fill-red-500 animate-pulse shrink-0" />
                )}
              </div>
              <span className="font-mono text-[11px] text-slate-400 shrink-0">
                {Math.round(fox.distance)}m
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

