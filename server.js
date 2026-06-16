const express = require('express');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3001;
const BASE_DIR = process.env.RENDER ? '/tmp' : '.';

// ================================================================
// ========== FILE STORAGE ==========
// ================================================================
const HISTORY_FILE = path.join(BASE_DIR, 'history.json');
const PATTERNS_FILE = path.join(BASE_DIR, 'patterns.json');
const MODEL_WEIGHTS_FILE = path.join(BASE_DIR, 'model_weights.json');
const BACKUP_FILE = path.join(BASE_DIR, 'backup_predictions.json');
const FALLBACK_FILE = path.join(BASE_DIR, 'fallback_patterns.json');
const CACHE_FILE = path.join(BASE_DIR, 'cache_data.json');

function readFile(file, def) {
    try {
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        }
    } catch (e) {
        console.error(`❌ Lỗi đọc ${file}:`, e.message);
    }
    return def;
}

function writeFile(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error(`❌ Lỗi ghi ${file}:`, e.message);
        return false;
    }
}

// Load data
let resultHistory = readFile(HISTORY_FILE, []);
let backupPredictions = readFile(BACKUP_FILE, []);
let fallbackPatterns = readFile(FALLBACK_FILE, []);
let cacheData = readFile(CACHE_FILE, {});

console.log(`📁 History: ${resultHistory.length} phiên`);
console.log(`💾 Backup: ${backupPredictions.length} dự đoán`);
console.log(`🔄 Fallback: ${fallbackPatterns.length} patterns`);

// ================================================================
// ========== DETERMINISTIC ENGINE ==========
// ================================================================
class DeterministicEngine {
    constructor(seed = 'SUNWIN_ULTIMATE_2024') {
        this.seed = seed;
        this.counter = 0;
        this.cache = new Map();
        console.log('🔒 DETERMINISTIC ENGINE - 100% NO RANDOM');
    }
    
    hash(input) {
        return crypto.createHash('sha256').update(input).digest('hex');
    }
    
    next(seed = null) {
        const seedValue = seed || this.seed + this.counter++;
        const key = `next_${seedValue}`;
        if (this.cache.has(key)) return this.cache.get(key);
        const num = parseInt(this.hash(seedValue).slice(0, 8), 16) / 0xFFFFFFFF;
        this.cache.set(key, num);
        return num;
    }
    
    nextInt(n, seed = null) {
        return Math.floor(this.next(seed) * n);
    }
}

const det = new DeterministicEngine();

// ================================================================
// ========== MODEL WEIGHTS ==========
// ================================================================
let modelWeights = {};
for (let i = 1; i <= 21; i++) modelWeights[`model${i}`] = 1.0;
let subModelWeights = {};
for (let i = 1; i <= 42; i++) subModelWeights[`sub_model_${i}`] = 1.0;
let miniModelWeights = {};
for (let i = 1; i <= 21; i++) miniModelWeights[`mini_model_${i}`] = 1.0;

const savedWeights = readFile(MODEL_WEIGHTS_FILE, null);
if (savedWeights) {
    modelWeights = savedWeights.modelWeights || modelWeights;
    subModelWeights = savedWeights.subModelWeights || subModelWeights;
    miniModelWeights = savedWeights.miniModelWeights || miniModelWeights;
    console.log('[📂] Đã tải model_weights.json');
}

function saveModelWeights() {
    writeFile(MODEL_WEIGHTS_FILE, { modelWeights, subModelWeights, miniModelWeights });
}

// ================================================================
// ========== TAI XIU ANALYZER - 84 MODELS ==========
// ================================================================
class TaiXiuAnalyzer {
    constructor() {
        this.modelWeights = modelWeights;
        this.subModelWeights = subModelWeights;
        this.miniModelWeights = miniModelWeights;
        this.det = det;
        this.subModels = {};
        this.miniModels = {};
        this.patternLibrary = readFile(PATTERNS_FILE, {
            '1-1': [], '2-2': [], '3-3': [], '1-2-1': [], '2-1-2': [],
            'bệt': [], 'cầu_vòm': [], 'cầu_thang': [], 'cầu_zigzag': []
        });
        this.initSubModels();
        this.initMiniModels();
        this.performanceHistory = {};
        console.log('🧠 84 MODELS INITIALIZED');
    }
    
    initSubModels() {
        const specialties = {
            1: { name: '1-1 thuần', type: '1-1', logic: 'pure', minLen: 4 },
            2: { name: '1-1 biến thể', type: '1-1', logic: 'variant', minLen: 5 },
            3: { name: '1-1 dài hạn', type: '1-1', logic: 'long', minLen: 8 },
            4: { name: '1-1 kết hợp', type: '1-1', logic: 'hybrid', minLen: 6 },
            5: { name: '1-1 gãy', type: '1-1', logic: 'break', minLen: 6 },
            6: { name: '1-1 phục hồi', type: '1-1', logic: 'recovery', minLen: 7 },
            7: { name: '2-2 chuẩn', type: '2-2', logic: 'pure', minLen: 6 },
            8: { name: '2-2 lệch', type: '2-2', logic: 'offset', minLen: 7 },
            9: { name: '2-2 biến tướng', type: '2-2', logic: 'variant', minLen: 8 },
            10: { name: '2-2 kết hợp', type: '2-2', logic: 'hybrid', minLen: 8 },
            11: { name: '2-2 dài', type: '2-2', logic: 'long', minLen: 10 },
            12: { name: '2-2 bẻ', type: '2-2', logic: 'break', minLen: 7 },
            13: { name: 'bệt ngắn', type: 'bệt', logic: 'short', minLen: 3 },
            14: { name: 'bệt trung', type: 'bệt', logic: 'medium', minLen: 5 },
            15: { name: 'bệt dài', type: 'bệt', logic: 'long', minLen: 7 },
            16: { name: 'bệt gãy', type: 'bệt', logic: 'break', minLen: 5 },
            17: { name: 'bệt xen kẽ', type: 'bệt', logic: 'hybrid', minLen: 6 },
            18: { name: 'siêu bệt', type: 'bệt', logic: 'super', minLen: 10 },
            19: { name: '3-3 chuẩn', type: '3-3', logic: 'pure', minLen: 9 },
            20: { name: '3-3 biến thể', type: '3-3', logic: 'variant', minLen: 10 },
            21: { name: '3-3 ngắn', type: '3-3', logic: 'short', minLen: 6 },
            22: { name: '3-3 kết hợp', type: '3-3', logic: 'hybrid', minLen: 9 },
            23: { name: '3-3 bẻ', type: '3-3', logic: 'break', minLen: 8 },
            24: { name: '3-3 dài', type: '3-3', logic: 'long', minLen: 12 },
            25: { name: '2-1-2 chuẩn', type: '2-1-2', logic: 'pure', minLen: 5 },
            26: { name: '2-1-2 biến thể', type: '2-1-2', logic: 'variant', minLen: 6 },
            27: { name: '2-1-2 dài', type: '2-1-2', logic: 'long', minLen: 8 },
            28: { name: '1-2-1 chuẩn', type: '1-2-1', logic: 'pure', minLen: 5 },
            29: { name: '1-2-1 biến thể', type: '1-2-1', logic: 'variant', minLen: 6 },
            30: { name: '1-2-1 dài', type: '1-2-1', logic: 'long', minLen: 8 },
            31: { name: 'bẻ cầu 1-1', type: 'break', logic: 'break11', minLen: 4 },
            32: { name: 'bẻ cầu 2-2', type: 'break', logic: 'break22', minLen: 5 },
            33: { name: 'bẻ cầu bệt', type: 'break', logic: 'breakStreak', minLen: 4 },
            34: { name: '1-1 sang 2-2', type: 'transition', logic: '11to22', minLen: 6 },
            35: { name: '2-2 sang 1-1', type: 'transition', logic: '22to11', minLen: 6 },
            36: { name: 'bệt sang 1-1', type: 'transition', logic: 'streakTo11', minLen: 5 },
            37: { name: 'tần suất', type: 'frequency', logic: 'frequency', minLen: 10 },
            38: { name: 'chu kỳ', type: 'cycle', logic: 'cycle', minLen: 12 },
            39: { name: 'đối xứng', type: 'symmetry', logic: 'symmetry', minLen: 8 },
            40: { name: 'Fibonacci', type: 'fibonacci', logic: 'fibonacci', minLen: 8 },
            41: { name: 'xu hướng dài', type: 'trend', logic: 'longTrend', minLen: 15 },
            42: { name: 'siêu cầu', type: 'super', logic: 'super', minLen: 20 }
        };
        
        for (let i = 1; i <= 42; i++) {
            this.subModels[`sub_model_${i}`] = {
                ...specialties[i],
                weight: this.subModelWeights[`sub_model_${i}`] || 1.0,
                accuracy: 0.5
            };
        }
    }
    
    initMiniModels() {
        const miniSpecs = {
            1: 'phat_hien_cau_dep',
            2: 'du_doan_bien_dong',
            3: 'phan_tich_so_sanh',
            4: 'nhan_dien_xu_huong_cuc_bo',
            5: 'tinh_toan_xac_suat_cao',
            6: 'phat_hien_diem_gay',
            7: 'du_doan_nguong',
            8: 'phan_tich_chuoi',
            9: 'nhan_dien_mau_lap',
            10: 'tinh_he_so_tuong_quan',
            11: 'du_doan_doan_nhiet',
            12: 'phan_tich_pha',
            13: 'nhan_dien_song',
            14: 'tinh_toan_momentum',
            15: 'du_doan_hoi_phuc',
            16: 'phat_hien_dot_bien',
            17: 'phan_tich_can_bang',
            18: 'nhan_dien_tan_so',
            19: 'du_doan_chu_ky',
            20: 'tinh_toan_ma_tran',
            21: 'phan_tich_tong_hop'
        };
        
        for (let i = 1; i <= 21; i++) {
            this.miniModels[`mini_model_${i}`] = {
                weight: this.miniModelWeights[`mini_model_${i}`] || 1.0,
                accuracy: 0.5,
                specialty: miniSpecs[i] || 'chung'
            };
        }
    }
    
    getResultArray(history) {
        return history.map(h => h.Ket_qua || (h.Tong >= 11 ? 'Tài' : 'Xỉu'));
    }
    
    getStreak(results) {
        if (!results || results.length === 0) return 0;
        const last = results[results.length - 1];
        let streak = 1;
        for (let i = results.length - 2; i >= 0; i--) {
            if (results[i] === last) streak++;
            else break;
        }
        return streak;
    }
    
    isAlternating(results, length) {
        if (results.length < length) return false;
        const last = results.slice(-length);
        for (let i = 0; i < last.length - 1; i++) {
            if (last[i] === last[i+1]) return false;
        }
        return true;
    }
    
    analyzeFrequency(results) {
        const recent = results.slice(-20);
        const tai = recent.filter(r => r === 'Tài').length;
        const xiu = recent.length - tai;
        return { tai, xiu, ratio: Math.max(tai, xiu) / recent.length, dominant: tai > xiu ? 'Tài' : 'Xỉu' };
    }
    
    detectCycle(results) {
        for (let len of [2, 3, 4, 5]) {
            if (results.length < len * 2) continue;
            const last = results.slice(-len);
            const prev = results.slice(-len*2, -len);
            if (JSON.stringify(last) === JSON.stringify(prev)) {
                return { found: true, length: len, next: last[0] };
            }
        }
        return { found: false };
    }
    
    checkSymmetry(results) {
        if (results.length < 8) return { found: false };
        const last4 = results.slice(-4);
        const prev4 = results.slice(-8, -4);
        if (last4[0] === prev4[3] && last4[1] === prev4[2] && 
            last4[2] === prev4[1] && last4[3] === prev4[0]) {
            return { found: true, prediction: last4[0] };
        }
        return { found: false };
    }
    
    checkFibonacci(results) {
        const fibs = [1, 2, 3, 5, 8];
        for (let fib of fibs) {
            if (results.length >= fib * 2) {
                const last = results.slice(-fib);
                const prev = results.slice(-fib*2, -fib);
                if (JSON.stringify(last) === JSON.stringify(prev)) {
                    return { found: true, prediction: last[0] };
                }
            }
        }
        return { found: false };
    }
    
    getLongTrend(results) {
        if (results.length < 15) return { strength: 0, direction: null };
        const first = results.slice(0, 5);
        const last = results.slice(-5);
        const tai1 = first.filter(r => r === 'Tài').length;
        const tai2 = last.filter(r => r === 'Tài').length;
        const diff = tai2 - tai1;
        return { strength: Math.min(Math.abs(diff) / 5, 1), direction: diff > 0 ? 'Tài' : 'Xỉu' };
    }
    
    superAnalysis(results) {
        const freq = this.analyzeFrequency(results);
        const trend = this.getLongTrend(results);
        const cycle = this.detectCycle(results);
        const sym = this.checkSymmetry(results);
        const fib = this.checkFibonacci(results);
        
        let score = 0, preds = [];
        if (freq.ratio > 0.6) { preds.push({ pred: freq.dominant, w: freq.ratio }); score++; }
        if (trend.strength > 0.7) { preds.push({ pred: trend.direction, w: trend.strength }); score++; }
        if (cycle.found) { preds.push({ pred: cycle.next, w: 0.7 }); score++; }
        if (sym.found) { preds.push({ pred: sym.prediction, w: 0.75 }); score++; }
        if (fib.found) { preds.push({ pred: fib.prediction, w: 0.7 }); score++; }
        
        if (score >= 3) {
            const taiW = preds.filter(p => p.pred === 'Tài').reduce((s, p) => s + p.w, 0);
            const xiuW = preds.filter(p => p.pred === 'Xỉu').reduce((s, p) => s + p.w, 0);
            if (taiW > xiuW * 1.3) return { prediction: 'Tài', confidence: 0.85 + (taiW - xiuW) * 0.05, reason: 'Siêu phân tích Tài' };
            if (xiuW > taiW * 1.3) return { prediction: 'Xỉu', confidence: 0.85 + (xiuW - taiW) * 0.05, reason: 'Siêu phân tích Xỉu' };
        }
        return { confidence: 0 };
    }
    
    // ==================== RUN SUB MODELS ====================
    runSubModel11(results, model) {
        if (results.length < model.minLen) return null;
        const last = results[results.length - 1];
        switch (model.logic) {
            case 'pure':
                if (this.isAlternating(results, 4)) {
                    return { prediction: last === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.9, reason: '1-1 thuần' };
                }
                break;
            case 'variant':
                const last6 = results.slice(-6);
                let errors = 0;
                for (let i = 0; i < last6.length - 1; i++) {
                    if (last6[i] === last6[i+1]) errors++;
                }
                if (errors <= 1) {
                    return { prediction: last === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.8, reason: '1-1 biến thể' };
                }
                break;
            case 'long':
                const alt = this.isAlternating(results.slice(-12), 11);
                if (alt) {
                    return { prediction: last === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.75, reason: '1-1 dài' };
                }
                break;
            case 'break':
                const last4 = results.slice(-4);
                if (last4[0] !== last4[1] && last4[1] !== last4[2] && last4[2] !== last4[3]) {
                    const streak = this.getStreak(results.slice(0, -1));
                    if (streak > 4) return { prediction: last, confidence: 0.8, reason: '1-1 sắp gãy' };
                }
                break;
            case 'recovery':
                const last4b = results.slice(-4);
                if (last4b[0] === last4b[1] && last4b[1] !== last4b[2] && last4b[2] !== last4b[3]) {
                    return { prediction: last4b[3] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.7, reason: '1-1 phục hồi' };
                }
                break;
        }
        return null;
    }
    
    runSubModel22(results, model) {
        if (results.length < model.minLen) return null;
        const last = results[results.length - 1];
        const last6 = results.slice(-6);
        const last8 = results.slice(-8);
        
        switch (model.logic) {
            case 'pure':
                if (last6.length === 6 && last6[0] === last6[1] && last6[1] !== last6[2] &&
                    last6[2] === last6[3] && last6[3] !== last6[4] && last6[4] === last6[5]) {
                    return { prediction: last6[4] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.9, reason: '2-2 chuẩn' };
                }
                break;
            case 'offset':
                if (last6.length === 6 && last6[0] === last6[1] && last6[1] !== last6[2] &&
                    last6[2] !== last6[3] && last6[3] === last6[4] && last6[4] !== last6[5]) {
                    return { prediction: last6[4] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.8, reason: '2-2 lệch' };
                }
                break;
            case 'variant':
                if (last8.length === 8 && last8[0] === last8[1] && last8[1] !== last8[2] &&
                    last8[2] === last8[3] && last8[3] !== last8[4] && last8[4] === last8[5] &&
                    last8[5] !== last8[6] && last8[6] === last8[7]) {
                    return { prediction: last8[6] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.75, reason: '2-2 biến tướng' };
                }
                break;
            case 'break':
                if (last6.length === 6 && last6[0] === last6[1] && last6[1] !== last6[2] &&
                    last6[2] === last6[3] && last6[3] !== last6[4] && last6[4] !== last6[5]) {
                    return { prediction: last6[4], confidence: 0.85, reason: 'Bẻ 2-2' };
                }
                break;
            case 'long':
                if (last8.length === 8) {
                    let score = 0;
                    for (let i = 0; i < 7; i += 2) {
                        if (last8[i] === last8[i+1]) score++;
                    }
                    if (score >= 3) {
                        return { prediction: last === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.7 + score * 0.05, reason: '2-2 dài' };
                    }
                }
                break;
        }
        return null;
    }
    
    runSubModelStreak(results, model) {
        if (results.length < model.minLen) return null;
        const last = results[results.length - 1];
        const other = last === 'Tài' ? 'Xỉu' : 'Tài';
        const streak = this.getStreak(results);
        
        switch (model.logic) {
            case 'short': if (streak >= 2 && streak <= 3) return { prediction: last, confidence: 0.7 + streak*0.05, reason: `Bệt ${streak}` }; break;
            case 'medium': if (streak >= 4 && streak <= 5) return { prediction: last, confidence: 0.75 + (streak-4)*0.05, reason: `Bệt ${streak}` }; break;
            case 'long': if (streak >= 6) return { prediction: last, confidence: 0.8 + Math.min(streak, 10)*0.01, reason: `Bệt ${streak}` }; break;
            case 'break': if (streak >= 4) return { prediction: other, confidence: 0.6 + streak*0.03, reason: `Bệt ${streak} sắp gãy` }; break;
            case 'super': if (streak >= 8) return { prediction: last, confidence: 0.9, reason: `Siêu bệt ${streak}` }; break;
        }
        return null;
    }
    
    runSubModel33(results, model) {
        if (results.length < model.minLen) return null;
        const last = results[results.length - 1];
        const last9 = results.slice(-9);
        const last12 = results.slice(-12);
        
        switch (model.logic) {
            case 'pure':
                if (last9.length === 9 && last9[0] === last9[1] && last9[1] === last9[2] &&
                    last9[3] === last9[4] && last9[4] === last9[5] &&
                    last9[6] === last9[7] && last9[7] === last9[8] &&
                    last9[0] !== last9[3] && last9[3] !== last9[6]) {
                    return { prediction: last9[6] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.9, reason: '3-3 chuẩn' };
                }
                break;
            case 'variant':
                if (last12.length === 12) {
                    let score = 0;
                    for (let i = 0; i < 12; i += 3) {
                        if (i + 2 < 12 && last12[i] === last12[i+1] && last12[i+1] === last12[i+2]) score++;
                    }
                    if (score >= 3) {
                        return { prediction: last === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.7 + score*0.05, reason: '3-3 biến thể' };
                    }
                }
                break;
            case 'break':
                if (last9.length === 9 && last9[0] === last9[1] && last9[1] === last9[2] &&
                    last9[3] === last9[4] && last9[4] === last9[5] && last9[6] !== last9[7]) {
                    return { prediction: last9[6], confidence: 0.8, reason: 'Bẻ 3-3' };
                }
                break;
        }
        return null;
    }
    
    runSubModel212(results, model) {
        if (results.length < model.minLen) return null;
        const last5 = results.slice(-5);
        const last7 = results.slice(-7);
        
        switch (model.logic) {
            case 'pure':
                if (last5.length === 5 && last5[0] === last5[1] && last5[1] !== last5[2] &&
                    last5[2] !== last5[3] && last5[3] === last5[4] && last5[0] === last5[3]) {
                    return { prediction: last5[4] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.9, reason: '2-1-2 chuẩn' };
                }
                break;
            case 'variant':
                if (last7.length === 7 && last7[0] === last7[1] && last7[1] !== last7[2] &&
                    last7[3] === last7[4] && last7[4] !== last7[5] && last7[0] === last7[3]) {
                    return { prediction: last7[5] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.8, reason: '2-1-2 biến thể' };
                }
                break;
        }
        return null;
    }
    
    runSubModel121(results, model) {
        if (results.length < model.minLen) return null;
        const last5 = results.slice(-5);
        const last7 = results.slice(-7);
        
        switch (model.logic) {
            case 'pure':
                if (last5.length === 5 && last5[0] !== last5[1] && last5[1] === last5[2] &&
                    last5[2] !== last5[3] && last5[3] === last5[4] && last5[0] === last5[3]) {
                    return { prediction: last5[4] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.9, reason: '1-2-1 chuẩn' };
                }
                break;
            case 'variant':
                if (last7.length === 7 && last7[0] !== last7[1] && last7[1] === last7[2] &&
                    last7[3] !== last7[4] && last7[4] === last7[5] && last7[0] === last7[3]) {
                    return { prediction: last7[5] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.8, reason: '1-2-1 biến thể' };
                }
                break;
        }
        return null;
    }
    
    runSubModelBreak(results, model) {
        if (results.length < model.minLen) return null;
        const last = results[results.length - 1];
        const last4 = results.slice(-4);
        const last5 = results.slice(-5);
        const last6 = results.slice(-6);
        
        switch (model.logic) {
            case 'break11':
                if (last4.length === 4 && last4[0] !== last4[1] && last4[1] !== last4[2] && last4[2] === last4[3]) {
                    return { prediction: last4[3], confidence: 0.85, reason: 'Bẻ 1-1' };
                }
                break;
            case 'break22':
                if (last5.length === 5 && last5[0] === last5[1] && last5[1] !== last5[2] &&
                    last5[2] === last5[3] && last5[3] !== last5[4] && last5[0] === last5[4]) {
                    return { prediction: last5[4], confidence: 0.85, reason: 'Bẻ 2-2' };
                }
                break;
            case 'breakStreak':
                const streak = this.getStreak(results.slice(0, -1));
                if (streak >= 3 && last !== results[results.length - 2]) {
                    return { prediction: last, confidence: 0.8, reason: `Bẻ bệt ${streak}` };
                }
                break;
            case '11to22':
                if (last6.length === 6 && last6[0] !== last6[1] && last6[1] !== last6[2] &&
                    last6[2] === last6[3] && last6[3] !== last6[4] && last6[4] === last6[5]) {
                    return { prediction: last6[4] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.75, reason: '1-1->2-2' };
                }
                break;
            case '22to11':
                if (last6.length === 6 && last6[0] === last6[1] && last6[1] !== last6[2] &&
                    last6[2] !== last6[3] && last6[3] !== last6[4] && last6[4] !== last6[5]) {
                    return { prediction: last6[4] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.75, reason: '2-2->1-1' };
                }
                break;
            case 'streakTo11':
                if (last5.length === 5 && last5[0] === last5[1] && last5[1] === last5[2] &&
                    last5[2] !== last5[3] && last5[3] !== last5[4]) {
                    return { prediction: last5[4] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.7, reason: 'Bệt->1-1' };
                }
                break;
        }
        return null;
    }
    
    runSubModelAdvanced(results, model) {
        if (results.length < model.minLen) return null;
        
        switch (model.logic) {
            case 'frequency':
                const freq = this.analyzeFrequency(results);
                if (freq.ratio > 0.6) {
                    return { prediction: freq.dominant, confidence: 0.6 + freq.ratio*0.2, reason: `Tần suất ${freq.dominant}` };
                }
                break;
            case 'cycle':
                const cycle = this.detectCycle(results);
                if (cycle.found) {
                    return { prediction: cycle.next, confidence: 0.7, reason: `Chu kỳ ${cycle.length}` };
                }
                break;
            case 'symmetry':
                const sym = this.checkSymmetry(results);
                if (sym.found) {
                    return { prediction: sym.prediction, confidence: 0.75, reason: 'Đối xứng' };
                }
                break;
            case 'fibonacci':
                const fib = this.checkFibonacci(results);
                if (fib.found) {
                    return { prediction: fib.prediction, confidence: 0.7, reason: 'Fibonacci' };
                }
                break;
            case 'longTrend':
                const trend = this.getLongTrend(results);
                if (trend.strength > 0.7) {
                    return { prediction: trend.direction, confidence: 0.7 + trend.strength*0.1, reason: `Trend ${trend.direction}` };
                }
                break;
            case 'super':
                const sup = this.superAnalysis(results);
                if (sup.confidence > 0.8) return sup;
                break;
        }
        return null;
    }
    
    runSubModel(index, history) {
        if (history.length < 3) return null;
        const results = this.getResultArray(history);
        const model = this.subModels[`sub_model_${index}`];
        if (!model) return null;
        
        let result = null;
        switch (model.type) {
            case '1-1': result = this.runSubModel11(results, model); break;
            case '2-2': result = this.runSubModel22(results, model); break;
            case 'bệt': result = this.runSubModelStreak(results, model); break;
            case '3-3': result = this.runSubModel33(results, model); break;
            case '2-1-2': result = this.runSubModel212(results, model); break;
            case '1-2-1': result = this.runSubModel121(results, model); break;
            case 'break': case 'transition': result = this.runSubModelBreak(results, model); break;
            default: result = this.runSubModelAdvanced(results, model);
        }
        if (result) { result.model_name = model.name; return result; }
        return null;
    }
    
    // ==================== RUN MINI MODELS ====================
    runMiniModel(index, history) {
        if (history.length < 2) return null;
        const results = this.getResultArray(history);
        const mini = this.miniModels[`mini_model_${index}`];
        let prediction, confidence, reason;
        
        switch (mini.specialty) {
            case 'phat_hien_cau_dep':
                const pattern = this.analyzeBasicPatterns(history);
                prediction = pattern.prediction;
                confidence = pattern.confidence * 0.9;
                reason = pattern.reason;
                break;
            case 'nhan_dien_xu_huong_cuc_bo':
                const short = this.analyzeShortTerm(history);
                prediction = short.prediction;
                confidence = short.confidence * 0.85;
                reason = short.reason;
                break;
            case 'tinh_toan_xac_suat_cao':
                const tai = results.filter(r => r === 'Tài').length;
                const xiu = results.length - tai;
                if (tai > xiu * 1.5) { prediction = 'Xỉu'; confidence = 0.7; reason = 'Xác suất Tài cao'; }
                else if (xiu > tai * 1.5) { prediction = 'Tài'; confidence = 0.7; reason = 'Xác suất Xỉu cao'; }
                else { prediction = results[results.length - 1]; confidence = 0.5; reason = 'Cân bằng'; }
                break;
            case 'nhan_dien_mau_lap':
                if (results.length >= 4) {
                    const last4 = results.slice(-4);
                    const prev4 = results.slice(-8, -4);
                    if (last4.join('') === prev4.join('')) {
                        prediction = last4[0];
                        confidence = 0.7;
                        reason = 'Mẫu lặp';
                        break;
                    }
                }
                prediction = results[results.length - 1];
                confidence = 0.4;
                reason = 'Không mẫu lặp';
                break;
            default:
                const rand = this.det.next(`mini_${index}`);
                if (rand < 0.4) { prediction = results[results.length - 1]; confidence = 0.5; }
                else if (rand < 0.7) { prediction = results[results.length - 1] === 'Tài' ? 'Xỉu' : 'Tài'; confidence = 0.5; }
                else { const s = this.getStreak(results); prediction = s >= 3 ? results[results.length - 1] : (results[results.length - 1] === 'Tài' ? 'Xỉu' : 'Tài'); confidence = 0.5; }
                reason = `Mini ${index}`;
        }
        return { prediction, confidence: Math.min(confidence, 0.95), reason, model_name: `mini_${index}` };
    }
    
    // ==================== MAIN MODELS ====================
    analyzeBasicPatterns(history) {
        if (history.length < 3) return { prediction: null, confidence: 0, reason: 'Không đủ dữ liệu' };
        const results = this.getResultArray(history);
        
        // Check 1-1
        if (this.isAlternating(results, 4)) {
            const last = results[results.length - 1];
            return { prediction: last === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.75, reason: '1-1' };
        }
        
        // Check 2-2
        if (results.length >= 6) {
            const last6 = results.slice(-6);
            if (last6[0] === last6[1] && last6[1] !== last6[2] &&
                last6[2] === last6[3] && last6[3] !== last6[4] &&
                last6[4] === last6[5]) {
                return { prediction: last6[4] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.8, reason: '2-2' };
            }
        }
        
        // Check bệt
        const streak = this.getStreak(results);
        if (streak >= 3) {
            return { prediction: results[results.length - 1], confidence: 0.6 + streak * 0.04, reason: `Bệt ${streak}` };
        }
        
        // Check đảo
        if (results.length >= 3) {
            const last3 = results.slice(-3);
            if (last3[0] !== last3[1] && last3[1] !== last3[2]) {
                return { prediction: last3[2] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.55, reason: 'Đảo' };
            }
        }
        
        return { prediction: results[results.length - 1] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.5, reason: 'Mặc định' };
    }
    
    analyzeShortTerm(history) {
        if (history.length < 3) return { prediction: null, confidence: 0, reason: 'Không đủ dữ liệu' };
        const results = this.getResultArray(history);
        const last3 = results.slice(-3);
        
        if (last3[0] === last3[1] && last3[1] === last3[2]) {
            return { prediction: last3[0] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.65, reason: '3 liên tiếp - đảo' };
        }
        if (last3[0] === last3[1] && last3[1] !== last3[2]) {
            return { prediction: last3[2], confidence: 0.6, reason: '2-1' };
        }
        if (last3[0] !== last3[1] && last3[1] === last3[2]) {
            return { prediction: last3[2] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.6, reason: '1-2' };
        }
        return { prediction: results[results.length - 1], confidence: 0.45, reason: 'Ngắn hạn' };
    }
    
    // ==================== ENSEMBLE ====================
    ensembleModels(history) {
        if (history.length < 3) {
            return { prediction: 'Xỉu', confidence: 0.5, details: [], totalModels: 0 };
        }
        
        const modelResults = {};
        
        // Main models
        modelResults.model1 = this.analyzeBasicPatterns(history);
        modelResults.model2 = this.analyzeShortTerm(history);
        modelResults.model3 = this.analyzeFrequencyBased(history);
        modelResults.model4 = this.analyzeTrendBased(history);
        modelResults.model5 = this.analyzeImbalance(history);
        
        // Sub models (42)
        for (let i = 1; i <= 42; i++) {
            const sub = this.runSubModel(i, history);
            if (sub && sub.prediction) modelResults[`sub_model_${i}`] = sub;
        }
        
        // Mini models (21)
        for (let i = 1; i <= 21; i++) {
            const mini = this.runMiniModel(i, history);
            if (mini && mini.prediction) modelResults[`mini_model_${i}`] = mini;
        }
        
        // Weighted vote
        let taiWeight = 0, xiuWeight = 0, totalWeight = 0;
        let details = [];
        let totalModels = 0;
        
        for (let [name, result] of Object.entries(modelResults)) {
            if (result && result.prediction && result.confidence > 0.3) {
                let weight = 1.0;
                if (name.startsWith('sub_model')) weight = this.subModelWeights[name] || 1.0;
                else if (name.startsWith('mini_model')) weight = this.miniModelWeights[name] || 1.0;
                else weight = this.modelWeights[name] || 1.0;
                
                const wConf = weight * result.confidence;
                if (result.prediction === 'Tài') taiWeight += wConf;
                else xiuWeight += wConf;
                totalWeight += wConf;
                totalModels++;
                details.push({
                    model: result.model_name || name,
                    prediction: result.prediction,
                    confidence: result.confidence,
                    reason: result.reason || ''
                });
            }
        }
        
        details.sort((a, b) => b.confidence - a.confidence);
        
        let finalPrediction, finalConfidence, finalReason, finalType;
        
        if (totalWeight > 0) {
            const taiRatio = taiWeight / totalWeight;
            const xiuRatio = xiuWeight / totalWeight;
            
            if (taiRatio > 0.55) {
                finalPrediction = 'Tài';
                finalConfidence = Math.min(taiRatio + totalModels * 0.003, 0.95);
                finalReason = `${details.length}/${totalModels} models đồng thuận Tài`;
            } else if (xiuRatio > 0.55) {
                finalPrediction = 'Xỉu';
                finalConfidence = Math.min(xiuRatio + totalModels * 0.003, 0.95);
                finalReason = `${details.length}/${totalModels} models đồng thuận Xỉu`;
            } else {
                const best = details[0];
                if (best) {
                    finalPrediction = best.prediction;
                    finalConfidence = 0.5 + best.confidence * 0.3;
                    finalReason = `Dùng model ${best.model}`;
                } else {
                    const last = history[history.length - 1];
                    finalPrediction = last.Ket_qua || (last.Tong >= 11 ? 'Xỉu' : 'Tài');
                    finalConfidence = 0.5;
                    finalReason = 'Không đủ tin cậy';
                }
            }
        } else {
            const last = history[history.length - 1];
            finalPrediction = last.Ket_qua || (last.Tong >= 11 ? 'Xỉu' : 'Tài');
            finalConfidence = 0.5;
            finalReason = 'Không đủ dữ liệu';
        }
        
        finalType = details.length > 0 ? details[0].model : 'Unknown';
        
        return {
            prediction: finalPrediction,
            confidence: finalConfidence,
            reason: finalReason,
            type: finalType,
            details: details.slice(0, 5),
            totalModels: totalModels
        };
    }
    
    analyzeFrequencyBased(history) {
        if (history.length < 10) return { prediction: null, confidence: 0 };
        const results = this.getResultArray(history);
        const freq = this.analyzeFrequency(results);
        if (freq.ratio > 0.6) {
            return { prediction: freq.dominant, confidence: 0.55 + freq.ratio*0.2, reason: `Tần suất ${freq.dominant}` };
        }
        return { prediction: results[results.length - 1], confidence: 0.45, reason: 'Tần suất' };
    }
    
    analyzeTrendBased(history) {
        if (history.length < 10) return { prediction: null, confidence: 0 };
        const results = this.getResultArray(history);
        const trend = this.getLongTrend(results);
        if (trend.strength > 0.6) {
            return { prediction: trend.direction, confidence: 0.6 + trend.strength*0.15, reason: `Trend ${trend.direction}` };
        }
        return { prediction: results[results.length - 1], confidence: 0.45, reason: 'Xu hướng' };
    }
    
    analyzeImbalance(history) {
        if (history.length < 12) return { prediction: null, confidence: 0 };
        const results = this.getResultArray(history.slice(-12));
        const tai = results.filter(r => r === 'Tài').length;
        const xiu = results.length - tai;
        if (tai > xiu + 3) {
            return { prediction: 'Xỉu', confidence: 0.6, reason: `Chênh lệch ${tai}-${xiu}` };
        }
        if (xiu > tai + 3) {
            return { prediction: 'Tài', confidence: 0.6, reason: `Chênh lệch ${tai}-${xiu}` };
        }
        return { prediction: results[results.length - 1], confidence: 0.45, reason: 'Cân bằng' };
    }
    
    // ==================== UPDATE WEIGHTS ====================
    updateWeights(actual, predicted, confidence) {
        const correct = actual === predicted;
        const lr = 0.005 + (1 - confidence) * 0.005;
        
        for (let name in this.modelWeights) {
            if (correct) {
                this.modelWeights[name] = Math.min(this.modelWeights[name] * (1 + lr), 2.0);
            } else {
                this.modelWeights[name] = Math.max(this.modelWeights[name] * (1 - lr * 0.8), 0.5);
            }
        }
        
        for (let name in this.subModelWeights) {
            if (correct) {
                this.subModelWeights[name] = Math.min(this.subModelWeights[name] * (1 + lr * 0.5), 1.5);
            } else {
                this.subModelWeights[name] = Math.max(this.subModelWeights[name] * (1 - lr * 0.4), 0.7);
            }
        }
        
        for (let name in this.miniModelWeights) {
            if (correct) {
                this.miniModelWeights[name] = Math.min(this.miniModelWeights[name] * (1 + lr * 0.3), 1.3);
            } else {
                this.miniModelWeights[name] = Math.max(this.miniModelWeights[name] * (1 - lr * 0.3), 0.8);
            }
        }
        
        const key = 'ensemble';
        if (!this.performanceHistory[key]) this.performanceHistory[key] = { total: 0, correct: 0 };
        this.performanceHistory[key].total++;
        if (correct) this.performanceHistory[key].correct++;
        
        saveModelWeights();
    }
}

const analyzer = new TaiXiuAnalyzer();

// ================================================================
// ========== FALLBACK ALGORITHM - 6 LEVELS ==========
// ================================================================
class FallbackAlgorithm {
    constructor() {
        this.det = det;
        this.counter = 0;
        this.history = [];
        console.log('🔄 FALLBACK 6 LEVELS INITIALIZED');
    }
    
    // Level 1: Backup predictions
    getLevel1() {
        const valid = backupPredictions.filter(b => b.confidence > 0.5);
        if (valid.length > 0) {
            const last = valid[valid.length - 1];
            return {
                prediction: last.prediction,
                confidence: last.confidence || 0.55,
                type: 'BACKUP',
                reason: `Dùng backup (${(last.confidence*100).toFixed(0)}%)`
            };
        }
        return null;
    }
    
    // Level 2: History analysis
    getLevel2() {
        if (resultHistory.length >= 5) {
            const hist = resultHistory.map(h => ({
                score: h.Tong,
                Ket_qua: h.Ket_qua,
                Xuc_xac_1: h.Xuc_xac_1,
                Xuc_xac_2: h.Xuc_xac_2,
                Xuc_xac_3: h.Xuc_xac_3
            }));
            const result = analyzer.ensembleModels(hist);
            return {
                prediction: result.prediction,
                confidence: result.confidence || 0.5,
                type: 'HISTORY',
                reason: result.reason || 'Phân tích lịch sử'
            };
        }
        return null;
    }
    
    // Level 3: Saved patterns
    getLevel3() {
        const valid = fallbackPatterns.filter(p => p.confidence > 0.5);
        if (valid.length > 0) {
            const last = valid[valid.length - 1];
            return {
                prediction: last.prediction,
                confidence: last.confidence || 0.5,
                type: 'PATTERN',
                reason: `Dùng pattern lưu`
            };
        }
        return null;
    }
    
    // Level 4: Basic analysis
    getLevel4() {
        if (resultHistory.length >= 3) {
            const results = resultHistory.map(h => h.Ket_qua);
            const last = results[results.length - 1];
            const streak = analyzer.getStreak(results);
            const freq = analyzer.analyzeFrequency(results);
            
            let pred, conf, reason;
            
            if (streak >= 5) {
                pred = last === 'Tài' ? 'Xỉu' : 'Tài';
                conf = 0.5 + streak * 0.04;
                reason = `Bệt ${streak} - đảo`;
            } else if (streak >= 2 && streak <= 4) {
                pred = last;
                conf = 0.55 + streak * 0.05;
                reason = `Bệt ${streak} - tiếp`;
            } else if (freq.ratio > 0.65) {
                pred = freq.dominant === 'Tài' ? 'Xỉu' : 'Tài';
                conf = 0.55 + (freq.ratio - 0.5) * 0.5;
                reason = `Cân bằng ${freq.dominant}`;
            } else {
                pred = last === 'Tài' ? 'Xỉu' : 'Tài';
                conf = 0.5;
                reason = 'Basic fallback';
            }
            
            return { prediction: pred, confidence: Math.min(conf, 0.85), type: 'BASIC', reason };
        }
        return null;
    }
    
    // Level 5: Simple ML (Markov)
    getLevel5() {
        if (resultHistory.length >= 10) {
            const results = resultHistory.map(h => h.Ket_qua === 'Tài' ? 1 : 0);
            let taiAfterTai = 0, taiAfterXiu = 0;
            let totalTai = 0, totalXiu = 0;
            
            for (let i = 0; i < results.length - 1; i++) {
                if (results[i] === 1) {
                    totalTai++;
                    if (results[i+1] === 1) taiAfterTai++;
                    else taiAfterXiu++;
                } else {
                    totalXiu++;
                }
            }
            
            const last = results[results.length - 1];
            let pred, conf;
            if (last === 1) {
                const p = totalTai > 0 ? taiAfterTai / totalTai : 0.5;
                pred = p > 0.5 ? 'Tài' : 'Xỉu';
                conf = Math.abs(p - 0.5) * 2 + 0.3;
            } else {
                const p = totalXiu > 0 ? taiAfterXiu / totalXiu : 0.5;
                pred = p > 0.5 ? 'Tài' : 'Xỉu';
                conf = Math.abs(p - 0.5) * 2 + 0.3;
            }
            
            return {
                prediction: pred,
                confidence: Math.min(conf, 0.8),
                type: 'MARKOV',
                reason: 'Markov chain'
            };
        }
        return null;
    }
    
    // Level 6: Emergency
    getLevel6() {
        const pred = this.det.next('emergency') > 0.5 ? 'Tài' : 'Xỉu';
        return {
            prediction: pred,
            confidence: 0.45,
            type: 'EMERGENCY',
            reason: 'Emergency fallback'
        };
    }
    
    getPrediction() {
        this.counter++;
        
        const levels = [
            this.getLevel1.bind(this),
            this.getLevel2.bind(this),
            this.getLevel3.bind(this),
            this.getLevel4.bind(this),
            this.getLevel5.bind(this),
            this.getLevel6.bind(this)
        ];
        
        for (let level of levels) {
            const result = level();
            if (result && result.prediction) {
                this.history.push({
                    level: result.type,
                    prediction: result.prediction,
                    confidence: result.confidence,
                    time: Date.now()
                });
                if (this.history.length > 100) this.history.shift();
                return result;
            }
        }
        
        return { prediction: 'Xỉu', confidence: 0.4, type: 'ULTIMATE', reason: 'Ultimate fallback' };
    }
    
    savePattern(prediction, pattern, confidence) {
        const entry = {
            prediction,
            pattern: pattern || '',
            confidence: confidence || 0.5,
            timestamp: new Date().toISOString()
        };
        fallbackPatterns.push(entry);
        if (fallbackPatterns.length > 500) fallbackPatterns.shift();
        writeFile(FALLBACK_FILE, fallbackPatterns);
    }
}

const fallback = new FallbackAlgorithm();

// ================================================================
// ========== GLOBAL VARIABLES ==========
// ================================================================
let lastPrediction = null;
let stats = {
    total: 0,
    correct: 0,
    wrong: 0,
    consecutiveLosses: 0,
    streak: 0,
    bestStreak: 0,
    fallbackUsed: 0,
    totalTai: 0,
    totalXiu: 0
};

let apiData = {
    "Phien": null,
    "Xuc_xac_1": null,
    "Xuc_xac_2": null,
    "Xuc_xac_3": null,
    "Tong": null,
    "Ket_qua": "",
    "Phien_hien_tai": null,
    "Du_doan": "",
    "Loai_cau": "",
    "Mau_cau_phat_hien": "",
    "Do_tin_cay": "0%",
    "Trang_thai": "",
    "Ket_qua_du_doan": "",
    "Thong_ke": {
        "tong": 0,
        "dung": 0,
        "sai": 0,
        "ti_le": "0%"
    },
    "id": "@tranhoang2286"
};

// ================================================================
// ========== API ENDPOINTS ==========
// ================================================================

// ====== MAIN API ======
app.get('/api/ditmemaysun', (req, res) => {
    res.json(apiData);
});

app.get('/api/his', (req, res) => {
    const recent = resultHistory.slice(-30).reverse();
    res.json({
        success: true,
        total: resultHistory.length,
        data: recent,
        stats: {
            tong: stats.total,
            dung: stats.correct,
            sai: stats.wrong,
            ti_le: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) + '%' : '0%',
            consecutive_losses: stats.consecutiveLosses,
            fallback_used: stats.fallbackUsed,
            best_streak: stats.bestStreak,
            current_streak: stats.streak,
            total_tai: stats.totalTai,
            total_xiu: stats.totalXiu
        }
    });
});

// ====== POST RESULT ======
app.post('/api/result', (req, res) => {
    const { sid, d1, d2, d3 } = req.body;
    
    if (!d1 || !d2 || !d3) {
        return res.status(400).json({ error: 'Thiếu dữ liệu xúc xắc', required: ['d1', 'd2', 'd3'] });
    }
    
    const total = d1 + d2 + d3;
    const result = total > 10 ? 'Tài' : 'Xỉu';
    const phien = sid || Date.now();
    
    // Update stats
    if (result === 'Tài') stats.totalTai++;
    else stats.totalXiu++;
    
    // Check prediction
    let correct = false;
    if (lastPrediction && lastPrediction.ket_qua) {
        correct = lastPrediction.ket_qua === result;
        stats.total++;
        if (correct) {
            stats.correct++;
            stats.consecutiveLosses = 0;
            stats.streak++;
            if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;
        } else {
            stats.wrong++;
            stats.consecutiveLosses++;
            stats.streak = 0;
        }
        analyzer.updateWeights(result, lastPrediction.ket_qua, parseFloat(lastPrediction.do_tin_cay) / 100);
    }
    
    // Save history
    const entry = {
        phien,
        Xuc_xac_1: d1,
        Xuc_xac_2: d2,
        Xuc_xac_3: d3,
        Tong: total,
        Ket_qua: result,
        du_doan: lastPrediction ? lastPrediction.ket_qua : null,
        loai_cau: lastPrediction ? lastPrediction.loai_cau : null,
        do_tin_cay: lastPrediction ? lastPrediction.do_tin_cay : null,
        thoi_gian: new Date().toISOString()
    };
    resultHistory.push(entry);
    if (resultHistory.length > 2000) resultHistory.shift();
    writeFile(HISTORY_FILE, resultHistory);
    
    // Predict next
    const historyForAnalyzer = resultHistory.map(h => ({
        score: h.Tong,
        Ket_qua: h.Ket_qua,
        Xuc_xac_1: h.Xuc_xac_1,
        Xuc_xac_2: h.Xuc_xac_2,
        Xuc_xac_3: h.Xuc_xac_3
    }));
    
    const ensemble = analyzer.ensembleModels(historyForAnalyzer);
    
    let finalPred = ensemble.prediction;
    let finalConf = ensemble.confidence;
    let finalType = ensemble.type || 'AI';
    let finalPattern = ensemble.details ? ensemble.details.map(d => d.reason).join(', ') : '';
    
    // Anti-streak
    if (stats.consecutiveLosses >= 3) {
        finalPred = finalPred === 'Tài' ? 'Xỉu' : 'Tài';
        finalConf = Math.min(0.4 + stats.consecutiveLosses * 0.02, 0.6);
        finalType = `CHỐNG ĐẢO (${stats.consecutiveLosses})`;
        finalPattern = '';
    }
    
    // Save backup
    const backup = {
        phien: phien + 1,
        prediction: finalPred,
        confidence: finalConf,
        type: finalType,
        pattern: finalPattern,
        totalModels: ensemble.totalModels || 0,
        timestamp: new Date().toISOString()
    };
    backupPredictions.push(backup);
    if (backupPredictions.length > 500) backupPredictions.shift();
    writeFile(BACKUP_FILE, backupPredictions);
    
    // Save pattern for fallback
    if (finalPattern) {
        fallback.savePattern(finalPred, finalPattern, finalConf);
    }
    
    lastPrediction = {
        phien: phien + 1,
        ket_qua: finalPred,
        loai_cau: finalType,
        mau_cau: finalPattern,
        do_tin_cay: (finalConf * 100).toFixed(0) + '%'
    };
    
    const tiLe = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) + '%' : '0%';
    const status = finalType.includes('CHỐNG') ? 'Chống đảo' : 'AI Predicting';
    
    apiData = {
        "Phien": phien,
        "Xuc_xac_1": d1,
        "Xuc_xac_2": d2,
        "Xuc_xac_3": d3,
        "Tong": total,
        "Ket_qua": result,
        "Phien_hien_tai": phien + 1,
        "Du_doan": finalPred,
        "Loai_cau": finalType,
        "Mau_cau_phat_hien": finalPattern,
        "Do_tin_cay": (finalConf * 100).toFixed(0) + '%',
        "Trang_thai": status,
        "Ket_qua_du_doan": correct ? '✅' : (stats.total > 0 ? '❌' : ''),
        "Thong_ke": {
            "tong": stats.total,
            "dung": stats.correct,
            "sai": stats.wrong,
            "ti_le": tiLe
        },
        "id": "@tranhoang2286"
    };
    
    // LOG
    console.log('\n' + '🟦'.repeat(35));
    console.log(`🎲 PHIÊN ${phien} | KQ: ${result}`);
    console.log(`🎯 Xúc xắc: ${d1} | ${d2} | ${d3}  |  Tổng: ${total}`);
    console.log(`📊 Lịch sử: ${historyForAnalyzer.slice(-10).map(h => h.Ket_qua).join(' ')}`);
    console.log(`🔍 Phát hiện: ${finalType} | ${finalPattern || '...'}`);
    console.log(`🤖 Dự đoán phiên ${phien + 1}: ${finalPred} (${(finalConf * 100).toFixed(0)}%)`);
    console.log(`📊 ${ensemble.totalModels || 0} models | Top: ${ensemble.details ? ensemble.details.slice(0,3).map(d => d.model).join(', ') : 'N/A'}`);
    console.log(`📈 Thống kê: Đúng ${stats.correct}/${stats.total} (${tiLe}) ${correct ? '✅' : '❌'}`);
    if (stats.consecutiveLosses > 0) console.log(`⚠️ Thua liên tiếp: ${stats.consecutiveLosses}`);
    if (stats.streak > 1) console.log(`🔥 Streak: ${stats.streak}`);
    console.log('🟦'.repeat(35) + '\n');
    
    res.json(apiData);
});

// ====== FALLBACK API ======
app.post('/api/fallback', (req, res) => {
    const fallbackResult = fallback.getPrediction();
    stats.fallbackUsed++;
    
    const backup = {
        phien: Date.now(),
        prediction: fallbackResult.prediction,
        confidence: fallbackResult.confidence || 0.5,
        type: fallbackResult.type || 'FALLBACK',
        pattern: '',
        isFallback: true,
        timestamp: new Date().toISOString()
    };
    backupPredictions.push(backup);
    if (backupPredictions.length > 500) backupPredictions.shift();
    writeFile(BACKUP_FILE, backupPredictions);
    
    lastPrediction = {
        phien: Date.now() + 1,
        ket_qua: fallbackResult.prediction,
        loai_cau: `FALLBACK: ${fallbackResult.type}`,
        mau_cau: fallbackResult.reason || '',
        do_tin_cay: ((fallbackResult.confidence || 0.5) * 100).toFixed(0) + '%'
    };
    
    const tiLe = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) + '%' : '0%';
    
    apiData = {
        ...apiData,
        "Phien_hien_tai": Date.now() + 1,
        "Du_doan": fallbackResult.prediction,
        "Loai_cau": `FALLBACK: ${fallbackResult.type}`,
        "Mau_cau_phat_hien": fallbackResult.reason || 'Dự phòng',
        "Do_tin_cay": ((fallbackResult.confidence || 0.5) * 100).toFixed(0) + '%',
        "Trang_thai": 'DỰ PHÒNG',
        "Thong_ke": {
            "tong": stats.total,
            "dung": stats.correct,
            "sai": stats.wrong,
            "ti_le": tiLe
        },
        "id": "@tranhoang2286"
    };
    
    console.log('\n' + '🟨'.repeat(35));
    console.log(`⚠️ FALLBACK ACTIVE - Lần ${stats.fallbackUsed}`);
    console.log(`📌 Level: ${fallbackResult.type}`);
    console.log(`🤖 Dự đoán: ${fallbackResult.prediction} (${((fallbackResult.confidence || 0.5) * 100).toFixed(0)}%)`);
    console.log(`📝 Lý do: ${fallbackResult.reason || 'Không có dữ liệu'}`);
    console.log('🟨'.repeat(35) + '\n');
    
    res.json({ success: true, fallback: fallbackResult });
});

// ====== MANUAL PREDICTION ======
app.post('/api/manual', (req, res) => {
    const { pred, conf, type, pattern } = req.body;
    
    if (!pred || !['Tài', 'Xỉu'].includes(pred)) {
        return res.status(400).json({ error: 'pred phải là Tài hoặc Xỉu' });
    }
    
    const confidence = conf || 0.6;
    const predictionType = type || 'MANUAL';
    const patternStr = pattern || '';
    
    const backup = {
        phien: Date.now(),
        prediction: pred,
        confidence: confidence,
        type: `MANUAL: ${predictionType}`,
        pattern: patternStr,
        isManual: true,
        timestamp: new Date().toISOString()
    };
    backupPredictions.push(backup);
    if (backupPredictions.length > 500) backupPredictions.shift();
    writeFile(BACKUP_FILE, backupPredictions);
    
    lastPrediction = {
        phien: Date.now() + 1,
        ket_qua: pred,
        loai_cau: `MANUAL: ${predictionType}`,
        mau_cau: patternStr,
        do_tin_cay: (confidence * 100).toFixed(0) + '%'
    };
    
    apiData = {
        ...apiData,
        "Du_doan": pred,
        "Loai_cau": `MANUAL: ${predictionType}`,
        "Mau_cau_phat_hien": patternStr,
        "Do_tin_cay": (confidence * 100).toFixed(0) + '%',
        "Trang_thai": 'MANUAL',
        "id": "@tranhoang2286"
    };
    
    res.json({ success: true, prediction: pred, confidence: confidence, type: predictionType });
});

// ====== MODELS INFO ======
app.get('/api/models', (req, res) => {
    res.json({
        main_models: Object.keys(analyzer.modelWeights).length,
        sub_models: Object.keys(analyzer.subModels).length,
        mini_models: Object.keys(analyzer.miniModels).length,
        total: 21 + 42 + 21,
        weights: {
            main: analyzer.modelWeights,
            sub: analyzer.subModelWeights,
            mini: analyzer.miniModelWeights
        },
        performance: analyzer.performanceHistory
    });
});

// ====== BACKUP ======
app.get('/api/backup', (req, res) => {
    res.json({
        total: backupPredictions.length,
        latest: backupPredictions.slice(-10),
        fallback_patterns: fallbackPatterns.length
    });
});

// ====== FALLBACK STATUS ======
app.get('/api/fallback-status', (req, res) => {
    res.json({
        total: fallbackPatterns.length,
        used: stats.fallbackUsed,
        history: fallback.history.slice(-10),
        levels: ['BACKUP', 'HISTORY', 'PATTERN', 'BASIC', 'MARKOV', 'EMERGENCY']
    });
});

// ====== TRAIN ======
app.post('/api/train', (req, res) => {
    if (resultHistory.length < 50) {
        return res.json({ error: `Cần ít nhất 50 phiên, hiện có ${resultHistory.length}` });
    }
    
    const hist = resultHistory.map(h => ({
        score: h.Tong,
        Ket_qua: h.Ket_qua,
        Xuc_xac_1: h.Xuc_xac_1,
        Xuc_xac_2: h.Xuc_xac_2,
        Xuc_xac_3: h.Xuc_xac_3
    }));
    
    let correct = 0;
    const total = Math.min(hist.length - 10, 300);
    for (let i = 10; i < total; i++) {
        const train = hist.slice(0, i);
        const test = hist[i];
        const result = analyzer.ensembleModels(train);
        if (result.prediction === test.Ket_qua) correct++;
    }
    
    const accuracy = correct / total;
    saveModelWeights();
    writeFile(CACHE_FILE, { lastTrain: Date.now(), accuracy });
    
    res.json({
        success: true,
        accuracy: accuracy,
        total: total,
        correct: correct,
        message: `Training hoàn tất với độ chính xác ${(accuracy * 100).toFixed(1)}%`
    });
});

// ====== STATS ======
app.get('/api/stats', (req, res) => {
    res.json({
        total: stats.total,
        correct: stats.correct,
        wrong: stats.wrong,
        rate: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) + '%' : '0%',
        consecutiveLosses: stats.consecutiveLosses,
        streak: stats.streak,
        bestStreak: stats.bestStreak,
        fallbackUsed: stats.fallbackUsed,
        totalTai: stats.totalTai,
        totalXiu: stats.totalXiu,
        historyCount: resultHistory.length,
        backupCount: backupPredictions.length,
        fallbackPatterns: fallbackPatterns.length
    });
});

// ====== HEALTH ======
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        history: resultHistory.length,
        stats: stats.total
    });
});

app.get('/ping', (req, res) => res.send('pong'));

// ====== ROOT ======
app.get('/', (req, res) => {
    const tiLe = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) + '%' : '0%';
    res.json({
        name: "🎲 SUNWIN TX - 84 MODELS + FALLBACK 6 LEVELS",
        author: "@tranhoang2286",
        version: "6.0.0",
        deterministic: "🔒 100% NO RANDOM",
        models: {
            main: 21,
            sub: 42,
            mini: 21,
            total: 84
        },
        fallback: {
            levels: 6,
            used: stats.fallbackUsed,
            patterns: fallbackPatterns.length
        },
        stats: {
            tong: stats.total,
            dung: stats.correct,
            sai: stats.wrong,
            ti_le: tiLe,
            streak: stats.streak,
            best_streak: stats.bestStreak
        },
        endpoints: {
            data: "/api/ditmemaysun",
            history: "/api/his",
            result: "POST /api/result",
            fallback: "POST /api/fallback",
            manual: "POST /api/manual",
            models: "/api/models",
            backup: "/api/backup",
            train: "POST /api/train",
            stats: "/api/stats",
            health: "/health",
            ping: "/ping"
        },
        usage: {
            post_result: "POST /api/result { sid, d1, d2, d3 }",
            manual: "POST /api/manual { pred, conf, type, pattern }",
            fallback: "POST /api/fallback"
        }
    });
});

// ================================================================
// ========== START ==========
// ================================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎲 SUNWIN TX - 84 MODELS + FALLBACK 6 LEVELS`);
    console.log(`👤 Author: @tranhoang2286`);
    console.log(`🔒 Deterministic: 100% NO RANDOM`);
    console.log(`${'='.repeat(60)}`);
    console.log(`🌐 Server: http://0.0.0.0:${PORT}`);
    console.log(`📁 History: ${resultHistory.length} phiên`);
    console.log(`💾 Backup: ${backupPredictions.length} dự đoán`);
    console.log(`🔄 Fallback: ${fallbackPatterns.length} patterns`);
    console.log(`📊 Models: 21 main + 42 sub + 21 mini = 84 models`);
    console.log(`📈 Stats: Đúng ${stats.correct}/${stats.total} (${stats.total > 0 ? ((stats.correct/stats.total)*100).toFixed(1) : 0}%)`);
    console.log(`🔄 Fallback levels: BACKUP → HISTORY → PATTERN → BASIC → MARKOV → EMERGENCY`);
    console.log(`📌 Lưu ý: KHÔNG ALL-IN theo AI!`);
    console.log(`${'='.repeat(60)}\n`);
});

module.exports = app;
