const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3001;

// ==================== FILE STORAGE ====================
const HISTORY_FILE = './history.json';
const PATTERNS_FILE = './patterns.json';
const MODEL_WEIGHTS_FILE = './model_weights.json';
const BACKUP_FILE = './backup_predictions.json';

// Load history if exists
let resultHistory = [];
if (fs.existsSync(HISTORY_FILE)) {
    try {
        resultHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        console.log(`[📂] Đã tải ${resultHistory.length} phiên từ history.json`);
    } catch (e) {
        console.error('[❌] Lỗi đọc history.json:', e.message);
    }
}

// Load backup predictions
let backupPredictions = [];
if (fs.existsSync(BACKUP_FILE)) {
    try {
        backupPredictions = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
        console.log(`[📂] Đã tải ${backupPredictions.length} dự đoán dự phòng`);
    } catch (e) {
        console.error('[❌] Lỗi đọc backup_predictions.json:', e.message);
    }
}

// Load model weights if exists
let modelWeights = {
    'model1': 1.0, 'model2': 1.0, 'model3': 1.0, 'model4': 1.0,
    'model5': 1.0, 'model6': 1.0, 'model7': 1.0, 'model8': 1.0,
    'model9': 1.0, 'model10': 1.0, 'model11': 1.0, 'model12': 1.0,
    'model13': 1.0, 'model14': 1.0, 'model15': 1.0, 'model16': 1.0,
    'model17': 1.0, 'model18': 1.0, 'model19': 1.0, 'model20': 1.0,
    'model21': 1.0
};

// Load sub model weights
let subModelWeights = {};
for (let i = 1; i <= 42; i++) {
    subModelWeights[`sub_model_${i}`] = 1.0;
}

// Load mini model weights
let miniModelWeights = {};
for (let i = 1; i <= 21; i++) {
    miniModelWeights[`mini_model_${i}`] = 1.0;
}

if (fs.existsSync(MODEL_WEIGHTS_FILE)) {
    try {
        const savedWeights = JSON.parse(fs.readFileSync(MODEL_WEIGHTS_FILE, 'utf8'));
        modelWeights = savedWeights.modelWeights || modelWeights;
        subModelWeights = savedWeights.subModelWeights || subModelWeights;
        miniModelWeights = savedWeights.miniModelWeights || miniModelWeights;
        console.log('[📂] Đã tải model_weights.json');
    } catch (e) {
        console.error('[❌] Lỗi đọc model_weights.json:', e.message);
    }
}

// ==================== DETERMINISTIC ENGINE ====================
class DeterministicEngine {
    constructor(seed = 'DIT_ME_MAY_SUNWIN_2024') {
        this.seed = seed;
        this.counter = 0;
        this.cache = new Map();
        console.log('🔒 DETERMINISTIC ENGINE - 100% NO RANDOM');
    }
    
    hash(input) {
        const hash = crypto.createHash('sha256');
        hash.update(input);
        return hash.digest('hex');
    }
    
    next(seed = null) {
        const seedValue = seed || this.seed + this.counter++;
        const key = `next_${seedValue}`;
        if (this.cache.has(key)) return this.cache.get(key);
        const hashValue = this.hash(seedValue);
        const num = parseInt(hashValue.slice(0, 8), 16) / 0xFFFFFFFF;
        this.cache.set(key, num);
        return num;
    }
}

const det = new DeterministicEngine();

// ==================== SAVE FUNCTIONS ====================
function saveHistory(entry) {
    resultHistory.push(entry);
    if (resultHistory.length > 2000) resultHistory.shift();
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(resultHistory, null, 2));
}

function saveBackup(prediction) {
    backupPredictions.push(prediction);
    if (backupPredictions.length > 500) backupPredictions.shift();
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(backupPredictions, null, 2));
}

function saveModelWeights() {
    const weights = { modelWeights, subModelWeights, miniModelWeights };
    fs.writeFileSync(MODEL_WEIGHTS_FILE, JSON.stringify(weights, null, 2));
}

// ==================== GLOBAL VARIABLES ====================
let currentSessionId = null;
let lastResult = null;
let lastPrediction = null;
let wsConnected = false;
let lastWsData = null;

let stats = {
    total: 0,
    correct: 0,
    wrong: 0,
    consecutiveLosses: 0,
    modelPerformance: {}
};

let apiResponseData = {
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
    "id": "@nhan161019"
};

// ==================== TAI XIU ANALYZER ====================
class TaiXiuAnalyzer {
    constructor() {
        this.modelWeights = modelWeights;
        this.subModelWeights = subModelWeights;
        this.miniModelWeights = miniModelWeights;
        this.det = det;
        this.subModels = {};
        this.miniModels = {};
        this.initSubModels();
        this.initMiniModels();
        this.performanceHistory = {};
        this.patternLibrary = this.loadPatternLibrary();
        this.predictionCache = new Map();
    }
    
    loadPatternLibrary() {
        if (fs.existsSync(PATTERNS_FILE)) {
            try {
                return JSON.parse(fs.readFileSync(PATTERNS_FILE, 'utf8'));
            } catch (e) {
                console.error('[❌] Lỗi đọc patterns.json:', e.message);
            }
        }
        return {
            '1-1': [], '2-2': [], '3-3': [], '1-2': [], '2-1': [],
            '2-1-2': [], '1-2-1': [], 'bệt': [], 'loạn': []
        };
    }
    
    savePatternLibrary() {
        fs.writeFileSync(PATTERNS_FILE, JSON.stringify(this.patternLibrary, null, 2));
    }
    
    initSubModels() {
        const subModelSpecialties = {
            1: { name: '1-1 thuần', type: '1-1', logic: 'pure', minLength: 4, threshold: 0.9 },
            2: { name: '1-1 biến thể', type: '1-1', logic: 'variant', minLength: 5, threshold: 0.8 },
            3: { name: '1-1 dài hạn', type: '1-1', logic: 'long', minLength: 8, threshold: 0.75 },
            4: { name: '1-1 kết hợp', type: '1-1', logic: 'hybrid', minLength: 6, threshold: 0.7 },
            5: { name: '1-1 gãy', type: '1-1', logic: 'break', minLength: 6, threshold: 0.8 },
            6: { name: '1-1 phục hồi', type: '1-1', logic: 'recovery', minLength: 7, threshold: 0.7 },
            7: { name: '2-2 chuẩn', type: '2-2', logic: 'pure', minLength: 6, threshold: 0.9 },
            8: { name: '2-2 lệch', type: '2-2', logic: 'offset', minLength: 7, threshold: 0.8 },
            9: { name: '2-2 biến tướng', type: '2-2', logic: 'variant', minLength: 8, threshold: 0.75 },
            10: { name: '2-2 kết hợp 1-1', type: '2-2', logic: 'hybrid', minLength: 8, threshold: 0.7 },
            11: { name: '2-2 dài', type: '2-2', logic: 'long', minLength: 10, threshold: 0.8 },
            12: { name: '2-2 bẻ', type: '2-2', logic: 'break', minLength: 7, threshold: 0.85 },
            13: { name: 'bệt ngắn', type: 'bệt', logic: 'short', minLength: 3, threshold: 0.8 },
            14: { name: 'bệt trung', type: 'bệt', logic: 'medium', minLength: 5, threshold: 0.85 },
            15: { name: 'bệt dài', type: 'bệt', logic: 'long', minLength: 7, threshold: 0.9 },
            16: { name: 'bệt gãy', type: 'bệt', logic: 'break', minLength: 5, threshold: 0.8 },
            17: { name: 'bệt xen kẽ', type: 'bệt', logic: 'hybrid', minLength: 6, threshold: 0.7 },
            18: { name: 'siêu bệt', type: 'bệt', logic: 'super', minLength: 10, threshold: 0.95 },
            19: { name: '3-3 chuẩn', type: '3-3', logic: 'pure', minLength: 9, threshold: 0.9 },
            20: { name: '3-3 biến thể', type: '3-3', logic: 'variant', minLength: 10, threshold: 0.8 },
            21: { name: '3-3 ngắn', type: '3-3', logic: 'short', minLength: 6, threshold: 0.7 },
            22: { name: '3-3 kết hợp', type: '3-3', logic: 'hybrid', minLength: 9, threshold: 0.75 },
            23: { name: '3-3 bẻ', type: '3-3', logic: 'break', minLength: 8, threshold: 0.8 },
            24: { name: '3-3 dài', type: '3-3', logic: 'long', minLength: 12, threshold: 0.85 },
            25: { name: '2-1-2 chuẩn', type: '2-1-2', logic: 'pure', minLength: 5, threshold: 0.9 },
            26: { name: '2-1-2 biến thể', type: '2-1-2', logic: 'variant', minLength: 6, threshold: 0.8 },
            27: { name: '2-1-2 dài', type: '2-1-2', logic: 'long', minLength: 8, threshold: 0.8 },
            28: { name: '1-2-1 chuẩn', type: '1-2-1', logic: 'pure', minLength: 5, threshold: 0.9 },
            29: { name: '1-2-1 biến thể', type: '1-2-1', logic: 'variant', minLength: 6, threshold: 0.8 },
            30: { name: '1-2-1 dài', type: '1-2-1', logic: 'long', minLength: 8, threshold: 0.8 },
            31: { name: 'bẻ cầu 1-1', type: 'break', logic: 'break11', minLength: 4, threshold: 0.85 },
            32: { name: 'bẻ cầu 2-2', type: 'break', logic: 'break22', minLength: 5, threshold: 0.85 },
            33: { name: 'bẻ cầu bệt', type: 'break', logic: 'breakStreak', minLength: 4, threshold: 0.8 },
            34: { name: 'chuyển tiếp 1-1 sang 2-2', type: 'transition', logic: '11to22', minLength: 6, threshold: 0.75 },
            35: { name: 'chuyển tiếp 2-2 sang 1-1', type: 'transition', logic: '22to11', minLength: 6, threshold: 0.75 },
            36: { name: 'chuyển tiếp bệt sang 1-1', type: 'transition', logic: 'streakTo11', minLength: 5, threshold: 0.7 },
            37: { name: 'phân tích tần suất', type: 'frequency', logic: 'frequency', minLength: 10, threshold: 0.7 },
            38: { name: 'phân tích chu kỳ', type: 'cycle', logic: 'cycle', minLength: 12, threshold: 0.7 },
            39: { name: 'phân tích đối xứng', type: 'symmetry', logic: 'symmetry', minLength: 8, threshold: 0.75 },
            40: { name: 'phân tích Fibonacci', type: 'fibonacci', logic: 'fibonacci', minLength: 8, threshold: 0.7 },
            41: { name: 'phân tích xu hướng dài', type: 'trend', logic: 'longTrend', minLength: 15, threshold: 0.8 },
            42: { name: 'tổng hợp siêu cầu', type: 'super', logic: 'super', minLength: 20, threshold: 0.85 }
        };
        
        for (let i = 1; i <= 42; i++) {
            this.subModels[`sub_model_${i}`] = {
                ...subModelSpecialties[i],
                weight: this.subModelWeights[`sub_model_${i}`] || 1.0,
                accuracy: 0.5,
                predictions: []
            };
        }
    }
    
    initMiniModels() {
        const specialties = {
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
                specialty: specialties[i] || 'chung',
                predictions: []
            };
        }
    }
    
    getResultArray(history) {
        return history.map(h => h.Ket_qua || (h.score >= 11 ? 'Tài' : 'Xỉu'));
    }
    
    // === CÁC HÀM PHÂN TÍCH PATTERN ===
    isPerfectAlternating(results, length) {
        const last = results.slice(-length);
        for (let i = 0; i < last.length - 1; i++) {
            if (last[i] === last[i+1]) return false;
        }
        return true;
    }
    
    isAlternatingWithTolerance(results, tolerance) {
        const last = results.slice(-6);
        let errors = 0;
        for (let i = 0; i < last.length - 1; i++) {
            if (last[i] === last[i+1]) errors++;
        }
        return errors <= tolerance;
    }
    
    countAlternating(results) {
        let count = 0;
        for (let i = 0; i < results.length - 1; i++) {
            if (results[i] !== results[i+1]) count++;
        }
        return count;
    }
    
    getStreak(results) {
        if (results.length === 0) return 0;
        const last = results[results.length - 1];
        let streak = 1;
        for (let i = results.length - 2; i >= 0; i--) {
            if (results[i] === last) streak++;
            else break;
        }
        return streak;
    }
    
    analyzeFrequency(results) {
        const recent = results.slice(-20);
        const taiCount = recent.filter(r => r === 'Tài').length;
        const xiuCount = recent.length - taiCount;
        const ratio = Math.max(taiCount, xiuCount) / recent.length;
        const dominant = taiCount > xiuCount ? 'Tài' : 'Xỉu';
        return { dominant, ratio };
    }
    
    detectCycle(results) {
        for (let cycleLen of [2, 3, 4]) {
            if (results.length < cycleLen * 2) continue;
            const lastCycle = results.slice(-cycleLen);
            const prevCycle = results.slice(-cycleLen*2, -cycleLen);
            if (JSON.stringify(lastCycle) === JSON.stringify(prevCycle)) {
                return { found: true, length: cycleLen, next: lastCycle[0] };
            }
        }
        return { found: false };
    }
    
    checkSymmetry(results) {
        if (results.length < 6) return { found: false };
        const last3 = results.slice(-3);
        const prev3 = results.slice(-6, -3);
        if (last3[0] === prev3[2] && last3[1] === prev3[1] && last3[2] === prev3[0]) {
            return { found: true, prediction: last3[1] };
        }
        return { found: false };
    }
    
    checkFibonacci(results) {
        if (results.length < 5) return { found: false };
        const fibs = [1, 2, 3, 5];
        for (let fib of fibs) {
            if (results.length >= fib * 2) {
                const lastFib = results.slice(-fib);
                const prevFib = results.slice(-fib*2, -fib);
                if (JSON.stringify(lastFib) === JSON.stringify(prevFib)) {
                    return { found: true, prediction: lastFib[0] };
                }
            }
        }
        return { found: false };
    }
    
    getLongTrend(results) {
        if (results.length < 10) return { strength: 0, direction: null };
        const first = results.slice(0, 5);
        const last = results.slice(-5);
        const firstTai = first.filter(r => r === 'Tài').length;
        const lastTai = last.filter(r => r === 'Tài').length;
        if (lastTai > firstTai + 2) return { strength: 0.8, direction: 'Tài' };
        if (lastTai < firstTai - 2) return { strength: 0.8, direction: 'Xỉu' };
        return { strength: 0.5, direction: lastTai > 2 ? 'Tài' : 'Xỉu' };
    }
    
    superAnalysis(results) {
        const freq = this.analyzeFrequency(results);
        const trend = this.getLongTrend(results);
        const cycle = this.detectCycle(results);
        let score = 0, predictions = [];
        if (freq.ratio > 0.6) { predictions.push({ pred: freq.dominant, weight: freq.ratio }); score++; }
        if (trend.strength > 0.7) { predictions.push({ pred: trend.direction, weight: trend.strength }); score++; }
        if (cycle.found) { predictions.push({ pred: cycle.next, weight: 0.7 }); score++; }
        if (score >= 2) {
            const taiWeight = predictions.filter(p => p.pred === 'Tài').reduce((s, p) => s + p.weight, 0);
            const xiuWeight = predictions.filter(p => p.pred === 'Xỉu').reduce((s, p) => s + p.weight, 0);
            if (taiWeight > xiuWeight * 1.5) return { prediction: 'Tài', confidence: 0.85, reason: 'Đồng thuận Tài' };
            if (xiuWeight > taiWeight * 1.5) return { prediction: 'Xỉu', confidence: 0.85, reason: 'Đồng thuận Xỉu' };
        }
        return { confidence: 0 };
    }
    
    // === RUN SUB MODELS ===
    runSubModel11(results, model) {
        if (results.length < model.minLength) return null;
        const last = results[results.length - 1];
        switch (model.logic) {
            case 'pure':
                if (this.isPerfectAlternating(results, 4)) {
                    return { prediction: last === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.9, reason: '1-1 thuần' };
                }
                break;
            case 'variant':
                if (this.isAlternatingWithTolerance(results, 1)) {
                    return { prediction: last === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.8, reason: '1-1 biến thể' };
                }
                break;
            case 'long':
                const altCount = this.countAlternating(results.slice(-12));
                if (altCount >= 8) {
                    return { prediction: last === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.7 + altCount/20, reason: '1-1 dài' };
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
        if (results.length < model.minLength) return null;
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
        }
        return null;
    }
    
    runSubModelStreak(results, model) {
        if (results.length < model.minLength) return null;
        const last = results[results.length - 1];
        const other = last === 'Tài' ? 'Xỉu' : 'Tài';
        let streak = 1;
        for (let i = results.length - 2; i >= 0; i--) {
            if (results[i] === last) streak++;
            else break;
        }
        switch (model.logic) {
            case 'short': if (streak >= 2 && streak <= 3) return { prediction: last, confidence: 0.7 + streak*0.05, reason: `Bệt ${streak}` }; break;
            case 'medium': if (streak >= 4 && streak <= 5) return { prediction: last, confidence: 0.75 + (streak-4)*0.05, reason: `Bệt ${streak}` }; break;
            case 'long': if (streak >= 6) return { prediction: last, confidence: 0.8 + Math.min(streak,10)*0.01, reason: `Bệt ${streak}` }; break;
            case 'break': if (streak >= 4) return { prediction: other, confidence: 0.6 + streak*0.03, reason: `Bệt ${streak} sắp gãy` }; break;
            case 'super': if (streak >= 8) return { prediction: last, confidence: 0.9, reason: `Siêu bệt ${streak}` }; break;
        }
        return null;
    }
    
    runSubModel33(results, model) {
        if (results.length < model.minLength) return null;
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
                    for (let i = 0; i < 12; i+=3) {
                        if (i+2 < 12 && last12[i] === last12[i+1] && last12[i+1] === last12[i+2]) score++;
                    }
                    if (score >= 3) return { prediction: last === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.7 + score*0.05, reason: '3-3 biến thể' };
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
        if (results.length < model.minLength) return null;
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
        if (results.length < model.minLength) return null;
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
        if (results.length < model.minLength) return null;
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
                    return { prediction: last6[4] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.75, reason: '1-1 -> 2-2' };
                }
                break;
            case '22to11':
                if (last6.length === 6 && last6[0] === last6[1] && last6[1] !== last6[2] &&
                    last6[2] !== last6[3] && last6[3] !== last6[4] && last6[4] !== last6[5]) {
                    return { prediction: last6[4] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.75, reason: '2-2 -> 1-1' };
                }
                break;
            case 'streakTo11':
                if (last5.length === 5 && last5[0] === last5[1] && last5[1] === last5[2] &&
                    last5[2] !== last5[3] && last5[3] !== last5[4]) {
                    return { prediction: last5[4] === 'Tài' ? 'Xỉu' : 'Tài', confidence: 0.7, reason: 'Bệt -> 1-1' };
                }
                break;
        }
        return null;
    }
    
    runSubModelAdvanced(results, model) {
        if (results.length < model.minLength) return null;
        const last = results[results.length - 1];
        const other = last === 'Tài' ? 'Xỉu' : 'Tài';
        switch (model.logic) {
            case 'frequency':
                const freq = this.analyzeFrequency(results);
                if (freq.dominant && freq.ratio > 0.6) {
                    return { prediction: freq.dominant, confidence: 0.6 + freq.ratio*0.2, reason: `Tần suất ${freq.dominant}` };
                }
                break;
            case 'cycle':
                const cycle = this.detectCycle(results);
                if (cycle.found) return { prediction: cycle.next, confidence: 0.7, reason: `Chu kỳ ${cycle.length}` };
                break;
            case 'symmetry':
                const symmetry = this.checkSymmetry(results);
                if (symmetry.found) return { prediction: symmetry.prediction, confidence: 0.75, reason: 'Đối xứng' };
                break;
            case 'fibonacci':
                const fib = this.checkFibonacci(results);
                if (fib.found) return { prediction: fib.prediction, confidence: 0.7, reason: 'Fibonacci' };
                break;
            case 'longTrend':
                const trend = this.getLongTrend(results);
                if (trend.strength > 0.7) {
                    return { prediction: trend.direction, confidence: 0.7 + trend.strength*0.1, reason: `Trend ${trend.direction}` };
                }
                break;
            case 'super':
                const superAnalysis = this.superAnalysis(results);
                if (superAnalysis.confidence > 0.8) return superAnalysis;
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
    
    // === MINI MODELS ===
    runMiniModel(index, history) {
        if (history.length < 2) return null;
        const results = this.getResultArray(history);
        const miniModel = this.miniModels[`mini_model_${index}`];
        let prediction, confidence, reason;
        switch (miniModel.specialty) {
            case 'phat_hien_cau_dep':
                const pattern = this.analyzeBasicPatterns(history);
                prediction = pattern.prediction; confidence = pattern.confidence * 0.9; reason = pattern.reason;
                break;
            case 'du_doan_bien_dong':
                const dice = this.analyzeDiceVolatility(history);
                prediction = dice.prediction; confidence = dice.confidence * 0.8; reason = dice.reason;
                break;
            case 'nhan_dien_xu_huong_cuc_bo':
                const short = this.analyzeShortTerm(history);
                prediction = short.prediction; confidence = short.confidence * 0.85; reason = short.reason;
                break;
            case 'tinh_toan_xac_suat_cao':
                const taiCount = results.filter(r => r === 'Tài').length;
                const xiuCount = results.length - taiCount;
                if (taiCount > xiuCount * 1.5) { prediction = 'Xỉu'; confidence = 0.7; reason = 'Xác suất Tài cao'; }
                else if (xiuCount > taiCount * 1.5) { prediction = 'Tài'; confidence = 0.7; reason = 'Xác suất Xỉu cao'; }
                else { prediction = results[results.length - 1]; confidence = 0.5; reason = 'Cân bằng'; }
                break;
            default:
                const rand = det.next(`mini_${index}`);
                if (rand < 0.4) { prediction = results[results.length - 1]; confidence = 0.5; }
                else if (rand < 0.7) { prediction = results[results.length - 1] === 'Tài' ? 'Xỉu' : 'Tài'; confidence = 0.5; }
                else { const streak = this.getStreak(results); prediction = streak >= 3 ? results[results.length - 1] : (results[results.length - 1] === 'Tài' ? 'Xỉu' : 'Tài'); confidence = 0.5; }
                reason = `Mini ${index}`;
        }
        return { prediction, confidence: Math.min(confidence, 0.95), reason, model_name: `mini_${index}` };
    }
    
    // === CÁC MODEL CHÍNH ===
    analyzeBasicPatterns(history) {
        if (history.length < 3) return { prediction: null, confidence: 0, reason: 'Không đủ dữ liệu' };
        const results = this.getResultArray(history);
        const patterns = {
            '1-1': this.checkAlternatingPattern(results),
            '1-2-1': this.checkPattern121(results),
            '2-1-2': this.checkPattern212(results),
            '2-2': this.checkPattern22(results),
            'cầu_bệt': this.checkStreakPattern(results),
            'cầu_đảo': this.checkReversalPattern(results)
        };
        let validPatterns = {};
        for (let [key, value] of Object.entries(patterns)) {
            if (value && value.confidence > 0) validPatterns[key] = value;
        }
        if (Object.keys(validPatterns).length === 0) {
            return { prediction: results[results.length - 1], confidence: 0.3, reason: 'Không phát hiện pattern' };
        }
        let bestPattern = null, bestConfidence = 0, bestKey = '';
        for (let [key, value] of Object.entries(validPatterns)) {
            if (value.confidence > bestConfidence) { bestConfidence = value.confidence; bestPattern = value; bestKey = key; }
        }
        return { prediction: bestPattern.prediction, confidence: bestPattern.confidence, pattern_type: bestKey, reason: `Phát hiện ${bestKey}` };
    }
    
    checkAlternatingPattern(results) {
        if (results.length < 2) return { prediction: null, confidence: 0 };
        const last = results[results.length - 1];
        const pred = last === 'Tài' ? 'Xỉu' : 'Tài';
        let confidence = 0.5;
        for (let i = results.length - 2; i >= Math.max(results.length - 6, 0); i -= 2) {
            if (results[i] === last) confidence += 0.1;
            else break;
        }
        return { prediction: pred, confidence: Math.min(confidence, 0.95) };
    }
    
    checkPattern121(results) {
        if (results.length < 3) return { prediction: null, confidence: 0 };
        if (results[results.length - 3] === results[results.length - 1] && results[results.length - 2] !== results[results.length - 1]) {
            return { prediction: results[results.length - 1], confidence: 0.7 };
        }
        return { prediction: results[results.length - 1], confidence: 0.3 };
    }
    
    checkPattern212(results) {
        if (results.length < 3) return { prediction: null, confidence: 0 };
        if (results[results.length - 3] !== results[results.length - 1] && results[results.length - 2] === results[results.length - 1]) {
            return { prediction: results[results.length - 2], confidence: 0.7 };
        }
        return { prediction: results[results.length - 1], confidence: 0.3 };
    }
    
    checkPattern22(results) {
        if (results.length < 4) return { prediction: null, confidence: 0 };
        if (results[results.length - 4] === results[results.length - 3] && results[results.length - 2] === results[results.length - 1] && results[results.length - 3] !== results[results.length - 2]) {
            return { prediction: results[results.length - 1], confidence: 0.75 };
        }
        return { prediction: results[results.length - 1], confidence: 0.25 };
    }
    
    checkStreakPattern(results) {
        let streak = 1;
        for (let i = results.length - 2; i >= 0; i--) {
            if (results[i] === results[results.length - 1]) streak++;
            else break;
        }
        if (streak >= 3) {
            let confidence = 0.6 + (streak * 0.05);
            return { prediction: results[results.length - 1], confidence: Math.min(confidence, 0.9) };
        }
        return { prediction: results[results.length - 1], confidence: 0.4 };
    }
    
    checkReversalPattern(results) {
        if (results.length < 3) return { prediction: null, confidence: 0 };
        if (results[results.length - 2] !== results[results.length - 1]) {
            return { prediction: results[results.length - 1], confidence: 0.5 };
        }
        const other = results[results.length - 1] === 'Tài' ? 'Xỉu' : 'Tài';
        return { prediction: other, confidence: 0.4 };
    }
    
    analyzeTrend(history) {
        if (history.length < 5) return { prediction: null, confidence: 0, reason: 'Không đủ dữ liệu' };
        const results = this.getResultArray(history);
        const shortTerm = results.slice(-3);
        const shortCounts = { 'Tài': 0, 'Xỉu': 0 };
        shortTerm.forEach(r => shortCounts[r]++);
        const shortTrend = shortCounts['Tài'] >= shortCounts['Xỉu'] ? 'Tài' : 'Xỉu';
        const longTerm = results.slice(-10);
        const longCounts = { 'Tài': 0, 'Xỉu': 0 };
        longTerm.forEach(r => longCounts[r]++);
        const longTrend = longCounts['Tài'] >= longCounts['Xỉu'] ? 'Tài' : 'Xỉu';
        const momentum = this.calculateMomentum(results);
        if (shortCounts[shortTrend] >= 2 && longCounts[longTrend] >= 6) {
            return { prediction: shortTrend, confidence: Math.min(0.7 + momentum * 0.1, 0.95), reason: `Trend ${shortTrend}` };
        } else if (shortCounts[shortTrend] >= 2) {
            return { prediction: shortTrend, confidence: Math.min(0.6 + momentum * 0.1, 0.95), reason: `Short trend ${shortTrend}` };
        }
        const other = results[results.length - 1] === 'Tài' ? 'Xỉu' : 'Tài';
        return { prediction: other, confidence: 0.5, reason: 'Không trend' };
    }
    
    calculateMomentum(results) {
        if (results.length < 5) return 0;
        const recent = results.slice(-5);
        const taiCount = recent.filter(r => r === 'Tài').length;
        if (taiCount === 5 || taiCount === 0) return 0.3;
        if (taiCount >= 3 || taiCount <= 2) return 0.15;
        return 0;
    }
    
    analyzeImbalance(history) {
        if (history.length < 12) return { prediction: null, confidence: 0, reason: 'Không đủ 12 phiên' };
        const results = this.getResultArray(history.slice(-12));
        const countTai = results.filter(r => r === 'Tài').length;
        const countXiu = results.length - countTai;
        const imbalanceRatio = Math.abs(countTai - countXiu) / 12;
        if (imbalanceRatio > 0.4) {
            if (countTai > countXiu) {
                return { prediction: 'Xỉu', confidence: Math.min(0.7 + imbalanceRatio * 0.2, 0.95), reason: `Chênh lệch ${countTai}T-${countXiu}X` };
            } else {
                return { prediction: 'Tài', confidence: Math.min(0.7 + imbalanceRatio * 0.2, 0.95), reason: `Chênh lệch ${countTai}T-${countXiu}X` };
            }
        }
        return { prediction: results[results.length - 1], confidence: 0.5, reason: 'Cân bằng' };
    }
    
    analyzeShortTerm(history) {
        if (history.length < 3) return { prediction: null, confidence: 0, reason: 'Không đủ dữ liệu' };
        const results = this.getResultArray(history);
        const last3 = results.slice(-3);
        const patterns = [];
        if (last3[0] === last3[1] && last3[1] === last3[2]) {
            patterns.push({ type: 'bệt', prediction: last3[0], confidence: 0.75 });
        }
        if (last3[0] === last3[1] && last3[1] !== last3[2]) {
            patterns.push({ type: '2-1', prediction: last3[2], confidence: 0.7 });
        }
        if (last3[0] !== last3[1] && last3[1] === last3[2]) {
            const other = last3[2] === 'Tài' ? 'Xỉu' : 'Tài';
            patterns.push({ type: '1-2', prediction: other, confidence: 0.65 });
        }
        if (results.length >= 4) {
            const last4 = results.slice(-4);
            if (last4[0] !== last4[1] && last4[1] !== last4[2] && last4[2] !== last4[3]) {
                const other = last4[3] === 'Tài' ? 'Xỉu' : 'Tài';
                patterns.push({ type: 'xen_kẽ', prediction: other, confidence: 0.8 });
            }
        }
        if (patterns.length > 0) {
            const bestPattern = patterns.reduce((best, current) => current.confidence > best.confidence ? current : best);
            return { prediction: bestPattern.prediction, confidence: bestPattern.confidence, pattern: bestPattern.type, reason: `Pattern ${bestPattern.type}` };
        }
        return { prediction: results[results.length - 1], confidence: 0.4, reason: 'Không pattern' };
    }
    
    analyzeDiceVolatility(history) {
        if (history.length < 5) return { prediction: null, confidence: 0, reason: 'Không đủ dữ liệu' };
        const faceSequences = [];
        history.forEach(h => {
            if (h.Xuc_xac_1) faceSequences.push(h.Xuc_xac_1);
            if (h.Xuc_xac_2) faceSequences.push(h.Xuc_xac_2);
            if (h.Xuc_xac_3) faceSequences.push(h.Xuc_xac_3);
        });
        if (faceSequences.length === 0) return { prediction: null, confidence: 0, reason: 'Không có dữ liệu xúc xắc' };
        const recentFaces = [];
        const recentHistory = history.slice(-5);
        recentHistory.forEach(h => {
            if (h.Xuc_xac_1) recentFaces.push(h.Xuc_xac_1);
            if (h.Xuc_xac_2) recentFaces.push(h.Xuc_xac_2);
            if (h.Xuc_xac_3) recentFaces.push(h.Xuc_xac_3);
        });
        const recentFreq = {};
        for (let i = 1; i <= 6; i++) recentFreq[i] = 0;
        recentFaces.forEach(f => recentFreq[f]++);
        const predictions = [];
        for (let face = 1; face <= 6; face++) {
            if (recentFreq[face] < 2) {
                const prob = 0.3 + (2 - recentFreq[face]) * 0.1;
                predictions.push({ face, prob });
            }
        }
        if (predictions.length > 0) {
            predictions.sort((a, b) => b.prob - a.prob);
            const topFaces = predictions.slice(0, 3);
            if (topFaces.length >= 2) {
                const predictedScores = [];
                for (let i = 0; i < topFaces.length; i++) {
                    for (let j = 0; j < topFaces.length; j++) {
                        for (let k = 0; k < topFaces.length; k++) {
                            predictedScores.push(topFaces[i].face + topFaces[j].face + topFaces[k].face);
                        }
                    }
                }
                const avgPredicted = predictedScores.reduce((a, b) => a + b, 0) / predictedScores.length;
                const predType = avgPredicted >= 11 ? 'Tài' : 'Xỉu';
                return { prediction: predType, confidence: 0.6, reason: `Xúc xắc biến động` };
            }
        }
        return { prediction: history[history.length - 1].Ket_qua || (history[history.length - 1].score >= 11 ? 'Tài' : 'Xỉu'), confidence: 0.4, reason: 'Không biến động' };
    }
    
    // === ENSEMBLE CHÍNH ===
    ensembleModels(history) {
        const modelResults = {};
        modelResults.model1 = this.analyzeBasicPatterns(history);
        modelResults.model2 = this.analyzeTrend(history);
        modelResults.model3 = this.analyzeImbalance(history);
        modelResults.model4 = this.analyzeShortTerm(history);
        modelResults.model11 = this.analyzeDiceVolatility(history);
        for (let i = 1; i <= 42; i++) {
            const subResult = this.runSubModel(i, history);
            if (subResult && subResult.prediction) modelResults[`sub_model_${i}`] = subResult;
        }
        for (let i = 1; i <= 21; i++) {
            const miniResult = this.runMiniModel(i, history);
            if (miniResult && miniResult.prediction) modelResults[`mini_model_${i}`] = miniResult;
        }
        let taiWeight = 0, xiuWeight = 0, totalWeight = 0, details = [];
        for (let [modelName, result] of Object.entries(modelResults)) {
            if (result && result.prediction && result.confidence > 0.3) {
                let weight = 1.0;
                if (modelName.startsWith('sub')) weight = this.subModelWeights[modelName] || 1.0;
                else if (modelName.startsWith('mini')) weight = this.miniModelWeights[modelName] || 1.0;
                else weight = this.modelWeights[modelName] || 1.0;
                const weightedConfidence = weight * result.confidence;
                if (result.prediction === 'Tài') taiWeight += weightedConfidence;
                else if (result.prediction === 'Xỉu') xiuWeight += weightedConfidence;
                totalWeight += weightedConfidence;
                details.push({ model: result.model_name || modelName, prediction: result.prediction, confidence: result.confidence, weight, reason: result.reason });
            }
        }
        details.sort((a, b) => b.confidence - a.confidence);
        let finalPrediction, finalConfidence, finalReason, finalPattern, finalType;
        if (totalWeight > 0) {
            const taiRatio = taiWeight / totalWeight;
            const xiuRatio = xiuWeight / totalWeight;
            if (taiRatio > 0.55) { finalPrediction = 'Tài'; finalConfidence = taiRatio; finalReason = `${details.length} models đồng thuận Tài`; }
            else if (xiuRatio > 0.55) { finalPrediction = 'Xỉu'; finalConfidence = xiuRatio; finalReason = `${details.length} models đồng thuận Xỉu`; }
            else {
                const bestModel = details[0];
                if (bestModel) { finalPrediction = bestModel.prediction; finalConfidence = 0.5 + bestModel.confidence * 0.2; finalReason = `Dùng model ${bestModel.model}`; }
                else { finalPrediction = history[history.length - 1].Ket_qua || (history[history.length - 1].score >= 11 ? 'Tài' : 'Xỉu'); finalConfidence = 0.5; finalReason = "Không đủ tin cậy"; }
            }
        } else {
            finalPrediction = history[history.length - 1].Ket_qua || (history[history.length - 1].score >= 11 ? 'Tài' : 'Xỉu');
            finalConfidence = 0.5;
            finalReason = "Không đủ dữ liệu";
        }
        if (details.length > 0) { finalType = details[0].model; finalPattern = this.getResultArray(history.slice(-5)).join(''); }
        else { finalType = 'Không xác định'; finalPattern = ''; }
        return { prediction: finalPrediction, confidence: finalConfidence, reason: finalReason, pattern_type: finalType, pattern: finalPattern, details: details.slice(0, 5) };
    }
    
    // === UPDATE WEIGHTS ===
    updateModelWeights(actual, predicted, confidence) {
        const correct = (actual === predicted) ? 1 : 0;
        for (let modelName in this.modelWeights) {
            if (correct) this.modelWeights[modelName] = Math.min(this.modelWeights[modelName] * 1.01, 2.0);
            else this.modelWeights[modelName] = Math.max(this.modelWeights[modelName] * 0.99, 0.5);
        }
        for (let modelName in this.subModelWeights) {
            if (correct) this.subModelWeights[modelName] = Math.min(this.subModelWeights[modelName] * 1.005, 1.5);
            else this.subModelWeights[modelName] = Math.max(this.subModelWeights[modelName] * 0.995, 0.7);
        }
        for (let modelName in this.miniModelWeights) {
            if (correct) this.miniModelWeights[modelName] = Math.min(this.miniModelWeights[modelName] * 1.003, 1.3);
            else this.miniModelWeights[modelName] = Math.max(this.miniModelWeights[modelName] * 0.997, 0.8);
        }
        saveModelWeights();
    }
}

// Initialize analyzer
const analyzer = new TaiXiuAnalyzer();

// ==================== DỰ ĐOÁN DỰ PHÒNG (FALLBACK) ====================
function getFallbackPrediction() {
    // Lấy dự đoán từ backup nếu có
    if (backupPredictions.length > 0) {
        const lastBackup = backupPredictions[backupPredictions.length - 1];
        console.log(`[🔄] Dùng dự đoán dự phòng từ backup: ${lastBackup.prediction}`);
        return lastBackup;
    }
    
    // Nếu không có backup, dùng phân tích từ lịch sử
    if (resultHistory.length >= 3) {
        const historyForAnalyzer = resultHistory.map(h => ({
            score: h.Tong,
            Ket_qua: h.Ket_qua,
            Xuc_xac_1: h.Xuc_xac_1,
            Xuc_xac_2: h.Xuc_xac_2,
            Xuc_xac_3: h.Xuc_xac_3
        }));
        const ensembleResult = analyzer.ensembleModels(historyForAnalyzer);
        console.log(`[🔄] Dùng dự đoán từ lịch sử: ${ensembleResult.prediction}`);
        return {
            prediction: ensembleResult.prediction,
            confidence: ensembleResult.confidence,
            type: ensembleResult.pattern_type,
            pattern: ensembleResult.pattern,
            reason: 'Fallback từ lịch sử'
        };
    }
    
    // Fallback cuối cùng
    console.log('[🔄] Dùng fallback cuối cùng: Xỉu');
    return { prediction: 'Xỉu', confidence: 0.5, type: 'FALLBACK', pattern: '', reason: 'Fallback cuối cùng' };
}

// ==================== WEBSOCKET ====================
const WEBSOCKET_URL = "wss://websocket.azhkthg1.net/websocket?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbW91bnQiOjAsInVzZXJuYW1lIjoiU0NfYXBpc3Vnd2luMTIzIn0.eL98kER0vK0xyxmdJf7S5POO4_OmgnYDpddTQSxOUoA";
const WS_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Origin": "https://play.sun.win"
};
const RECONNECT_DELAY = 3000;
const PING_INTERVAL = 15000;
const WS_TIMEOUT = 10000;

const initialMessages = [
    [
        1,
        "MiniGame",
        "GM_apivopnha",
        "WangLin",
        {
            "info": "{\"ipAddress\":\"14.249.227.107\",\"wsToken\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJnZW5kZXIiOjAsImNhblZpZXdTdGF0IjpmYWxzZSwiZGlzcGxheU5hbWUiOiI5ODE5YW5zc3MiLCJib3QiOjAsImlzTWVyY2hhbnQiOmZhbHNlLCJ2ZXJpZmllZEJhbmtBY2NvdW50IjpmYWxzZSwicGxheUV2ZW50TG9iYnkiOmZhbHNlLCJjdXN0b21lcklkIjozMjMyODExNTEsImFmZklkIjoic3VuLndpbiIsImJhbm5lZCI6ZmFsc2UsImJyYW5kIjoiZ2VtIiwidGltZXN0YW1wIjoxNzYzMDMyOTI4NzcwLCJsb2NrR2FtZXMiOltdLCJhbW91bnQiOjAsImxvY2tDaGF0IjpmYWxzZSwicGhvbmVWZXJpZmllZCI6ZmFsc2UsImlwQWRkcmVzcyI6IjE0LjI0OS4yMjcuMTA3IiwibXV0ZSI6ZmFsc2UsImF2YXRhciI6Imh0dHBzOi8vaW1hZ2VzLnN3aW5zaG9wLm5ldC9pbWFnZXMvYXZhdGFyL2F2YXRhcl8wNS5wbmciLCJwbGF0Zm9ybUlkIjo0LCJ1c2VySWQiOiI4ODM4NTMzZS1kZTQzLTRiOGQtOTUwMy02MjFmNDA1MDUzNGUiLCJyZWdUaW1lIjoxNzYxNjMyMzAwNTc2LCJwaG9uZSI6IiIsImRlcG9zaXQiOmZhbHNlLCJ1c2VybmFtZSI6IkdNX2FwaXZvcG5oYSJ9.guH6ztJSPXUL1cU8QdMz8O1Sdy_SbxjSM-CDzWPTr-0\",\"locale\":\"vi\",\"userId\":\"8838533e-de43-4b8d-9503-621f4050534e\",\"username\":\"GM_apivopnha\",\"timestamp\":1763032928770,\"refreshToken\":\"e576b43a64e84f789548bfc7c4c8d1e5.7d4244a361e345908af95ee2e8ab2895\"}",
            "signature": "45EF4B318C883862C36E1B189A1DF5465EBB60CB602BA05FAD8FCBFCD6E0DA8CB3CE65333EDD79A2BB4ABFCE326ED5525C7D971D9DEDB5A17A72764287FFE6F62CBC2DF8A04CD8EFF8D0D5AE27046947ADE45E62E644111EFDE96A74FEC635A97861A425FF2B5732D74F41176703CA10CFEED67D0745FF15EAC1065E1C8BCBFA"
        }
    ],
    [6, "MiniGame", "taixiuPlugin", { cmd: 1005 }],
    [6, "MiniGame", "lobbyPlugin", { cmd: 10001 }]
];

let ws = null;
let pingInterval = null;
let reconnectTimeout = null;
let wsDataTimeout = null;
let lastWsMessageTime = 0;

function connectWebSocket() {
    if (ws) {
        ws.removeAllListeners();
        ws.close();
    }

    ws = new WebSocket(WEBSOCKET_URL, { headers: WS_HEADERS });
    wsConnected = false;

    ws.on('open', () => {
        console.log('[✅] WebSocket connected.');
        wsConnected = true;
        lastWsMessageTime = Date.now();
        
        initialMessages.forEach((msg, i) => {
            setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(msg));
                }
            }, i * 600);
        });

        clearInterval(pingInterval);
        pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
            }
        }, PING_INTERVAL);
        
        // Reset timeout
        clearTimeout(wsDataTimeout);
        wsDataTimeout = setTimeout(checkWebSocketData, WS_TIMEOUT);
    });

    ws.on('pong', () => {
        lastWsMessageTime = Date.now();
    });

    ws.on('message', (message) => {
        try {
            lastWsMessageTime = Date.now();
            const data = JSON.parse(message);
            if (!Array.isArray(data) || typeof data[1] !== 'object') return;
            const { cmd, sid, d1, d2, d3, gBB } = data[1];

            if (cmd === 1008 && sid) {
                currentSessionId = sid;
            }

            if (cmd === 1003 && gBB) {
                if (!d1 || !d2 || !d3) return;
                
                lastWsData = { sid, d1, d2, d3, total: d1 + d2 + d3, result: (d1 + d2 + d3 > 10) ? "Tài" : "Xỉu" };
                handleGameResult(lastWsData);
            }
        } catch (e) {
            console.error('[❌] Lỗi xử lý message:', e.message);
        }
    });

    ws.on('close', (code, reason) => {
        console.log(`[🔌] WebSocket closed. Code: ${code}, Reason: ${reason.toString()}`);
        wsConnected = false;
        clearInterval(pingInterval);
        clearTimeout(reconnectTimeout);
        clearTimeout(wsDataTimeout);
        reconnectTimeout = setTimeout(connectWebSocket, RECONNECT_DELAY);
    });

    ws.on('error', (err) => {
        console.error('[❌] WebSocket error:', err.message);
        wsConnected = false;
        ws.close();
    });
}

function checkWebSocketData() {
    if (!wsConnected) {
        console.log('[⚠️] WebSocket chưa kết nối, dùng dự đoán dự phòng...');
        useFallbackPrediction();
        return;
    }
    
    const timeSinceLastMessage = Date.now() - lastWsMessageTime;
    if (timeSinceLastMessage > WS_TIMEOUT) {
        console.log('[⚠️] Không nhận được dữ liệu từ WebSocket trong 10s, dùng dự đoán dự phòng...');
        useFallbackPrediction();
    } else {
        console.log('[✅] WebSocket đang hoạt động bình thường');
    }
    
    // Tiếp tục check
    clearTimeout(wsDataTimeout);
    wsDataTimeout = setTimeout(checkWebSocketData, WS_TIMEOUT);
}

// ==================== XỬ LÝ KẾT QUẢ ====================
function handleGameResult(wsData) {
    const { sid, d1, d2, d3, total, result } = wsData;
    
    // Kiểm tra dự đoán cũ
    let predictionCorrect = false;
    if (lastPrediction && lastPrediction.ket_qua) {
        predictionCorrect = (lastPrediction.ket_qua === result);
        stats.total++;
        if (predictionCorrect) {
            stats.correct++;
            stats.consecutiveLosses = 0;
        } else {
            stats.wrong++;
            stats.consecutiveLosses++;
        }
        analyzer.updateModelWeights(result, lastPrediction.ket_qua, lastPrediction.do_tin_cay);
    }

    // Lưu lịch sử
    const historyEntry = {
        phien: sid,
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
    saveHistory(historyEntry);

    // Dự đoán cho phiên tiếp theo
    const historyForAnalyzer = resultHistory.map(h => ({
        score: h.Tong,
        Ket_qua: h.Ket_qua,
        Xuc_xac_1: h.Xuc_xac_1,
        Xuc_xac_2: h.Xuc_xac_2,
        Xuc_xac_3: h.Xuc_xac_3
    }));

    const ensembleResult = analyzer.ensembleModels(historyForAnalyzer);
    
    let finalPrediction = ensembleResult.prediction;
    let finalConfidence = ensembleResult.confidence;
    let finalType = ensembleResult.pattern_type;
    let finalPattern = ensembleResult.pattern;
    let finalReason = ensembleResult.reason;
    
    if (stats.consecutiveLosses >= 3) {
        finalPrediction = finalPrediction === 'Tài' ? 'Xỉu' : 'Tài';
        finalConfidence = 0.4;
        finalType = 'CHỐNG ĐẢO (SAU ' + stats.consecutiveLosses + ' LẦN THUA)';
        finalPattern = '';
        finalReason = 'Chống đảo do thua liên tiếp';
    }

    // Lưu dự đoán vào backup
    const backupPred = {
        phien: sid ? parseInt(sid) + 1 : null,
        prediction: finalPrediction,
        confidence: finalConfidence,
        type: finalType,
        pattern: finalPattern,
        timestamp: new Date().toISOString()
    };
    saveBackup(backupPred);

    lastPrediction = {
        phien: sid ? parseInt(sid) + 1 : null,
        ket_qua: finalPrediction,
        loai_cau: finalType,
        mau_cau: finalPattern,
        do_tin_cay: (finalConfidence * 100).toFixed(0) + '%'
    };

    const trangThai = finalType.includes('CHỐNG') ? 'Chống đảo' :
                     (finalType.includes('THEO') ? 'Đang theo kết quả' : 'Đang theo cầu');
    const tiLe = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) + '%' : '0%';

    apiResponseData = {
        "Phien": sid,
        "Xuc_xac_1": d1,
        "Xuc_xac_2": d2,
        "Xuc_xac_3": d3,
        "Tong": total,
        "Ket_qua": result,
        "Phien_hien_tai": sid ? parseInt(sid) + 1 : null,
        "Du_doan": finalPrediction,
        "Loai_cau": finalType,
        "Mau_cau_phat_hien": finalPattern,
        "Do_tin_cay": (finalConfidence * 100).toFixed(0) + '%',
        "Trang_thai": trangThai,
        "Ket_qua_du_doan": predictionCorrect ? '✅' : (stats.total > 0 ? '❌' : ''),
        "Thong_ke": {
            "tong": stats.total,
            "dung": stats.correct,
            "sai": stats.wrong,
            "ti_le": tiLe
        },
        "id": "@nhan161019"
    };

    // Log đẹp
    console.log('\n' + '🟦'.repeat(25));
    console.log(`🎲 Phiên ${apiResponseData.Phien} | KQ: ${result}`);
    console.log(`📊 Lịch sử: ${historyForAnalyzer.slice(-12).map(h => h.Ket_qua).join(' ')}`);
    console.log(`🔍 Phát hiện: ${finalType} | Mẫu: ${finalPattern || '...'}`);
    console.log(`🤖 Dự đoán phiên ${apiResponseData.Phien_hien_tai}: ${finalPrediction} (${(finalConfidence * 100).toFixed(0)}%)`);
    console.log(`📊 ${ensembleResult.details.length} models tham gia | Top: ${ensembleResult.details.slice(0,3).map(d => d.model).join(', ')}`);
    console.log(`📈 Thống kê: Đúng ${stats.correct}/${stats.total} (${tiLe}) ${apiResponseData.Ket_qua_du_doan}`);
    if (stats.consecutiveLosses > 0) {
        console.log(`⚠️ Thua liên tiếp: ${stats.consecutiveLosses}`);
    }
    console.log('🟦'.repeat(25) + '\n');

    lastResult = result;
    currentSessionId = null;
}

// ==================== DỰ ĐOÁN DỰ PHÒNG ====================
function useFallbackPrediction() {
    const fallback = getFallbackPrediction();
    
    // Tạo dự đoán dự phòng
    const backupPred = {
        phien: currentSessionId ? parseInt(currentSessionId) + 1 : null,
        prediction: fallback.prediction,
        confidence: fallback.confidence || 0.5,
        type: fallback.type || 'FALLBACK',
        pattern: fallback.pattern || '',
        timestamp: new Date().toISOString(),
        isFallback: true
    };
    saveBackup(backupPred);
    
    lastPrediction = {
        phien: currentSessionId ? parseInt(currentSessionId) + 1 : null,
        ket_qua: fallback.prediction,
        loai_cau: fallback.type || 'FALLBACK',
        mau_cau: fallback.pattern || '',
        do_tin_cay: ((fallback.confidence || 0.5) * 100).toFixed(0) + '%'
    };
    
    // Cập nhật API với dự đoán dự phòng
    apiResponseData = {
        ...apiResponseData,
        "Phien_hien_tai": currentSessionId ? parseInt(currentSessionId) + 1 : null,
        "Du_doan": fallback.prediction,
        "Loai_cau": `FALLBACK: ${fallback.type || 'Unknown'}`,
        "Mau_cau_phat_hien": fallback.pattern || 'Dự phòng',
        "Do_tin_cay": ((fallback.confidence || 0.5) * 100).toFixed(0) + '%',
        "Trang_thai": 'DỰ PHÒNG (Không có dữ liệu WS)',
        "id": "@nhan161019"
    };
    
    console.log('\n' + '🟨'.repeat(25));
    console.log(`⚠️ DỰ ĐOÁN DỰ PHÒNG`);
    console.log(`🤖 Dự đoán: ${fallback.prediction} (${((fallback.confidence || 0.5) * 100).toFixed(0)}%)`);
    console.log(`📌 Lý do: ${fallback.reason || 'Không có dữ liệu từ WebSocket'}`);
    console.log('🟨'.repeat(25) + '\n');
}

// ==================== EXPRESS API ====================
app.get('/api/ditmemaysun', (req, res) => {
    res.json(apiResponseData);
});

app.get('/api/his', (req, res) => {
    const recent = resultHistory.slice(-20).reverse();
    res.json({
        success: true,
        total: resultHistory.length,
        data: recent,
        stats: {
            tong: stats.total,
            dung: stats.correct,
            sai: stats.wrong,
            ti_le: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) + '%' : '0%',
            consecutive_losses: stats.consecutiveLosses
        },
        ws_status: wsConnected ? '🟢 Connected' : '🔴 Disconnected'
    });
});

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
        }
    });
});

app.get('/api/backup', (req, res) => {
    res.json({
        total: backupPredictions.length,
        latest: backupPredictions.slice(-10),
        ws_status: wsConnected ? 'connected' : 'disconnected'
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        ws: {
            connected: wsConnected,
            last_message: lastWsMessageTime ? new Date(lastWsMessageTime).toISOString() : null,
            timeout: WS_TIMEOUT
        },
        history: {
            total: resultHistory.length,
            latest: resultHistory.slice(-5)
        },
        backup: {
            total: backupPredictions.length,
            latest: backupPredictions.slice(-3)
        },
        stats: {
            total: stats.total,
            correct: stats.correct,
            wrong: stats.wrong,
            rate: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) + '%' : '0%'
        }
    });
});

app.get('/', (req, res) => {
    res.json({
        name: "🎲 SUNWIN TX - SIÊU THUẬT TOÁN 84 MODELS",
        author: "@nhan161019",
        version: "3.0 - CÓ DỰ PHÒNG",
        endpoints: {
            "Dữ liệu hiện tại": "/api/ditmemaysun",
            "Lịch sử": "/api/his",
            "Models": "/api/models",
            "Backup": "/api/backup",
            "Status": "/api/status"
        },
        ws_status: wsConnected ? '🟢 Connected' : '🔴 Disconnected',
        backup_available: backupPredictions.length > 0
    });
});

// ==================== START ====================
connectWebSocket();

app.listen(PORT, () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🎲 SUNWIN TX - 84 MODELS`);
    console.log(`👤 Author: @nhan161019`);
    console.log(`🔄 Cơ chế dự phòng: BẬT`);
    console.log(`${'='.repeat(50)}`);
    console.log(`[🌐] Server: http://localhost:${PORT}`);
    console.log(`[📁] History: ${resultHistory.length} phiên`);
    console.log(`[💾] Backup: ${backupPredictions.length} dự đoán`);
    console.log(`[🔒] Deterministic: 100% KHÔNG RANDOM`);
    console.log(`[🔄] Fallback: Tự động khi WS không có dữ liệu`);
    console.log(`${'='.repeat(50)}\n`);
});
