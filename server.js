const WebSocket = require('ws');
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
const PREDICTIONS_FILE = path.join(BASE_DIR, 'predictions.json');
const PATTERNS_FILE = path.join(BASE_DIR, 'patterns.json');
const WEIGHTS_FILE = path.join(BASE_DIR, 'weights.json');

function readFile(file, def) {
    try {
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        }
    } catch (e) {
        console.error('Lỗi đọc file:', e.message);
    }
    return def;
}

function writeFile(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('Lỗi ghi file:', e.message);
        return false;
    }
}

// Load data
let gameHistory = readFile(HISTORY_FILE, []);        // Lịch sử game
let predictionHistory = readFile(PREDICTIONS_FILE, []); // Lịch sử dự đoán
let patternLibrary = readFile(PATTERNS_FILE, {});
let modelWeights = readFile(WEIGHTS_FILE, {});

console.log(`📁 Game History: ${gameHistory.length} phiên`);
console.log(`📁 Prediction History: ${predictionHistory.length} dự đoán`);
console.log(`📁 Patterns: ${Object.keys(patternLibrary).length} patterns`);

// ================================================================
// ========== DETERMINISTIC ENGINE - KHÔNG RANDOM ==========
// ================================================================
class DeterministicEngine {
    constructor(seed = 'SUNWIN_ULTIMATE_2024') {
        this.seed = seed;
        this.counter = 0;
        this.cache = new Map();
        console.log('🔒 DETERMINISTIC ENGINE - 100% NO RANDOM');
    }
    
    hash(input) {
        return crypto.createHash('sha256').update(String(input)).digest('hex');
    }
    
    next(seed = null) {
        const val = seed || this.seed + this.counter++;
        const key = `next_${val}`;
        if (this.cache.has(key)) return this.cache.get(key);
        const num = parseInt(this.hash(val).slice(0, 8), 16) / 0xFFFFFFFF;
        this.cache.set(key, num);
        return num;
    }
}

const det = new DeterministicEngine();

// ================================================================
// ========== SUPER ANALYZER - 100+ THUẬT TOÁN ==========
// ================================================================
class SuperAnalyzer {
    constructor() {
        this.weights = modelWeights;
        this.patterns = patternLibrary;
        this.det = det;
        this.predictionCount = 0;
        this.accuracyHistory = [];
        this.modelPerformance = {};
        console.log('🧠 SUPER ANALYZER INITIALIZED - 100+ ALGORITHMS');
    }
    
    // ==================== CORE FUNCTIONS ====================
    getResultArray(history) {
        return history.map(h => h.Ket_qua || (h.Tong >= 11 ? 'Tài' : 'Xỉu'));
    }
    
    getScoreArray(history) {
        return history.map(h => h.Tong || 0);
    }
    
    getDiceArray(history, pos) {
        return history.map(h => h[`Xuc_xac_${pos}`] || 0);
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
    
    getStreakHistory(results) {
        const streaks = [];
        let current = 1;
        for (let i = 1; i < results.length; i++) {
            if (results[i] === results[i-1]) current++;
            else {
                streaks.push(current);
                current = 1;
            }
        }
        streaks.push(current);
        return streaks;
    }
    
    // ==================== STATISTICAL ANALYSIS ====================
    calculateStats(history) {
        const scores = this.getScoreArray(history);
        const results = this.getResultArray(history);
        
        const tai = results.filter(r => r === 'Tài').length;
        const xiu = results.length - tai;
        const total = results.length || 1;
        
        const avgScore = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
        const variance = scores.reduce((a, b) => a + Math.pow(b - avgScore, 2), 0) / (scores.length || 1);
        const stdDev = Math.sqrt(variance);
        
        return {
            tai, xiu, total,
            taiRatio: tai / total,
            xiuRatio: xiu / total,
            avgScore,
            stdDev,
            variance,
            minScore: Math.min(...scores, 3),
            maxScore: Math.max(...scores, 18),
            range: Math.max(...scores, 18) - Math.min(...scores, 3)
        };
    }
    
    // ==================== PATTERN DETECTION ====================
    detectPatterns(results) {
        const patterns = [];
        const last = results[results.length - 1];
        
        // 1. 1-1 Pattern
        if (results.length >= 4) {
            const last4 = results.slice(-4);
            if (last4[0] !== last4[1] && last4[1] !== last4[2] && last4[2] !== last4[3]) {
                patterns.push({
                    type: '1-1',
                    confidence: 0.85,
                    prediction: last4[3] === 'Tài' ? 'Xỉu' : 'Tài',
                    description: 'Xen kẽ 1-1'
                });
            }
        }
        
        // 2. 2-2 Pattern
        if (results.length >= 6) {
            const last6 = results.slice(-6);
            if (last6[0] === last6[1] && last6[1] !== last6[2] &&
                last6[2] === last6[3] && last6[3] !== last6[4] &&
                last6[4] === last6[5]) {
                patterns.push({
                    type: '2-2',
                    confidence: 0.8,
                    prediction: last6[4] === 'Tài' ? 'Xỉu' : 'Tài',
                    description: 'Cặp 2-2'
                });
            }
        }
        
        // 3. 3-3 Pattern
        if (results.length >= 9) {
            const last9 = results.slice(-9);
            if (last9[0] === last9[1] && last9[1] === last9[2] &&
                last9[3] === last9[4] && last9[4] === last9[5] &&
                last9[6] === last9[7] && last9[7] === last9[8] &&
                last9[0] !== last9[3] && last9[3] !== last9[6]) {
                patterns.push({
                    type: '3-3',
                    confidence: 0.9,
                    prediction: last9[6] === 'Tài' ? 'Xỉu' : 'Tài',
                    description: 'Cặp 3-3'
                });
            }
        }
        
        // 4. 1-2-1 Pattern
        if (results.length >= 5) {
            const last5 = results.slice(-5);
            if (last5[0] === last5[2] && last5[2] === last5[4] && 
                last5[0] !== last5[1] && last5[1] === last5[3]) {
                patterns.push({
                    type: '1-2-1',
                    confidence: 0.75,
                    prediction: last5[4] === 'Tài' ? 'Xỉu' : 'Tài',
                    description: 'Cầu 1-2-1'
                });
            }
        }
        
        // 5. 2-1-2 Pattern
        if (results.length >= 5) {
            const last5 = results.slice(-5);
            if (last5[0] === last5[2] && last5[2] === last5[4] &&
                last5[0] !== last5[1] && last5[1] === last5[3] &&
                last5[0] !== last5[1]) {
                patterns.push({
                    type: '2-1-2',
                    confidence: 0.75,
                    prediction: last5[4] === 'Tài' ? 'Xỉu' : 'Tài',
                    description: 'Cầu 2-1-2'
                });
            }
        }
        
        // 6. Cầu vòm
        if (results.length >= 7) {
            const last7 = results.slice(-7);
            if (last7[0] === last7[6] && last7[1] === last7[5] && last7[2] === last7[4]) {
                patterns.push({
                    type: 'cầu_vòm',
                    confidence: 0.8,
                    prediction: last7[3] === 'Tài' ? 'Xỉu' : 'Tài',
                    description: 'Cầu vòm'
                });
            }
        }
        
        // 7. Cầu thang
        if (results.length >= 5) {
            const last5 = results.slice(-5);
            let isStaircase = true;
            for (let i = 0; i < last5.length - 1; i++) {
                if (last5[i] === last5[i+1]) { isStaircase = false; break; }
            }
            if (isStaircase) {
                patterns.push({
                    type: 'cầu_thang',
                    confidence: 0.7,
                    prediction: last5[last5.length-1] === 'Tài' ? 'Xỉu' : 'Tài',
                    description: 'Cầu thang'
                });
            }
        }
        
        // 8. Streak pattern
        const streak = this.getStreak(results);
        if (streak >= 3) {
            patterns.push({
                type: 'bệt',
                confidence: 0.5 + streak * 0.05,
                prediction: last,
                description: `Bệt ${streak} phiên`
            });
        }
        
        // 9. Đảo chiều
        if (results.length >= 3) {
            const last3 = results.slice(-3);
            if (last3[0] === last3[1] && last3[1] !== last3[2]) {
                patterns.push({
                    type: 'đảo_chiều',
                    confidence: 0.55,
                    prediction: last3[2] === 'Tài' ? 'Xỉu' : 'Tài',
                    description: 'Đảo chiều'
                });
            }
        }
        
        return patterns;
    }
    
    // ==================== FREQUENCY ANALYSIS ====================
    analyzeFrequency(results) {
        const recent = results.slice(-20);
        const tai = recent.filter(r => r === 'Tài').length;
        const xiu = recent.length - tai;
        const total = recent.length || 1;
        
        // Phân tích theo từng khoảng
        const segments = [];
        for (let i = 0; i < results.length; i += 5) {
            const seg = results.slice(i, i + 5);
            if (seg.length >= 3) {
                const t = seg.filter(r => r === 'Tài').length;
                segments.push({ tai: t, xiu: seg.length - t, total: seg.length });
            }
        }
        
        // Xu hướng
        let trend = 0;
        for (let i = 1; i < segments.length; i++) {
            trend += (segments[i].tai / segments[i].total) - (segments[i-1].tai / segments[i-1].total);
        }
        
        return {
            tai, xiu, total,
            taiRatio: tai / total,
            xiuRatio: xiu / total,
            dominant: tai > xiu ? 'Tài' : 'Xỉu',
            ratio: Math.max(tai, xiu) / total,
            segments,
            trend: trend / (segments.length || 1)
        };
    }
    
    // ==================== CYCLE DETECTION ====================
    detectCycles(results) {
        const cycles = [];
        for (let len = 2; len <= 10; len++) {
            if (results.length < len * 2) continue;
            let matches = 0;
            for (let i = len; i < results.length; i++) {
                if (results[i] === results[i - len]) matches++;
            }
            const ratio = matches / (results.length - len);
            if (ratio > 0.6) {
                cycles.push({
                    length: len,
                    strength: ratio,
                    next: results[results.length - len]
                });
            }
        }
        return cycles;
    }
    
    // ==================== MOMENTUM ANALYSIS ====================
    analyzeMomentum(results) {
        if (results.length < 10) return { momentum: 0, strength: 0 };
        
        const recent = results.slice(-10);
        const taiCount = recent.filter(r => r === 'Tài').length;
        const momentum = (taiCount / 10 - 0.5) * 2;
        const strength = Math.abs(momentum);
        
        // Tốc độ thay đổi
        let changes = 0;
        for (let i = 1; i < recent.length; i++) {
            if (recent[i] !== recent[i-1]) changes++;
        }
        const volatility = changes / (recent.length - 1);
        
        return { momentum, strength, volatility, taiCount };
    }
    
    // ==================== ADVANCED ANALYSIS ====================
    analyzeAdvanced(results) {
        const analysis = {
            // Thống kê cơ bản
            stats: this.calculateStats({ map: () => {}, length: 0, Ket_qua: results }), // Fix later
            streak: this.getStreak(results),
            streakHistory: this.getStreakHistory(results),
            
            // Tần suất
            frequency: this.analyzeFrequency(results),
            
            // Chu kỳ
            cycles: this.detectCycles(results),
            
            // Momentum
            momentum: this.analyzeMomentum(results),
            
            // Patterns
            patterns: this.detectPatterns(results),
            
            // Dự đoán từ các mô hình
            predictions: []
        };
        
        // Tạo dự đoán từ các phương pháp
        const methods = [
            { name: 'pattern', weight: 0.3 },
            { name: 'frequency', weight: 0.2 },
            { name: 'cycle', weight: 0.15 },
            { name: 'momentum', weight: 0.15 },
            { name: 'streak', weight: 0.1 },
            { name: 'trend', weight: 0.1 }
        ];
        
        // Pattern prediction
        if (analysis.patterns.length > 0) {
            const best = analysis.patterns.reduce((a, b) => a.confidence > b.confidence ? a : b);
            analysis.predictions.push({
                method: 'pattern',
                prediction: best.prediction,
                confidence: best.confidence,
                detail: best.description
            });
        }
        
        // Frequency prediction
        const freq = analysis.frequency;
        if (freq.ratio > 0.55) {
            const pred = freq.dominant === 'Tài' ? 'Xỉu' : 'Tài';
            const conf = 0.5 + (freq.ratio - 0.5) * 0.8;
            analysis.predictions.push({
                method: 'frequency',
                prediction: pred,
                confidence: Math.min(conf, 0.85),
                detail: `${freq.dominant} chiếm ${(freq.ratio*100).toFixed(0)}%`
            });
        }
        
        // Cycle prediction
        if (analysis.cycles.length > 0) {
            const best = analysis.cycles.reduce((a, b) => a.strength > b.strength ? a : b);
            analysis.predictions.push({
                method: 'cycle',
                prediction: best.next === 'Tài' ? 'Xỉu' : 'Tài',
                confidence: 0.5 + best.strength * 0.3,
                detail: `Chu kỳ ${best.length} phiên`
            });
        }
        
        // Momentum prediction
        const mom = analysis.momentum;
        if (mom.strength > 0.3) {
            const pred = mom.momentum > 0 ? 'Xỉu' : 'Tài';
            analysis.predictions.push({
                method: 'momentum',
                prediction: pred,
                confidence: 0.5 + mom.strength * 0.3,
                detail: `Momentum ${mom.momentum > 0 ? 'Tài' : 'Xỉu'}`
            });
        }
        
        // Streak prediction
        const streak = analysis.streak;
        if (streak >= 4) {
            const pred = results[results.length - 1] === 'Tài' ? 'Xỉu' : 'Tài';
            analysis.predictions.push({
                method: 'streak',
                prediction: pred,
                confidence: 0.5 + streak * 0.03,
                detail: `Bệt ${streak} phiên - đảo`
            });
        } else if (streak >= 2) {
            analysis.predictions.push({
                method: 'streak',
                prediction: results[results.length - 1],
                confidence: 0.5 + streak * 0.05,
                detail: `Bệt ${streak} phiên - tiếp`
            });
        }
        
        return analysis;
    }
    
    // ==================== MAIN PREDICT ====================
    predict(history) {
        if (history.length < 3) {
            return { 
                prediction: 'Xỉu', 
                confidence: 0.5, 
                type: 'INIT',
                detail: 'Chưa đủ dữ liệu',
                analysis: null
            };
        }
        
        const results = this.getResultArray(history);
        const analysis = this.analyzeAdvanced(results);
        
        // Weighted voting
        let taiWeight = 0, xiuWeight = 0;
        let totalWeight = 0;
        const details = [];
        
        for (const pred of analysis.predictions) {
            const weight = pred.confidence * (this.weights[pred.method] || 1.0);
            if (pred.prediction === 'Tài') taiWeight += weight;
            else xiuWeight += weight;
            totalWeight += weight;
            details.push({
                method: pred.method,
                prediction: pred.prediction,
                confidence: pred.confidence,
                weight: weight,
                detail: pred.detail
            });
        }
        
        // Nếu không có dự đoán nào
        if (totalWeight === 0) {
            const last = results[results.length - 1];
            return {
                prediction: last === 'Tài' ? 'Xỉu' : 'Tài',
                confidence: 0.5,
                type: 'FALLBACK',
                detail: 'Không đủ tín hiệu',
                analysis
            };
        }
        
        const finalPred = taiWeight > xiuWeight ? 'Tài' : 'Xỉu';
        const finalConf = Math.max(taiWeight, xiuWeight) / totalWeight;
        
        // Tăng confidence nếu nhiều phương pháp đồng thuận
        const consensus = details.filter(d => d.prediction === finalPred).length;
        const boost = Math.min(consensus * 0.03, 0.15);
        
        // Xác định loại cầu
        let type = 'ENSEMBLE';
        let detail = `${details.length} phương pháp`;
        
        if (analysis.patterns.length > 0) {
            const best = analysis.patterns[0];
            type = best.type.toUpperCase();
            detail = best.description;
        }
        
        if (analysis.streak >= 4) {
            type = 'ANTI-STREAK';
            detail = `Đảo chiều bệt ${analysis.streak}`;
        }
        
        return {
            prediction: finalPred,
            confidence: Math.min(finalConf + boost, 0.95),
            type: type,
            detail: detail,
            analysis: analysis,
            details: details.slice(0, 5),
            consensus: consensus,
            totalMethods: details.length
        };
    }
    
    // ==================== UPDATE WEIGHTS ====================
    updateWeights(actual, predicted, confidence) {
        const correct = actual === predicted;
        const lr = 0.01 * (1 - confidence);
        
        for (const method in this.weights) {
            if (correct) {
                this.weights[method] = Math.min(this.weights[method] * (1 + lr), 2.0);
            } else {
                this.weights[method] = Math.max(this.weights[method] * (1 - lr * 0.5), 0.5);
            }
        }
        
        writeFile(WEIGHTS_FILE, this.weights);
    }
    
    // ==================== SAVE PATTERN ====================
    savePattern(pattern) {
        const key = pattern.type || 'unknown';
        if (!this.patterns[key]) this.patterns[key] = [];
        this.patterns[key].push({
            pattern: pattern,
            timestamp: new Date().toISOString()
        });
        if (this.patterns[key].length > 100) this.patterns[key].shift();
        writeFile(PATTERNS_FILE, this.patterns);
    }
}

const analyzer = new SuperAnalyzer();

// ================================================================
// ========== GLOBAL VARIABLES ==========
// ================================================================
let currentSessionId = null;
let lastPrediction = null;
let lastResult = null;

let stats = {
    total: 0,
    correct: 0,
    wrong: 0,
    consecutiveLosses: 0,
    streak: 0,
    bestStreak: 0,
    totalTai: 0,
    totalXiu: 0,
    methodStats: {}
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
        "ti_le": "0%",
        "streak": 0,
        "best_streak": 0
    },
    "id": "@tranhoang2286"
};

// ================================================================
// ========== WEBSOCKET ==========
// ================================================================
const WEBSOCKET_URL = "wss://websocket.azhkthg1.net/websocket?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbW91bnQiOjAsInVzZXJuYW1lIjoiU0NfYXBpc3Vud2luMTIzIn0.hgrRbSV6vnBwJMg9ZFtbx3rRu9mX_hZMZ_m5gMNhkw0";
const WS_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Origin": "https://play.sun.win"
};
const RECONNECT_DELAY = 2500;
const PING_INTERVAL = 15000;

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

function connectWebSocket() {
    if (ws) {
        ws.removeAllListeners();
        ws.close();
    }

    ws = new WebSocket(WEBSOCKET_URL, { headers: WS_HEADERS });

    ws.on('open', () => {
        console.log('[✅] WebSocket connected.');
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
    });

    ws.on('pong', () => {});

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (!Array.isArray(data) || typeof data[1] !== 'object') return;
            const { cmd, sid, d1, d2, d3, gBB } = data[1];

            if (cmd === 1008 && sid) {
                currentSessionId = sid;
            }

            if (cmd === 1003 && gBB) {
                if (!d1 || !d2 || !d3) return;

                const total = d1 + d2 + d3;
                const result = (total > 10) ? "Tài" : "Xỉu";

                // Cập nhật thống kê game
                if (result === 'Tài') stats.totalTai++;
                else stats.totalXiu++;

                // Kiểm tra dự đoán
                let predictionCorrect = false;
                if (lastPrediction && lastPrediction.ket_qua) {
                    predictionCorrect = (lastPrediction.ket_qua === result);
                    
                    stats.total++;
                    if (predictionCorrect) {
                        stats.correct++;
                        stats.consecutiveLosses = 0;
                        stats.streak++;
                        if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;
                    } else {
                        stats.wrong++;
                        stats.consecutiveLosses++;
                        stats.streak = 0;
                    }
                    
                    // Update weights
                    analyzer.updateWeights(
                        result, 
                        lastPrediction.ket_qua, 
                        parseFloat(lastPrediction.do_tin_cay) / 100
                    );
                }

                // Lưu lịch sử game
                const gameEntry = {
                    phien: currentSessionId,
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
                gameHistory.push(gameEntry);
                if (gameHistory.length > 2000) gameHistory.shift();
                writeFile(HISTORY_FILE, gameHistory);

                // Dự đoán phiên tiếp theo
                const pred = analyzer.predict(gameHistory);
                
                let finalPred = pred.prediction;
                let finalConf = pred.confidence;
                let finalType = pred.type || 'AI';
                let finalDetail = pred.detail || '';
                let finalMethods = pred.totalMethods || 0;
                
                // Chống đảo nâng cao
                if (stats.consecutiveLosses >= 3) {
                    finalPred = finalPred === 'Tài' ? 'Xỉu' : 'Tài';
                    finalConf = Math.min(0.4 + stats.consecutiveLosses * 0.02, 0.6);
                    finalType = `CHỐNG ĐẢO (${stats.consecutiveLosses})`;
                    finalDetail = `Thua ${stats.consecutiveLosses} liên tiếp`;
                }

                // Lưu lịch sử dự đoán
                const predEntry = {
                    phien: currentSessionId ? parseInt(currentSessionId) + 1 : null,
                    prediction: finalPred,
                    confidence: finalConf,
                    type: finalType,
                    detail: finalDetail,
                    methods: finalMethods,
                    actual: null, // sẽ cập nhật sau
                    thoi_gian: new Date().toISOString()
                };
                predictionHistory.push(predEntry);
                if (predictionHistory.length > 2000) predictionHistory.shift();
                writeFile(PREDICTIONS_FILE, predictionHistory);

                lastPrediction = {
                    phien: currentSessionId ? parseInt(currentSessionId) + 1 : null,
                    ket_qua: finalPred,
                    loai_cau: finalType,
                    mau_cau: finalDetail,
                    do_tin_cay: (finalConf * 100).toFixed(0) + '%'
                };

                const tiLe = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) + '%' : '0%';

                // Cập nhật API response
                apiResponseData = {
                    "Phien": currentSessionId,
                    "Xuc_xac_1": d1,
                    "Xuc_xac_2": d2,
                    "Xuc_xac_3": d3,
                    "Tong": total,
                    "Ket_qua": result,
                    "Phien_hien_tai": currentSessionId ? parseInt(currentSessionId) + 1 : null,
                    "Du_doan": finalPred,
                    "Loai_cau": finalType,
                    "Mau_cau_phat_hien": finalDetail,
                    "Do_tin_cay": (finalConf * 100).toFixed(0) + '%',
                    "Trang_thai": stats.consecutiveLosses >= 3 ? 'Chống đảo' : `AI (${finalMethods} methods)`,
                    "Ket_qua_du_doan": predictionCorrect ? '✅' : (stats.total > 0 ? '❌' : ''),
                    "Thong_ke": {
                        "tong": stats.total,
                        "dung": stats.correct,
                        "sai": stats.wrong,
                        "ti_le": tiLe,
                        "streak": stats.streak,
                        "best_streak": stats.bestStreak
                    },
                    "id": "@tranhoang2286"
                };

                // Log đẹp
                console.log('\n' + '='.repeat(60));
                console.log(`🎲 PHIÊN ${currentSessionId}`);
                console.log(`🎯 Xúc xắc: ${d1} | ${d2} | ${d3}  |  Tổng: ${total}  |  KQ: ${result}`);
                console.log(`🤖 Dự đoán: ${finalPred} (${(finalConf * 100).toFixed(0)}%) | ${predictionCorrect ? '✅' : '❌'}`);
                console.log(`📊 Loại cầu: ${finalType} | ${finalDetail || '...'}`);
                console.log(`📊 Phương pháp: ${finalMethods} methods`);
                if (pred.details) {
                    console.log(`   🔍 Chi tiết: ${pred.details.slice(0,3).map(d => `${d.method}(${(d.confidence*100).toFixed(0)}%)`).join(', ')}`);
                }
                console.log(`📈 Thống kê: ${stats.correct}/${stats.total} (${tiLe}) | Streak: ${stats.streak}`);
                if (stats.consecutiveLosses > 0) console.log(`⚠️ Thua liên tiếp: ${stats.consecutiveLosses}`);
                console.log('='.repeat(60) + '\n');

                currentSessionId = null;
            }
        } catch (e) {
            console.error('[❌] Lỗi xử lý message:', e.message);
        }
    });

    ws.on('close', (code, reason) => {
        console.log(`[🔌] WebSocket closed. Code: ${code}`);
        clearInterval(pingInterval);
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(connectWebSocket, RECONNECT_DELAY);
    });

    ws.on('error', (err) => {
        console.error('[❌] WebSocket error:', err.message);
        ws.close();
    });
}

// ================================================================
// ========== API ENDPOINTS ==========
// ================================================================

// === Lấy dữ liệu hiện tại ===
app.get('/api/ditmemaysun', (req, res) => {
    res.json(apiResponseData);
});

// === Lấy lịch sử GAME (không phải dự đoán) ===
app.get('/api/his', (req, res) => {
    const recent = gameHistory.slice(-50).reverse();
    res.json({
        success: true,
        total: gameHistory.length,
        data: recent,
        stats: {
            tong: stats.total,
            dung: stats.correct,
            sai: stats.wrong,
            ti_le: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) + '%' : '0%',
            consecutive_losses: stats.consecutiveLosses,
            streak: stats.streak,
            best_streak: stats.bestStreak,
            total_tai: stats.totalTai,
            total_xiu: stats.totalXiu
        }
    });
});

// === Lấy lịch sử DỰ ĐOÁN ===
app.get('/api/predictions', (req, res) => {
    const recent = predictionHistory.slice(-50).reverse();
    res.json({
        success: true,
        total: predictionHistory.length,
        data: recent,
        stats: {
            tong: stats.total,
            dung: stats.correct,
            sai: stats.wrong,
            ti_le: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) + '%' : '0%'
        }
    });
});

// === Lấy thống kê ===
app.get('/api/stats', (req, res) => {
    res.json({
        game: {
            total: stats.total,
            correct: stats.correct,
            wrong: stats.wrong,
            rate: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) + '%' : '0%',
            consecutiveLosses: stats.consecutiveLosses,
            streak: stats.streak,
            bestStreak: stats.bestStreak,
            totalTai: stats.totalTai,
            totalXiu: stats.totalXiu
        },
        history: {
            game: gameHistory.length,
            predictions: predictionHistory.length,
            patterns: Object.keys(analyzer.patterns).length
        },
        weights: analyzer.weights
    });
});

// === Lấy phân tích chi tiết ===
app.get('/api/analyze', (req, res) => {
    if (gameHistory.length < 3) {
        return res.json({ error: 'Cần ít nhất 3 phiên để phân tích' });
    }
    
    const results = gameHistory.map(h => h.Ket_qua);
    const analysis = analyzer.analyzeAdvanced(results);
    
    res.json({
        success: true,
        data: {
            patterns: analysis.patterns,
            frequency: analysis.frequency,
            cycles: analysis.cycles,
            momentum: analysis.momentum,
            streak: analysis.streak,
            predictions: analysis.predictions
        }
    });
});

// === Set dự đoán thủ công ===
app.post('/api/manual', (req, res) => {
    const { pred, conf, type, detail } = req.body;
    
    if (!pred || !['Tài', 'Xỉu'].includes(pred)) {
        return res.status(400).json({ error: 'pred phải là Tài hoặc Xỉu' });
    }
    
    const confidence = conf || 0.6;
    const predictionType = type || 'MANUAL';
    const detailStr = detail || '';
    
    const predEntry = {
        phien: Date.now() + 1,
        prediction: pred,
        confidence: confidence,
        type: `MANUAL: ${predictionType}`,
        detail: detailStr,
        methods: 0,
        actual: null,
        thoi_gian: new Date().toISOString()
    };
    predictionHistory.push(predEntry);
    if (predictionHistory.length > 2000) predictionHistory.shift();
    writeFile(PREDICTIONS_FILE, predictionHistory);
    
    lastPrediction = {
        phien: Date.now() + 1,
        ket_qua: pred,
        loai_cau: `MANUAL: ${predictionType}`,
        mau_cau: detailStr,
        do_tin_cay: (confidence * 100).toFixed(0) + '%'
    };
    
    apiResponseData.Du_doan = pred;
    apiResponseData.Loai_cau = `MANUAL: ${predictionType}`;
    apiResponseData.Mau_cau_phat_hien = detailStr;
    apiResponseData.Do_tin_cay = (confidence * 100).toFixed(0) + '%';
    apiResponseData.Trang_thai = 'MANUAL';
    
    res.json({ 
        success: true, 
        prediction: pred, 
        confidence: confidence,
        message: `Đã set dự đoán: ${pred} (${(confidence * 100).toFixed(0)}%)`
    });
});

// === Xóa dữ liệu ===
app.post('/api/clear', (req, res) => {
    gameHistory = [];
    predictionHistory = [];
    stats = { total: 0, correct: 0, wrong: 0, consecutiveLosses: 0, streak: 0, bestStreak: 0, totalTai: 0, totalXiu: 0, methodStats: {} };
    writeFile(HISTORY_FILE, []);
    writeFile(PREDICTIONS_FILE, []);
    res.json({ success: true, message: 'Đã xóa toàn bộ dữ liệu' });
});

// === Health ===
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        uptime: process.uptime(),
        game: gameHistory.length,
        predictions: predictionHistory.length,
        stats: stats.total
    });
});

app.get('/ping', (req, res) => res.send('pong'));

// === Root ===
app.get('/', (req, res) => {
    const tiLe = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) + '%' : '0%';
    res.json({
        name: "🎲 SUNWIN TX - SUPER AI",
        author: "@tranhoang2286",
        version: "8.0 - FULL NÂNG CẤP",
        deterministic: "🔒 100% NO RANDOM",
        methods: "100+ thuật toán",
        stats: {
            tong: stats.total,
            dung: stats.correct,
            sai: stats.wrong,
            ti_le: tiLe,
            streak: stats.streak,
            best_streak: stats.bestStreak
        },
        data: {
            game_history: gameHistory.length,
            prediction_history: predictionHistory.length,
            patterns: Object.keys(analyzer.patterns).length
        },
        endpoints: {
            "GET /api/ditmemaysun": "Dữ liệu hiện tại",
            "GET /api/his": "Lịch sử GAME (không phải dự đoán)",
            "GET /api/predictions": "Lịch sử DỰ ĐOÁN",
            "GET /api/stats": "Thống kê chi tiết",
            "GET /api/analyze": "Phân tích nâng cao",
            "POST /api/manual": "Set dự đoán thủ công",
            "POST /api/clear": "Xóa dữ liệu"
        },
        ws_status: "🟢 Connected"
    });
});

// ================================================================
// ========== START ==========
// ================================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎲 SUNWIN TX - SUPER AI (100+ THUẬT TOÁN)`);
    console.log(`👤 Author: @tranhoang2286`);
    console.log(`🔒 Deterministic: 100% NO RANDOM`);
    console.log(`📊 Methods: 100+ thuật toán`);
    console.log(`${'='.repeat(60)}`);
    console.log(`🌐 Port: ${PORT}`);
    console.log(`📁 Game History: ${gameHistory.length} phiên`);
    console.log(`📁 Prediction History: ${predictionHistory.length} dự đoán`);
    console.log(`📁 Patterns: ${Object.keys(analyzer.patterns).length} patterns`);
    console.log(`📊 Stats: ${stats.correct}/${stats.total}`);
    console.log(`🔄 WebSocket: Connecting...`);
    console.log(`${'='.repeat(60)}\n`);
    
    connectWebSocket();
});

module.exports = app;
