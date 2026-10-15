// StudentImportModal.jsx - Import and Manage Student List (Paste, Excel, CSV, Mock)
import React, { useState } from 'react';
import { Upload, X, AlertTriangle, CheckCircle2, Users, FileSpreadsheet, Sparkles, Trash2 } from 'lucide-react';
import { parsePastedText, parseUploadedFile, generateMockStudents } from '../../utils/csvParser';

export default function StudentImportModal({
  isOpen,
  onClose,
  onSaveStudents,
  currentCount = 0
}) {
  const [inputText, setInputText] = useState('');
  const [parsedResult, setParsedResult] = useState({
    students: [],
    totalCount: 0,
    duplicates: [],
    isTruncated: false
  });
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState('paste'); // 'paste' | 'file' | 'mock'

  if (!isOpen) return null;

  // Handle Textarea input changes
  const handleTextChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    if (text.trim()) {
      const res = parsePastedText(text);
      setParsedResult(res);
    } else {
      setParsedResult({ students: [], totalCount: 0, duplicates: [], isTruncated: false });
    }
  };

  // Handle File Upload (.xlsx, .csv)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const res = await parseUploadedFile(file);
      setParsedResult(res);
      // Format back to textarea preview
      const previewStr = res.students.map(s => `${s.mssv}, ${s.name}, ${s.classGroup}`).join('\n');
      setInputText(previewStr);
    } catch (err) {
      alert(`Lỗi đọc file: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Quick generate mock students
  const handleGenerateMock = (count) => {
    const mock = generateMockStudents(count);
    const previewStr = mock.map(s => `${s.mssv}, ${s.name}, ${s.classGroup}`).join('\n');
    setInputText(previewStr);
    setParsedResult({
      students: mock,
      totalCount: mock.length,
      duplicates: [],
      isTruncated: false
    });
  };

  // Confirm and inject into engine
  const handleConfirm = () => {
    if (parsedResult.students.length === 0) return;
    onSaveStudents(parsedResult.students);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-orbitron font-black text-lg sm:text-xl text-white">
                NHẬP DANH SÁCH MSSV VÀO LỒNG CẦU
              </h2>
              <p className="text-xs text-slate-400">
                Tối đa 400 quả cầu tương ứng 400 mã số sinh viên
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Dán danh sách (Text/Excel)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'file'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Tải file Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'mock'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tạo mẫu nhanh</span>
          </button>
        </div>

        {/* Tab 1: Paste Text */}
        {activeTab === 'paste' && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Dán danh sách sinh viên (mỗi dòng: MSSV, Họ và tên, Lớp):
            </label>
            <textarea
              rows={7}
              value={inputText}
              onChange={handleTextChange}
              placeholder="Ví dụ:&#10;2280601234, Nguyễn Văn An, 22DTHA1&#10;2280605678, Trần Thị Bình, 23CNTT2&#10;2280609999&#10;..."
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs sm:text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>
        )}

        {/* Tab 2: File Upload */}
        {activeTab === 'file' && (
          <div className="mb-4 p-6 border-2 border-dashed border-slate-700 hover:border-amber-500/70 rounded-2xl bg-slate-950/60 text-center transition">
            <input
              type="file"
              id="file-upload"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <Upload className="w-8 h-8 text-amber-400 mb-2 animate-bounce" />
              <span className="text-sm font-bold text-white mb-1">
                Chọn file Excel (.xlsx, .xls) hoặc CSV
              </span>
              <span className="text-xs text-slate-400">
                Hệ thống tự động nhận diện cột MSSV, Họ Tên, Lớp
              </span>
            </label>
            {isParsing && (
              <p className="mt-2 text-xs text-amber-400 font-bold">Đang phân tích file...</p>
            )}
          </div>
        )}

        {/* Tab 3: Quick Mock Generator */}
        {activeTab === 'mock' && (
          <div className="mb-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <p className="text-xs text-slate-300 mb-3">
              Tạo nhanh bộ dữ liệu sinh viên mẫu thực tế để thử nghiệm lồng cầu 3D ngay:
            </p>
            <div className="flex flex-wrap gap-2">
              {[50, 100, 200, 400].map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => handleGenerateMock(cnt)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Tạo {cnt} Sinh Viên
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Duplicates or Errors Warning */}
        {parsedResult.duplicates.length > 0 && (
          <div className="mb-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Cảnh báo MSSV bị trùng lặp ({parsedResult.duplicates.length}):</p>
              <p className="font-mono text-[11px] truncate mt-0.5">
                {parsedResult.duplicates.slice(0, 5).join(', ')}
                {parsedResult.duplicates.length > 5 && '...'}
              </p>
            </div>
          </div>
        )}

        {/* Preview Summary */}
        <div className="flex items-center justify-between text-xs font-semibold px-1 py-1 mb-2 text-slate-400">
          <span>Tổng số sinh viên hợp lệ: <strong className="text-emerald-400">{parsedResult.students.length} / 400</strong></span>
          {parsedResult.isTruncated && (
            <span className="text-amber-400 text-[11px]">(Đã giới hạn tối đa 400 sinh viên)</span>
          )}
        </div>

        {/* Preview Table */}
        {parsedResult.students.length > 0 && (
          <div className="mb-4 max-h-40 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/90 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-900 sticky top-0 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-1.5 font-bold">#</th>
                  <th className="px-3 py-1.5 font-bold">MSSV</th>
                  <th className="px-3 py-1.5 font-bold">Họ Và Tên</th>
                  <th className="px-3 py-1.5 font-bold">Lớp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {parsedResult.students.slice(0, 20).map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="px-3 py-1 text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-1 text-amber-300 font-bold">{s.mssv}</td>
                    <td className="px-3 py-1 text-slate-200">{s.name}</td>
                    <td className="px-3 py-1 text-slate-400">{s.classGroup || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedResult.students.length > 20 && (
              <div className="text-center py-1 text-[11px] text-slate-500 border-t border-slate-800">
                ...và còn {parsedResult.students.length - 20} sinh viên khác
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            disabled={parsedResult.students.length === 0}
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-orbitron font-black text-xs tracking-wider shadow-lg hover:scale-105 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>NẠP {parsedResult.students.length} QUẢ CẦU VÀO LỒNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}

