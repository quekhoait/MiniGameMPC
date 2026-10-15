// csvParser.js - Robust parser for Student Lists (.xlsx, .csv, and pasted text)
import * as XLSX from 'xlsx';

/**
 * Parse raw pasted text (tabs, commas, or single MSSV per line)
 * Example lines:
 * 1. 2024001
 * 2. 2024001, Nguyễn Văn A, CNTT1
 * 3. 2024001 \t Trần Thị B \t KTPM2
 */
export function parsePastedText(text) {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const students = [];
  const seenMssv = new Set();
  const duplicates = [];

  lines.forEach((line, index) => {
    // Split by tab, comma, or semicolon
    let parts = [];
    if (line.includes('\t')) {
      parts = line.split('\t').map(p => p.trim());
    } else if (line.includes(';') && !line.includes(',')) {
      parts = line.split(';').map(p => p.trim());
    } else if (line.includes(',')) {
      parts = line.split(',').map(p => p.trim());
    } else {
      // Single value line: MSSV only
      parts = [line];
    }

    const mssv = (parts[0] || '').replace(/^[#\.\s]+/, '').trim();
    if (!mssv) return;

    const fullName = parts[1] || `Sinh viên ${index + 1}`;
    const className = parts[2] || '';

    if (seenMssv.has(mssv)) {
      duplicates.push(mssv);
    }
    seenMssv.add(mssv);

    students.push({
      id: index + 1,
      mssv,
      name: fullName,
      classGroup: className,
      isWinner: false
    });
  });

  return {
    students: students.slice(0, 400),
    totalCount: students.length,
    duplicates: Array.from(new Set(duplicates)),
    isTruncated: students.length > 400
  };
}

/**
 * Parse an uploaded file (.xlsx, .xls, .csv)
 */
export async function parseUploadedFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert sheet to JSON rows
        const rawJson = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        if (!rawJson || rawJson.length === 0) {
          resolve({ students: [], totalCount: 0, duplicates: [], isTruncated: false });
          return;
        }

        // Identify header row if present
        let startRow = 0;
        const firstRow = rawJson[0].map(c => String(c).toLowerCase().trim());
        const hasHeader = firstRow.some(c => 
          c.includes('mssv') || c.includes('mã') || c.includes('id') || c.includes('tên') || c.includes('họ')
        );

        let mssvCol = 0;
        let nameCol = 1;
        let classCol = 2;

        if (hasHeader) {
          startRow = 1;
          firstRow.forEach((h, idx) => {
            if (h.includes('mssv') || h.includes('mã') || h.includes('id')) mssvCol = idx;
            else if (h.includes('tên') || h.includes('họ')) nameCol = idx;
            else if (h.includes('lớp') || h.includes('khoa') || h.includes('class')) classCol = idx;
          });
        }

        const students = [];
        const seenMssv = new Set();
        const duplicates = [];

        for (let i = startRow; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.length === 0) continue;

          const rawMssv = String(row[mssvCol] || '').trim();
          if (!rawMssv) continue;

          const name = String(row[nameCol] || `Sinh viên ${students.length + 1}`).trim();
          const classGroup = String(row[classCol] || '').trim();

          if (seenMssv.has(rawMssv)) {
            duplicates.push(rawMssv);
          }
          seenMssv.add(rawMssv);

          students.push({
            id: students.length + 1,
            mssv: rawMssv,
            name,
            classGroup,
            isWinner: false
          });
        }

        resolve({
          students: students.slice(0, 400),
          totalCount: students.length,
          duplicates: Array.from(new Set(duplicates)),
          isTruncated: students.length > 400
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export lottery history list to CSV with UTF-8 BOM for Microsoft Excel
 */
export function exportHistoryToCSV(historyList, filename = 'ket-qua-quay-so-mssv.csv') {
  if (!historyList || historyList.length === 0) return;

  const headers = ['STT', 'MSSV', 'Họ Và Tên', 'Lớp', 'Thời Gian Trúng', 'Trạng Thái'];
  const rows = historyList.map((item, idx) => [
    idx + 1,
    `"${item.mssv}"`,
    `"${item.name || ''}"`,
    `"${item.classGroup || ''}"`,
    `"${item.time || ''}"`,
    `"${item.confirmed ? 'Đã xác nhận' : 'Chờ duyệt'}"`
  ]);

  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate mock students for instant one-click testing (50, 100, 200, 400)
 */
export function generateMockStudents(count = 100) {
  const ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
  const dem = ['Văn', 'Thị', 'Đình', 'Thành', 'Minh', 'Ngọc', 'Quốc', 'Anh', 'Hữu', 'Đức', 'Phương', 'Thanh'];
  const ten = ['An', 'Bình', 'Cường', 'Dũng', 'Giang', 'Hải', 'Huy', 'Khoa', 'Linh', 'Long', 'Nam', 'Phong', 'Phúc', 'Quân', 'Sơn', 'Tâm', 'Thắng', 'Tùng', 'Việt', 'Vy'];
  const classes = ['22DTHA1', '22DTHB2', '23CNTT1', '23CNTT2', '24KTPM1', '24KTPM2', '22ATTT1', '23HTTT1'];

  const students = [];
  for (let i = 1; i <= Math.min(count, 400); i++) {
    const randomHo = ho[Math.floor(Math.random() * ho.length)];
    const randomDem = dem[Math.floor(Math.random() * dem.length)];
    const randomTen = ten[Math.floor(Math.random() * ten.length)];
    const randomClass = classes[Math.floor(Math.random() * classes.length)];
    
    // MSSV format: 228060xxxx
    const mssvNum = (2000 + i).toString().padStart(4, '0');
    const mssv = `228060${mssvNum}`;

    students.push({
      id: i,
      mssv,
      name: `${randomHo} ${randomDem} ${randomTen}`,
      classGroup: randomClass,
      isWinner: false
    });
  }

  return students;
}

