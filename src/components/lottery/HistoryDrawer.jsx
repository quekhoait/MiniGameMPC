// HistoryDrawer.jsx - Draw History Table, Search Filter & CSV Export
import React, { useState } from 'react';
import { History, Download, Trash2, Search, X, Trophy, CheckCircle } from 'lucide-react';
import { exportHistoryToCSV } from '../../utils/csvParser';

export default function HistoryDrawer({
  isOpen,
  onClose,
  history = [],
  onResetSession
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  // Filter history
  const filtered = history.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.mssv.toLowerCase().includes(q) ||
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.classGroup && item.classGroup.toLowerCase().includes(q))
    );
  });

  const handleExport = () => {
    exportHistoryToCSV(history);
  };

  const handleConfirmReset = () => {
    onResetSession();
    setShowConfirmReset(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg h-full bg-slate-900 border-l border-amber-500/50 shadow-2xl flex flex-col p-5 sm:p-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-orbitron font-black text-lg text-white">
                LỊCH SỬ QUAY SỐ TRÚNG THƯỞNG
              </h2>
              <p className="text-xs text-slate-400">
                Đã có <strong className="text-amber-400 font-bold">{history.length}</strong> sinh viên trúng giải
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Action Buttons */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo MSSV hoặc họ tên..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <button
            type="button"
            disabled={history.length === 0}
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            title="Xuất file CSV kết quả"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xuất CSV</span>
          </button>

          <button
            type="button"
            disabled={history.length === 0}
            onClick={() => setShowConfirmReset(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 border border-slate-700 hover:border-rose-500/50 text-rose-400 font-bold text-xs transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            title="Xóa phiên quay và bắt đầu lại"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Confirmation Modal for Reset */}
        {showConfirmReset && (
          <div className="p-3.5 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs">
            <p className="font-bold text-rose-300 mb-2">
              Bạn có chắc muốn xóa toàn bộ lịch sử quay và đưa toàn bộ sinh viên trở lại lồng cầu?
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filtered.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs">
              <History className="w-8 h-8 mb-2 opacity-50" />
              <span>{searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có quả cầu nào được rút'}</span>
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={item.mssv + idx}
                className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-orbitron font-black text-xs flex items-center justify-center shrink-0">
                    #{item.order}
                  </div>
                  <div className="truncate">
                    <div className="font-orbitron font-black text-amber-300 text-sm tracking-wide">
                      {item.mssv}
                    </div>
                    <div className="text-slate-300 font-medium truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {item.classGroup && `${item.classGroup} • `}{item.time}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                  <CheckCircle className="w-3 h-3" />
                  <span>Trúng giải</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

