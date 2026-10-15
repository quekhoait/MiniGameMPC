import React, { useState, useEffect } from 'react';
import { Users, Upload, Trash2, Sparkles, AlertTriangle, CheckCircle, FileText, Shuffle } from 'lucide-react';

const SAMPLE_NAMES_VI = [
  "Nguyễn Văn An", "Trần Thị Bích", "Lê Hoàng Long", "Phạm Minh Đức", "Vũ Hải Đăng",
  "Hoàng Gia Bảo", "Đặng Thu Thảo", "Bùi Quang Huy", "Đỗ Quỳnh Chi", "Ngô Quốc Anh",
  "Dương Thanh Hằng", "Lý Tuấn Kiệt", "Trịnh Mai Hương", "Mai Xuân Bách", "Hồ Ngọc Hà",
  "Phan Đình Tùng", "Đinh Hữu Phước", "Cao Tiến Đạt", "Lâm Mỹ Dung", "Tô Hoài Nam",
  "Châu Hải My", "Tạ Đình Phong", "Trương Bá Chi", "Vương Nhất Bác", "Kim Trọng",
  "Thúy Kiều", "Thúy Vân", "Từ Hải", "Sơn Tinh", "Thủy Tinh",
  "Thạch Sanh", "Lý Thông", "Chử Đồng Tử", "Tiên Dung", "Thánh Gióng",
  "Lạc Long Quân", "Âu Cơ", "Trần Hưng Đạo", "Quang Trung", "Ngô Quyền",
  "Lê Lợi", "Nguyễn Trãi", "Hai Bà Trưng", "Bà Triệu", "Võ Nguyên Giáp",
  "Cáo Lửa", "Cáo Tuyết", "Cáo Siêu Tốc", "Cáo Tia Chớp", "Cáo Bão Táp"
];

export default function NameInput({ onFoxesReady, initialNames = [] }) {
  const [rawText, setRawText] = useState('');
  const [parsedList, setParsedList] = useState([]);
  const [warning, setWarning] = useState('');

  // Load from props or localStorage on mount
  useEffect(() => {
    if (initialNames && initialNames.length > 0) {
      setRawText(initialNames.map(p => p.name).join('\n'));
    } else {
      const saved = localStorage.getItem('fox_battle_names') || localStorage.getItem('fox_race_names');
      if (saved) {
        setRawText(saved);
      }
    }
  }, [initialNames]);

  // Parse text whenever rawText changes
  useEffect(() => {
    const lines = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const listWithIds = lines.map((name, idx) => ({
      id: idx + 1,
      name
    }));

    setParsedList(listWithIds);

    if (lines.length > 400) {
      setWarning(`Đang có ${lines.length} tên. Hệ thống hỗ trợ tối đa 400 cáo. Hãy giảm bớt hoặc nhấn "Giới hạn 400" để tiếp tục.`);
    } else if (lines.length === 0) {
      setWarning('Vui lòng nhập ít nhất 2 chiến binh cáo để bắt đầu đại chiến sinh tồn.');
    } else {
      setWarning('');
    }

    // Save to local storage
    if (rawText) {
      localStorage.setItem('fox_battle_names', rawText);
    }
  }, [rawText]);

  // Handle file upload (.txt or .csv)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        // Support CSV comma separation or line breaks
        let extractedNames = [];
        if (file.name.endsWith('.csv')) {
          const rows = content.split(/\r\n|\n/);
          rows.forEach(r => {
            const cols = r.split(',');
            cols.forEach(c => {
              const cleaned = c.replace(/["']/g, '').trim();
              if (cleaned) extractedNames.push(cleaned);
            });
          });
        } else {
          extractedNames = content.split(/\r\n|\n/).map(s => s.trim()).filter(Boolean);
        }

        setRawText(extractedNames.join('\n'));
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset file input
  };

  // Generate 400 sample names
  const handleGenerate400 = () => {
    const names = [];
    for (let i = 1; i <= 400; i++) {
      const base = SAMPLE_NAMES_VI[(i - 1) % SAMPLE_NAMES_VI.length];
      names.push(`${base} #${i}`);
    }
    setRawText(names.join('\n'));
  };

  // Generate 50 sample names
  const handleGenerate50 = () => {
    const names = [];
    for (let i = 1; i <= 50; i++) {
      const base = SAMPLE_NAMES_VI[(i - 1) % SAMPLE_NAMES_VI.length];
      names.push(`${base} #${i}`);
    }
    setRawText(names.join('\n'));
  };

  // Trim to exact 400 names
  const handleTrimTo400 = () => {
    const lines = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 400);
    setRawText(lines.join('\n'));
  };

  // Clear all
  const handleClear = () => {
    setRawText('');
    localStorage.removeItem('fox_race_names');
  };

  // Submit and create fox fleet
  const handleCreateFleet = () => {
    if (parsedList.length < 2) return;
    const finalFoxes = parsedList.slice(0, 400);
    onFoxesReady(finalFoxes);
  };

  const isOverLimit = parsedList.length > 400;
  const isValid = parsedList.length >= 2 && !isOverLimit;

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl transition-all">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              DANH SÁCH CHIẾN BINH CÁO BAY
            </h2>
            <p className="text-sm text-slate-400">
              Nhập tối đa 400 tên người chơi (mỗi dòng một tên). Tự động gán ID riêng biệt.
            </p>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className={`px-4 py-2 rounded-xl border font-orbitron font-bold text-sm flex items-center gap-2 shadow-inner ${
            isOverLimit
              ? 'bg-red-950/60 border-red-500 text-red-400'
              : parsedList.length >= 2
              ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-400'
              : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}>
            <span>SỐ LƯỢNG:</span>
            <span className="text-lg">{parsedList.length}</span>
            <span className="text-xs opacity-70">/ 400</span>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* File Upload */}
          <label className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600/70 text-slate-200 text-xs font-semibold cursor-pointer transition shadow-sm">
            <Upload className="w-4 h-4 text-orange-400" />
            <span>Tải file TXT / CSV</span>
            <input
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Quick preset buttons */}
          <button
            type="button"
            onClick={handleGenerate400}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-950/50 hover:bg-orange-900/60 border border-orange-500/50 text-orange-300 text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Tạo nhanh 400 tên mẫu</span>
          </button>

          <button
            type="button"
            onClick={handleGenerate50}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 text-xs font-semibold transition"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>50 tên mẫu</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isOverLimit && (
            <button
              type="button"
              onClick={handleTrimTo400}
              className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-md"
            >
              Cắt về 400 tên đầu
            </button>
          )}

          <button
            type="button"
            onClick={handleClear}
            disabled={parsedList.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 text-xs font-medium transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa hết</span>
          </button>
        </div>
      </div>

      {/* Textarea Input */}
      <div className="relative">
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={`Dán danh sách tên tại đây (mỗi dòng một tên). Ví dụ:&#10;Nguyễn Văn An&#10;Trần Thị Bích&#10;Lê Hoàng Long...`}
          rows={9}
          className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:border-transparent font-mono leading-relaxed resize-y transition shadow-inner"
        />
        <div className="absolute right-3 bottom-3 text-[11px] text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 pointer-events-none">
          Dòng trống tự động bỏ qua
        </div>
      </div>

      {/* Warning message */}
      {warning && (
        <div className={`mt-3 p-3 rounded-xl flex items-center gap-2.5 text-xs font-medium border ${
          isOverLimit
            ? 'bg-rose-950/50 border-rose-600/60 text-rose-300'
            : 'bg-amber-950/40 border-amber-500/50 text-amber-300'
        }`}>
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{warning}</span>
        </div>
      )}

      {/* Submit / Ready Button */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Tên trùng lặp vẫn được giữ nguyên và phân biệt bằng mã định danh riêng biệt.</span>
        </div>

        <button
          type="button"
          disabled={!isValid}
          onClick={handleCreateFleet}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-xl ${
            isValid
              ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-slate-950 shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] cursor-pointer active:scale-[0.98]'
              : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>TẠO ĐỘI CÁO ({parsedList.length} CHIẾN BINH)</span>
        </button>
      </div>
    </div>
  );
}

