const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

// ============================================================
// ========== CẤU HÌNH API LC79 ==========
// ============================================================

const API_LC79_HU = "https://wtx.tele68.com/v1/tx/lite-sessions?cp=R&cl=R&pf=web&at=83991213bfd4c554dc94bcd98979bdc5";
const API_LC79_MD5 = "https://wtxmd52.tele68.com/v1/txmd5/lite-sessions?cp=R&cl=R&pf=web&at=3959701241b686f12e01bfe9c3a319b8";

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://tele68.com/",
    "Origin": "https://tele68.com"
};

const http = axios.create({ timeout: 10000, headers: HEADERS });

// ============================================================
// ========== LƯU TRỮ DỮ LIỆU ==========
// ============================================================

let huHistory = [];
let md5History = [];

let huStats = { total: 0, correct: 0, wrong: 0, consecutiveLosses: 0, ti_le: "0%" };
let md5Stats = { total: 0, correct: 0, wrong: 0, consecutiveLosses: 0, ti_le: "0%" };

let lastHuPrediction = null;
let lastMd5Prediction = null;

// ============================================================
// ========== HÀM TIỆN ÍCH ==========
// ============================================================

function opp(c) {
    if (c === "Tài") return "Xỉu";
    if (c === "Xỉu") return "Tài";
    if (c === "TAI") return "XIU";
    if (c === "XIU") return "TAI";
    return "Xỉu";
}

function getStreak(arr) {
    if (!arr.length) return [0, null];
    let s = 1;
    const last = arr[arr.length - 1];
    for (let i = arr.length - 2; i >= 0; i--) {
        if (arr[i] === last) s++;
        else break;
    }
    return [s, last];
}

function getMaxStreak(arr) {
    if (!arr.length) return 0;
    let max = 1, cur = 1;
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] === arr[i-1]) { cur++; max = Math.max(max, cur); }
        else cur = 1;
    }
    return max;
}

function tinhDoLechChuan(mangSo) {
    if (mangSo.length < 2) return 0;
    const n = mangSo.length;
    const mean = mangSo.reduce((a, b) => a + b, 0) / n;
    const variance = mangSo.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
    return Math.sqrt(variance);
}

// ============================================================
// ========== HỆ THỐNG NHẬN DIỆN CẦU - 25 LOẠI CẦU ==========
// ============================================================

class CauRecognizer {
    constructor() {
        this.cauDetected = [];
    }

    // 1. CẦU BỆT (STREAK)
    nhanDienCauBet(results) {
        const [streak, last] = getStreak(results);
        if (streak < 3) return null;
        return {
            loai: "BỆT",
            chiTiet: `Bệt ${streak} phiên ${last}`,
            doTinCay: Math.min(94, 60 + streak * 5),
            duDoan: opp(last)
        };
    }

    // 2. CẦU 1-1 (ZIGZAG)
    nhanDienCau11(results) {
        if (results.length < 6) return null;
        let is11 = true;
        for (let i = 1; i < 6; i++) {
            if (results[i] === results[i-1]) { is11 = false; break; }
        }
        if (!is11) return null;
        return {
            loai: "CẦU 1-1",
            chiTiet: `Cầu 1-1 kéo dài ${Math.min(results.length, 10)} phiên`,
            doTinCay: 78 + Math.min(12, results.length),
            duDoan: opp(results[0])
        };
    }

    // 3. CẦU 2-2 (DOUBLE)
    nhanDienCau22(results) {
        if (results.length < 8) return null;
        for (let i = 0; i <= results.length - 8; i++) {
            const p = results.slice(i, i + 8);
            if (p[0] === p[1] && p[2] === p[3] && p[4] === p[5] && p[6] === p[7] &&
                p[0] !== p[2] && p[2] !== p[4] && p[4] !== p[6]) {
                return {
                    loai: "CẦU 2-2",
                    chiTiet: `Cầu 2-2 (${p[0]==='Tài'?'TT':'XX'} ${p[2]==='Tài'?'TT':'XX'} ${p[4]==='Tài'?'TT':'XX'} ${p[6]==='Tài'?'TT':'XX'})`,
                    doTinCay: 86,
                    duDoan: opp(p[6])
                };
            }
        }
        return null;
    }

    // 4. CẦU 3-3 (TRIPLE)
    nhanDienCau33(results) {
        if (results.length < 12) return null;
        for (let i = 0; i <= results.length - 12; i++) {
            const p = results.slice(i, i + 12);
            if (p[0] === p[1] && p[0] === p[2] && p[3] === p[4] && p[3] === p[5] &&
                p[6] === p[7] && p[6] === p[8] && p[9] === p[10] && p[9] === p[11] &&
                p[0] !== p[3] && p[3] !== p[6] && p[6] !== p[9]) {
                return {
                    loai: "CẦU 3-3",
                    chiTiet: `Cầu 3-3 (${p[0]==='Tài'?'TTT':'XXX'} ${p[3]==='Tài'?'TTT':'XXX'} ${p[6]==='Tài'?'TTT':'XXX'} ${p[9]==='Tài'?'TTT':'XXX'})`,
                    doTinCay: 90,
                    duDoan: opp(p[9])
                };
            }
        }
        return null;
    }

    // 5. CẦU 1-2-1
    nhanDienCau121(results) {
        if (results.length < 6) return null;
        const p = results.slice(0, 5);
        if (p[0] === p[2] && p[0] === p[4] && p[1] === p[3] && p[0] !== p[1]) {
            return {
                loai: "CẦU 1-2-1",
                chiTiet: `Cầu 1-2-1 (${p[0]} ${p[1]} ${p[1]} ${p[0]})`,
                doTinCay: 82,
                duDoan: opp(p[0])
            };
        }
        return null;
    }

    // 6. CẦU 2-1-2
    nhanDienCau212(results) {
        if (results.length < 7) return null;
        const p = results.slice(0, 6);
        if (p[0] === p[1] && p[3] === p[4] && p[0] !== p[2] && p[2] === p[5] && p[0] !== p[3]) {
            return {
                loai: "CẦU 2-1-2",
                chiTiet: `Cầu 2-1-2 (${p[0]}${p[0]} ${p[2]} ${p[3]}${p[3]})`,
                doTinCay: 84,
                duDoan: opp(p[3])
            };
        }
        return null;
    }

    // 7. CẦU CHỮ A
    nhanDienCauChuA(results) {
        if (results.length < 8) return null;
        const p = results.slice(0, 7);
        if (p[0] === p[2] && p[0] === p[4] && p[0] === p[6] &&
            p[1] === p[3] && p[1] === p[5] && p[0] !== p[1]) {
            return {
                loai: "CẦU CHỮ A",
                chiTiet: `Cầu chữ A (${p[0]} ${p[1]} ${p[0]} ${p[1]} ${p[1]} ${p[0]})`,
                doTinCay: 86,
                duDoan: opp(p[0])
            };
        }
        return null;
    }

    // 8. CẦU 3-2
    nhanDienCau32(results) {
        if (results.length < 10) return null;
        const p = results.slice(0, 5);
        if (p[0] === p[1] && p[0] === p[2] && p[3] === p[4] && p[0] !== p[3]) {
            return {
                loai: "CẦU 3-2",
                chiTiet: `Cầu 3-2 (${p[0]}${p[0]}${p[0]} ${p[3]}${p[3]})`,
                doTinCay: 84,
                duDoan: p[0] === 'Tài' ? "Xỉu" : "Tài"
            };
        }
        if (p[0] === p[1] && p[2] === p[3] && p[2] === p[4] && p[0] !== p[2]) {
            return {
                loai: "CẦU 2-3",
                chiTiet: `Cầu 2-3 (${p[0]}${p[0]} ${p[2]}${p[2]}${p[2]})`,
                doTinCay: 84,
                duDoan: p[2] === 'Tài' ? "Xỉu" : "Tài"
            };
        }
        return null;
    }

    // 9. CẦU 1-1-1 (3 PHIÊN XEN KẼ)
    nhanDienCau111(results) {
        if (results.length < 3) return null;
        const p = results.slice(0, 3);
        if (p[0] !== p[1] && p[1] !== p[2]) {
            return {
                loai: "CẦU 1-1-1",
                chiTiet: `Cầu xen kẽ 3 phiên (${p[0]} ${p[1]} ${p[2]})`,
                doTinCay: 68,
                duDoan: opp(p[2])
            };
        }
        return null;
    }

    // 10. CẦU 2-2-2 (3 CẶP)
    nhanDienCau222(results) {
        if (results.length < 6) return null;
        const p = results.slice(0, 6);
        if (p[0] === p[1] && p[2] === p[3] && p[4] === p[5] &&
            p[0] !== p[2] && p[2] !== p[4]) {
            return {
                loai: "CẦU 2-2-2",
                chiTiet: `Cầu 3 cặp (${p[0]}${p[0]} ${p[2]}${p[2]} ${p[4]}${p[4]})`,
                doTinCay: 82,
                duDoan: opp(p[4])
            };
        }
        return null;
    }

    // 11. CẦU TĂNG DẦN (ACCELERATING)
    nhanDienCauTangDan(results) {
        if (results.length < 6) return null;
        let count = 0;
        for (let i = 1; i < results.length; i++) {
            if (results[i] === results[i-1]) count++;
            else break;
        }
        if (count >= 4) {
            return {
                loai: "CẦU BỆT TĂNG DẦN",
                chiTiet: `Bệt tăng dần ${count} phiên`,
                doTinCay: 80 + count * 2,
                duDoan: opp(results[0])
            };
        }
        return null;
    }

    // 12. CẦU GIẢM DẦN (DECELERATING)
    nhanDienCauGiamDan(results) {
        if (results.length < 6) return null;
        let count = 0;
        for (let i = 1; i < results.length; i++) {
            if (results[i] !== results[i-1]) count++;
            else break;
        }
        if (count >= 5) {
            return {
                loai: "CẦU 1-1 GIẢM DẦN",
                chiTiet: `Cầu 1-1 kéo dài ${count} phiên`,
                doTinCay: 76 + count,
                duDoan: opp(results[0])
            };
        }
        return null;
    }

    // 13. CẦU ĐỐI XỨNG HOÀN HẢO
    nhanDienCauDoiXungHoanHao(results) {
        if (results.length < 6) return null;
        const p = results.slice(0, 6);
        if (p[0] === p[5] && p[1] === p[4] && p[2] === p[3] && p[0] !== p[1]) {
            return {
                loai: "CẦU ĐỐI XỨNG HOÀN HẢO",
                chiTiet: `Cầu đối xứng (${p[0]} ${p[1]} ${p[2]} ${p[2]} ${p[1]} ${p[0]})`,
                doTinCay: 88,
                duDoan: opp(p[0])
            };
        }
        return null;
    }

    // 14. CẦU FIBONACCI
    nhanDienCauFibonacci(results) {
        if (results.length < 8) return null;
        const fibs = [1, 2, 3, 5, 8];
        for (const fib of fibs) {
            if (results.length >= fib * 2) {
                const lastFib = results.slice(0, fib);
                const prevFib = results.slice(fib, fib * 2);
                if (lastFib.every((v, i) => v === prevFib[i])) {
                    return {
                        loai: "CẦU FIBONACCI",
                        chiTiet: `Fibonacci ${fib} (${lastFib.join(' ')})`,
                        doTinCay: 78,
                        duDoan: opp(lastFib[0])
                    };
                }
            }
        }
        return null;
    }

    // 15. CẦU CHU KỲ
    nhanDienCauChuKy(results) {
        if (results.length < 12) return null;
        const str = results.map(r => r === "Tài" ? 1 : 0).join('');
        for (let len = 2; len <= 5; len++) {
            let match = true;
            for (let i = 0; i < str.length - len; i++) {
                if (str[i] !== str[i + len]) { match = false; break; }
            }
            if (match && str.length >= len * 2) {
                const pos = str.length % len;
                const pred = str[pos] === '1' ? "Tài" : "Xỉu";
                return {
                    loai: "CẦU CHU KỲ",
                    chiTiet: `Chu kỳ ${len} (${str.slice(0, len*2)})`,
                    doTinCay: 74,
                    duDoan: pred
                };
            }
        }
        return null;
    }

    // 16. CẦU TỔNG ĐIỂM CAO
    nhanDienTongDiemCao(lichSu) {
        if (lichSu.length < 10) return null;
        const points = lichSu.slice(0, 10).map(h => h.Tong).filter(p => p);
        if (points.length < 5) return null;
        const avg = points.reduce((a, b) => a + b, 0) / points.length;
        if (avg > 12.5) {
            return {
                loai: "TỔNG ĐIỂM CAO",
                chiTiet: `TB ${avg.toFixed(1)} điểm (cao)`,
                doTinCay: 72,
                duDoan: "Xỉu"
            };
        }
        if (avg < 8.5) {
            return {
                loai: "TỔNG ĐIỂM THẤP",
                chiTiet: `TB ${avg.toFixed(1)} điểm (thấp)`,
                doTinCay: 72,
                duDoan: "Tài"
            };
        }
        return null;
    }

    // 17. CẦU XÚC XẮC CHẴN/LẺ
    nhanDienXucXacChanLe(lichSu) {
        if (lichSu.length < 10) return null;
        const faces = [];
        for (const h of lichSu.slice(0, 15)) {
            faces.push(h.Xuc_xac_1, h.Xuc_xac_2, h.Xuc_xac_3);
        }
        if (faces.length < 20) return null;
        const chan = faces.filter(f => f % 2 === 0).length;
        const le = faces.length - chan;
        if (chan / faces.length > 0.6) {
            return { loai: "XÚC XẮC CHẴN", chiTiet: `${chan}/${faces.length} mặt chẵn`, doTinCay: 62, duDoan: "Xỉu" };
        }
        if (le / faces.length > 0.6) {
            return { loai: "XÚC XẮC LẺ", chiTiet: `${le}/${faces.length} mặt lẻ`, doTinCay: 62, duDoan: "Tài" };
        }
        return null;
    }

    // 18. CẦU BIÊN ĐỘ LỚN
    nhanDienBienDoLon(lichSu) {
        if (lichSu.length < 10) return null;
        const points = lichSu.slice(0, 10).map(h => h.Tong).filter(p => p);
        if (points.length < 5) return null;
        const range = Math.max(...points) - Math.min(...points);
        if (range > 8) {
            const last = points[0];
            return {
                loai: "BIÊN ĐỘ LỚN",
                chiTiet: `Biên độ ${range} điểm`,
                doTinCay: 68,
                duDoan: last > 11 ? "Xỉu" : "Tài"
            };
        }
        return null;
    }

    // 19. CẦU TÂM LÝ
    nhanDienCauTamLy(results) {
        if (results.length < 5) return null;
        const last5 = results.slice(0, 5);
        const tai5 = last5.filter(r => r === "Tài").length;
        if (tai5 === 4) {
            return { loai: "TÂM LÝ - 4 TÀI", chiTiet: "4 Tài trong 5 phiên", doTinCay: 74, duDoan: "Xỉu" };
        }
        if (tai5 === 1) {
            return { loai: "TÂM LÝ - 4 XỈU", chiTiet: "4 Xỉu trong 5 phiên", doTinCay: 74, duDoan: "Tài" };
        }
        return null;
    }

    // 20. CẦU ĐẢO CHIỀU
    nhanDienCauDaoChieu(results) {
        if (results.length < 6) return null;
        const last3 = results.slice(0, 3);
        const prev3 = results.slice(3, 6);
        if (last3.every((v, i) => v === prev3[i]) && last3[0] !== last3[1]) {
            return {
                loai: "CẦU ĐẢO CHIỀU",
                chiTiet: `Đảo chiều (${last3.join(' ')} → ${opp(last3[2])})`,
                doTinCay: 76,
                duDoan: opp(last3[2])
            };
        }
        return null;
    }

    // 21. CẦU LỆCH PHA
    nhanDienLechPha(results) {
        if (results.length < 15) return null;
        const last15 = results.slice(0, 15);
        const tai15 = last15.filter(r => r === "Tài").length;
        if (tai15 >= 11) {
            return { loai: "LỆCH PHA TÀI", chiTiet: `${tai15}T-${15-tai15}X`, doTinCay: 82, duDoan: "Xỉu" };
        }
        if (tai15 <= 4) {
            return { loai: "LỆCH PHA XỈU", chiTiet: `${tai15}T-${15-tai15}X`, doTinCay: 82, duDoan: "Tài" };
        }
        return null;
    }

    // 22. CẦU LẤY MẪU
    nhanDienCauLayMau(results) {
        if (results.length < 10) return null;
        const pattern = results.slice(0, 5).join('');
        let count = 0;
        for (let i = 5; i < results.length - 5; i++) {
            if (results.slice(i, i + 5).join('') === pattern) count++;
        }
        if (count >= 2) {
            return {
                loai: "CẦU LẤY MẪU",
                chiTiet: `Mẫu ${pattern} xuất hiện ${count + 1} lần`,
                doTinCay: 76,
                duDoan: opp(results[4])
            };
        }
        return null;
    }

    // 23. CẦU ĐÁNH DẤU
    nhanDienCauDanhDau(results) {
        if (results.length < 8) return null;
        const positions = [];
        for (let i = 1; i < results.length; i++) {
            if (results[i] !== results[i-1]) positions.push(i);
        }
        if (positions.length >= 4) {
            const gaps = [];
            for (let i = 1; i < positions.length; i++) {
                gaps.push(positions[i] - positions[i-1]);
            }
            const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
            if (Math.abs(gaps[gaps.length - 1] - avgGap) <= 1) {
                return {
                    loai: "CẦU ĐÁNH DẤU",
                    chiTiet: `Khoảng cách đều ${avgGap.toFixed(0)} phiên`,
                    doTinCay: 72,
                    duDoan: results[0] === "Tài" ? "Xỉu" : "Tài"
                };
            }
        }
        return null;
    }

    // 24. CẦU LỆCH
    nhanDienCauLech(results) {
        if (results.length < 10) return null;
        const last10 = results.slice(0, 10);
        const tai10 = last10.filter(r => r === "Tài").length;
        const xiu10 = 10 - tai10;
        if (tai10 === 6 || tai10 === 4) {
            return {
                loai: "CẦU LỆCH NHẸ",
                chiTiet: `${tai10}T-${xiu10}X`,
                doTinCay: 64,
                duDoan: tai10 === 6 ? "Xỉu" : "Tài"
            };
        }
        return null;
    }

    // 25. CẦU KHÔNG
    nhanDienCauKhong(results) {
        if (results.length < 3) return null;
        const last3 = results.slice(0, 3);
        if (last3[0] === last3[1] && last3[1] === last3[2] && last3[0] !== "Tài") {
            return {
                loai: "CẦU KHÔNG",
                chiTiet: `3 phiên ${last3[0]}`,
                doTinCay: 66,
                duDoan: opp(last3[0])
            };
        }
        return null;
    }

    // NHẬN DIỆN TẤT CẢ CÁC LOẠI CẦU
    nhanDienTatCa(lichSu) {
        const results = lichSu.map(h => h.Ket_qua);
        const tatCaCau = [];
        
        const phuongPhap = [
            this.nhanDienCauBet.bind(this),
            this.nhanDienCau11.bind(this),
            this.nhanDienCau22.bind(this),
            this.nhanDienCau33.bind(this),
            this.nhanDienCau121.bind(this),
            this.nhanDienCau212.bind(this),
            this.nhanDienCauChuA.bind(this),
            this.nhanDienCau32.bind(this),
            this.nhanDienCau111.bind(this),
            this.nhanDienCau222.bind(this),
            this.nhanDienCauTangDan.bind(this),
            this.nhanDienCauGiamDan.bind(this),
            this.nhanDienCauDoiXungHoanHao.bind(this),
            this.nhanDienCauFibonacci.bind(this),
            this.nhanDienCauChuKy.bind(this),
            this.nhanDienTongDiemCao.bind(this),
            this.nhanDienXucXacChanLe.bind(this),
            this.nhanDienBienDoLon.bind(this),
            this.nhanDienCauTamLy.bind(this),
            this.nhanDienCauDaoChieu.bind(this),
            this.nhanDienLechPha.bind(this),
            this.nhanDienCauLayMau.bind(this),
            this.nhanDienCauDanhDau.bind(this),
            this.nhanDienCauLech.bind(this),
            this.nhanDienCauKhong.bind(this)
        ];

        for (const phuongPhap of phuongPhap) {
            const ketQua = phuongPhap(results);
            if (ketQua) tatCaCau.push(ketQua);
        }

        return tatCaCau;
    }
}

// ============================================================
// ========== THUẬT TOÁN LC79 HŨ (CÓ NHẬN DIỆN CẦU) ==========
// ============================================================

class HuAlgorithmNangCap {
    constructor() {
        this.cauRecognizer = new CauRecognizer();
        this.stats = { total: 0, correct: 0, wrong: 0, consecutiveLosses: 0 };
        this.performanceHistory = [];
        this.cauHistory = [];
    }

    predict(lichSu) {
        if (!lichSu || lichSu.length < 5) {
            return { duDoan: "Tài", doTinCay: 55, loaiCau: "chưa_đủ", giaiThich: "Chưa đủ dữ liệu" };
        }

        const results = lichSu.map(h => h.Ket_qua);
        const tatCaCau = this.cauRecognizer.nhanDienTatCa(lichSu);
        
        // Lọc cầu có độ tin cậy cao
        const cauTot = tatCaCau.filter(c => c.doTinCay >= 65);
        const cauManh = tatCaCau.filter(c => c.doTinCay >= 80);
        
        this.cauHistory.push({ time: Date.now(), count: tatCaCau.length, cau: cauTot.map(c => c.loai) });
        if (this.cauHistory.length > 100) this.cauHistory.shift();

        // Nếu có cầu mạnh (>80%) ưu tiên
        if (cauManh.length > 0) {
            const best = cauManh.reduce((a, b) => a.doTinCay > b.doTinCay ? a : b);
            return {
                duDoan: best.duDoan,
                doTinCay: best.doTinCay,
                loaiCau: best.loai,
                giaiThich: `Phát hiện ${best.loai}: ${best.chiTiet} (${best.doTinCay}%)`
            };
        }

        // Tổng hợp từ nhiều cầu
        if (cauTot.length >= 2) {
            let tai = 0, xiu = 0;
            for (const c of cauTot) {
                if (c.duDoan === "Tài") tai += c.doTinCay;
                else xiu += c.doTinCay;
            }
            const final = tai > xiu ? "Tài" : "Xỉu";
            const conf = Math.min(92, Math.floor((final === "Tài" ? tai : xiu) / (tai + xiu) * 100));
            return {
                duDoan: final,
                doTinCay: conf,
                loaiCau: `TỔNG HỢP ${cauTot.length} CẦU`,
                giaiThich: `Tổng hợp ${cauTot.length} loại cầu: ${cauTot.slice(0,3).map(c => c.loai).join(', ')}`
            };
        }

        // Nếu có cầu yếu
        if (cauTot.length === 1) {
            const c = cauTot[0];
            return {
                duDoan: c.duDoan,
                doTinCay: c.doTinCay - 5,
                loaiCau: c.loai,
                giaiThich: `Phát hiện ${c.loai}: ${c.chiTiet}`
            };
        }

        // Fallback: đảo cầu
        const last = results[0];
        return {
            duDoan: opp(last),
            doTinCay: 60,
            loaiCau: "ĐẢO CẦU",
            giaiThich: `Không phát hiện cầu rõ ràng, đảo ${last} → ${opp(last)}`
        };
    }

    updateStats(pred, actual) {
        const dung = pred === actual;
        if (dung) { this.stats.correct++; this.stats.consecutiveLosses = 0; }
        else { this.stats.wrong++; this.stats.consecutiveLosses++; }
        this.stats.total++;
        this.performanceHistory.push({ pred, actual, dung, time: Date.now() });
        if (this.performanceHistory.length > 100) this.performanceHistory.shift();
        return dung;
    }

    getAccuracy() {
        if (this.performanceHistory.length < 10) return 0;
        const recent = this.performanceHistory.slice(-30);
        const correct = recent.filter(p => p.dung).length;
        return (correct / recent.length) * 100;
    }
}

// ============================================================
// ========== THUẬT TOÁN LC79 MD5 (CÓ NHẬN DIỆN CẦU) ==========
// ============================================================

class Md5AlgorithmNangCap {
    constructor() {
        this.cauRecognizer = new CauRecognizer();
        this.stats = { total: 0, correct: 0, wrong: 0, consecutiveLosses: 0 };
        this.performanceHistory = [];
        this.cauHistory = [];
    }

    predict(lichSu) {
        if (!lichSu || lichSu.length < 5) {
            return { duDoan: "Tài", doTinCay: 55, loaiCau: "chưa_đủ", giaiThich: "Chưa đủ dữ liệu" };
        }

        const results = lichSu.map(h => h.Ket_qua);
        const tatCaCau = this.cauRecognizer.nhanDienTatCa(lichSu);
        
        // MD5 ưu tiên cầu 1-1 và cầu ngắn
        const cauUuTien = tatCaCau.filter(c => 
            c.loai.includes("1-1") || 
            c.loai.includes("ĐỐI XỨNG") || 
            c.loai.includes("FIBONACCI") ||
            c.loai.includes("LỆCH")
        );
        
        const cauTot = tatCaCau.filter(c => c.doTinCay >= 60);
        const cauManh = tatCaCau.filter(c => c.doTinCay >= 78);

        this.cauHistory.push({ time: Date.now(), count: tatCaCau.length, cau: cauTot.map(c => c.loai) });
        if (this.cauHistory.length > 100) this.cauHistory.shift();

        // Ưu tiên cầu được ưu tiên
        if (cauUuTien.length > 0) {
            const best = cauUuTien.reduce((a, b) => a.doTinCay > b.doTinCay ? a : b);
            return {
                duDoan: best.duDoan,
                doTinCay: Math.min(90, best.doTinCay + 4),
                loaiCau: best.loai,
                giaiThich: `Phát hiện ${best.loai}: ${best.chiTiet}`
            };
        }

        if (cauManh.length > 0) {
            const best = cauManh.reduce((a, b) => a.doTinCay > b.doTinCay ? a : b);
            return {
                duDoan: best.duDoan,
                doTinCay: best.doTinCay,
                loaiCau: best.loai,
                giaiThich: `Phát hiện ${best.loai}: ${best.chiTiet}`
            };
        }

        if (cauTot.length >= 2) {
            let tai = 0, xiu = 0;
            for (const c of cauTot) {
                if (c.duDoan === "Tài") tai += c.doTinCay;
                else xiu += c.doTinCay;
            }
            const final = tai > xiu ? "Tài" : "Xỉu";
            const conf = Math.min(90, Math.floor((final === "Tài" ? tai : xiu) / (tai + xiu) * 100));
            return {
                duDoan: final,
                doTinCay: conf,
                loaiCau: `TỔNG HỢP ${cauTot.length} CẦU`,
                giaiThich: `Tổng hợp ${cauTot.length} loại cầu`
            };
        }

        if (cauTot.length === 1) {
            const c = cauTot[0];
            return {
                duDoan: c.duDoan,
                doTinCay: c.doTinCay,
                loaiCau: c.loai,
                giaiThich: `Phát hiện ${c.loai}: ${c.chiTiet}`
            };
        }

        const last = results[0];
        return {
            duDoan: opp(last),
            doTinCay: 60,
            loaiCau: "ĐẢO CẦU",
            giaiThich: `Không phát hiện cầu, đảo ${last} → ${opp(last)}`
        };
    }

    updateStats(pred, actual) {
        const dung = pred === actual;
        if (dung) { this.stats.correct++; this.stats.consecutiveLosses = 0; }
        else { this.stats.wrong++; this.stats.consecutiveLosses++; }
        this.stats.total++;
        this.performanceHistory.push({ pred, actual, dung, time: Date.now() });
        if (this.performanceHistory.length > 100) this.performanceHistory.shift();
        return dung;
    }

    getAccuracy() {
        if (this.performanceHistory.length < 10) return 0;
        const recent = this.performanceHistory.slice(-30);
        const correct = recent.filter(p => p.dung).length;
        return (correct / recent.length) * 100;
    }
}

// ============================================================
// ========== KHỞI TẠO ALGORITHM ==========
// ============================================================

const huAlgo = new HuAlgorithmNangCap();
const md5Algo = new Md5AlgorithmNangCap();

// ============================================================
// ========== FETCH DATA ==========
// ============================================================

async function fetchData(url) {
    try {
        const res = await http.get(url);
        if (res.data?.list) {
            return res.data.list.map(item => ({
                Phien: item.id,
                Ket_qua: item.resultTruyenThong === "TAI" ? "Tài" : "Xỉu",
                Tong: item.point,
                Xuc_xac_1: item.dices[0],
                Xuc_xac_2: item.dices[1],
                Xuc_xac_3: item.dices[2],
                resultTruyenThong: item.resultTruyenThong
            }));
        }
        return null;
    } catch (e) {
        console.error("Fetch lỗi:", e.message);
        return null;
    }
}

async function updateData() {
    const huData = await fetchData(API_LC79_HU);
    if (huData) {
        for (const item of huData) {
            if (!huHistory.find(h => h.Phien === item.Phien)) {
                huHistory.unshift(item);
                if (huHistory.length > 300) huHistory.pop();
            }
        }
        if (huHistory.length >= 2 && lastHuPrediction) {
            const current = huHistory[0];
            if (lastHuPrediction.phien === current.Phien) {
                const dung = lastHuPrediction.du_doan === current.Ket_qua;
                if (dung) { huStats.correct++; huStats.consecutiveLosses = 0; }
                else { huStats.wrong++; huStats.consecutiveLosses++; }
                huStats.total++;
                huStats.ti_le = huStats.total > 0 ? ((huStats.correct / huStats.total) * 100).toFixed(1) + '%' : '0%';
                huAlgo.updateStats(lastHuPrediction.du_doan, current.Ket_qua);
            }
        }
    }
    
    const md5Data = await fetchData(API_LC79_MD5);
    if (md5Data) {
        for (const item of md5Data) {
            if (!md5History.find(h => h.Phien === item.Phien)) {
                md5History.unshift(item);
                if (md5History.length > 300) md5History.pop();
            }
        }
        if (md5History.length >= 2 && lastMd5Prediction) {
            const current = md5History[0];
            if (lastMd5Prediction.phien === current.Phien) {
                const dung = lastMd5Prediction.du_doan === current.Ket_qua;
                if (dung) { md5Stats.correct++; md5Stats.consecutiveLosses = 0; }
                else { md5Stats.wrong++; md5Stats.consecutiveLosses++; }
                md5Stats.total++;
                md5Stats.ti_le = md5Stats.total > 0 ? ((md5Stats.correct / md5Stats.total) * 100).toFixed(1) + '%' : '0%';
                md5Algo.updateStats(lastMd5Prediction.du_doan, current.Ket_qua);
            }
        }
    }
}

// ============================================================
// ========== API ENDPOINTS ==========
// ============================================================

// LC79 HŨ
app.get("/api/lc79/hu/predict", async (req, res) => {
    await updateData();
    
    if (huHistory.length === 0) {
        return res.status(500).json({ error: "Chưa có dữ liệu LC79 Hũ" });
    }
    
    const current = huHistory[0];
    const pred = huAlgo.predict(huHistory);
    const coNenCuoc = pred.doTinCay >= 70;
    
    lastHuPrediction = {
        phien: current.Phien + 1,
        du_doan: pred.duDoan,
        do_tin_cay: pred.doTinCay
    };
    
    res.json({
        success: true,
        game: "LC79_HU",
        phien_hien_tai: current.Phien,
        ket_qua_hien_tai: current.Ket_qua,
        xuc_xac: `${current.Xuc_xac_1} - ${current.Xuc_xac_2} - ${current.Xuc_xac_3}`,
        tong: current.Tong,
        cau_phat_hien: huAlgo.cauHistory.slice(-5).map(h => h.cau).flat().slice(0, 5),
        du_doan: {
            phien_tiep: current.Phien + 1,
            du_doan: pred.duDoan,
            ti_le: `${pred.doTinCay}%`,
            loai_cau: pred.loaiCau,
            giai_thich: pred.giaiThich,
            co_nen_cuoc: coNenCuoc ? "✅ NÊN CƯỢC" : "⏸️ BỎ QUA"
        },
        thong_ke: {
            tong: huStats.total,
            dung: huStats.correct,
            sai: huStats.wrong,
            ti_le: huStats.ti_le,
            thua_lien_tiep: huStats.consecutiveLosses,
            do_chinh_xac_gan_day: huAlgo.getAccuracy() ? huAlgo.getAccuracy().toFixed(1) + '%' : '0%'
        },
        timestamp: new Date().toISOString(),
        author: "@tranhoang2286"
    });
});

app.get("/api/lc79/hu/history", async (req, res) => {
    await updateData();
    res.json({
        success: true,
        total: huHistory.length,
        data: huHistory.slice(0, 50),
        stats: huStats
    });
});

// LC79 MD5
app.get("/api/lc79/md5/predict", async (req, res) => {
    await updateData();
    
    if (md5History.length === 0) {
        return res.status(500).json({ error: "Chưa có dữ liệu LC79 MD5" });
    }
    
    const current = md5History[0];
    const pred = md5Algo.predict(md5History);
    const coNenCuoc = pred.doTinCay >= 70;
    
    lastMd5Prediction = {
        phien: current.Phien + 1,
        du_doan: pred.duDoan,
        do_tin_cay: pred.doTinCay
    };
    
    res.json({
        success: true,
        game: "LC79_MD5",
        phien_hien_tai: current.Phien,
        ket_qua_hien_tai: current.Ket_qua,
        xuc_xac: `${current.Xuc_xac_1} - ${current.Xuc_xac_2} - ${current.Xuc_xac_3}`,
        tong: current.Tong,
        cau_phat_hien: md5Algo.cauHistory.slice(-5).map(h => h.cau).flat().slice(0, 5),
        du_doan: {
            phien_tiep: current.Phien + 1,
            du_doan: pred.duDoan,
            ti_le: `${pred.doTinCay}%`,
            loai_cau: pred.loaiCau,
            giai_thich: pred.giaiThich,
            co_nen_cuoc: coNenCuoc ? "✅ NÊN CƯỢC" : "⏸️ BỎ QUA"
        },
        thong_ke: md5Stats,
        timestamp: new Date().toISOString(),
        author: "@tranhoang2286"
    });
});

app.get("/api/lc79/md5/history", async (req, res) => {
    await updateData();
    res.json({
        success: true,
        total: md5History.length,
        data: md5History.slice(0, 50),
        stats: md5Stats
    });
});

// All stats
app.get("/api/lc79/stats", async (req, res) => {
    await updateData();
    res.json({
        success: true,
        hu: huStats,
        md5: md5Stats,
        last_hu_prediction: lastHuPrediction,
        last_md5_prediction: lastMd5Prediction,
        hu_accuracy: huAlgo.getAccuracy() ? huAlgo.getAccuracy().toFixed(1) + '%' : '0%',
        md5_accuracy: md5Algo.getAccuracy() ? md5Algo.getAccuracy().toFixed(1) + '%' : '0%'
    });
});

// Root
app.get("/", (req, res) => {
    res.json({
        name: "🎲 LC79 API - NHẬN DIỆN 25 LOẠI CẦU 🎲",
        author: "@tranhoang2286",
        version: "4.0",
        danh_sach_cau: [
            "1. Bệt", "2. Cầu 1-1", "3. Cầu 2-2", "4. Cầu 3-3",
            "5. Cầu 1-2-1", "6. Cầu 2-1-2", "7. Cầu chữ A",
            "8. Cầu 3-2 / 2-3", "9. Cầu 1-1-1", "10. Cầu 2-2-2",
            "11. Cầu tăng dần", "12. Cầu giảm dần", "13. Cầu đối xứng hoàn hảo",
            "14. Cầu Fibonacci", "15. Cầu chu kỳ", "16. Tổng điểm cao/thấp",
            "17. Xúc xắc chẵn/lẻ", "18. Biên độ lớn", "19. Cầu tâm lý",
            "20. Cầu đảo chiều", "21. Lệch pha", "22. Cầu lấy mẫu",
            "23. Cầu đánh dấu", "24. Cầu lệch", "25. Cầu không"
        ],
        endpoints: {
            "Hũ Dự đoán": "/api/lc79/hu/predict",
            "MD5 Dự đoán": "/api/lc79/md5/predict",
            "Thống kê": "/api/lc79/stats"
        }
    });
});

// ============================================================
// ========== KHỞI ĐỘNG ==========
// ============================================================

setInterval(updateData, 10000);
updateData();

app.listen(PORT, () => {
    console.log(`\n============================================================`);
    console.log(`🎲 LC79 API - NHẬN DIỆN 25 LOẠI CẦU v4.0`);
    console.log(`============================================================`);
    console.log(`✅ HŨ: http://localhost:${PORT}/api/lc79/hu/predict`);
    console.log(`✅ MD5: http://localhost:${PORT}/api/lc79/md5/predict`);
    console.log(`🎯 25 LOẠI CẦU ĐƯỢC NHẬN DIỆN`);
    console.log(`🚀 PORT: ${PORT}`);
    console.log(`============================================================\n`);
});
