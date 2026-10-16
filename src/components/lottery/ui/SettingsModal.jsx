// SettingsModal.jsx - Vintage Radio themed Settings & Audio Controls
import React from 'react';
import { X, Volume2, Sliders, Monitor, Sparkles } from 'lucide-react';
import { useGrandDrawStore } from '../store/useGrandDrawStore.js';

export default function SettingsModal() {
  const activeModal = useGrandDrawStore(state => state.activeModal);
  const closeModal = useGrandDrawStore(state => state.closeModal);
  const settings = useGrandDrawStore(state => state.settings);
  const updateSettings = useGrandDrawStore(state => state.updateSettings);

  if (activeModal !== 'SETTINGS') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#161210] border border-[#B8893B]/50 rounded-2xl shadow-2xl overflow-hidden text-amber-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#B8893B]/30 bg-[#211A16]">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="font-serif font-bold text-sm text-[#F3E2C4] tracking-wide">
              RADIO MIXER — CÀI ĐẶT HỆ THỐNG
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="p-1 text-amber-300/60 hover:text-amber-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Audio Sliders */}
          <div className="space-y-4">
            <h4 className="text-xs font-serif font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              Âm Lượng Sân Khấu
            </h4>

            {/* Master Volume */}
            <div>
              <div className="flex justify-between text-xs text-amber-200/80 mb-1">
                <span>Âm lượng tổng (Master)</span>
                <span className="font-mono">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => updateSettings({ masterVolume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* SFX Volume */}
            <div>
              <div className="flex justify-between text-xs text-amber-200/80 mb-1">
                <span>Hiệu ứng cơ khí & va đập (SFX)</span>
                <span className="font-mono">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => updateSettings({ sfxVolume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* BGM Ambient Volume */}
            <div>
              <div className="flex justify-between text-xs text-amber-200/80 mb-1">
                <span>Không khí khán phòng (Ambient)</span>
                <span className="font-mono">{Math.round(settings.bgmVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.bgmVolume}
                onChange={(e) => updateSettings({ bgmVolume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="border-t border-amber-900/40 pt-4 space-y-4">
            {/* Graphics Preset */}
            <div>
              <h4 className="text-xs font-serif font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Monitor className="w-3.5 h-3.5" />
                Chất Lượng Đồ Họa 3D
              </h4>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {['LOW', 'MED', 'HIGH', 'ULTRA'].map((quality) => (
                  <button
                    key={quality}
                    onClick={() => updateSettings({ graphicsQuality: quality })}
                    className={`py-1.5 rounded-lg border font-mono font-medium transition-colors ${
                      settings.graphicsQuality === quality
                        ? 'bg-[#B8893B] text-[#241A0B] border-[#D4AF37] font-bold'
                        : 'bg-[#1D1714] text-amber-300/70 border-amber-900/40 hover:bg-[#2A211D]'
                    }`}
                  >
                    {quality}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Open Ball Delay */}
            <div>
              <h4 className="text-xs font-serif font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Tự Động Mở Quả Cầu Sau
              </h4>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {[
                  { label: '3s', val: 3 },
                  { label: '5s', val: 5 },
                  { label: '8s', val: 8 },
                  { label: 'Thủ công', val: 0 }
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => updateSettings({ autoOpenDelay: opt.val })}
                    className={`py-1.5 rounded-lg border font-medium transition-colors ${
                      settings.autoOpenDelay === opt.val
                        ? 'bg-[#B8893B] text-[#241A0B] border-[#D4AF37] font-bold'
                        : 'bg-[#1D1714] text-amber-300/70 border-amber-900/40 hover:bg-[#2A211D]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#B8893B]/20 bg-[#1A1412] text-right">
          <button
            onClick={closeModal}
            className="px-4 py-1.5 rounded-lg bg-[#B8893B] text-[#251806] font-serif font-bold text-xs hover:brightness-110 transition-all"
          >
            Đóng Bảng
          </button>
        </div>
      </div>
    </div>
  );
}

