// useGrandDrawStore.js - Zustand State Machine for Grand Draw Cinematic 3D Lottery
import { create } from 'zustand';
import { parseEntries, removeDuplicates, shuffleArray } from '../lib/parseEntries.js';
import { pickCryptoRandom } from '../lib/cryptoRandom.js';
import { grandAudio } from '../audio/grandDrawAudio.js';

export const PHASES = {
  EDITING: 'EDITING',
  PACKING: 'PACKING',
  LOADING_CAGE: 'LOADING_CAGE',
  IDLE_READY: 'IDLE_READY',
  SPINNING: 'SPINNING',
  DECELERATING: 'DECELERATING',
  DISPENSING: 'DISPENSING',
  BALL_PRESENTED: 'BALL_PRESENTED',
  OPENING: 'OPENING',
  TICKET_SHOWN: 'TICKET_SHOWN',
  FINISHED: 'FINISHED'
};

export const BALL_COLORS = [
  '#FF3B5C', // Crimson Ruby
  '#E67E22', // Amber Orange
  '#F1C40F', // Imperial Gold
  '#2ECC71', // Emerald Jade
  '#1ABC9C', // Turquoise
  '#3498DB', // Sapphire Blue
  '#9B59B6', // Amethyst Purple
  '#E91E63', // Hot Pink
  '#00BCD4', // Cyan Lapis
  '#C9A24A', // Champagne Brass
  '#E74C3C', // Coral Red
  '#8E44AD'  // Royal Violet
];

const DEFAULT_SAMPLE_ENTRIES = `SV001 | Nguyễn Văn An | Giải Nhất
SV002 | Trần Thị Bích | Giải Nhì
SV003 | Lê Hoàng Cường | Giải Ba
SV004 | Phạm Minh Đức | Giải Khuyến Khích
SV005 | Hoàng Thùy Dung | Giải Khuyến Khích
SV006 | Đỗ Gia Hưng | Giải Nhất
SV007 | Vũ Thu Hà | Giải Ba
SV008 | Ngô Thanh Long | Giải Nhì
SV009 | Bùi Mai Linh | Giải Khuyến Khích
SV010 | Phan Quốc Nam | Giải Nhất
SV011 | Đặng Tuấn Kiệt | Giải Ba
SV012 | Trịnh Quỳnh Nga | Giải Khuyến Khích
SV013 | Lương Thế Phong | Giải Nhì
SV014 | Hồ Ngọc Phương | Giải Khuyến Khích
SV015 | Mai Anh Quân | Giải Ba
SV016 | Chu Diễm Quỳnh | Giải Khuyến Khích
SV017 | Tạ Quang Sáng | Giải Nhất
SV018 | Đinh Cẩm Tú | Giải Nhì
SV019 | Lâm Bảo Uyên | Giải Khuyến Khích
SV020 | Quách Đình Vũ | Giải Ba`;

const STORAGE_KEYS = {
  RAW_TEXT: 'grand_draw_raw_entries_v1',
  HISTORY: 'grand_draw_history_v1',
  SETTINGS: 'grand_draw_settings_v1',
  REMOVE_AFTER_DRAW: 'grand_draw_remove_after_draw_v1'
};

function loadStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

const initialText = loadStorage(STORAGE_KEYS.RAW_TEXT, DEFAULT_SAMPLE_ENTRIES);
const initialEntries = parseEntries(initialText);
const initialHistory = loadStorage(STORAGE_KEYS.HISTORY, []);
const initialRemoveAfterDraw = loadStorage(STORAGE_KEYS.REMOVE_AFTER_DRAW, true);
const initialSettings = loadStorage(STORAGE_KEYS.SETTINGS, {
  masterVolume: 0.8,
  sfxVolume: 0.9,
  bgmVolume: 0.5,
  graphicsQuality: 'HIGH', // 'LOW' | 'MED' | 'HIGH' | 'ULTRA'
  autoOpenDelay: 6
});

export const useGrandDrawStore = create((set, get) => ({
  phase: PHASES.EDITING,
  rawInputText: initialText,
  entries: initialEntries,
  remainingPool: [...initialEntries],
  drawHistory: initialHistory,
  currentWinner: null,
  currentBallColor: '#F1C40F',
  removeAfterDraw: initialRemoveAfterDraw,
  activeModal: 'ENTRY', // 'ENTRY' | 'SETTINGS' | 'HISTORY' | null

  // Interactive 3D highlight state
  hoveredProp: null, // 'CRANK' | 'BALL' | 'RADIO' | 'CLIPBOARD' | 'CHEST' | null
  cageRotationAngle: 0,
  isSpinning: false,

  settings: initialSettings,

  setPhase: (phase) => set({ phase }),

  setHoveredProp: (prop) => {
    if (prop && prop !== get().hoveredProp) {
      grandAudio.playPropHover();
    }
    set({ hoveredProp: prop });
  },

  setActiveModal: (modal) => {
    grandAudio.playPropHover();
    set({ activeModal: modal });
  },

  closeModal: () => set({ activeModal: null }),

  setRawInputText: (text) => {
    const parsed = parseEntries(text);
    saveStorage(STORAGE_KEYS.RAW_TEXT, text);
    set({
      rawInputText: text,
      entries: parsed,
      remainingPool: [...parsed]
    });
  },

  shuffleEntries: () => {
    const { entries, rawInputText } = get();
    const shuffled = shuffleArray(entries);
    const newText = shuffled.map(e => e.prize ? `${e.title} | ${e.prize}` : e.title).join('\n');
    saveStorage(STORAGE_KEYS.RAW_TEXT, newText);
    set({
      rawInputText: newText,
      entries: shuffled,
      remainingPool: [...shuffled]
    });
  },

  sortEntries: () => {
    const { entries } = get();
    const sorted = [...entries].sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    const newText = sorted.map(e => e.prize ? `${e.title} | ${e.prize}` : e.title).join('\n');
    saveStorage(STORAGE_KEYS.RAW_TEXT, newText);
    set({
      rawInputText: newText,
      entries: sorted,
      remainingPool: [...sorted]
    });
  },

  dedupeEntries: () => {
    const { entries } = get();
    const deduped = removeDuplicates(entries);
    const newText = deduped.map(e => e.prize ? `${e.title} | ${e.prize}` : e.title).join('\n');
    saveStorage(STORAGE_KEYS.RAW_TEXT, newText);
    set({
      rawInputText: newText,
      entries: deduped,
      remainingPool: [...deduped]
    });
  },

  toggleRemoveAfterDraw: () => {
    const nextVal = !get().removeAfterDraw;
    saveStorage(STORAGE_KEYS.REMOVE_AFTER_DRAW, nextVal);
    set({ removeAfterDraw: nextVal });
  },

  clearHistory: () => {
    saveStorage(STORAGE_KEYS.HISTORY, []);
    set({ drawHistory: [] });
  },

  updateSettings: (partial) => {
    const updated = { ...get().settings, ...partial };
    saveStorage(STORAGE_KEYS.SETTINGS, updated);
    if (partial.masterVolume !== undefined) grandAudio.setMasterVolume(updated.masterVolume);
    if (partial.sfxVolume !== undefined) grandAudio.setSfxVolume(updated.sfxVolume);
    if (partial.bgmVolume !== undefined) grandAudio.setBgmVolume(updated.bgmVolume);
    set({ settings: updated });
  },

  // Transition from EDITING -> PACKING -> LOADING_CAGE -> IDLE_READY
  confirmEntriesAndPack: () => {
    const { entries } = get();
    if (entries.length === 0) return;

    set({
      activeModal: null,
      phase: PHASES.PACKING,
      remainingPool: [...entries]
    });

    // Sound: sequence of ball drops
    grandAudio.ensureContext();
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        grandAudio.playBallDrop(0.8 + Math.random() * 0.4);
      }, 400 + i * 160);
    }

    setTimeout(() => {
      set({ phase: PHASES.LOADING_CAGE });
      grandAudio.playLidClank();

      setTimeout(() => {
        set({ phase: PHASES.IDLE_READY });
      }, 900);
    }, 2200);
  },

  // Start spinning the brass cage (Triggered by clicking/dragging crank or cage)
  triggerSpin: () => {
    const { phase, remainingPool, isSpinning } = get();
    if (phase !== PHASES.IDLE_READY || isSpinning) return;
    if (remainingPool.length === 0) {
      set({ phase: PHASES.FINISHED });
      return;
    }

    grandAudio.ensureContext();
    grandAudio.playCrankRatchet();
    grandAudio.startTumble();
    grandAudio.playSpinMusic();

    set({
      phase: PHASES.SPINNING,
      isSpinning: true
    });

    // Pick winner via cryptographically secure RNG
    const pickResult = pickCryptoRandom(remainingPool);
    const chosenWinner = pickResult.item;
    const randomColor = BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];

    // Spin duration 3.8s, then decelerate into dispensing
    setTimeout(() => {
      set({ phase: PHASES.DECELERATING });
      grandAudio.stopTumble();
      grandAudio.stopSpinMusic();

      setTimeout(() => {
        set({
          phase: PHASES.DISPENSING,
          currentWinner: chosenWinner,
          currentBallColor: randomColor,
          isSpinning: false
        });
        grandAudio.playChuteRoll();

        // Ball arrives in velvet catch tray rotating 45 degrees
        setTimeout(() => {
          set({ phase: PHASES.BALL_PRESENTED });
          // Give 800ms for solid sphere to complete 45-degree rotation, then open lid
          setTimeout(() => {
            get().openBall();
          }, 800);
        }, 950);
      }, 1100);
    }, 3000);
  },

  // Open ball: splits in half, golden bloom flash, reveal ticket
  openBall: () => {
    const { phase, currentWinner, remainingPool, removeAfterDraw, drawHistory } = get();
    if (phase !== PHASES.BALL_PRESENTED || !currentWinner) return;

    grandAudio.playBallCrackBloom();
    set({ phase: PHASES.OPENING });

    // Update history & pool
    const newHistoryItem = {
      id: `draw-${Date.now()}`,
      item: currentWinner,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: new Date().toLocaleDateString('vi-VN'),
      ticketNumber: drawHistory.length + 1
    };
    const nextHistory = [newHistoryItem, ...drawHistory];
    saveStorage(STORAGE_KEYS.HISTORY, nextHistory);

    let nextPool = remainingPool;
    if (removeAfterDraw) {
      nextPool = remainingPool.filter(e => e.id !== currentWinner.id);
    }

    setTimeout(() => {
      grandAudio.playTicketRevealFanfare();
      set({
        phase: PHASES.TICKET_SHOWN,
        drawHistory: nextHistory,
        remainingPool: nextPool
      });
    }, 1200);
  },

  // Proceed to next draw
  nextDraw: () => {
    const { remainingPool } = get();
    if (remainingPool.length === 0) {
      set({
        phase: PHASES.FINISHED,
        currentWinner: null
      });
    } else {
      set({
        phase: PHASES.IDLE_READY,
        currentWinner: null
      });
    }
  },

  // Return to editing list
  returnToEditing: () => {
    grandAudio.stopSpinMusic();
    set({
      activeModal: 'ENTRY',
      phase: PHASES.EDITING,
      currentWinner: null
    });
  }
}));

