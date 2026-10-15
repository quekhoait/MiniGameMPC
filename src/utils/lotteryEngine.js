// lotteryEngine.js - State management, Fair Selection Algorithm & Session Persistence
import { lotteryAudio } from './lotteryAudio';
import { generateMockStudents } from './csvParser';

const STORAGE_KEY_STUDENTS = 'lottery_3d_students_list';
const STORAGE_KEY_HISTORY = 'lottery_3d_draw_history';

export class LotteryEngine {
  constructor() {
    this.students = [];
    this.remainingStudents = [];
    this.history = [];
    this.currentWinner = null;
    this.phase = 'IDLE'; // 'IDLE' | 'SPINNING_UP' | 'SPINNING_FAST' | 'SLOWING_DOWN' | 'EXTRACTING' | 'ANNOUNCING'
    this.drumSpeed = 0; // 0 to 1
    this.targetDrumSpeed = 0;
    
    // Batch spin configuration
    this.targetWinnerCount = 1; // 1, 3, 5, 10, or custom
    this.batchDrawnCount = 0;
    this.isAutoSpinning = false;
    this.autoSpinTimeout = null;

    // Listeners for UI reactive updates
    this.listeners = new Set();

    this.loadFromStorage();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach(cb => {
      try {
        cb(state);
      } catch (err) {
        console.error(err);
      }
    });
  }

  getState() {
    return {
      phase: this.phase,
      totalStudents: this.students.length,
      remainingCount: this.remainingStudents.length,
      wonCount: this.history.length,
      currentWinner: this.currentWinner,
      targetWinnerCount: this.targetWinnerCount,
      batchDrawnCount: this.batchDrawnCount,
      isAutoSpinning: this.isAutoSpinning,
      drumSpeed: this.drumSpeed
    };
  }

  loadFromStorage() {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (savedHistory) {
        this.history = JSON.parse(savedHistory);
      }

      const savedStudents = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (savedStudents) {
        const parsed = JSON.parse(savedStudents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.setStudents(parsed, false);
          return;
        }
      }

      // Default initial mock students (80 students) if empty
      const defaultMock = generateMockStudents(80);
      this.setStudents(defaultMock, false);
    } catch {
      // Fallback
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(this.students));
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(this.history));
    } catch {
      // Quota exceeded fallback
    }
  }

  setStudents(newStudents, clearHistory = true) {
    if (clearHistory) {
      this.history = [];
      this.currentWinner = null;
    }

    const wonMssvs = new Set(this.history.map(h => h.mssv));

    this.students = newStudents.slice(0, 400).map((s, idx) => ({
      ...s,
      id: idx + 1,
      isWinner: wonMssvs.has(s.mssv)
    }));

    this.remainingStudents = this.students.filter(s => !wonMssvs.has(s.mssv));
    this.saveToStorage();
    this.notify();
  }

  setTargetWinnerCount(count) {
    this.targetWinnerCount = Math.max(1, Number(count) || 1);
    this.batchDrawnCount = 0;
    this.notify();
  }

  // =========================================================================
  // SPINNING PHASES (4-STAGE ENGINE)
  // =========================================================================

  // Step 1: Start Drum Rotation
  startSpin() {
    if (this.remainingStudents.length === 0) return false;
    if (this.phase !== 'IDLE' && this.phase !== 'ANNOUNCING') return false;

    this.phase = 'SPINNING_UP';
    this.drumSpeed = 0.2;
    this.targetDrumSpeed = 1.0;
    this.currentWinner = null;

    lotteryAudio.startDrumSpin(0.6);
    this.notify();

    // After 1.2s ramp-up, enter SPINNING_FAST
    setTimeout(() => {
      if (this.phase === 'SPINNING_UP') {
        this.phase = 'SPINNING_FAST';
        this.drumSpeed = 1.0;
        lotteryAudio.updateDrumSpeed(1.0);
        this.notify();

        // If in auto-spin mode or user doesn't press manual stop, auto slow-down after 3.2s
        if (this.isAutoSpinning) {
          setTimeout(() => {
            if (this.phase === 'SPINNING_FAST') {
              this.stopAndDrawWinner();
            }
          }, 2800);
        }
      }
    }, 1200);

    return true;
  }

  // Step 2 & 3: Stop button triggered -> decelerate & choose fair winner
  stopAndDrawWinner() {
    if (this.phase !== 'SPINNING_FAST' && this.phase !== 'SPINNING_UP') return;
    if (this.remainingStudents.length === 0) return;

    this.phase = 'SLOWING_DOWN';
    this.targetDrumSpeed = 0.15;
    lotteryAudio.updateDrumSpeed(0.4);
    this.notify();

    // Fair Random Selection from remaining candidates
    const chosenIndex = Math.floor(Math.random() * this.remainingStudents.length);
    const chosenStudent = this.remainingStudents[chosenIndex];

    // Remove from remaining pool immediately to prevent double-draws
    this.remainingStudents.splice(chosenIndex, 1);

    // Mark as winner in student list
    const foundStudent = this.students.find(s => s.mssv === chosenStudent.mssv);
    if (foundStudent) {
      foundStudent.isWinner = true;
    }

    // Prepare winner record
    const record = {
      order: this.history.length + 1,
      id: chosenStudent.id,
      mssv: chosenStudent.mssv,
      name: chosenStudent.name,
      classGroup: chosenStudent.classGroup || '',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: new Date().toLocaleDateString('vi-VN'),
      confirmed: true
    };

    // Delay 1.4s for realistic deceleration, then trigger Extraction
    setTimeout(() => {
      this.currentWinner = record;
      this.history.unshift(record);
      this.batchDrawnCount++;
      this.saveToStorage();

      this.phase = 'EXTRACTING';
      this.drumSpeed = 0.05;
      lotteryAudio.stopDrumSpin();
      lotteryAudio.playExtractionWhoosh();
      this.notify();

      // After ball rolls down chute (1.2s), announce winner
      setTimeout(() => {
        this.phase = 'ANNOUNCING';
        this.drumSpeed = 0;
        lotteryAudio.playBallDrop();
        setTimeout(() => {
          lotteryAudio.playWinnerFanfare();
        }, 150);
        this.notify();

        // Handle auto-spin loop
        if (this.isAutoSpinning) {
          if (this.batchDrawnCount < this.targetWinnerCount && this.remainingStudents.length > 0) {
            this.autoSpinTimeout = setTimeout(() => {
              this.startSpin();
            }, 3800); // 3.8s pause to view result before next spin
          } else {
            this.isAutoSpinning = false;
            this.notify();
          }
        }
      }, 1200);
    }, 1400);
  }

  toggleAutoSpin() {
    if (this.isAutoSpinning) {
      this.isAutoSpinning = false;
      if (this.autoSpinTimeout) clearTimeout(this.autoSpinTimeout);
      this.notify();
    } else {
      if (this.remainingStudents.length === 0) return;
      this.isAutoSpinning = true;
      this.batchDrawnCount = 0;
      this.startSpin();
    }
  }

  confirmWinnerAndContinue() {
    if (this.phase === 'ANNOUNCING') {
      this.phase = 'IDLE';
      this.notify();
    }
  }

  // Reset entire session (delete draw history and replenish remaining pool)
  resetSession() {
    if (this.autoSpinTimeout) clearTimeout(this.autoSpinTimeout);
    this.isAutoSpinning = false;
    this.phase = 'IDLE';
    this.drumSpeed = 0;
    this.currentWinner = null;
    this.history = [];
    this.batchDrawnCount = 0;
    this.students.forEach(s => s.isWinner = false);
    this.remainingStudents = [...this.students];
    this.saveToStorage();
    this.notify();
  }

  // Clear everything including students
  clearAll() {
    if (this.autoSpinTimeout) clearTimeout(this.autoSpinTimeout);
    this.isAutoSpinning = false;
    this.phase = 'IDLE';
    this.students = [];
    this.remainingStudents = [];
    this.history = [];
    this.currentWinner = null;
    this.batchDrawnCount = 0;
    this.saveToStorage();
    this.notify();
  }
}

