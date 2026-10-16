// HistoryModal.jsx - Ticket Chest modal displaying drawn winners with CSV export & copy
import React from 'react';
import { X, Archive, Download, Copy, Trash2, CheckCircle2 } from 'lucide-react';
import { useGrandDrawStore } from '../store/useGrandDrawStore.js';

export default function HistoryModal() {
  const activeModal = useGrandDrawStore(state => state.activeModal);
  const closeModal = useGrandDrawStore(state => state.closeModal);
  const drawHistory = useGrandDrawStore(state => state.drawHistory);
  const clearHistory = useGrandDrawStore(state => state.clearHistory);

  if (activeModal !== 'HISTORY') return null;

  // Export CSV
  const handleExportCSV = () => {
    if (drawHistory.length === 0) return;
    const header = ['Số thứ tự vé', 'Thời gian', 'Ngày', 'Họ và Tên / MSSV', 'Giải thưởng', 'Ghi chú'];
    const rows = drawHistory.map(h => [
      h.ticketNumber,
      h.timestamp,
      h.date,
      `"${(h.item.title || '').replace(/"/g, '""')}"`,
      `"${(h.item.prize || '').replace(/"/g, '""')}"`,
      `"${(h.item.note || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `grand_draw_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (drawHistory.length === 0) return;
    const text = drawHistory
      .map(h => `Vé #${h.ticketNumber} [${h.timestamp}]: ${h.item.title} - ${h.item.prize}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    alert('Đã sao chép lịch sử trúng thưởng vào Clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl max-h-[85vh] flex flex-col bg-[#140F0E] border border-[#B8893B]/50 rounded-2xl shadow-2xl overflow-hidden text-amber-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#B8893B]/30 bg-[#211815]">
          <div className="flex items-center gap-2.5">
            <Archive className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="font-serif font-bold text-sm text-[#F3E2C4] tracking-wide">
              RƯƠNG LƯU TRỮ VÉ ĐÃ RÚT ({drawHistory.length})
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="p-1 text-amber-300/60 hover:text-amber-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-2.5 border-b border-amber-900/30 bg-[#1A1310] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              disabled={drawHistory.length === 0}
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#2B1F19] hover:bg-[#3D2C24] border border-[#B8893B]/30 text-xs text-amber-200 transition-colors disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              Xuất CSV
            </button>
            <button
              disabled={drawHistory.length === 0}
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#2B1F19] hover:bg-[#3D2C24] border border-[#B8893B]/30 text-xs text-amber-200 transition-colors disabled:opacity-40"
            >
              <Copy className="w-3.5 h-3.5 text-amber-400" />
              Sao chép
            </button>
          </div>

          <button
            disabled={drawHistory.length === 0}
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử quay thưởng?')) {
                clearHistory();
              }
            }}
            className="flex items-center gap-1 text-xs text-red-400/80 hover:text-red-300 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa lịch sử
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0 bg-[#0E0B0A] scrollbar-thin scrollbar-thumb-amber-900/50">
          {drawHistory.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-amber-400/40 text-center">
              <Archive className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Rương hiện đang trống.</p>
              <p className="text-xs mt-1">Các vé trúng thưởng sau khi quay sẽ tự động được cất vào đây.</p>
            </div>
          ) : (
            drawHistory.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-[#1D1614] border border-amber-900/40 flex items-center justify-between hover:border-[#B8893B]/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#B8893B]/20 border border-[#B8893B]/40 flex items-center justify-center font-mono text-xs font-bold text-[#E5B25D] flex-shrink-0">
                    #{item.ticketNumber}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-serif font-bold text-amber-100 truncate">
                      {item.item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-amber-300/60 font-mono">
                      <span>{item.item.prize || 'Giải Thưởng'}</span>
                      <span>•</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>
                </div>

                <CheckCircle2 className="w-4 h-4 text-[#B8893B]/70 flex-shrink-0 ml-2" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#B8893B]/20 bg-[#17110F] text-right">
          <button
            onClick={closeModal}
            className="px-4 py-1.5 rounded-lg bg-[#B8893B] text-[#251806] font-serif font-bold text-xs hover:brightness-110 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

