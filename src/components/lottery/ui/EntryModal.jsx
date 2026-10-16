// EntryModal.jsx - Luxury 2D Modal for editing and previewing participants
import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Shuffle,
  ArrowUpDown,
  Filter,
  Trash2,
  Sparkles,
  Users,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { useGrandDrawStore } from '../store/useGrandDrawStore.js';
import * as XLSX from 'xlsx';

export default function EntryModal() {
  const activeModal = useGrandDrawStore(state => state.activeModal);
  const closeModal = useGrandDrawStore(state => state.closeModal);
  const rawInputText = useGrandDrawStore(state => state.rawInputText);
  const setRawInputText = useGrandDrawStore(state => state.setRawInputText);
  const entries = useGrandDrawStore(state => state.entries);
  const shuffleEntries = useGrandDrawStore(state => state.shuffleEntries);
  const sortEntries = useGrandDrawStore(state => state.sortEntries);
  const dedupeEntries = useGrandDrawStore(state => state.dedupeEntries);
  const removeAfterDraw = useGrandDrawStore(state => state.removeAfterDraw);
  const toggleRemoveAfterDraw = useGrandDrawStore(state => state.toggleRemoveAfterDraw);
  const confirmEntriesAndPack = useGrandDrawStore(state => state.confirmEntriesAndPack);

  const [filterQuery, setFilterQuery] = useState('');
  const fileInputRef = useRef(null);

  if (activeModal !== 'ENTRY') return null;

  // File import handler (TXT, CSV, XLSX)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          const lines = rows
            .map(row => Array.isArray(row) ? row.filter(cell => cell != null).join(' | ') : '')
            .filter(line => line.trim().length > 0);
          setRawInputText(lines.join('\n'));
        } catch (err) {
          alert('Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng file!');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (evt) => {
        const text = evt.target.result;
        setRawInputText(text);
      };
      reader.readAsText(file);
    }
  };

  const filteredPreview = entries.filter(e =>
    e.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    e.prize.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-[86rem] h-[86vh] flex flex-col bg-[#0E0C0B] border border-[#B8893B]/40 rounded-2xl shadow-2xl overflow-hidden text-amber-50">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#B8893B]/30 bg-gradient-to-r from-[#1A1412] via-[#241B17] to-[#1A1412]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#B8893B]/20 border border-[#B8893B]/50 flex items-center justify-center text-[#E5B25D]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-[#F3E2C4] tracking-wide flex items-center gap-2">
                GRAND DRAW — BẢNG DANH SÁCH THAM GIA
              </h2>
              <p className="text-xs text-amber-200/60 font-sans">
                Định dạng hỗ trợ: <code className="text-[#E5B25D]">MSSV / Tên</code> hoặc <code className="text-[#E5B25D]">Tên | Giải thưởng</code> (mỗi dòng một người)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={closeModal}
              className="p-2 text-amber-300/70 hover:text-amber-100 hover:bg-white/10 rounded-lg transition-colors"
              title="Đóng modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: 60/40 Split */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 bg-[#0A0909]">
          {/* Left Column (60%): Text Area Editor & Toolbar */}
          <div className="lg:col-span-7 flex flex-col border-r border-[#B8893B]/20 p-5 min-h-0">
            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.csv,.xlsx,.xls"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2A1E17] hover:bg-[#3D2C22] border border-[#B8893B]/40 text-xs font-medium text-amber-200 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#E5B25D]" />
                  Tải file (.txt, .csv, Excel)
                </button>

                <button
                  onClick={shuffleEntries}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F1916] hover:bg-[#2F2622] border border-amber-900/50 text-xs text-amber-200/90 transition-colors"
                  title="Xáo trộn ngẫu nhiên thứ tự"
                >
                  <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                  Xáo trộn
                </button>

                <button
                  onClick={sortEntries}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F1916] hover:bg-[#2F2622] border border-amber-900/50 text-xs text-amber-200/90 transition-colors"
                  title="Sắp xếp danh sách A-Z"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                  Sắp xếp A-Z
                </button>

                <button
                  onClick={dedupeEntries}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F1916] hover:bg-[#2F2622] border border-amber-900/50 text-xs text-amber-200/90 transition-colors"
                  title="Loại bỏ dòng trùng nhau"
                >
                  <Filter className="w-3.5 h-3.5 text-amber-400" />
                  Lọc trùng
                </button>
              </div>

              <button
                onClick={() => setRawInputText('')}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-400/80 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors"
                title="Xóa toàn bộ nội dung"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa hết
              </button>
            </div>

            {/* Monospaced Editor */}
            <div className="flex-1 relative flex flex-col min-h-0 bg-[#120E0D] border border-amber-900/40 rounded-xl overflow-hidden focus-within:border-[#B8893B]/70 transition-colors">
              <textarea
                value={rawInputText}
                onChange={(e) => setRawInputText(e.target.value)}
                placeholder="Dán danh sách người chơi vào đây...&#10;Ví dụ:&#10;SV001 | Nguyễn Văn An | Giải Nhất&#10;SV002 | Trần Thị Bích | Giải Nhì"
                className="w-full h-full p-4 font-mono text-sm leading-relaxed text-amber-100/90 bg-transparent resize-none focus:outline-none scrollbar-thin scrollbar-thumb-amber-900/50"
                spellCheck={false}
              />
              <div className="px-4 py-2 bg-[#1A1412] border-t border-amber-900/30 flex justify-between items-center text-xs text-amber-300/60 font-mono">
                <span>Dòng hợp lệ: {entries.length} người</span>
                <span>Ký tự: {rawInputText.length}</span>
              </div>
            </div>
          </div>

          {/* Right Column (40%): Parsed Live Table Preview */}
          <div className="lg:col-span-5 flex flex-col p-5 min-h-0 bg-[#0E0C0B]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold font-serif text-[#F3E2C4]">
                  XEM TRƯỚC DANH SÁCH
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#B8893B]/20 border border-[#B8893B]/40 text-[#E5B25D]">
                  {entries.length} người
                </span>
              </div>

              {/* Search Filter input */}
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-md bg-[#1B1513] border border-amber-900/40 text-amber-100 placeholder-amber-400/40 focus:outline-none focus:border-[#B8893B]/60"
              />
            </div>

            {/* Scrollable Parsed Entries Table */}
            <div className="flex-1 overflow-y-auto rounded-xl border border-amber-900/40 bg-[#140F0E] scrollbar-thin scrollbar-thumb-amber-900/50">
              {filteredPreview.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-amber-300/40">
                  <HelpCircle className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Chưa có dữ liệu người chơi hợp lệ.</p>
                  <p className="text-xs mt-1">Hãy dán danh sách hoặc tải file ở cột bên trái.</p>
                </div>
              ) : (
                <div className="divide-y divide-amber-950/60">
                  {filteredPreview.map((entry, idx) => (
                    <div
                      key={entry.id || idx}
                      className="px-3.5 py-2.5 flex items-center justify-between hover:bg-amber-950/20 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 text-center font-mono text-xs text-amber-500/70 font-bold">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-amber-100 truncate">
                            {entry.title}
                          </p>
                          {entry.prize && (
                            <span className="inline-block mt-0.5 text-xs text-amber-300/60 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-800/30">
                              {entry.prize}
                            </span>
                          )}
                        </div>
                      </div>

                      <CheckCircle2 className="w-4 h-4 text-[#B8893B]/60 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="px-6 py-4 border-t border-[#B8893B]/30 bg-[#16110F] flex flex-wrap items-center justify-between gap-4">
          {/* Toggle Remove Winner After Draw */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={removeAfterDraw}
              onChange={toggleRemoveAfterDraw}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 bg-black/60 border-amber-700/50 cursor-pointer"
            />
            <span className="text-sm text-amber-200/90 font-medium">
              Loại bỏ người đã trúng sau mỗi lượt quay
            </span>
          </label>

          {/* Big Brass & Gold Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={closeModal}
              className="px-5 py-2.5 rounded-xl border border-amber-900/60 text-sm font-medium text-amber-300/80 hover:bg-white/5 transition-colors"
            >
              Để Sau
            </button>

            <button
              disabled={entries.length === 0}
              onClick={confirmEntriesAndPack}
              className={`flex items-center gap-2.5 px-7 py-3 rounded-xl font-serif font-bold text-sm tracking-wider uppercase transition-all shadow-lg ${
                entries.length > 0
                  ? 'bg-gradient-to-r from-[#C29643] via-[#E4B860] to-[#C29643] text-[#2C1D06] hover:brightness-110 shadow-amber-900/30 active:scale-95'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              TIẾN HÀNH QUAY SỐ ({entries.length} BÓNG)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

