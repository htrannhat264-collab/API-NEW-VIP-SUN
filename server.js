const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;

// ==========================================
// CHỈ GIỮ 2 GAME
// ==========================================
const GAME_APIS = {
  'lc79_tx': 'https://wtx.tele68.com/v1/tx/lite-sessions?cp=R&cl=R&pf=web&at=83991213bfd4c554dc94bcd98979bdc5',
  'lc79_txmd5': 'https://wtxmd52.tele68.com/v1/txmd5/lite-sessions?cp=R&cl=R&pf=web&at=3959701241b686f12e01bfe9c3a319b8'
};

// ==========================================
// LƯU TRỮ DỮ LIỆU
// ==========================================
const gameData = {};
const statsDB = {};
const memory = {};

for (let key in GAME_APIS) {
  gameData[key] = { 
    data: [], 
    tongData: [], 
    lichSuDuDoan: [], 
    feedbackHistory: [],
    historyTaiXiu: [] // Lưu lịch sử Tài/Xỉu riêng
  };
  statsDB[key] = { tong: 0, dung: 0, sai: 0, tiLe: '0%' };
  memory[key] = { 
    patterns: [], 
    markovChain: {}, 
    kalmanState: { x: 10.5, p: 1 },
    streakHistory: [],
    cycleCount: 0,
    lastPrediction: null
  };
}

// ==========================================
// HÀM CHUẨN HÓA KẾT QUẢ
// ==========================================
function chuanHoa(ketQua) {
  if (!ketQua) return null;
  const kq = String(ketQua).toLowerCase().trim();
  if (kq === 'tài' || kq === 'tai' || kq === 'big' || kq === 'b') return 'Tài';
  if (kq === 'xỉu' || kq === 'xiu' || kq === 'small' || kq === 's') return 'Xỉu';
  if (kq === 'chẵn' || kq === 'chan') return 'Chẵn';
  if (kq === 'lẻ' || kq === 'le') return 'Lẻ';
  return ketQua;
}

// ==========================================
// FETCH DATA
// ==========================================
async function fetchGameData(url, gameKey) {
  try {
    const headers = { 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    };
    
    const res = await axios.get(url, { timeout: 10000, headers });
    let data = res.data;
    if (!data) return null;
    
    // XỬ LÝ API TELE68
    if (data.list && Array.isArray(data.list) && data.list.length > 0) {
      const lastItem = data.list[data.list.length - 1];
      let ketQua = lastItem.resultTruyenThong || lastItem.result;
      if (ketQua === 'TAI' || ketQua === 'BIG') ketQua = 'Tài';
      if (ketQua === 'XIU' || ketQua === 'SMALL') ketQua = 'Xỉu';
      
      return {
        phien: lastItem.id,
        ket_qua: chuanHoa(ketQua),
        dice: lastItem.dices || [],
        tong: lastItem.point || lastItem.total || null
      };
    }
    return null;
  } catch (error) {
    console.error(`❌ Fetch lỗi ${gameKey}:`, error.message);
    return null;
  }
}

// ==========================================
// THUẬT TOÁN NÂNG CẤP CHO LC79_TX
// ==========================================
function engineLC79TX(lichSu, tongData, kalmanState, historyTaiXiu) {
  // Lấy lịch sử Tài/Xỉu gần nhất
  const recent = historyTaiXiu.slice(0, 20);
  
  // TRƯỜNG HỢP 1: CHỈ CÓ 1 PHIÊN
  if (recent.length === 0) {
    return { duDoan: 'Tài', doTinCay: 55, lyDo: '⚠️ Chưa có dữ liệu, dự đoán Tài' };
  }
  if (recent.length === 1) {
    const duDoan = recent[0] === "Tài" ? "Xỉu" : "Tài";
    return { duDoan, doTinCay: 62, lyDo: `⚠️ Chỉ 1 phiên (${recent[0]}), dự đoán đảo cầu: ${duDoan}` };
  }
  
  // TRƯỜNG HỢP 2: CÓ 2 PHIÊN
  if (recent.length === 2) {
    const last2 = recent.slice(0, 2);
    if (last2[0] === last2[1]) {
      const duDoan = last2[0] === "Tài" ? "Xỉu" : "Tài";
      return { duDoan, doTinCay: 66, lyDo: `📊 Bệt 2 phiên ${last2[0]}, dự đoán đảo thành ${duDoan}` };
    } else {
      const duDoan = last2[0];
      return { duDoan, doTinCay: 64, lyDo: `🔄 Cầu 1-1 (${last2[0]}→${last2[1]}), theo ${duDoan}` };
    }
  }
  
  // TRƯỜNG HỢP 3: CÓ 3 PHIÊN
  if (recent.length === 3) {
    const last3 = recent.slice(0, 3);
    if (last3[0] === last3[1] && last3[1] === last3[2]) {
      const duDoan = last3[0] === "Tài" ? "Xỉu" : "Tài";
      return { duDoan, doTinCay: 74, lyDo: `🔥 Bệt 3 phiên ${last3[0]}, dự đoán đảo cầu ${duDoan}` };
    }
    if (last3[0] !== last3[1] && last3[1] !== last3[2]) {
      const duDoan = last3[2] === "Tài" ? "Xỉu" : "Tài";
      return { duDoan, doTinCay: 72, lyDo: `🎯 Cầu 1-1 (${last3[0]}→${last3[1]}→${last3[2]}), dự đoán ${duDoan}` };
    }
    const duDoan = last3[0] === "Tài" ? "Xỉu" : "Tài";
    return { duDoan, doTinCay: 65, lyDo: `⚖️ Dự đoán đảo cầu (${last3[0]} → ${duDoan})` };
  }
  
  // ========== ĐÃ CÓ >=4 PHIÊN ==========
  
  // 1. PHÁT HIỆN CHUỖI BỆT
  let streak = 1;
  for (let i = 1; i < Math.min(recent.length, 12); i++) {
    if (recent[i] === recent[0]) streak++;
    else break;
  }
  
  if (streak >= 6) {
    const duDoan = recent[0] === 'Tài' ? 'Xỉu' : 'Tài';
    let doTinCay = Math.min(95, 80 + (streak - 5) * 4);
    return { duDoan, doTinCay, lyDo: `🔥🔥🔥 Bệt ${streak} phiên ${recent[0]} => BẺ CẦU ${duDoan}` };
  }
  
  if (streak === 5) {
    const duDoan = recent[0] === 'Tài' ? 'Xỉu' : 'Tài';
    return { duDoan, doTinCay: 88, lyDo: `🔥🔥 Bệt 5 phiên ${recent[0]} => BẺ CẦU ${duDoan}` };
  }
  
  if (streak === 4) {
    const duDoan = recent[0] === 'Tài' ? 'Xỉu' : 'Tài';
    return { duDoan, doTinCay: 82, lyDo: `🔥 Bệt 4 phiên ${recent[0]} => BẺ CẦU ${duDoan}` };
  }
  
  if (streak === 3) {
    const duDoan = recent[0] === 'Tài' ? 'Xỉu' : 'Tài';
    return { duDoan, doTinCay: 74, lyDo: `⚡ Bệt 3 phiên ${recent[0]} => Đảo cầu ${duDoan}` };
  }

  // 2. CẦU 1-1 (ZIGZAG)
  if (recent.length >= 4) {
    let isZigzag = true;
    for (let i = 1; i < 4; i++) {
      if (recent[i] === recent[i-1]) { isZigzag = false; break; }
    }
    if (isZigzag) {
      const duDoan = recent[0] === 'Tài' ? 'Xỉu' : 'Tài';
      let doTinCay = 78;
      // Nếu zigzag kéo dài, tăng độ tin cậy
      if (recent.length >= 6 && recent[0] !== recent[1] && recent[2] !== recent[3]) {
        doTinCay = 85;
        return { duDoan, doTinCay, lyDo: `🎯🎯 Cầu 1-1 dài (${recent.slice(0,6).join('→')}) => ${duDoan}` };
      }
      return { duDoan, doTinCay, lyDo: `🎯 Cầu 1-1 => ${duDoan}` };
    }
  }

  // 3. PHÂN TÍCH TẦN SUẤT 5-10 PHIÊN
  if (recent.length >= 5) {
    const last5 = recent.slice(0, 5);
    const last10 = recent.slice(0, Math.min(10, recent.length));
    const tai5 = last5.filter(r => r === 'Tài').length;
    const tai10 = last10.filter(r => r === 'Tài').length;
    
    // Nếu 5 phiên có 4-5 Tài
    if (tai5 >= 4) {
      return { duDoan: 'Xỉu', doTinCay: 82, lyDo: `📊 5 phiên ${tai5}T => BẮT XỈU` };
    }
    if (tai5 <= 1) {
      return { duDoan: 'Tài', doTinCay: 82, lyDo: `📊 5 phiên ${tai5}T => BẮT TÀI` };
    }
    
    // Nếu 10 phiên có 7-8 Tài
    if (tai10 >= 7) {
      return { duDoan: 'Xỉu', doTinCay: 80, lyDo: `📊 10 phiên ${tai10}T => BẮT XỈU` };
    }
    if (tai10 <= 3) {
      return { duDoan: 'Tài', doTinCay: 80, lyDo: `📊 10 phiên ${tai10}T => BẮT TÀI` };
    }
  }

  // 4. PHÁT HIỆN CHU KỲ 3-4 PHIÊN
  if (recent.length >= 6) {
    const p4 = recent.slice(0, 4);
    const p5 = recent.slice(0, 5);
    const p6 = recent.slice(0, 6);
    
    // Chu kỳ 3: Tài-Xỉu-Tài hoặc Xỉu-Tài-Xỉu
    if (p4[0] === p4[2] && p4[1] === p4[3] && p4[0] !== p4[1]) {
      const duDoan = p4[0] === 'Tài' ? 'Xỉu' : 'Tài';
      return { duDoan, doTinCay: 82, lyDo: `🔄 Chu kỳ 2-2 (${p4.slice(0,4).join('→')}) => ${duDoan}` };
    }
    
    // Chu kỳ 3-1 hoặc 1-3
    if (p5[0] === p5[1] && p5[0] === p5[2] && p5[3] === p5[4] && p5[0] !== p5[3]) {
      const duDoan = p5[0] === 'Tài' ? 'Xỉu' : 'Tài';
      return { duDoan, doTinCay: 80, lyDo: `🔄 Mẫu 3-1 (${p5.slice(0,5).join('→')}) => ${duDoan}` };
    }
  }

  // 5. KALMAN FILTER (DỰA TRÊN ĐIỂM)
  if (tongData && tongData.length > 0) {
    let x_pred = kalmanState.x; 
    let p_pred = kalmanState.p + 0.1; 
    const z = tongData[0]; 
    const k_gain = p_pred / (p_pred + 2.9); 
    kalmanState.x = x_pred + k_gain * (z - x_pred);
    kalmanState.p = (1 - k_gain) * p_pred;
    const diemUocLuong = kalmanState.x;
    const kqKalman = diemUocLuong > 10.5 ? 'Tài' : 'Xỉu';
    
    // Điều chỉnh độ tin cậy Kalman
    let doTinCay = 72;
    if (recent.length >= 8) doTinCay += 5;
    if (Math.abs(diemUocLuong - 10.5) > 3) doTinCay += 5;
    
    // Kiểm tra xem Kalman có trùng với xu hướng không
    const lastResult = recent[0];
    if (kqKalman === lastResult) {
      doTinCay += 5; // Kalman đồng thuận với xu hướng
    }
    
    return { 
      duDoan: kqKalman, 
      doTinCay: Math.min(90, doTinCay), 
      lyDo: `🎯 Kalman dự báo điểm ${diemUocLuong.toFixed(1)} => ${kqKalman}` 
    };
  }

  // 6. FALLBACK - Đảo cầu
  const lastResult = recent[0];
  const duDoan = lastResult === 'Tài' ? 'Xỉu' : 'Tài';
  return { duDoan, doTinCay: 66, lyDo: `⚖️ Đảo cầu (${lastResult} → ${duDoan})` };
}

// ==========================================
// THUẬT TOÁN NÂNG CẤP CHO LC79_TXMD5
// ==========================================
function engineLC79TXMD5(lichSu, gameMemory, historyTaiXiu) {
  const recent = historyTaiXiu.slice(0, 20);
  const mc = gameMemory.markovChain;
  
  // TRƯỜNG HỢP 1: CHỈ CÓ 1 PHIÊN
  if (recent.length === 0) {
    return { duDoan: 'Tài', doTinCay: 55, lyDo: '⚠️ Chưa có dữ liệu, dự đoán Tài' };
  }
  if (recent.length === 1) {
    const duDoan = recent[0] === "Tài" ? "Xỉu" : "Tài";
    return { duDoan, doTinCay: 62, lyDo: `⚠️ Chỉ 1 phiên (${recent[0]}), dự đoán đảo: ${duDoan}` };
  }
  
  // TRƯỜNG HỢP 2: CÓ 2 PHIÊN
  if (recent.length === 2) {
    const last2 = recent.slice(0, 2);
    if (last2[0] === last2[1]) {
      const duDoan = last2[0] === "Tài" ? "Xỉu" : "Tài";
      return { duDoan, doTinCay: 66, lyDo: `📊 Bệt 2 phiên ${last2[0]}, dự đoán đảo ${duDoan}` };
    } else {
      return { duDoan: last2[0], doTinCay: 64, lyDo: `🔄 Cầu 1-1, theo ${last2[0]}` };
    }
  }
  
  // TRƯỜNG HỢP 3: CÓ 3 PHIÊN
  if (recent.length === 3) {
    const last3 = recent.slice(0, 3);
    if (last3[0] === last3[1] && last3[1] === last3[2]) {
      const duDoan = last3[0] === "Tài" ? "Xỉu" : "Tài";
      return { duDoan, doTinCay: 74, lyDo: `🔥 Bệt 3 phiên ${last3[0]}, đảo ${duDoan}` };
    }
    if (last3[0] !== last3[1] && last3[1] !== last3[2]) {
      const duDoan = last3[2] === "Tài" ? "Xỉu" : "Tài";
      return { duDoan, doTinCay: 72, lyDo: `🎯 Cầu 1-1, dự đoán ${duDoan}` };
    }
    const duDoan = last3[0] === "Tài" ? "Xỉu" : "Tài";
    return { duDoan, doTinCay: 65, lyDo: `⚖️ Đảo cầu (${last3[0]} → ${duDoan})` };
  }
  
  // ========== ĐÃ CÓ >=4 PHIÊN ==========
  
  // XÂY DỰNG MARKOV CHAIN (CHUỖI MARKOV CẤP 3)
  if (recent.length >= 5) {
    for (let i = recent.length - 4; i >= 0; i--) {
      const trangThai = recent.slice(i + 1, i + 4).join(''); 
      const ketQuaTiep = recent[i];
      if (!mc[trangThai]) mc[trangThai] = { Tài: 0, Xỉu: 0 };
      mc[trangThai][ketQuaTiep]++;
    }
  }

  // 1. PHÁT HIỆN BỆT (NÂNG CẤP)
  let streak = 1;
  for (let i = 1; i < Math.min(recent.length, 12); i++) {
    if (recent[i] === recent[0]) streak++;
    else break;
  }
  
  if (streak >= 6) {
    const duDoan = recent[0] === 'Tài' ? 'Xỉu' : 'Tài';
    let doTinCay = Math.min(95, 80 + (streak - 5) * 4);
    return { duDoan, doTinCay, lyDo: `🔥🔥🔥 Bệt ${streak} phiên => BẺ CẦU ${duDoan}` };
  }
  
  if (streak === 5) {
    const duDoan = recent[0] === 'Tài' ? 'Xỉu' : 'Tài';
    return { duDoan, doTinCay: 88, lyDo: `🔥🔥 Bệt 5 phiên => BẺ CẦU ${duDoan}` };
  }
  
  if (streak === 4) {
    const duDoan = recent[0] === 'Tài' ? 'Xỉu' : 'Tài';
    return { duDoan, doTinCay: 82, lyDo: `🔥 Bệt 4 phiên => BẺ CẦU ${duDoan}` };
  }
  
  if (streak === 3) {
    const duDoan = recent[0] === 'Tài' ? 'Xỉu' : 'Tài';
    return { duDoan, doTinCay: 74, lyDo: `⚡ Bệt 3 phiên => Đảo ${duDoan}` };
  }

  // 2. MARKOV PREDICTION (NÂNG CẤP)
  if (recent.length >= 4) {
    const trangThaiHienTai = recent.slice(0, 3).join('');
    const thongKe = mc[trangThaiHienTai];
    if (thongKe && (thongKe.Tài + thongKe.Xỉu) >= 2) {
      const t = thongKe.Tài;
      const x = thongKe.Xỉu;
      const tong = t + x;
      const tyLeTai = t / tong;
      const tyLeXiu = x / tong;
      
      if (Math.abs(tyLeTai - tyLeXiu) > 0.2) {
        const duDoan = t > x ? 'Tài' : 'Xỉu';
        const tyLe = Math.max(t, x) / tong;
        let doTinCay = Math.min(92, Math.round(65 + tyLe * 27));
        return { 
          duDoan, 
          doTinCay, 
          lyDo: `🔗 Markov [${trangThaiHienTai}] => ${duDoan} (${Math.round(tyLe*100)}%)` 
        };
      }
    }
    
    // Markov cấp 2 nếu cấp 3 không đủ
    if (recent.length >= 3) {
      const trangThai2 = recent.slice(0, 2).join('');
      const thongKe2 = mc[trangThai2];
      if (thongKe2 && (thongKe2.Tài + thongKe2.Xỉu) >= 3) {
        const t = thongKe2.Tài;
        const x = thongKe2.Xỉu;
        if (t !== x) {
          const duDoan = t > x ? 'Tài' : 'Xỉu';
          const tyLe = Math.max(t, x) / (t + x);
          let doTinCay = Math.min(85, Math.round(60 + tyLe * 25));
          return { 
            duDoan, 
            doTinCay, 
            lyDo: `🔗 Markov [${trangThai2}] => ${duDoan} (${Math.round(tyLe*100)}%)` 
          };
        }
      }
    }
  }

  // 3. PHÁT HIỆN MẪU ABAB (NÂNG CẤP)
  if (recent.length >= 6) {
    // Kiểm tra 4 phiên gần nhất
    const p4 = recent.slice(0, 4);
    if (p4[0] === p4[2] && p4[1] === p4[3] && p4[0] !== p4[1]) {
      const duDoan = p4[0] === 'Tài' ? 'Xỉu' : 'Tài';
      let doTinCay = 82;
      
      // Nếu kéo dài thêm 2 phiên
      if (recent.length >= 6) {
        const p6 = recent.slice(0, 6);
        if (p6[0] === p6[2] && p6[2] === p6[4] && p6[1] === p6[3] && p6[3] === p6[5]) {
          doTinCay = 90;
          return { duDoan, doTinCay, lyDo: `🎯🎯 Cấu trúc ABABAB => ${duDoan}` };
        }
      }
      return { duDoan, doTinCay, lyDo: `🔄 Cấu trúc ABAB => ${duDoan}` };
    }
  }

  // 4. PHÂN TÍCH TẦN SUẤT 5-10 PHIÊN
  if (recent.length >= 5) {
    const last5 = recent.slice(0, 5);
    const last10 = recent.slice(0, Math.min(10, recent.length));
    const tai5 = last5.filter(r => r === 'Tài').length;
    const tai10 = last10.filter(r => r === 'Tài').length;
    
    if (tai5 >= 4) {
      return { duDoan: 'Xỉu', doTinCay: 82, lyDo: `📊 5 phiên ${tai5}T => BẮT XỈU` };
    }
    if (tai5 <= 1) {
      return { duDoan: 'Tài', doTinCay: 82, lyDo: `📊 5 phiên ${tai5}T => BẮT TÀI` };
    }
    if (tai10 >= 7) {
      return { duDoan: 'Xỉu', doTinCay: 80, lyDo: `📊 10 phiên ${tai10}T => BẮT XỈU` };
    }
    if (tai10 <= 3) {
      return { duDoan: 'Tài', doTinCay: 80, lyDo: `📊 10 phiên ${tai10}T => BẮT TÀI` };
    }
  }

  // 5. PHÁT HIỆN CHU KỲ 3-2 HOẶC 2-3
  if (recent.length >= 5) {
    const p5 = recent.slice(0, 5);
    const p5_str = p5.join('');
    // Mẫu 3-2: TTXTT hoặc XXXTX
    if (p5_str === 'TTXTT' || p5_str === 'XXTXX') {
      const duDoan = p5[0] === 'Tài' ? 'Xỉu' : 'Tài';
      return { duDoan, doTinCay: 85, lyDo: `🎯 Mẫu 3-2 (${p5_str}) => ${duDoan}` };
    }
    // Mẫu 2-3: TTXTT cũng vậy
    if (p5_str === 'TXXTT' || p5_str === 'XTTXX') {
      const duDoan = p5[0] === 'Tài' ? 'Xỉu' : 'Tài';
      return { duDoan, doTinCay: 84, lyDo: `🎯 Mẫu 2-3 (${p5_str}) => ${duDoan}` };
    }
  }

  // 6. FALLBACK
  const lastResult = recent[0];
  const duDoan = lastResult === 'Tài' ? 'Xỉu' : 'Tài';
  return { duDoan, doTinCay: 66, lyDo: `⚖️ Đảo cầu (${lastResult} → ${duDoan})` };
}

// ==========================================
// XỬ LÝ GAME CHÍNH
// ==========================================
async function xuLyGame(gameKey) {
  if (!GAME_APIS[gameKey]) throw new Error(`Game [${gameKey}] không tồn tại.`);
  
  let data = await fetchGameData(GAME_APIS[gameKey], gameKey);
  if (!data) throw new Error(`Không lấy được data từ API ${gameKey}.`);
  
  const ketQuaThucTe = data.ket_qua;
  const game = gameData[gameKey];
  const mem = memory[gameKey];
  const phien = data.phien;
  
  // Cập nhật lịch sử
  const daTonTai = game.data.find(x => x.phien === phien);
  if (!daTonTai) {
    game.data.unshift({ phien, ket_qua: ketQuaThucTe, tong: data.tong });
    if (game.data.length > 300) game.data.pop();
    if (data.tong && typeof data.tong === 'number') {
      game.tongData.unshift(data.tong);
      if (game.tongData.length > 100) game.tongData.pop();
    }
    // Cập nhật lịch sử Tài/Xỉu
    if (ketQuaThucTe === 'Tài' || ketQuaThucTe === 'Xỉu') {
      game.historyTaiXiu.unshift(ketQuaThucTe);
      if (game.historyTaiXiu.length > 100) game.historyTaiXiu.pop();
    }
  }
  
  // Kiểm tra dự đoán cũ
  if (game.lichSuDuDoan.length > 0 && game.lichSuDuDoan[0].ket_qua === 'CHỜ') {
    const lastPred = game.lichSuDuDoan[0];
    if (lastPred.du_doan && lastPred.du_doan !== 'KHÔNG DỰ ĐOÁN') {
      const dung = (ketQuaThucTe === lastPred.du_doan);
      if (dung) statsDB[gameKey].dung++;
      else statsDB[gameKey].sai++;
      statsDB[gameKey].tong++;
      statsDB[gameKey].tiLe = ((statsDB[gameKey].dung / statsDB[gameKey].tong) * 100).toFixed(1) + '%';
      lastPred.ket_qua = dung ? 'ĐÚNG' : 'SAI';
      lastPred.thuc_te = ketQuaThucTe;
    }
  }
  
  // Lấy lịch sử Tài/Xỉu
  const historyTaiXiu = game.historyTaiXiu;
  const tongData = game.tongData;
  
  // Dự đoán theo game
  let ketQuaPhanTich;
  if (gameKey === 'lc79_txmd5') {
    ketQuaPhanTich = engineLC79TXMD5(historyTaiXiu, mem, historyTaiXiu);
  } else {
    ketQuaPhanTich = engineLC79TX(historyTaiXiu, tongData, mem.kalmanState, historyTaiXiu);
  }
  
  // Học pattern
  if (historyTaiXiu.length >= 5) {
    const patternMau = historyTaiXiu.slice(1, 5).join('-');
    const nhipKe = historyTaiXiu[0];
    mem.patterns.push({ pattern: patternMau, next: nhipKe });
    if (mem.patterns.length > 500) mem.patterns.shift();
  }
  
  const duDoanCuoi = ketQuaPhanTich.duDoan;
  const tinCayCuoi = ketQuaPhanTich.doTinCay;
  const lyDo = ketQuaPhanTich.lyDo;
  
  // Lưu dự đoán
  game.lichSuDuDoan.unshift({
    phien: phien,
    du_doan: duDoanCuoi,
    do_tin_cay: tinCayCuoi,
    ly_do: lyDo,
    ket_qua: 'CHỜ',
    thoi_gian: Date.now()
  });
  if (game.lichSuDuDoan.length > 100) game.lichSuDuDoan.pop();
  
  const coNenCuoc = tinCayCuoi >= 65;
  
  return {
    game: gameKey,
    phien_hien_tai: phien,
    ket_qua_thuc_te: ketQuaThucTe,
    du_doan: {
      phien_tiep: phien + 1,
      co_nen_cuoc: coNenCuoc ? '✅ NÊN CƯỢC' : '⏸️ BỎ QUA',
      du_doan: duDoanCuoi,
      do_tin_cay: tinCayCuoi + '%',
      ly_do: lyDo
    },
    thong_ke: statsDB[gameKey],
    lich_su_gan_day: historyTaiXiu.slice(0, 12)
  };
}

// ==========================================
// API ENDPOINTS
// ==========================================

app.get('/api/games', (req, res) => {
  res.json({ 
    games: Object.keys(GAME_APIS), 
    total: Object.keys(GAME_APIS).length,
    note: '🚀 Đã xóa toàn bộ game khác, chỉ giữ LC79_TX và LC79_TXMD5'
  });
});

app.get('/api/predict/:game', async (req, res) => {
  const gameKey = req.params.game;
  if (!GAME_APIS[gameKey]) {
    return res.status(404).json({ error: 'Game không tồn tại', available: Object.keys(GAME_APIS) });
  }
  
  try {
    const result = await xuLyGame(gameKey);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/feedback/:game', (req, res) => {
  const gameKey = req.params.game;
  const { du_doan, ket_qua_thuc_te } = req.body;
  
  if (!GAME_APIS[gameKey]) {
    return res.status(404).json({ error: 'Game không tồn tại' });
  }
  
  if (!du_doan || !ket_qua_thuc_te) {
    return res.status(400).json({ error: 'Thiếu du_doan hoặc ket_qua_thuc_te' });
  }
  
  const dung = (du_doan === ket_qua_thuc_te);
  const stats = statsDB[gameKey];
  
  if (dung) stats.dung++;
  else stats.sai++;
  stats.tong++;
  stats.tiLe = ((stats.dung / stats.tong) * 100).toFixed(1) + '%';
  
  gameData[gameKey].feedbackHistory.unshift({
    du_doan, thuc_te: ket_qua_thuc_te, ket_qua: dung ? 'ĐÚNG' : 'SAI', thoi_gian: Date.now()
  });
  
  res.json({ success: true, dung, stats });
});

app.get('/api/stats/:game', (req, res) => {
  const gameKey = req.params.game;
  if (!statsDB[gameKey]) return res.status(404).json({ error: 'Chưa có dữ liệu' });
  res.json(statsDB[gameKey]);
});

app.get('/', (req, res) => {
  res.json({
    name: '🔥 API TÀI XỈU - LC79 TX & TXMD5 🔥',
    status: 'ONLINE',
    total_games: Object.keys(GAME_APIS).length,
    games: Object.keys(GAME_APIS),
    version: 'V3.0 - NÂNG CẤP THUẬT TOÁN'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🔥 API TÀI XỈU - LC79 TX & TXMD5`);
  console.log(`======================================================`);
  console.log(`📊 CHỈ GIỮ 2 GAME: LC79_TX và LC79_TXMD5`);
  console.log(`✅ ĐÃ XÓA TOÀN BỘ GAME KHÁC`);
  console.log(`🚀 PORT: ${PORT}`);
  console.log(`======================================================\n`);
});
