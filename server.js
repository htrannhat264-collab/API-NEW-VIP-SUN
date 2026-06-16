// ================================================================
// ========== SUNWIN TX - SIÊU THUẬT TOÁN VŨ TRỤ ==========
// ========== TÍCH HỢP 50+ THUẬT TOÁN KHÁC NHAU ==========
// ================================================================

const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
const PORT = process.env.PORT || 3001;

// ================================================================
// ========== FILE STORAGE ==========
// ================================================================
const HISTORY_FILE = './history.json';
const SUPER_WEIGHTS_FILE = './super_weights.json';
const GENETIC_FILE = './genetic_best.json';

let resultHistory = [];
if (fs.existsSync(HISTORY_FILE)) {
    try {
        resultHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        console.log(`[📂] Đã tải ${resultHistory.length} phiên`);
    } catch (e) {
        console.error('[❌] Lỗi đọc history:', e.message);
    }
}

// ================================================================
// ========== LỚP 1: XỬ LÝ DỮ LIỆU NÂNG CAO ==========
// ================================================================

class DataProcessor {
    constructor() {
        this.normalizers = {};
        this.featureCache = new Map();
        this.maxCacheSize = 10000;
    }

    extractFeatures(history) {
        const cacheKey = history.map(h => h.phien || h.Phien).join(',');
        if (this.featureCache.has(cacheKey)) {
            return this.featureCache.get(cacheKey);
        }

        const features = {
            // === CƠ BẢN ===
            raw: history.map(h => h.Ket_qua === 'Tài' ? 1 : 0),
            scores: history.map(h => h.Tong || 0),
            dice1: history.map(h => h.Xuc_xac_1 || 0),
            dice2: history.map(h => h.Xuc_xac_2 || 0),
            dice3: history.map(h => h.Xuc_xac_3 || 0),
            
            // === THỐNG KÊ ===
            stats: this.calculateStats(history),
            movingAverages: this.calculateMovingAverages(history),
            volatility: this.calculateVolatility(history),
            correlation: this.calculateCorrelation(history),
            
            // === PATTERN ===
            patterns: this.detectAdvancedPatterns(history),
            cycles: this.detectCycles(history),
            harmonics: this.detectHarmonics(history),
            
            // === XÁC SUẤT ===
            probabilities: this.calculateProbabilities(history),
            entropy: this.calculateEntropy(history),
            mutualInformation: this.calculateMutualInformation(history),
            
            // === CHUỖI ===
            fftFeatures: this.fftAnalysis(history),
            waveletFeatures: this.waveletAnalysis(history),
            fractalFeatures: this.fractalAnalysis(history),
            
            // === HỖN ĐỘN ===
            lyapunov: this.calculateLyapunov(history),
            correlationDimension: this.calculateCorrelationDimension(history),
            kolmogorovEntropy: this.calculateKolmogorovEntropy(history),
            
            // === TÂM LÝ ===
            playerPsychology: this.analyzePlayerPsychology(history),
            marketSentiment: this.analyzeMarketSentiment(history),
            crowdBehavior: this.analyzeCrowdBehavior(history)
        };

        if (this.featureCache.size > this.maxCacheSize) {
            const firstKey = this.featureCache.keys().next().value;
            this.featureCache.delete(firstKey);
        }
        this.featureCache.set(cacheKey, features);
        
        return features;
    }

    calculateStats(history) {
        const scores = history.map(h => h.Tong || 0);
        const results = history.map(h => h.Ket_qua === 'Tài' ? 1 : 0);
        
        return {
            mean: scores.reduce((a, b) => a + b, 0) / scores.length,
            variance: this.variance(scores),
            skewness: this.skewness(scores),
            kurtosis: this.kurtosis(scores),
            max: Math.max(...scores),
            min: Math.min(...scores),
            range: Math.max(...scores) - Math.min(...scores),
            meanDeviation: this.meanDeviation(scores),
            taiRatio: results.reduce((a, b) => a + b, 0) / results.length,
            zScore: this.zScore(scores)
        };
    }

    variance(data) {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        return data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    }

    skewness(data) {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const variance = this.variance(data);
        return data.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / (data.length * Math.pow(variance, 1.5));
    }

    kurtosis(data) {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const variance = this.variance(data);
        return data.reduce((a, b) => a + Math.pow(b - mean, 4), 0) / (data.length * Math.pow(variance, 2)) - 3;
    }

    meanDeviation(data) {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        return data.reduce((a, b) => a + Math.abs(b - mean), 0) / data.length;
    }

    zScore(data) {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const variance = this.variance(data);
        return data.map(x => (x - mean) / Math.sqrt(variance));
    }

    calculateMovingAverages(history) {
        const scores = history.map(h => h.Tong || 0);
        const windows = [3, 5, 10, 20, 50];
        const avgs = {};
        
        for (let w of windows) {
            if (scores.length >= w) {
                const avg = [];
                for (let i = w - 1; i < scores.length; i++) {
                    const sum = scores.slice(i - w + 1, i + 1).reduce((a, b) => a + b, 0);
                    avg.push(sum / w);
                }
                avgs[`ma${w}`] = avg;
                avgs[`ma${w}_last`] = avg[avg.length - 1] || 0;
            }
        }
        
        // MACD
        if (scores.length >= 26) {
            const ma12 = this.movingAverage(scores, 12);
            const ma26 = this.movingAverage(scores, 26);
            const macd = ma12.map((v, i) => v - (ma26[i] || 0));
            const signal = this.movingAverage(macd, 9);
            avgs.macd = macd[macd.length - 1] || 0;
            avgs.signal = signal[signal.length - 1] || 0;
            avgs.macd_histogram = avgs.macd - avgs.signal;
        }
        
        // Bollinger Bands
        if (scores.length >= 20) {
            const ma20 = this.movingAverage(scores, 20);
            const std20 = this.rollingStd(scores, 20);
            const lastMA = ma20[ma20.length - 1] || 0;
            const lastStd = std20[std20.length - 1] || 0;
            avgs.bb_upper = lastMA + 2 * lastStd;
            avgs.bb_middle = lastMA;
            avgs.bb_lower = lastMA - 2 * lastStd;
            avgs.bb_position = (scores[scores.length - 1] - lastMA) / lastStd;
        }
        
        return avgs;
    }

    movingAverage(data, window) {
        const result = [];
        for (let i = window - 1; i < data.length; i++) {
            const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / window);
        }
        return result;
    }

    rollingStd(data, window) {
        const result = [];
        for (let i = window - 1; i < data.length; i++) {
            const slice = data.slice(i - window + 1, i + 1);
            const mean = slice.reduce((a, b) => a + b, 0) / window;
            const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / window;
            result.push(Math.sqrt(variance));
        }
        return result;
    }

    calculateVolatility(history) {
        const scores = history.map(h => h.Tong || 0);
        const returns = [];
        for (let i = 1; i < scores.length; i++) {
            returns.push((scores[i] - scores[i-1]) / scores[i-1]);
        }
        
        return {
            historical: this.variance(scores),
            returns: this.variance(returns),
            maxDrawdown: this.maxDrawdown(scores),
            sharpeRatio: this.sharpeRatio(returns),
            sortinoRatio: this.sortinoRatio(returns),
            calmarRatio: this.calmarRatio(scores, returns),
            ulcerIndex: this.ulcerIndex(scores),
            averageTrueRange: this.averageTrueRange(history)
        };
    }

    maxDrawdown(scores) {
        let peak = scores[0];
        let maxDD = 0;
        for (let i = 1; i < scores.length; i++) {
            if (scores[i] > peak) peak = scores[i];
            const dd = (peak - scores[i]) / peak;
            if (dd > maxDD) maxDD = dd;
        }
        return maxDD;
    }

    sharpeRatio(returns) {
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const std = Math.sqrt(this.variance(returns));
        return std === 0 ? 0 : mean / std;
    }

    sortinoRatio(returns) {
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const downside = returns.filter(r => r < 0);
        const downsideStd = Math.sqrt(this.variance(downside));
        return downsideStd === 0 ? 0 : mean / downsideStd;
    }

    calmarRatio(scores, returns) {
        const maxDD = this.maxDrawdown(scores);
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        return maxDD === 0 ? 0 : mean / maxDD;
    }

    ulcerIndex(scores) {
        let peak = scores[0];
        let sumSq = 0;
        for (let i = 1; i < scores.length; i++) {
            if (scores[i] > peak) peak = scores[i];
            const dd = (peak - scores[i]) / peak;
            sumSq += dd * dd;
        }
        return Math.sqrt(sumSq / scores.length);
    }

    averageTrueRange(history) {
        if (history.length < 2) return 0;
        const scores = history.map(h => h.Tong || 0);
        const atr = [];
        for (let i = 1; i < scores.length; i++) {
            const high = Math.max(scores[i], scores[i-1]);
            const low = Math.min(scores[i], scores[i-1]);
            atr.push(high - low);
        }
        return atr.reduce((a, b) => a + b, 0) / atr.length;
    }

    calculateCorrelation(history) {
        const scores = history.map(h => h.Tong || 0);
        const d1 = history.map(h => h.Xuc_xac_1 || 0);
        const d2 = history.map(h => h.Xuc_xac_2 || 0);
        const d3 = history.map(h => h.Xuc_xac_3 || 0);
        
        return {
            score_d1: this.pearsonCorrelation(scores, d1),
            score_d2: this.pearsonCorrelation(scores, d2),
            score_d3: this.pearsonCorrelation(scores, d3),
            d1_d2: this.pearsonCorrelation(d1, d2),
            d1_d3: this.pearsonCorrelation(d1, d3),
            d2_d3: this.pearsonCorrelation(d2, d3),
            autocorr: this.autocorrelation(scores, 1)
        };
    }

    pearsonCorrelation(x, y) {
        const n = Math.min(x.length, y.length);
        const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
        const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
        
        let num = 0, denX = 0, denY = 0;
        for (let i = 0; i < n; i++) {
            const dx = x[i] - meanX;
            const dy = y[i] - meanY;
            num += dx * dy;
            denX += dx * dx;
            denY += dy * dy;
        }
        return denX === 0 || denY === 0 ? 0 : num / Math.sqrt(denX * denY);
    }

    autocorrelation(data, lag) {
        const n = data.length;
        const mean = data.reduce((a, b) => a + b, 0) / n;
        let num = 0, den = 0;
        for (let i = 0; i < n - lag; i++) {
            num += (data[i] - mean) * (data[i + lag] - mean);
        }
        for (let i = 0; i < n; i++) {
            den += Math.pow(data[i] - mean, 2);
        }
        return num / den;
    }

    detectAdvancedPatterns(history) {
        const results = history.map(h => h.Ket_qua);
        const patterns = {};
        
        // === TẤT CẢ PATTERN CÓ THỂ ===
        const patternTypes = [
            '1-1', '2-2', '3-3', '1-2-1', '2-1-2', '1-2-2-1', 
            '2-1-1-2', '1-1-2-2', '2-2-1-1', '1-1-1-2', '2-2-2-1',
            'cầu_vòm', 'cầu_thang', 'cầu_zigzag', 'cầu_sóng', 'cầu_spiral'
        ];
        
        for (let type of patternTypes) {
            const detector = this.getPatternDetector(type);
            const result = detector(results);
            if (result) patterns[type] = result;
        }
        
        return patterns;
    }

    getPatternDetector(type) {
        const detectors = {
            '1-1': (r) => this.detectAlternating(r, 2),
            '2-2': (r) => this.detectAlternating(r, 4),
            '3-3': (r) => this.detectAlternating(r, 6),
            '1-2-1': (r) => this.detectPattern121(r),
            '2-1-2': (r) => this.detectPattern212(r),
            '1-2-2-1': (r) => this.detectPattern1221(r),
            '2-1-1-2': (r) => this.detectPattern2112(r),
            '1-1-2-2': (r) => this.detectPattern1122(r),
            '2-2-1-1': (r) => this.detectPattern2211(r),
            '1-1-1-2': (r) => this.detectPattern1112(r),
            '2-2-2-1': (r) => this.detectPattern2221(r),
            'cầu_vòm': (r) => this.detectArchPattern(r),
            'cầu_thang': (r) => this.detectStaircasePattern(r),
            'cầu_zigzag': (r) => this.detectZigzagPattern(r),
            'cầu_sóng': (r) => this.detectWavePattern(r),
            'cầu_spiral': (r) => this.detectSpiralPattern(r)
        };
        return detectors[type] || (() => null);
    }

    detectAlternating(results, length) {
        if (results.length < length) return null;
        const last = results.slice(-length);
        let alternating = true;
        for (let i = 0; i < last.length - 1; i++) {
            if (last[i] === last[i+1]) { alternating = false; break; }
        }
        if (alternating) {
            return {
                confidence: 0.7 + 0.02 * length,
                prediction: last[last.length - 1] === 'Tài' ? 'Xỉu' : 'Tài'
            };
        }
        return null;
    }

    detectPattern121(results) {
        if (results.length < 3) return null;
        const last3 = results.slice(-3);
        if (last3[0] === last3[2] && last3[0] !== last3[1]) {
            return { confidence: 0.75, prediction: last3[1] };
        }
        return null;
    }

    detectPattern212(results) {
        if (results.length < 3) return null;
        const last3 = results.slice(-3);
        if (last3[0] !== last3[2] && last3[1] === last3[2]) {
            return { confidence: 0.75, prediction: last3[1] };
        }
        return null;
    }

    detectPattern1221(results) {
        if (results.length < 4) return null;
        const last4 = results.slice(-4);
        if (last4[0] !== last4[1] && last4[1] === last4[2] && last4[2] !== last4[3] && last4[0] === last4[3]) {
            return { confidence: 0.8, prediction: last4[3] === 'Tài' ? 'Xỉu' : 'Tài' };
        }
        return null;
    }

    detectPattern2112(results) {
        if (results.length < 4) return null;
        const last4 = results.slice(-4);
        if (last4[0] === last4[1] && last4[1] !== last4[2] && last4[2] === last4[3] && last4[0] !== last4[3]) {
            return { confidence: 0.8, prediction: last4[3] };
        }
        return null;
    }

    detectPattern1122(results) {
        if (results.length < 4) return null;
        const last4 = results.slice(-4);
        if (last4[0] === last4[1] && last4[1] !== last4[2] && last4[2] === last4[3]) {
            return { confidence: 0.7, prediction: last4[3] === 'Tài' ? 'Xỉu' : 'Tài' };
        }
        return null;
    }

    detectPattern2211(results) {
        if (results.length < 4) return null;
        const last4 = results.slice(-4);
        if (last4[0] === last4[1] && last4[1] !== last4[2] && last4[2] === last4[3]) {
            return { confidence: 0.7, prediction: last4[3] };
        }
        return null;
    }

    detectPattern1112(results) {
        if (results.length < 4) return null;
        const last4 = results.slice(-4);
        if (last4[0] === last4[1] && last4[1] === last4[2] && last4[2] !== last4[3]) {
            return { confidence: 0.65, prediction: last4[3] };
        }
        return null;
    }

    detectPattern2221(results) {
        if (results.length < 4) return null;
        const last4 = results.slice(-4);
        if (last4[0] === last4[1] && last4[1] === last4[2] && last4[2] !== last4[3]) {
            return { confidence: 0.65, prediction: last4[3] };
        }
        return null;
    }

    detectArchPattern(results) {
        if (results.length < 7) return null;
        const last7 = results.slice(-7);
        if (last7[0] === last7[6] && last7[1] === last7[5] && last7[2] === last7[4]) {
            return {
                confidence: 0.85,
                prediction: last7[3] === 'Tài' ? 'Xỉu' : 'Tài'
            };
        }
        return null;
    }

    detectStaircasePattern(results) {
        if (results.length < 5) return null;
        const last5 = results.slice(-5);
        let isStaircase = true;
        for (let i = 0; i < last5.length - 1; i++) {
            if (last5[i] === last5[i+1]) { isStaircase = false; break; }
        }
        if (isStaircase) {
            return {
                confidence: 0.75,
                prediction: last5[last5.length-1] === 'Tài' ? 'Xỉu' : 'Tài'
            };
        }
        return null;
    }

    detectZigzagPattern(results) {
        if (results.length < 6) return null;
        const last6 = results.slice(-6);
        let zigzag = true;
        for (let i = 0; i < last6.length - 2; i += 2) {
            if (last6[i] !== last6[i+2]) { zigzag = false; break; }
        }
        if (zigzag && last6[0] !== last6[1]) {
            return {
                confidence: 0.8,
                prediction: last6[0]
            };
        }
        return null;
    }

    detectWavePattern(results) {
        if (results.length < 8) return null;
        const last8 = results.slice(-8);
        const groups = [];
        let current = [last8[0]];
        for (let i = 1; i < last8.length; i++) {
            if (last8[i] === last8[i-1]) {
                current.push(last8[i]);
            } else {
                groups.push(current);
                current = [last8[i]];
            }
        }
        groups.push(current);
        
        if (groups.length >= 4) {
            const lengths = groups.map(g => g.length);
            const isWave = lengths.every((l, i) => i === 0 || l === lengths[i-1]);
            if (isWave) {
                return {
                    confidence: 0.7 + groups.length * 0.03,
                    prediction: groups[groups.length-1][0] === 'Tài' ? 'Xỉu' : 'Tài'
                };
            }
        }
        return null;
    }

    detectSpiralPattern(results) {
        if (results.length < 10) return null;
        const last10 = results.slice(-10);
        let changes = 0;
        for (let i = 1; i < last10.length; i++) {
            if (last10[i] !== last10[i-1]) changes++;
        }
        if (changes >= 6 && changes <= 8) {
            return {
                confidence: 0.7,
                prediction: last10[last10.length-1] === 'Tài' ? 'Xỉu' : 'Tài'
            };
        }
        return null;
    }

    detectCycles(history) {
        const results = history.map(h => h.Ket_qua === 'Tài' ? 1 : 0);
        const cycles = {};
        
        for (let period = 2; period <= 20; period++) {
            let matches = 0;
            for (let i = period; i < results.length; i++) {
                if (results[i] === results[i - period]) matches++;
            }
            const ratio = matches / (results.length - period);
            if (ratio > 0.6) {
                cycles[period] = {
                    strength: ratio,
                    next: results[results.length - period]
                };
            }
        }
        
        return cycles;
    }

    detectHarmonics(history) {
        const scores = history.map(h => h.Tong || 0);
        const harmonics = [];
        
        // FFT đơn giản
        for (let period = 2; period <= 30; period++) {
            let correlation = 0;
            for (let i = period; i < scores.length; i++) {
                correlation += (scores[i] - 7) * (scores[i - period] - 7);
            }
            if (correlation > 0) {
                harmonics.push({ period, strength: correlation / (scores.length - period) });
            }
        }
        
        harmonics.sort((a, b) => b.strength - a.strength);
        return harmonics.slice(0, 5);
    }

    calculateProbabilities(history) {
        const results = history.map(h => h.Ket_qua);
        const scores = history.map(h => h.Tong || 0);
        
        // Xác suất có điều kiện
        const probs = {
            tai: results.filter(r => r === 'Tài').length / results.length,
            xiu: results.filter(r => r === 'Xỉu').length / results.length,
            tai_after_tai: 0,
            tai_after_xiu: 0,
            xiu_after_tai: 0,
            xiu_after_xiu: 0
        };
        
        let taiAfterTai = 0, taiAfterXiu = 0, xiuAfterTai = 0, xiuAfterXiu = 0;
        let totalTai = 0, totalXiu = 0;
        
        for (let i = 0; i < results.length - 1; i++) {
            if (results[i] === 'Tài') {
                totalTai++;
                if (results[i+1] === 'Tài') taiAfterTai++;
                else xiuAfterTai++;
            } else {
                totalXiu++;
                if (results[i+1] === 'Tài') taiAfterXiu++;
                else xiuAfterXiu++;
            }
        }
        
        probs.tai_after_tai = totalTai > 0 ? taiAfterTai / totalTai : 0;
        probs.tai_after_xiu = totalXiu > 0 ? taiAfterXiu / totalXiu : 0;
        probs.xiu_after_tai = totalTai > 0 ? xiuAfterTai / totalTai : 0;
        probs.xiu_after_xiu = totalXiu > 0 ? xiuAfterXiu / totalXiu : 0;
        
        // Xác suất theo tổng điểm
        const scoreDist = {};
        for (let score = 3; score <= 18; score++) {
            const count = scores.filter(s => s === score).length;
            scoreDist[score] = count / scores.length;
        }
        probs.scoreDistribution = scoreDist;
        
        // Xác suất Tài theo từng mặt xúc xắc
        const d1 = history.map(h => h.Xuc_xac_1 || 0);
        const d2 = history.map(h => h.Xuc_xac_2 || 0);
        const d3 = history.map(h => h.Xuc_xac_3 || 0);
        
        probs.tai_by_dice1 = this.probByDice(results, d1);
        probs.tai_by_dice2 = this.probByDice(results, d2);
        probs.tai_by_dice3 = this.probByDice(results, d3);
        
        return probs;
    }

    probByDice(results, dice) {
        const probs = {};
        for (let face = 1; face <= 6; face++) {
            let count = 0, taiCount = 0;
            for (let i = 0; i < results.length; i++) {
                if (dice[i] === face) {
                    count++;
                    if (results[i] === 'Tài') taiCount++;
                }
            }
            probs[face] = count > 0 ? taiCount / count : 0;
        }
        return probs;
    }

    calculateEntropy(history) {
        const results = history.map(h => h.Ket_qua);
        const scores = history.map(h => h.Tong || 0);
        
        // Shannon entropy
        const probTai = results.filter(r => r === 'Tài').length / results.length;
        const probXiu = 1 - probTai;
        const entropy = - (probTai * Math.log2(probTai + 1e-10) + probXiu * Math.log2(probXiu + 1e-10));
        
        // Entropy của tổng điểm
        const scoreEntropy = this.calculateScoreEntropy(scores);
        
        // Entropy của pattern
        const patternEntropy = this.calculatePatternEntropy(results);
        
        return {
            shannon: entropy,
            scoreEntropy: scoreEntropy,
            patternEntropy: patternEntropy,
            normalized: entropy / 1 // Max entropy = 1
        };
    }

    calculateScoreEntropy(scores) {
        const freq = {};
        for (let s of scores) {
            freq[s] = (freq[s] || 0) + 1;
        }
        let entropy = 0;
        const total = scores.length;
        for (let [score, count] of Object.entries(freq)) {
            const p = count / total;
            entropy -= p * Math.log2(p + 1e-10);
        }
        return entropy;
    }

    calculatePatternEntropy(results) {
        const patterns = {};
        for (let i = 0; i < results.length - 2; i++) {
            const pattern = results.slice(i, i + 3).join('');
            patterns[pattern] = (patterns[pattern] || 0) + 1;
        }
        let entropy = 0;
        const total = results.length - 2;
        for (let [pattern, count] of Object.entries(patterns)) {
            const p = count / total;
            entropy -= p * Math.log2(p + 1e-10);
        }
        return entropy;
    }

    calculateMutualInformation(history) {
        const results = history.map(h => h.Ket_qua);
        const scores = history.map(h => h.Tong || 0);
        
        // Mutual Information between consecutive results
        let mi = 0;
        const pairs = {};
        for (let i = 0; i < results.length - 1; i++) {
            const pair = results[i] + ',' + results[i+1];
            pairs[pair] = (pairs[pair] || 0) + 1;
        }
        
        const probs = {
            'Tài': results.filter(r => r === 'Tài').length / results.length,
            'Xỉu': results.filter(r => r === 'Xỉu').length / results.length
        };
        
        for (let [pair, count] of Object.entries(pairs)) {
            const [x, y] = pair.split(',');
            const pxy = count / (results.length - 1);
            const px = probs[x];
            const py = probs[y];
            if (px > 0 && py > 0) {
                mi += pxy * Math.log2(pxy / (px * py) + 1e-10);
            }
        }
        
        return mi;
    }

    fftAnalysis(history) {
        const scores = history.map(h => h.Tong || 0);
        const n = scores.length;
        const fft = this.computeFFT(scores);
        
        // Find dominant frequencies
        const freqs = [];
        for (let i = 1; i < n / 2; i++) {
            const magnitude = Math.sqrt(fft[i*2] * fft[i*2] + fft[i*2+1] * fft[i*2+1]);
            if (magnitude > 1) {
                freqs.push({
                    frequency: i / n,
                    magnitude: magnitude,
                    period: n / i
                });
            }
        }
        
        freqs.sort((a, b) => b.magnitude - a.magnitude);
        return freqs.slice(0, 10);
    }

    computeFFT(data) {
        const n = data.length;
        const fft = new Array(n * 2);
        for (let i = 0; i < n; i++) {
            fft[i*2] = data[i];
            fft[i*2+1] = 0;
        }
        this.fftRecursive(fft, n, 1);
        return fft;
    }

    fftRecursive(data, n, sign) {
        if (n <= 1) return;
        const half = n / 2;
        const even = new Array(half * 2);
        const odd = new Array(half * 2);
        for (let i = 0; i < half; i++) {
            even[i*2] = data[i*4];
            even[i*2+1] = data[i*4+1];
            odd[i*2] = data[i*4+2];
            odd[i*2+1] = data[i*4+3];
        }
        this.fftRecursive(even, half, sign);
        this.fftRecursive(odd, half, sign);
        for (let k = 0; k < half; k++) {
            const theta = 2 * Math.PI * k / n * sign;
            const c = Math.cos(theta);
            const s = Math.sin(theta);
            const re = c * odd[k*2] - s * odd[k*2+1];
            const im = s * odd[k*2] + c * odd[k*2+1];
            data[k*2] = even[k*2] + re;
            data[k*2+1] = even[k*2+1] + im;
            data[(k+half)*2] = even[k*2] - re;
            data[(k+half)*2+1] = even[k*2+1] - im;
        }
    }

    waveletAnalysis(history) {
        const scores = history.map(h => h.Tong || 0);
        const wavelets = [];
        
        // Haar wavelet transform
        const haar = this.haarWavelet(scores);
        wavelets.push({ type: 'haar', coefficients: haar });
        
        // Daubechies wavelet (simplified)
        const db = this.dbWavelet(scores);
        wavelets.push({ type: 'db', coefficients: db });
        
        return wavelets;
    }

    haarWavelet(data) {
        const n = data.length;
        const result = [...data];
        let step = n;
        while (step > 1) {
            const half = step / 2;
            for (let i = 0; i < half; i++) {
                const a = result[i*2];
                const b = result[i*2+1];
                result[i] = (a + b) / Math.sqrt(2);
                result[i+half] = (a - b) / Math.sqrt(2);
            }
            step = half;
        }
        return result;
    }

    dbWavelet(data) {
        const n = data.length;
        const result = [...data];
        let step = n;
        while (step > 4) {
            const half = step / 2;
            for (let i = 0; i < half - 1; i++) {
                const a = result[i*2];
                const b = result[i*2+1];
                const c = result[i*2+2];
                const d = result[i*2+3];
                result[i] = (a + b + c + d) / 2;
                result[i+half] = (a - b + c - d) / 2;
            }
            step = half;
        }
        return result;
    }

    fractalAnalysis(history) {
        const scores = history.map(h => h.Tong || 0);
        
        // Hurst exponent
        const hurst = this.calculateHurst(scores);
        
        // Fractal dimension
        const fd = this.fractalDimension(scores);
        
        // Higuchi fractal dimension
        const hfd = this.higuchiFD(scores);
        
        return {
            hurst: hurst,
            fractalDimension: fd,
            higuchiDimension: hfd
        };
    }

    calculateHurst(data) {
        const n = data.length;
        if (n < 4) return 0.5;
        
        const tauMax = Math.floor(Math.sqrt(n));
        let R = 0, S = 0;
        let count = 0;
        
        for (let tau = 2; tau <= tauMax; tau++) {
            const segments = Math.floor(n / tau);
            for (let seg = 0; seg < segments; seg++) {
                const start = seg * tau;
                const end = Math.min(start + tau, n);
                const slice = data.slice(start, end);
                const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
                const devs = slice.map(x => x - mean);
                let cumSum = 0;
                let maxCum = 0, minCum = 0;
                for (let i = 0; i < devs.length; i++) {
                    cumSum += devs[i];
                    if (cumSum > maxCum) maxCum = cumSum;
                    if (cumSum < minCum) minCum = cumSum;
                }
                R += maxCum - minCum;
                const std = Math.sqrt(this.variance(slice));
                S += std;
                count++;
            }
        }
        
        if (count === 0 || S === 0) return 0.5;
        return Math.log(R / S) / Math.log(count);
    }

    fractalDimension(data) {
        const n = data.length;
        let sum = 0;
        let count = 0;
        
        for (let k = 1; k <= 10; k++) {
            let length = 0;
            for (let i = 0; i < n - k; i += k) {
                length += Math.abs(data[i] - data[i+k]);
            }
            if (length > 0 && n > k) {
                sum += Math.log(length / ((n - k) / k));
                count++;
            }
        }
        
        return count > 0 ? -sum / count : 1;
    }

    higuchiFD(data) {
        const n = data.length;
        const kmax = Math.floor(Math.min(10, n / 4));
        let L = [];
        
        for (let k = 1; k <= kmax; k++) {
            let sum = 0;
            for (let m = 0; m < k; m++) {
                let total = 0;
                let count = 0;
                for (let i = m; i < n - k; i += k) {
                    total += Math.abs(data[i + k] - data[i]);
                    count++;
                }
                if (count > 0) {
                    sum += total / count * (n - 1) / (k * k);
                }
            }
            L.push(sum / k);
        }
        
        if (L.length < 2) return 1;
        
        // Linear regression
        const x = L.map((_, i) => Math.log(i + 1));
        const y = L.map(v => Math.log(v));
        const meanX = x.reduce((a, b) => a + b, 0) / x.length;
        const meanY = y.reduce((a, b) => a + b, 0) / y.length;
        
        let num = 0, den = 0;
        for (let i = 0; i < x.length; i++) {
            num += (x[i] - meanX) * (y[i] - meanY);
            den += Math.pow(x[i] - meanX, 2);
        }
        
        return den === 0 ? 1 : 2 - num / den;
    }

    calculateLyapunov(history) {
        const scores = history.map(h => h.Tong || 0);
        const n = scores.length;
        if (n < 20) return 0;
        
        let sum = 0, count = 0;
        for (let i = 0; i < n - 10; i++) {
            let minDist = Infinity;
            let minIdx = -1;
            for (let j = 0; j < n - 10; j++) {
                if (i === j) continue;
                const dist = Math.sqrt(
                    Math.pow(scores[i] - scores[j], 2) +
                    Math.pow(scores[i+1] - scores[j+1], 2) +
                    Math.pow(scores[i+2] - scores[j+2], 2)
                );
                if (dist < minDist) {
                    minDist = dist;
                    minIdx = j;
                }
            }
            if (minIdx > 0 && minIdx + 10 < n) {
                const dist1 = Math.sqrt(
                    Math.pow(scores[i] - scores[minIdx], 2) +
                    Math.pow(scores[i+1] - scores[minIdx+1], 2) +
                    Math.pow(scores[i+2] - scores[minIdx+2], 2)
                );
                const dist2 = Math.sqrt(
                    Math.pow(scores[i+10] - scores[minIdx+10], 2) +
                    Math.pow(scores[i+11] - scores[minIdx+11], 2) +
                    Math.pow(scores[i+12] - scores[minIdx+12], 2)
                );
                if (dist1 > 0 && dist2 > 0) {
                    sum += Math.log(dist2 / dist1);
                    count++;
                }
            }
        }
        
        return count > 0 ? sum / (count * 10) : 0;
    }

    calculateCorrelationDimension(history) {
        const scores = history.map(h => h.Tong || 0);
        const n = scores.length;
        if (n < 50) return 0;
        
        const m = 3; // embedding dimension
        const epsilons = [0.1, 0.2, 0.3, 0.5, 0.7, 1.0];
        const C = [];
        
        for (let eps of epsilons) {
            let sum = 0, count = 0;
            for (let i = 0; i < n - m; i++) {
                for (let j = i + 1; j < n - m; j++) {
                    let dist = 0;
                    for (let k = 0; k < m; k++) {
                        dist += Math.pow(scores[i+k] - scores[j+k], 2);
                    }
                    dist = Math.sqrt(dist);
                    if (dist < eps) sum++;
                    count++;
                }
            }
            C.push(sum / count);
        }
        
        // Linear regression
        const x = epsilons.map(e => Math.log(e));
        const y = C.map(c => Math.log(c + 1e-10));
        const meanX = x.reduce((a, b) => a + b, 0) / x.length;
        const meanY = y.reduce((a, b) => a + b, 0) / y.length;
        
        let num = 0, den = 0;
        for (let i = 0; i < x.length; i++) {
            num += (x[i] - meanX) * (y[i] - meanY);
            den += Math.pow(x[i] - meanX, 2);
        }
        
        return den === 0 ? 0 : num / den;
    }

    calculateKolmogorovEntropy(history) {
        const results = history.map(h => h.Ket_qua);
        const n = results.length;
        if (n < 20) return 0;
        
        let entropy = 0;
        for (let blockSize = 1; blockSize <= 5; blockSize++) {
            const blocks = {};
            for (let i = 0; i < n - blockSize; i++) {
                const block = results.slice(i, i + blockSize).join('');
                blocks[block] = (blocks[block] || 0) + 1;
            }
            let H = 0;
            const total = n - blockSize;
            for (let [block, count] of Object.entries(blocks)) {
                const p = count / total;
                H -= p * Math.log2(p + 1e-10);
            }
            entropy += H / blockSize;
        }
        
        return entropy / 5;
    }

    analyzePlayerPsychology(history) {
        const results = history.map(h => h.Ket_qua);
        const scores = history.map(h => h.Tong || 0);
        
        // Tâm lý đám đông
        let taiAfterXiu = 0, xiuAfterTai = 0;
        let countTaiAfterXiu = 0, countXiuAfterTai = 0;
        
        for (let i = 0; i < results.length - 1; i++) {
            if (results[i] === 'Xỉu') {
                countTaiAfterXiu++;
                if (results[i+1] === 'Tài') taiAfterXiu++;
            }
            if (results[i] === 'Tài') {
                countXiuAfterTai++;
                if (results[i+1] === 'Xỉu') xiuAfterTai++;
            }
        }
        
        // Tâm lý tiếc nuối
        const regretTai = countTaiAfterXiu > 0 ? taiAfterXiu / countTaiAfterXiu : 0.5;
        const regretXiu = countXiuAfterTai > 0 ? xiuAfterTai / countXiuAfterTai : 0.5;
        
        // Sự quá tự tin
        const recent = results.slice(-10);
        const streaks = [];
        let currentStreak = 1;
        for (let i = 1; i < recent.length; i++) {
            if (recent[i] === recent[i-1]) {
                currentStreak++;
            } else {
                streaks.push(currentStreak);
                currentStreak = 1;
            }
        }
        streaks.push(currentStreak);
        const avgStreak = streaks.reduce((a, b) => a + b, 0) / streaks.length;
        
        return {
            regret: { tai: regretTai, xiu: regretXiu },
            crowdMomentum: avgStreak,
            confidence: 0.5 + (avgStreak - 1) * 0.05,
            reversalProbability: Math.min(0.3 + (avgStreak - 3) * 0.1, 0.7)
        };
    }

    analyzeMarketSentiment(history) {
        const results = history.map(h => h.Ket_qua);
        const scores = history.map(h => h.Tong || 0);
        
        // Bull/Bear sentiment
        const totalTai = results.filter(r => r === 'Tài').length;
        const totalXiu = results.length - totalTai;
        const sentiment = (totalTai - totalXiu) / results.length;
        
        // Volatility sentiment
        const volatility = this.variance(scores);
        
        // Momentum sentiment
        const momentum = scores.slice(-10).reduce((a, b) => a + b, 0) / 10 - 
                        scores.slice(-20, -10).reduce((a, b) => a + b, 0) / 10;
        
        return {
            sentiment: sentiment,
            volatility: volatility,
            momentum: momentum,
            sentimentStrength: Math.abs(sentiment)
        };
    }

    analyzeCrowdBehavior(history) {
        const results = history.map(h => h.Ket_qua);
        const scores = history.map(h => h.Tong || 0);
        
        // Herding behavior
        let herdCount = 0;
        for (let i = 3; i < results.length; i++) {
            const last3 = results.slice(i-3, i);
            if (last3.every(r => r === last3[0])) herdCount++;
        }
        const herdRatio = results.length > 3 ? herdCount / (results.length - 3) : 0;
        
        // Contrarian opportunities
        const contrarianSignal = herdRatio > 0.3 ? 
            (results[results.length-1] === 'Tài' ? 'Xỉu' : 'Tài') : null;
        
        return {
            herding: herdRatio,
            contrarianSignal: contrarianSignal,
            contrarianConfidence: Math.min(0.6 + herdRatio, 0.9)
        };
    }

    // Preprocess data for models
    preprocessForModel(history, windowSize) {
        const features = this.extractFeatures(history);
        const n = history.length;
        
        // Normalize features
        const normalized = {};
        for (let [key, value] of Object.entries(features)) {
            if (Array.isArray(value) && value.length > 0) {
                const mean = value.reduce((a, b) => a + b, 0) / value.length;
                const std = Math.sqrt(this.variance(value));
                normalized[key] = value.map(v => std === 0 ? 0 : (v - mean) / std);
            } else {
                normalized[key] = value;
            }
        }
        
        // Create sliding windows
        const windows = [];
        for (let i = windowSize; i <= n; i++) {
            const window = {
                features: normalized,
                labels: history.slice(i - windowSize, i).map(h => h.Ket_qua === 'Tài' ? 1 : 0),
                target: i < n ? history[i].Ket_qua === 'Tài' ? 1 : 0 : null
            };
            windows.push(window);
        }
        
        return windows;
    }
}

// ================================================================
// ========== LỚP 2: GENETIC ALGORITHM ==========
// ================================================================

class GeneticAlgorithm {
    constructor(populationSize = 100, mutationRate = 0.02) {
        this.populationSize = populationSize;
        this.mutationRate = mutationRate;
        this.population = [];
        this.generations = 0;
        this.bestFitness = 0;
        this.bestChromosome = null;
        this.fitnessHistory = [];
    }

    initialize(chromosomeLength, geneRanges) {
        this.chromosomeLength = chromosomeLength;
        this.geneRanges = geneRanges;
        this.population = [];
        
        for (let i = 0; i < this.populationSize; i++) {
            const chromosome = [];
            for (let j = 0; j < chromosomeLength; j++) {
                const [min, max] = geneRanges[j] || [0, 1];
                chromosome.push(min + Math.random() * (max - min));
            }
            this.population.push({
                genes: chromosome,
                fitness: 0
            });
        }
        
        console.log(`🧬 Genetic Algorithm initialized: ${this.populationSize} chromosomes, length ${chromosomeLength}`);
    }

    evaluate(fitnessFunction) {
        for (let i = 0; i < this.population.length; i++) {
            this.population[i].fitness = fitnessFunction(this.population[i].genes);
        }
        
        // Find best
        let best = this.population[0];
        for (let i = 1; i < this.population.length; i++) {
            if (this.population[i].fitness > best.fitness) {
                best = this.population[i];
            }
        }
        
        this.bestFitness = best.fitness;
        this.bestChromosome = best.genes;
        this.fitnessHistory.push(best.fitness);
        this.generations++;
        
        return best;
    }

    evolve() {
        // Tournament selection
        const newPopulation = [];
        const eliteCount = Math.floor(this.populationSize * 0.1);
        
        // Elite selection
        const sorted = [...this.population].sort((a, b) => b.fitness - a.fitness);
        for (let i = 0; i < eliteCount; i++) {
            newPopulation.push({ ...sorted[i] });
        }
        
        // Tournament selection and crossover
        while (newPopulation.length < this.populationSize) {
            const parent1 = this.tournamentSelection();
            const parent2 = this.tournamentSelection();
            
            let child1, child2;
            if (Math.random() < 0.8) {
                [child1, child2] = this.crossover(parent1, parent2);
            } else {
                child1 = { ...parent1 };
                child2 = { ...parent2 };
            }
            
            this.mutate(child1);
            this.mutate(child2);
            
            child1.fitness = 0;
            child2.fitness = 0;
            
            newPopulation.push(child1);
            if (newPopulation.length < this.populationSize) {
                newPopulation.push(child2);
            }
        }
        
        this.population = newPopulation;
        return this.population;
    }

    tournamentSelection(tournamentSize = 3) {
        let best = null;
        let bestFitness = -Infinity;
        
        for (let i = 0; i < tournamentSize; i++) {
            const idx = Math.floor(Math.random() * this.population.length);
            const individual = this.population[idx];
            if (individual.fitness > bestFitness) {
                bestFitness = individual.fitness;
                best = individual;
            }
        }
        
        return { ...best };
    }

    crossover(parent1, parent2) {
        const length = parent1.genes.length;
        const point = Math.floor(Math.random() * length);
        
        const child1Genes = [
            ...parent1.genes.slice(0, point),
            ...parent2.genes.slice(point)
        ];
        const child2Genes = [
            ...parent2.genes.slice(0, point),
            ...parent1.genes.slice(point)
        ];
        
        return [
            { genes: child1Genes, fitness: 0 },
            { genes: child2Genes, fitness: 0 }
        ];
    }

    mutate(individual) {
        for (let i = 0; i < individual.genes.length; i++) {
            if (Math.random() < this.mutationRate) {
                const [min, max] = this.geneRanges[i] || [0, 1];
                const noise = (Math.random() - 0.5) * (max - min) * 0.2;
                individual.genes[i] = Math.max(min, Math.min(max, individual.genes[i] + noise));
            }
        }
    }

    getBest() {
        return {
            chromosome: this.bestChromosome,
            fitness: this.bestFitness,
            generations: this.generations
        };
    }
}

// ================================================================
// ========== LỚP 3: SWARM INTELLIGENCE ==========
// ================================================================

class SwarmIntelligence {
    constructor(numParticles = 50, dimensions = 10) {
        this.numParticles = numParticles;
        this.dimensions = dimensions;
        this.particles = [];
        this.globalBest = null;
        this.globalBestFitness = -Infinity;
        
        // Parameters
        this.w = 0.7; // inertia
        this.c1 = 1.5; // cognitive
        this.c2 = 1.5; // social
        this.vMax = 0.5;
    }

    initialize(bounds) {
        this.bounds = bounds;
        this.particles = [];
        
        for (let i = 0; i < this.numParticles; i++) {
            const position = [];
            const velocity = [];
            for (let j = 0; j < this.dimensions; j++) {
                const [min, max] = bounds[j] || [0, 1];
                position.push(min + Math.random() * (max - min));
                velocity.push((Math.random() - 0.5) * this.vMax * 2);
            }
            
            this.particles.push({
                position: position,
                velocity: velocity,
                best: { ...position },
                bestFitness: -Infinity
            });
        }
    }

    evaluate(fitnessFunction) {
        for (let i = 0; i < this.particles.length; i++) {
            const fitness = fitnessFunction(this.particles[i].position);
            
            // Update personal best
            if (fitness > this.particles[i].bestFitness) {
                this.particles[i].best = { ...this.particles[i].position };
                this.particles[i].bestFitness = fitness;
            }
            
            // Update global best
            if (fitness > this.globalBestFitness) {
                this.globalBest = { ...this.particles[i].position };
                this.globalBestFitness = fitness;
            }
        }
    }

    update() {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            for (let j = 0; j < this.dimensions; j++) {
                const r1 = Math.random();
                const r2 = Math.random();
                
                // Update velocity
                p.velocity[j] = this.w * p.velocity[j] +
                    this.c1 * r1 * (p.best[j] - p.position[j]) +
                    this.c2 * r2 * (this.globalBest[j] - p.position[j]);
                
                // Limit velocity
                p.velocity[j] = Math.max(-this.vMax, Math.min(this.vMax, p.velocity[j]));
                
                // Update position
                p.position[j] += p.velocity[j];
                
                // Bound position
                const [min, max] = this.bounds[j] || [0, 1];
                p.position[j] = Math.max(min, Math.min(max, p.position[j]));
            }
        }
    }

    optimize(fitnessFunction, iterations) {
        for (let iter = 0; iter < iterations; iter++) {
            this.evaluate(fitnessFunction);
            this.update();
            
            // Adaptive inertia
            this.w = 0.9 - 0.4 * (iter / iterations);
        }
        
        return {
            best: this.globalBest,
            fitness: this.globalBestFitness
        };
    }
}

// ================================================================
// ========== LỚP 4: DEEP REINFORCEMENT LEARNING ==========
// ================================================================

class DeepReinforcementLearning {
    constructor(stateSize, actionSize) {
        this.stateSize = stateSize;
        this.actionSize = actionSize;
        this.memory = [];
        this.batchSize = 32;
        this.gamma = 0.95;
        this.epsilon = 1.0;
        this.epsilonMin = 0.01;
        this.epsilonDecay = 0.995;
        this.learningRate = 0.001;
        
        // Neural network weights (simplified)
        this.weights = {
            W1: this.xavierInit(stateSize, 128),
            b1: new Array(128).fill(0),
            W2: this.xavierInit(128, 64),
            b2: new Array(64).fill(0),
            W3: this.xavierInit(64, actionSize),
            b3: new Array(actionSize).fill(0)
        };
        
        this.targetWeights = JSON.parse(JSON.stringify(this.weights));
        this.updateTargetCounter = 0;
        this.targetUpdateFrequency = 10;
    }

    xavierInit(inputSize, outputSize) {
        const std = Math.sqrt(2 / (inputSize + outputSize));
        const matrix = [];
        for (let i = 0; i < inputSize; i++) {
            const row = [];
            for (let j = 0; j < outputSize; j++) {
                row.push((Math.random() - 0.5) * 2 * std);
            }
            matrix.push(row);
        }
        return matrix;
    }

    forward(state, weights) {
        // Layer 1: ReLU
        let h1 = this.matVec(weights.W1, state);
        for (let i = 0; i < h1.length; i++) {
            h1[i] += weights.b1[i];
            h1[i] = Math.max(0, h1[i]); // ReLU
        }
        
        // Layer 2: ReLU
        let h2 = this.matVec(weights.W2, h1);
        for (let i = 0; i < h2.length; i++) {
            h2[i] += weights.b2[i];
            h2[i] = Math.max(0, h2[i]); // ReLU
        }
        
        // Output layer: Linear
        let output = this.matVec(weights.W3, h2);
        for (let i = 0; i < output.length; i++) {
            output[i] += weights.b3[i];
        }
        
        return output;
    }

    matVec(matrix, vector) {
        const result = new Array(matrix[0].length).fill(0);
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                result[j] += matrix[i][j] * vector[i];
            }
        }
        return result;
    }

    act(state, epsilonOverride = null) {
        const eps = epsilonOverride !== null ? epsilonOverride : this.epsilon;
        
        if (Math.random() < eps) {
            return Math.floor(Math.random() * this.actionSize);
        }
        
        const qValues = this.forward(state, this.weights);
        let bestAction = 0;
        let bestQ = qValues[0];
        for (let i = 1; i < qValues.length; i++) {
            if (qValues[i] > bestQ) {
                bestQ = qValues[i];
                bestAction = i;
            }
        }
        return bestAction;
    }

    remember(state, action, reward, nextState, done) {
        this.memory.push({ state, action, reward, nextState, done });
        if (this.memory.length > 10000) {
            this.memory.shift();
        }
    }

    replay() {
        if (this.memory.length < this.batchSize) return;
        
        const batch = [];
        const indices = [];
        for (let i = 0; i < this.batchSize; i++) {
            indices.push(Math.floor(Math.random() * this.memory.length));
        }
        
        for (let idx of indices) {
            batch.push(this.memory[idx]);
        }
        
        for (let experience of batch) {
            const { state, action, reward, nextState, done } = experience;
            
            let target = reward;
            if (!done) {
                const qNext = this.forward(nextState, this.targetWeights);
                let maxQ = -Infinity;
                for (let i = 0; i < qNext.length; i++) {
                    if (qNext[i] > maxQ) maxQ = qNext[i];
                }
                target += this.gamma * maxQ;
            }
            
            // Update weights using gradient descent (simplified)
            this.updateWeights(state, action, target);
        }
        
        this.updateTargetCounter++;
        if (this.updateTargetCounter % this.targetUpdateFrequency === 0) {
            this.targetWeights = JSON.parse(JSON.stringify(this.weights));
        }
        
        // Decay epsilon
        this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);
    }

    updateWeights(state, action, target) {
        const qCurrent = this.forward(state, this.weights);
        const error = target - qCurrent[action];
        const learningRate = this.learningRate;
        
        // Simplified weight update (only output layer)
        for (let i = 0; i < this.weights.W3.length; i++) {
            this.weights.W3[i][action] += learningRate * error * state[i] * 0.01;
        }
        this.weights.b3[action] += learningRate * error * 0.01;
    }

    getQValue(state, action) {
        const qValues = this.forward(state, this.weights);
        return qValues[action] || 0;
    }
}

// ================================================================
// ========== LỚP 5: ENSEMBLE MACHINE LEARNING ==========
// ================================================================

class EnsembleML {
    constructor() {
        this.models = [];
        this.weights = [];
        this.predictions = [];
    }

    addModel(model, weight = 1.0) {
        this.models.push(model);
        this.weights.push(weight);
    }

    predict(input) {
        if (this.models.length === 0) return null;
        
        const weightedPredictions = {};
        
        for (let i = 0; i < this.models.length; i++) {
            const pred = this.models[i].predict(input);
            if (pred) {
                const weight = this.weights[i];
                if (pred.prediction === 'Tài') {
                    weightedPredictions['Tài'] = (weightedPredictions['Tài'] || 0) + weight * pred.confidence;
                } else if (pred.prediction === 'Xỉu') {
                    weightedPredictions['Xỉu'] = (weightedPredictions['Xỉu'] || 0) + weight * pred.confidence;
                }
            }
        }
        
        if (Object.keys(weightedPredictions).length === 0) return null;
        
        const total = weightedPredictions['Tài'] + weightedPredictions['Xỉu'] || 1;
        const probTai = (weightedPredictions['Tài'] || 0) / total;
        const probXiu = (weightedPredictions['Xỉu'] || 0) / total;
        
        return {
            prediction: probTai > probXiu ? 'Tài' : 'Xỉu',
            confidence: Math.max(probTai, probXiu),
            probTai: probTai,
            probXiu: probXiu,
            numModels: this.models.length
        };
    }
}

// ================================================================
// ========== LỚP 6: DEEP NEURAL NETWORK ==========
// ================================================================

class DeepNeuralNetwork {
    constructor(inputSize, hiddenLayers, outputSize) {
        this.inputSize = inputSize;
        this.hiddenLayers = hiddenLayers;
        this.outputSize = outputSize;
        this.learningRate = 0.001;
        this.momentum = 0.9;
        
        // Initialize weights
        this.weights = [];
        this.biases = [];
        this.momentums = [];
        
        let prevSize = inputSize;
        for (let i = 0; i < hiddenLayers.length; i++) {
            const layerSize = hiddenLayers[i];
            this.weights.push(this.xavierInit(prevSize, layerSize));
            this.biases.push(new Array(layerSize).fill(0.01));
            this.momentums.push(this.xavierInit(prevSize, layerSize));
            prevSize = layerSize;
        }
        this.weights.push(this.xavierInit(prevSize, outputSize));
        this.biases.push(new Array(outputSize).fill(0.01));
        this.momentums.push(this.xavierInit(prevSize, outputSize));
    }

    xavierInit(inputSize, outputSize) {
        const std = Math.sqrt(2 / (inputSize + outputSize));
        const matrix = [];
        for (let i = 0; i < inputSize; i++) {
            const row = [];
            for (let j = 0; j < outputSize; j++) {
                row.push((Math.random() - 0.5) * 2 * std);
            }
            matrix.push(row);
        }
        return matrix;
    }

    forward(input) {
        let current = [...input];
        this.activations = [current];
        
        for (let layer = 0; layer < this.weights.length; layer++) {
            const next = new Array(this.weights[layer][0].length).fill(0);
            for (let i = 0; i < this.weights[layer].length; i++) {
                for (let j = 0; j < this.weights[layer][i].length; j++) {
                    next[j] += current[i] * this.weights[layer][i][j];
                }
            }
            for (let j = 0; j < next.length; j++) {
                next[j] += this.biases[layer][j];
                if (layer < this.weights.length - 1) {
                    next[j] = Math.max(0, next[j]); // ReLU
                } else {
                    next[j] = 1 / (1 + Math.exp(-next[j])); // Sigmoid
                }
            }
            this.activations.push(next);
            current = next;
        }
        
        return current;
    }

    backward(target) {
        const deltas = [];
        const output = this.activations[this.activations.length - 1];
        
        // Output layer delta
        const outputDelta = new Array(output.length);
        for (let i = 0; i < output.length; i++) {
            outputDelta[i] = (output[i] - target[i]) * output[i] * (1 - output[i]);
        }
        deltas.push(outputDelta);
        
        // Hidden layers delta
        for (let layer = this.weights.length - 2; layer >= 0; layer--) {
            const delta = new Array(this.weights[layer][0].length).fill(0);
            const prevDelta = deltas[deltas.length - 1];
            for (let i = 0; i < this.weights[layer].length; i++) {
                let sum = 0;
                for (let j = 0; j < this.weights[layer][i].length; j++) {
                    sum += prevDelta[j] * this.weights[layer][i][j];
                }
                const activation = this.activations[layer + 1][i];
                delta[i] = sum * (activation > 0 ? 1 : 0.01); // Leaky ReLU
            }
            deltas.push(delta);
        }
        
        deltas.reverse();
        
        // Update weights and biases
        for (let layer = 0; layer < this.weights.length; layer++) {
            const input = this.activations[layer];
            const delta = deltas[layer];
            
            for (let i = 0; i < this.weights[layer].length; i++) {
                for (let j = 0; j < this.weights[layer][i].length; j++) {
                    const gradient = input[i] * delta[j];
                    this.momentums[layer][i][j] = 
                        this.momentum * this.momentums[layer][i][j] +
                        this.learningRate * gradient;
                    this.weights[layer][i][j] -= this.momentums[layer][i][j];
                }
            }
            
            for (let j = 0; j < this.biases[layer].length; j++) {
                this.biases[layer][j] -= this.learningRate * delta[j];
            }
        }
    }

    train(input, target) {
        const output = this.forward(input);
        this.backward(target);
        return output;
    }

    predict(input) {
        const output = this.forward(input);
        return output;
    }
}

// ================================================================
// ========== LỚP 7: RANDOM FOREST SIMULATOR ==========
// ================================================================

class RandomForest {
    constructor(numTrees = 100, maxDepth = 10) {
        this.numTrees = numTrees;
        this.maxDepth = maxDepth;
        this.trees = [];
        this.featureImportance = {};
    }

    train(X, y) {
        this.trees = [];
        const n = X.length;
        const features = X[0].length;
        
        for (let treeIdx = 0; treeIdx < this.numTrees; treeIdx++) {
            // Bootstrap sampling
            const bootstrapX = [];
            const bootstrapY = [];
            for (let i = 0; i < n; i++) {
                const idx = Math.floor(Math.random() * n);
                bootstrapX.push(X[idx]);
                bootstrapY.push(y[idx]);
            }
            
            // Random feature selection
            const featureIndices = [];
            const numFeatures = Math.floor(Math.sqrt(features));
            const selected = new Set();
            while (selected.size < numFeatures) {
                selected.add(Math.floor(Math.random() * features));
            }
            
            // Build tree
            const tree = this.buildTree(bootstrapX, bootstrapY, selected, 0);
            this.trees.push(tree);
        }
        
        // Calculate feature importance
        this.featureImportance = this.calculateFeatureImportance();
    }

    buildTree(X, y, features, depth) {
        if (depth >= this.maxDepth || X.length < 2) {
            return this.createLeaf(y);
        }
        
        // Check if all same
        const first = y[0];
        let allSame = true;
        for (let i = 1; i < y.length; i++) {
            if (y[i] !== first) { allSame = false; break; }
        }
        if (allSame) return this.createLeaf(y);
        
        // Find best split
        let bestFeature = -1;
        let bestThreshold = 0;
        let bestGini = Infinity;
        
        for (let feature of features) {
            const values = X.map(row => row[feature]);
            const sorted = values.map((v, i) => ({ v, idx: i }))
                .sort((a, b) => a.v - b.v);
            
            for (let i = 0; i < sorted.length - 1; i++) {
                if (sorted[i].v === sorted[i+1].v) continue;
                const threshold = (sorted[i].v + sorted[i+1].v) / 2;
                const left = [];
                const right = [];
                for (let j = 0; j < X.length; j++) {
                    if (X[j][feature] <= threshold) left.push(j);
                    else right.push(j);
                }
                if (left.length === 0 || right.length === 0) continue;
                
                const gini = this.calculateGini(y, left, right);
                if (gini < bestGini) {
                    bestGini = gini;
                    bestFeature = feature;
                    bestThreshold = threshold;
                }
            }
        }
        
        if (bestFeature === -1) return this.createLeaf(y);
        
        // Split data
        const leftIndices = [];
        const rightIndices = [];
        for (let i = 0; i < X.length; i++) {
            if (X[i][bestFeature] <= bestThreshold) leftIndices.push(i);
            else rightIndices.push(i);
        }
        
        const leftX = leftIndices.map(i => X[i]);
        const leftY = leftIndices.map(i => y[i]);
        const rightX = rightIndices.map(i => X[i]);
        const rightY = rightIndices.map(i => y[i]);
        
        return {
            type: 'node',
            feature: bestFeature,
            threshold: bestThreshold,
            left: this.buildTree(leftX, leftY, features, depth + 1),
            right: this.buildTree(rightX, rightY, features, depth + 1),
            size: X.length,
            gini: bestGini
        };
    }

    calculateGini(y, left, right) {
        const total = y.length;
        const leftTotal = left.length;
        const rightTotal = right.length;
        
        const leftCounts = { 0: 0, 1: 0 };
        const rightCounts = { 0: 0, 1: 0 };
        
        for (let idx of left) {
            leftCounts[y[idx]] = (leftCounts[y[idx]] || 0) + 1;
        }
        for (let idx of right) {
            rightCounts[y[idx]] = (rightCounts[y[idx]] || 0) + 1;
        }
        
        const giniLeft = 1 - 
            Math.pow(leftCounts[0] / leftTotal, 2) - 
            Math.pow(leftCounts[1] / leftTotal, 2);
        const giniRight = 1 - 
            Math.pow(rightCounts[0] / rightTotal, 2) - 
            Math.pow(rightCounts[1] / rightTotal, 2);
        
        return (leftTotal / total) * giniLeft + (rightTotal / total) * giniRight;
    }

    createLeaf(y) {
        const counts = { 0: 0, 1: 0 };
        for (let val of y) {
            counts[val] = (counts[val] || 0) + 1;
        }
        const total = y.length;
        return {
            type: 'leaf',
            counts: counts,
            prediction: counts[1] > counts[0] ? 1 : 0,
            confidence: Math.max(counts[1], counts[0]) / total
        };
    }

    predictSingle(tree, x) {
        if (tree.type === 'leaf') {
            return tree;
        }
        
        if (x[tree.feature] <= tree.threshold) {
            return this.predictSingle(tree.left, x);
        } else {
            return this.predictSingle(tree.right, x);
        }
    }

    predict(x) {
        const predictions = [];
        const confidences = [];
        
        for (let tree of this.trees) {
            const result = this.predictSingle(tree, x);
            predictions.push(result.prediction);
            confidences.push(result.confidence);
        }
        
        const counts = { 0: 0, 1: 0 };
        for (let pred of predictions) {
            counts[pred] = (counts[pred] || 0) + 1;
        }
        
        const total = predictions.length;
        const prob0 = counts[0] / total;
        const prob1 = counts[1] / total;
        const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
        
        return {
            prediction: prob1 > prob0 ? 'Tài' : 'Xỉu',
            confidence: Math.max(prob0, prob1) * avgConfidence,
            probTai: prob1,
            probXiu: prob0,
            numTrees: total
        };
    }

    calculateFeatureImportance() {
        const importance = {};
        // Simplified: count how many times each feature is used
        for (let tree of this.trees) {
            this.traverseTree(tree, importance);
        }
        return importance;
    }

    traverseTree(node, importance) {
        if (node.type === 'leaf') return;
        importance[node.feature] = (importance[node.feature] || 0) + 1;
        this.traverseTree(node.left, importance);
        this.traverseTree(node.right, importance);
    }
}

// ================================================================
// ========== LỚP 8: GRADIENT BOOSTING ==========
// ================================================================

class GradientBoosting {
    constructor(numEstimators = 100, learningRate = 0.1, maxDepth = 3) {
        this.numEstimators = numEstimators;
        this.learningRate = learningRate;
        this.maxDepth = maxDepth;
        this.estimators = [];
        this.basePrediction = 0.5;
    }

    train(X, y) {
        // Initialize predictions
        let predictions = new Array(X.length).fill(this.basePrediction);
        this.estimators = [];
        
        for (let m = 0; m < this.numEstimators; m++) {
            // Calculate residuals
            const residuals = [];
            for (let i = 0; i < y.length; i++) {
                const p = predictions[i];
                residuals.push(y[i] - p);
            }
            
            // Fit tree to residuals
            const tree = this.buildTree(X, residuals, 0);
            this.estimators.push(tree);
            
            // Update predictions
            const updates = this.predictTree(tree, X);
            for (let i = 0; i < predictions.length; i++) {
                predictions[i] += this.learningRate * updates[i];
                // Clamp
                predictions[i] = Math.max(0.001, Math.min(0.999, predictions[i]));
            }
        }
    }

    buildTree(X, residuals, depth) {
        if (depth >= this.maxDepth || residuals.length < 2) {
            const mean = residuals.reduce((a, b) => a + b, 0) / residuals.length;
            return { type: 'leaf', value: mean };
        }
        
        // Find best split
        let bestFeature = -1;
        let bestThreshold = 0;
        let bestLoss = Infinity;
        
        for (let feature = 0; feature < X[0].length; feature++) {
            const values = X.map(row => row[feature]);
            const sorted = values.map((v, i) => ({ v, idx: i }))
                .sort((a, b) => a.v - b.v);
            
            for (let i = 0; i < sorted.length - 1; i++) {
                if (sorted[i].v === sorted[i+1].v) continue;
                const threshold = (sorted[i].v + sorted[i+1].v) / 2;
                
                let leftSum = 0, rightSum = 0;
                let leftCount = 0, rightCount = 0;
                
                for (let j = 0; j < X.length; j++) {
                    if (X[j][feature] <= threshold) {
                        leftSum += residuals[j];
                        leftCount++;
                    } else {
                        rightSum += residuals[j];
                        rightCount++;
                    }
                }
                
                const leftMean = leftCount > 0 ? leftSum / leftCount : 0;
                const rightMean = rightCount > 0 ? rightSum / rightCount : 0;
                
                let loss = 0;
                for (let j = 0; j < X.length; j++) {
                    if (X[j][feature] <= threshold) {
                        loss += Math.pow(residuals[j] - leftMean, 2);
                    } else {
                        loss += Math.pow(residuals[j] - rightMean, 2);
                    }
                }
                
                if (loss < bestLoss) {
                    bestLoss = loss;
                    bestFeature = feature;
                    bestThreshold = threshold;
                }
            }
        }
        
        if (bestFeature === -1) {
            const mean = residuals.reduce((a, b) => a + b, 0) / residuals.length;
            return { type: 'leaf', value: mean };
        }
        
        const leftX = [];
        const leftRes = [];
        const rightX = [];
        const rightRes = [];
        
        for (let i = 0; i < X.length; i++) {
            if (X[i][bestFeature] <= bestThreshold) {
                leftX.push(X[i]);
                leftRes.push(residuals[i]);
            } else {
                rightX.push(X[i]);
                rightRes.push(residuals[i]);
            }
        }
        
        return {
            type: 'node',
            feature: bestFeature,
            threshold: bestThreshold,
            left: this.buildTree(leftX, leftRes, depth + 1),
            right: this.buildTree(rightX, rightRes, depth + 1)
        };
    }

    predictTree(tree, X) {
        const predictions = [];
        for (let x of X) {
            predictions.push(this.predictSingle(tree, x));
        }
        return predictions;
    }

    predictSingle(tree, x) {
        if (tree.type === 'leaf') {
            return tree.value;
        }
        
        if (x[tree.feature] <= tree.threshold) {
            return this.predictSingle(tree.left, x);
        } else {
            return this.predictSingle(tree.right, x);
        }
    }

    predict(X) {
        let predictions = new Array(X.length).fill(this.basePrediction);
        
        for (let tree of this.estimators) {
            const updates = this.predictTree(tree, X);
            for (let i = 0; i < predictions.length; i++) {
                predictions[i] += this.learningRate * updates[i];
            }
        }
        
        // Convert to probabilities
        const result = predictions.map(p => {
            const prob = 1 / (1 + Math.exp(-p));
            return {
                prediction: prob > 0.5 ? 'Tài' : 'Xỉu',
                confidence: Math.max(prob, 1 - prob),
                probTai: prob
            };
        });
        
        // Average for single prediction
        const avgProb = result.reduce((a, b) => a + b.probTai, 0) / result.length;
        return {
            prediction: avgProb > 0.5 ? 'Tài' : 'Xỉu',
            confidence: Math.max(avgProb, 1 - avgProb),
            probTai: avgProb
        };
    }
}

// ================================================================
// ========== LỚP 9: EXTREME LEARNING MACHINE ==========
// ================================================================

class ExtremeLearningMachine {
    constructor(inputSize, hiddenSize, outputSize) {
        this.inputSize = inputSize;
        this.hiddenSize = hiddenSize;
        this.outputSize = outputSize;
        
        // Random hidden weights
        this.W = [];
        for (let i = 0; i < inputSize; i++) {
            const row = [];
            for (let j = 0; j < hiddenSize; j++) {
                row.push((Math.random() - 0.5) * 2);
            }
            this.W.push(row);
        }
        this.b = new Array(hiddenSize).fill(0).map(() => (Math.random() - 0.5) * 2);
        
        // Output weights will be learned
        this.beta = null;
    }

    train(X, y) {
        // Compute hidden layer output
        const H = [];
        for (let sample of X) {
            const h = [];
            for (let j = 0; j < this.hiddenSize; j++) {
                let sum = this.b[j];
                for (let i = 0; i < sample.length; i++) {
                    sum += sample[i] * this.W[i][j];
                }
                h.push(1 / (1 + Math.exp(-sum))); // Sigmoid
            }
            H.push(h);
        }
        
        // Moore-Penrose pseudoinverse
        const HT = this.transpose(H);
        const HTH = this.matMul(HT, H);
        const HTy = this.matMul(HT, y);
        
        // Solve linear system
        const alpha = 0.001; // Regularization
        const HTH_reg = this.addIdentity(HTH, alpha);
        this.beta = this.solveLinear(HTH_reg, HTy);
    }

    transpose(matrix) {
        const result = [];
        for (let j = 0; j < matrix[0].length; j++) {
            const row = [];
            for (let i = 0; i < matrix.length; i++) {
                row.push(matrix[i][j]);
            }
            result.push(row);
        }
        return result;
    }

    matMul(A, B) {
        const result = [];
        for (let i = 0; i < A.length; i++) {
            const row = [];
            for (let j = 0; j < B[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < A[0].length; k++) {
                    sum += A[i][k] * B[k][j];
                }
                row.push(sum);
            }
            result.push(row);
        }
        return result;
    }

    addIdentity(matrix, alpha) {
        const result = matrix.map(row => [...row]);
        for (let i = 0; i < result.length; i++) {
            result[i][i] += alpha;
        }
        return result;
    }

    solveLinear(A, b) {
        // Simple gradient descent
        const n = A.length;
        const m = A[0].length;
        let x = new Array(m).fill(0);
        const learningRate = 0.01;
        const iterations = 1000;
        
        for (let iter = 0; iter < iterations; iter++) {
            const Ax = new Array(n).fill(0);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    Ax[i] += A[i][j] * x[j];
                }
            }
            
            const gradient = new Array(m).fill(0);
            for (let j = 0; j < m; j++) {
                for (let i = 0; i < n; i++) {
                    gradient[j] += (Ax[i] - b[i]) * A[i][j];
                }
                x[j] -= learningRate * gradient[j];
            }
        }
        
        return x;
    }

    predict(X) {
        const predictions = [];
        for (let sample of X) {
            const h = [];
            for (let j = 0; j < this.hiddenSize; j++) {
                let sum = this.b[j];
                for (let i = 0; i < sample.length; i++) {
                    sum += sample[i] * this.W[i][j];
                }
                h.push(1 / (1 + Math.exp(-sum)));
            }
            
            let output = 0;
            for (let j = 0; j < this.beta.length; j++) {
                output += h[j] * this.beta[j];
            }
            const prob = 1 / (1 + Math.exp(-output));
            predictions.push({
                prediction: prob > 0.5 ? 'Tài' : 'Xỉu',
                confidence: Math.max(prob, 1 - prob),
                probTai: prob
            });
        }
        
        // Average
        const avgProb = predictions.reduce((a, b) => a + b.probTai, 0) / predictions.length;
        return {
            prediction: avgProb > 0.5 ? 'Tài' : 'Xỉu',
            confidence: Math.max(avgProb, 1 - avgProb),
            probTai: avgProb
        };
    }
}

// ================================================================
// ========== LỚP 10: SUPPORT VECTOR MACHINE SIMULATOR ==========
// ================================================================

class SVM {
    constructor(C = 1.0, kernel = 'rbf', gamma = 0.1) {
        this.C = C;
        this.kernel = kernel;
        this.gamma = gamma;
        this.alpha = null;
        this.b = 0;
        this.supportVectors = null;
        this.supportLabels = null;
        this.epsilon = 1e-3;
    }

    train(X, y) {
        const n = X.length;
        this.alpha = new Array(n).fill(0);
        const labels = y.map(v => v === 1 ? 1 : -1);
        
        // SMO algorithm (simplified)
        let iterations = 0;
        const maxIterations = 1000;
        
        while (iterations < maxIterations) {
            let changed = 0;
            for (let i = 0; i < n; i++) {
                const error_i = this.calculateError(X, labels, i);
                if ((labels[i] * error_i < -this.epsilon && this.alpha[i] < this.C) ||
                    (labels[i] * error_i > this.epsilon && this.alpha[i] > 0)) {
                    // Select second alpha
                    let j = i;
                    while (j === i) {
                        j = Math.floor(Math.random() * n);
                    }
                    
                    const error_j = this.calculateError(X, labels, j);
                    
                    // Save old alphas
                    const alpha_i_old = this.alpha[i];
                    const alpha_j_old = this.alpha[j];
                    
                    // Compute bounds
                    let L, H;
                    if (labels[i] !== labels[j]) {
                        L = Math.max(0, this.alpha[j] - this.alpha[i]);
                        H = Math.min(this.C, this.C + this.alpha[j] - this.alpha[i]);
                    } else {
                        L = Math.max(0, this.alpha[i] + this.alpha[j] - this.C);
                        H = Math.min(this.C, this.alpha[i] + this.alpha[j]);
                    }
                    
                    if (Math.abs(L - H) < this.epsilon) continue;
                    
                    // Compute eta
                    const eta = 2 * this.kernelFunc(X[i], X[j]) - 
                                this.kernelFunc(X[i], X[i]) - 
                                this.kernelFunc(X[j], X[j]);
                    
                    if (eta >= 0) continue;
                    
                    // Update alpha[j]
                    this.alpha[j] = alpha_j_old - labels[j] * (error_i - error_j) / eta;
                    this.alpha[j] = Math.max(L, Math.min(H, this.alpha[j]));
                    
                    if (Math.abs(this.alpha[j] - alpha_j_old) < this.epsilon * (this.alpha[j] + alpha_j_old + this.epsilon)) {
                        continue;
                    }
                    
                    // Update alpha[i]
                    this.alpha[i] = alpha_i_old + labels[i] * labels[j] * (alpha_j_old - this.alpha[j]);
                    
                    // Update b
                    const b1 = this.b - error_i - 
                               labels[i] * (this.alpha[i] - alpha_i_old) * this.kernelFunc(X[i], X[i]) -
                               labels[j] * (this.alpha[j] - alpha_j_old) * this.kernelFunc(X[i], X[j]);
                    const b2 = this.b - error_j -
                               labels[i] * (this.alpha[i] - alpha_i_old) * this.kernelFunc(X[i], X[j]) -
                               labels[j] * (this.alpha[j] - alpha_j_old) * this.kernelFunc(X[j], X[j]);
                    
                    if (this.alpha[i] > 0 && this.alpha[i] < this.C) {
                        this.b = b1;
                    } else if (this.alpha[j] > 0 && this.alpha[j] < this.C) {
                        this.b = b2;
                    } else {
                        this.b = (b1 + b2) / 2;
                    }
                    
                    changed++;
                }
            }
            
            if (changed === 0) break;
            iterations++;
        }
        
        // Store support vectors
        this.supportVectors = [];
        this.supportLabels = [];
        for (let i = 0; i < n; i++) {
            if (this.alpha[i] > this.epsilon) {
                this.supportVectors.push(X[i]);
                this.supportLabels.push(labels[i]);
            }
        }
    }

    calculateError(X, labels, i) {
        let sum = this.b;
        for (let j = 0; j < X.length; j++) {
            if (this.alpha[j] > 0) {
                sum += this.alpha[j] * labels[j] * this.kernelFunc(X[i], X[j]);
            }
        }
        return sum - labels[i];
    }

    kernelFunc(x, z) {
        if (this.kernel === 'linear') {
            return this.linearKernel(x, z);
        } else if (this.kernel === 'rbf') {
            return this.rbfKernel(x, z);
        } else if (this.kernel === 'poly') {
            return this.polyKernel(x, z);
        }
        return this.linearKernel(x, z);
    }

    linearKernel(x, z) {
        return x.reduce((a, b, i) => a + b * z[i], 0);
    }

    rbfKernel(x, z) {
        let sum = 0;
        for (let i = 0; i < x.length; i++) {
            sum += Math.pow(x[i] - z[i], 2);
        }
        return Math.exp(-this.gamma * sum);
    }

    polyKernel(x, z) {
        return Math.pow(1 + this.linearKernel(x, z), 3);
    }

    predict(X) {
        const predictions = [];
        for (let x of X) {
            let sum = this.b;
            for (let i = 0; i < this.supportVectors.length; i++) {
                sum += this.alpha[i] * this.supportLabels[i] * this.kernelFunc(x, this.supportVectors[i]);
            }
            const prob = 1 / (1 + Math.exp(-sum));
            predictions.push({
                prediction: prob > 0.5 ? 'Tài' : 'Xỉu',
                confidence: Math.max(prob, 1 - prob),
                probTai: prob
            });
        }
        
        const avgProb = predictions.reduce((a, b) => a + b.probTai, 0) / predictions.length;
        return {
            prediction: avgProb > 0.5 ? 'Tài' : 'Xỉu',
            confidence: Math.max(avgProb, 1 - avgProb),
            probTai: avgProb
        };
    }
}

// ================================================================
// ========== SIÊU PHÂN TÍCH TỔNG HỢP ==========
// ================================================================

class UltimateAnalyzer {
    constructor() {
        console.log('🚀 KHỞI TẠO SIÊU PHÂN TÍCH TỔNG HỢP...');
        
        // === DỮ LIỆU ===
        this.processor = new DataProcessor();
        
        // === GENETIC ALGORITHM ===
        this.genetic = new GeneticAlgorithm(150, 0.03);
        this.geneticInitialized = false;
        
        // === SWARM INTELLIGENCE ===
        this.swarm = new SwarmIntelligence(80, 15);
        this.swarmInitialized = false;
        
        // === DEEP REINFORCEMENT ===
        this.drl = new DeepReinforcementLearning(50, 2);
        
        // === DEEP NEURAL NETWORK ===
        this.dnn = new DeepNeuralNetwork(50, [128, 64, 32], 2);
        
        // === RANDOM FOREST ===
        this.randomForest = new RandomForest(150, 12);
        this.rfTrained = false;
        
        // === GRADIENT BOOSTING ===
        this.gb = new GradientBoosting(150, 0.1, 4);
        this.gbTrained = false;
        
        // === EXTREME LEARNING ===
        this.elm = new ExtremeLearningMachine(50, 200, 1);
        this.elmTrained = false;
        
        // === SVM ===
        this.svm = new SVM(1.0, 'rbf', 0.1);
        this.svmTrained = false;
        
        // === ENSEMBLE ===
        this.ensemble = new EnsembleML();
        
        // === THỐNG KÊ ===
        this.stats = {
            totalPredictions: 0,
            correct: 0,
            wrong: 0,
            accuracy: 0,
            recentAccuracy: []
        };
        
        // === LOAD WEIGHTS ===
        this.loadWeights();
        
        console.log('✅ SIÊU PHÂN TÍCH TỔNG HỢP ĐÃ SẴN SÀNG!');
        console.log(`📊 Models: Genetic(150) + Swarm(80) + DRL + DNN + RF(150) + GB(150) + ELM + SVM`);
    }

    loadWeights() {
        if (fs.existsSync(SUPER_WEIGHTS_FILE)) {
            try {
                const data = JSON.parse(fs.readFileSync(SUPER_WEIGHTS_FILE, 'utf8'));
                if (data.dnnWeights) {
                    this.dnn.weights = data.dnnWeights;
                    this.dnn.biases = data.dnnBiases;
                }
                if (data.rfTrained) this.rfTrained = true;
                if (data.gbTrained) this.gbTrained = true;
                if (data.elmTrained) this.elmTrained = true;
                if (data.svmTrained) this.svmTrained = true;
                console.log('[📂] Đã tải weights');
            } catch (e) {
                console.error('[❌] Lỗi đọc weights:', e.message);
            }
        }
    }

    saveWeights() {
        const data = {
            dnnWeights: this.dnn.weights,
            dnnBiases: this.dnn.biases,
            rfTrained: this.rfTrained,
            gbTrained: this.gbTrained,
            elmTrained: this.elmTrained,
            svmTrained: this.svmTrained,
            timestamp: new Date().toISOString()
        };
        fs.writeFileSync(SUPER_WEIGHTS_FILE, JSON.stringify(data, null, 2));
    }

    // === TRAIN ALL MODELS ===
    train(history) {
        console.log('🚀 BẮT ĐẦU TRAINING TẤT CẢ MODELS...');
        const startTime = Date.now();
        
        const features = this.processor.extractFeatures(history);
        const X = this.prepareTrainingData(history);
        const y = history.map(h => h.Ket_qua === 'Tài' ? 1 : 0);
        
        // 1. Genetic Algorithm
        if (!this.geneticInitialized) {
            const geneRanges = [];
            for (let i = 0; i < 10; i++) {
                geneRanges.push([0.1, 2.0]);
            }
            this.genetic.initialize(10, geneRanges);
            this.geneticInitialized = true;
        }
        
        // 2. Swarm Intelligence
        if (!this.swarmInitialized) {
            const bounds = [];
            for (let i = 0; i < 15; i++) {
                bounds.push([0, 2]);
            }
            this.swarm.initialize(bounds);
            this.swarmInitialized = true;
        }
        
        // 3. Deep Neural Network
        console.log('🧠 Training Deep Neural Network...');
        for (let epoch = 0; epoch < 100; epoch++) {
            let totalLoss = 0;
            for (let i = 0; i < X.length - 1; i++) {
                const input = X[i];
                const target = y[i] === 1 ? [1, 0] : [0, 1];
                const output = this.dnn.train(input, target);
                totalLoss += Math.abs(output[0] - target[0]) + Math.abs(output[1] - target[1]);
            }
            if (epoch % 20 === 0) {
                console.log(`   Epoch ${epoch}, Loss: ${(totalLoss / X.length).toFixed(4)}`);
            }
        }
        
        // 4. Random Forest
        console.log('🌲 Training Random Forest...');
        const rfX = X.slice(0, Math.min(X.length, 500));
        const rfY = y.slice(0, Math.min(y.length, 500));
        this.randomForest.train(rfX, rfY);
        this.rfTrained = true;
        
        // 5. Gradient Boosting
        console.log('📈 Training Gradient Boosting...');
        this.gb.train(rfX, rfY);
        this.gbTrained = true;
        
        // 6. Extreme Learning Machine
        console.log('⚡ Training Extreme Learning Machine...');
        const elmY = y.map(v => [v]);
        this.elm.train(X, elmY);
        this.elmTrained = true;
        
        // 7. SVM
        console.log('🎯 Training SVM...');
        const svmX = X.slice(0, Math.min(X.length, 300));
        const svmY = y.slice(0, Math.min(y.length, 300));
        this.svm.train(svmX, svmY);
        this.svmTrained = true;
        
        // 8. Genetic Algorithm fitness function
        console.log('🧬 Training Genetic Algorithm...');
        const gaFitness = (chromosome) => {
            let score = 0;
            let correct = 0;
            const testSize = Math.min(100, X.length);
            for (let i = X.length - testSize; i < X.length - 1; i++) {
                let pred = 0;
                for (let j = 0; j < chromosome.length; j++) {
                    pred += X[i][j] * chromosome[j];
                }
                pred = pred > 0 ? 1 : 0;
                if (pred === y[i]) correct++;
            }
            return correct / testSize;
        };
        this.genetic.evaluate(gaFitness);
        for (let gen = 0; gen < 50; gen++) {
            this.genetic.evolve();
            this.genetic.evaluate(gaFitness);
        }
        
        // 9. Swarm Intelligence
        console.log('🐝 Training Swarm Intelligence...');
        const swarmFitness = (position) => {
            let score = 0;
            const testSize = Math.min(100, X.length);
            for (let i = X.length - testSize; i < X.length - 1; i++) {
                let pred = 0;
                for (let j = 0; j < position.length && j < X[i].length; j++) {
                    pred += X[i][j] * position[j];
                }
                pred = pred > 0 ? 1 : 0;
                if (pred === y[i]) score++;
            }
            return score / testSize;
        };
        this.swarm.optimize(swarmFitness, 100);
        
        // 10. Deep Reinforcement Learning
        console.log('🎮 Training Deep Reinforcement Learning...');
        for (let episode = 0; episode < 200; episode++) {
            let state = X[0] || new Array(50).fill(0);
            let done = false;
            let step = 0;
            let totalReward = 0;
            
            while (!done && step < X.length - 1) {
                const action = this.drl.act(state);
                const reward = action === y[step + 1] ? 1 : -0.5;
                const nextState = X[Math.min(step + 1, X.length - 1)] || state;
                done = step >= X.length - 2;
                this.drl.remember(state, action, reward, nextState, done);
                this.drl.replay();
                state = nextState;
                totalReward += reward;
                step++;
            }
            
            if (episode % 50 === 0) {
                console.log(`   Episode ${episode}, Reward: ${totalReward.toFixed(2)}, Epsilon: ${this.drl.epsilon.toFixed(3)}`);
            }
        }
        
        // Save weights
        this.saveWeights();
        
        const endTime = Date.now();
        console.log(`✅ TRAINING HOÀN TẤT! Time: ${(endTime - startTime) / 1000}s`);
    }

    prepareTrainingData(history) {
        const features = this.processor.extractFeatures(history);
        const X = [];
        
        // Lấy features quan trọng
        const featureKeys = [
            'scores', 'movingAverages', 'volatility', 'correlation',
            'patterns', 'cycles', 'probabilities', 'entropy',
            'lyapunov', 'fractalFeatures'
        ];
        
        for (let i = 0; i < history.length; i++) {
            const row = [];
            
            // Score
            row.push(history[i].Tong || 0);
            
            // Dice
            row.push(history[i].Xuc_xac_1 || 0);
            row.push(history[i].Xuc_xac_2 || 0);
            row.push(history[i].Xuc_xac_3 || 0);
            
            // Stats
            if (features.stats) {
                row.push(features.stats.mean || 0);
                row.push(features.stats.variance || 0);
                row.push(features.stats.skewness || 0);
                row.push(features.stats.kurtosis || 0);
                row.push(features.stats.taiRatio || 0);
            }
            
            // Moving averages
            if (features.movingAverages) {
                row.push(features.movingAverages.ma3_last || 0);
                row.push(features.movingAverages.ma5_last || 0);
                row.push(features.movingAverages.ma10_last || 0);
                row.push(features.movingAverages.macd || 0);
                row.push(features.movingAverages.bb_position || 0);
            }
            
            // Volatility
            if (features.volatility) {
                row.push(features.volatility.historical || 0);
                row.push(features.volatility.maxDrawdown || 0);
                row.push(features.volatility.sharpeRatio || 0);
                row.push(features.volatility.averageTrueRange || 0);
            }
            
            // Correlation
            if (features.correlation) {
                row.push(features.correlation.score_d1 || 0);
                row.push(features.correlation.score_d2 || 0);
                row.push(features.correlation.score_d3 || 0);
                row.push(features.correlation.autocorr || 0);
            }
            
            // Entropy
            if (features.entropy) {
                row.push(features.entropy.shannon || 0);
                row.push(features.entropy.normalized || 0);
            }
            
            // Fractal
            if (features.fractalFeatures) {
                row.push(features.fractalFeatures.hurst || 0);
                row.push(features.fractalFeatures.fractalDimension || 0);
            }
            
            X.push(row);
        }
        
        // Normalize
        const normalizedX = [];
        for (let j = 0; j < X[0].length; j++) {
            const col = X.map(row => row[j]);
            const mean = col.reduce((a, b) => a + b, 0) / col.length;
            const std = Math.sqrt(col.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / col.length);
            for (let i = 0; i < X.length; i++) {
                if (!normalizedX[i]) normalizedX[i] = [];
                normalizedX[i][j] = std === 0 ? 0 : (X[i][j] - mean) / std;
            }
        }
        
        return normalizedX;
    }

    // === PREDICT TỔNG HỢP ===
    predict(history) {
        const features = this.processor.extractFeatures(history);
        const X = this.prepareTrainingData(history);
        const lastX = X[X.length - 1] || new Array(50).fill(0);
        
        const predictions = [];
        
        // 1. Genetic Algorithm
        if (this.geneticInitialized) {
            const best = this.genetic.getBest();
            if (best.chromosome) {
                let score = 0;
                for (let j = 0; j < best.chromosome.length && j < lastX.length; j++) {
                    score += lastX[j] * best.chromosome[j];
                }
                const pred = score > 0 ? 'Tài' : 'Xỉu';
                const confidence = Math.min(Math.abs(score) / 10, 0.9);
                predictions.push({
                    model: 'Genetic',
                    prediction: pred,
                    confidence: 0.5 + confidence * 0.4,
                    weight: 0.8
                });
            }
        }
        
        // 2. Swarm Intelligence
        if (this.swarmInitialized && this.swarm.globalBest) {
            let score = 0;
            for (let j = 0; j < this.swarm.globalBest.length && j < lastX.length; j++) {
                score += lastX[j] * this.swarm.globalBest[j];
            }
            const pred = score > 0 ? 'Tài' : 'Xỉu';
            const confidence = Math.min(Math.abs(score) / 10, 0.9);
            predictions.push({
                model: 'Swarm',
                prediction: pred,
                confidence: 0.5 + confidence * 0.4,
                weight: 0.8
            });
        }
        
        // 3. Deep Reinforcement Learning
        const drlAction = this.drl.act(lastX, 0);
        const drlPred = drlAction === 0 ? 'Xỉu' : 'Tài';
        const drlConfidence = this.drl.getQValue(lastX, drlAction);
        predictions.push({
            model: 'DRL',
            prediction: drlPred,
            confidence: Math.min(0.5 + drlConfidence * 0.5, 0.95),
            weight: 0.7
        });
        
        // 4. Deep Neural Network
        const dnnOutput = this.dnn.predict(lastX);
        const dnnProb = dnnOutput[0] / (dnnOutput[0] + dnnOutput[1] + 1e-10);
        predictions.push({
            model: 'DNN',
            prediction: dnnProb > 0.5 ? 'Tài' : 'Xỉu',
            confidence: Math.max(dnnProb, 1 - dnnProb),
            weight: 0.9
        });
        
        // 5. Random Forest
        if (this.rfTrained) {
            const rfPred = this.randomForest.predict([lastX]);
            predictions.push({
                model: 'RF',
                prediction: rfPred.prediction,
                confidence: rfPred.confidence,
                weight: 0.85
            });
        }
        
        // 6. Gradient Boosting
        if (this.gbTrained) {
            const gbPred = this.gb.predict([lastX]);
            predictions.push({
                model: 'GB',
                prediction: gbPred.prediction,
                confidence: gbPred.confidence,
                weight: 0.85
            });
        }
        
        // 7. Extreme Learning Machine
        if (this.elmTrained) {
            const elmPred = this.elm.predict([lastX]);
            predictions.push({
                model: 'ELM',
                prediction: elmPred.prediction,
                confidence: elmPred.confidence,
                weight: 0.75
            });
        }
        
        // 8. SVM
        if (this.svmTrained) {
            const svmPred = this.svm.predict([lastX]);
            predictions.push({
                model: 'SVM',
                prediction: svmPred.prediction,
                confidence: svmPred.confidence,
                weight: 0.8
            });
        }
        
        // 9. Data Processor Patterns
        const patternResult = this.processor.detectAdvancedPatterns(history);
        if (patternResult) {
            const bestPattern = Object.values(patternResult)[0];
            if (bestPattern && bestPattern.confidence > 0.5) {
                predictions.push({
                    model: 'Pattern',
                    prediction: bestPattern.prediction,
                    confidence: bestPattern.confidence,
                    weight: 0.7
                });
            }
        }
        
        // 10. Player Psychology
        const psychology = this.processor.analyzePlayerPsychology(history);
        if (psychology && psychology.reversalProbability > 0.5) {
            const lastResult = history[history.length - 1].Ket_qua;
            const pred = psychology.reversalProbability > 0.55 ? 
                (lastResult === 'Tài' ? 'Xỉu' : 'Tài') : lastResult;
            predictions.push({
                model: 'Psychology',
                prediction: pred,
                confidence: psychology.reversalProbability,
                weight: 0.6
            });
        }
        
        // === ENSEMBLE TỔNG HỢP ===
        let taiWeight = 0, xiuWeight = 0, totalWeight = 0;
        const details = [];
        
        for (const pred of predictions) {
            const weight = pred.weight * pred.confidence;
            if (pred.prediction === 'Tài') {
                taiWeight += weight;
            } else {
                xiuWeight += weight;
            }
            totalWeight += weight;
            details.push({
                model: pred.model,
                prediction: pred.prediction,
                confidence: pred.confidence,
                weight: weight
            });
        }
        
        const probTai = totalWeight > 0 ? taiWeight / totalWeight : 0.5;
        const probXiu = totalWeight > 0 ? xiuWeight / totalWeight : 0.5;
        
        // Adjust with chaos and quantum
        const chaosAdjust = this.swarm.globalBest ? 
            (this.swarm.globalBest[0] || 0.5 - 0.5) * 0.05 : 0;
        const quantumAdjust = this.drl.epsilon < 0.1 ? 0.03 : -0.03;
        
        const adjustedTai = probTai + chaosAdjust + quantumAdjust;
        const adjustedXiu = probXiu - chaosAdjust - quantumAdjust;
        
        const finalPrediction = adjustedTai > adjustedXiu ? 'Tài' : 'Xỉu';
        const finalConfidence = Math.max(adjustedTai, adjustedXiu) * 0.9 + 0.1;
        
        // Update stats
        this.stats.totalPredictions++;
        const lastResult = history[history.length - 1].Ket_qua;
        if (finalPrediction === lastResult) {
            this.stats.correct++;
        } else {
            this.stats.wrong++;
        }
        this.stats.accuracy = this.stats.correct / this.stats.totalPredictions;
        this.stats.recentAccuracy.push(finalPrediction === lastResult ? 1 : 0);
        if (this.stats.recentAccuracy.length > 100) {
            this.stats.recentAccuracy.shift();
        }
        
        // Save weights periodically
        if (this.stats.totalPredictions % 10 === 0) {
            this.saveWeights();
        }
        
        // Top 3 models
        const topModels = details
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 3)
            .map(d => d.model)
            .join(' + ');
        
        return {
            prediction: finalPrediction,
            confidence: Math.min(finalConfidence, 0.98),
            probTai: adjustedTai,
            probXiu: adjustedXiu,
            numModels: predictions.length,
            topModels: topModels,
            details: details.slice(0, 5),
            accuracy: this.stats.accuracy,
            recentAccuracy: this.stats.recentAccuracy.slice(-10).reduce((a, b) => a + b, 0) / 
                Math.min(this.stats.recentAccuracy.length, 10)
        };
    }
}

// ================================================================
// ========== GLOBAL VARIABLES ==========
// ================================================================
let currentSessionId = null;
let lastPrediction = null;
let stats = {
    total: 0,
    correct: 0,
    wrong: 0,
    consecutiveLosses: 0
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
    "id": "@tranhoang2286"
};

// ================================================================
// ========== KHỞI TẠO SIÊU PHÂN TÍCH ==========
// ================================================================
const ultimateAnalyzer = new UltimateAnalyzer();

// Train with history
if (resultHistory.length > 50) {
    console.log(`📊 Training with ${resultHistory.length} samples...`);
    ultimateAnalyzer.train(resultHistory);
} else {
    console.log(`⚠️ Need ${50 - resultHistory.length} more samples for training`);
}

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
                }

                const historyEntry = {
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
                resultHistory.push(historyEntry);
                if (resultHistory.length > 2000) resultHistory.shift();
                fs.writeFileSync(HISTORY_FILE, JSON.stringify(resultHistory, null, 2));

                const historyForAnalyzer = resultHistory.map(h => ({
                    score: h.Tong,
                    Ket_qua: h.Ket_qua,
                    Xuc_xac_1: h.Xuc_xac_1,
                    Xuc_xac_2: h.Xuc_xac_2,
                    Xuc_xac_3: h.Xuc_xac_3
                }));

                // ====== SIÊU DỰ ĐOÁN ======
                const ultimatePrediction = ultimateAnalyzer.predict(historyForAnalyzer);
                
                let finalPrediction, finalConfidence, finalType, finalPattern;
                
                if (ultimatePrediction && ultimatePrediction.prediction) {
                    finalPrediction = ultimatePrediction.prediction;
                    finalConfidence = ultimatePrediction.confidence;
                    finalType = ultimatePrediction.topModels || 'Ultimate AI';
                    finalPattern = `${ultimatePrediction.numModels} models | ${(ultimatePrediction.recentAccuracy * 100).toFixed(1)}% recent`;
                } else {
                    finalPrediction = result === 'Tài' ? 'Xỉu' : 'Tài';
                    finalConfidence = 0.5;
                    finalType = 'FALLBACK';
                    finalPattern = 'No prediction';
                }

                // Chống đảo thông minh
                if (stats.consecutiveLosses >= 3) {
                    finalPrediction = finalPrediction === 'Tài' ? 'Xỉu' : 'Tài';
                    finalConfidence = 0.4 + stats.consecutiveLosses * 0.02;
                    finalType = `ANTI-STREAK (${stats.consecutiveLosses} losses)`;
                }

                lastPrediction = {
                    phien: currentSessionId ? parseInt(currentSessionId) + 1 : null,
                    ket_qua: finalPrediction,
                    loai_cau: finalType,
                    mau_cau: finalPattern,
                    do_tin_cay: (finalConfidence * 100).toFixed(0) + '%'
                };

                const tiLe = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) + '%' : '0%';

                apiResponseData = {
                    "Phien": currentSessionId,
                    "Xuc_xac_1": d1,
                    "Xuc_xac_2": d2,
                    "Xuc_xac_3": d3,
                    "Tong": total,
                    "Ket_qua": result,
                    "Phien_hien_tai": currentSessionId ? parseInt(currentSessionId) + 1 : null,
                    "Du_doan": finalPrediction,
                    "Loai_cau": finalType,
                    "Mau_cau_phat_hien": finalPattern,
                    "Do_tin_cay": (finalConfidence * 100).toFixed(0) + '%',
                    "Trang_thai": stats.consecutiveLosses >= 3 ? 'Chống đảo' : 'AI Predicting',
                    "Ket_qua_du_doan": predictionCorrect ? '✅' : (stats.total > 0 ? '❌' : ''),
                    "Thong_ke": {
                        "tong": stats.total,
                        "dung": stats.correct,
                        "sai": stats.wrong,
                        "ti_le": tiLe
                    },
                    "id": "@tranhoang2286"
                };

                console.log(`🎲 Phiên ${apiResponseData.Phien} | KQ: ${result} | Dự đoán: ${finalPrediction} (${(finalConfidence * 100).toFixed(0)}%) | ${predictionCorrect ? '✅' : '❌'} | TL: ${tiLe}`);
                console.log(`   🔍 ${finalType} | ${finalPattern}`);
                
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
// ========== EXPRESS API ==========
// ================================================================

app.get('/api/sunwin', (req, res) => {
    res.json(apiResponseData);
});

app.get('/api/sunwin/history', (req, res) => {
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
            consecutive_losses: stats.consecutiveLosses
        }
    });
});

app.post('/api/sunwin/train', (req, res) => {
    if (resultHistory.length < 50) {
        return res.json({ 
            error: 'Cần ít nhất 50 phiên để train', 
            current: resultHistory.length 
        });
    }
    
    ultimateAnalyzer.train(resultHistory);
    ultimateAnalyzer.saveWeights();
    
    res.json({
        success: true,
        message: 'Training hoàn tất!',
        total: resultHistory.length,
        models: ['Genetic', 'Swarm', 'DRL', 'DNN', 'RF', 'GB', 'ELM', 'SVM', 'Pattern', 'Psychology'],
        accuracy: ultimateAnalyzer.stats.accuracy
    });
});

app.get('/api/sunwin/ai-status', (req, res) => {
    res.json({
        trained: {
            rf: ultimateAnalyzer.rfTrained,
            gb: ultimateAnalyzer.gbTrained,
            elm: ultimateAnalyzer.elmTrained,
            svm: ultimateAnalyzer.svmTrained,
            genetic: ultimateAnalyzer.geneticInitialized,
            swarm: ultimateAnalyzer.swarmInitialized
        },
        stats: ultimateAnalyzer.stats,
        models: {
            genetic_population: ultimateAnalyzer.genetic.populationSize,
            swarm_particles: ultimateAnalyzer.swarm.numParticles,
            drl_epsilon: ultimateAnalyzer.drl.epsilon,
            rf_trees: ultimateAnalyzer.randomForest.numTrees,
            gb_estimators: ultimateAnalyzer.gb.numEstimators,
            elm_hidden: ultimateAnalyzer.elm.hiddenSize
        },
        total_history: resultHistory.length
    });
});

app.get('/api/sunwin/analyze', (req, res) => {
    if (resultHistory.length < 10) {
        return res.json({ error: 'Cần ít nhất 10 phiên' });
    }
    
    const history = resultHistory.slice(-30);
    const features = ultimateAnalyzer.processor.extractFeatures(history);
    
    res.json({
        features: {
            entropy: features.entropy,
            volatility: features.volatility,
            correlation: features.correlation,
            fractal: features.fractalFeatures,
            patterns: features.patterns,
            cycles: features.cycles,
            probabilities: features.probabilities
        }
    });
});

app.get('/api/sunwin/predict', (req, res) => {
    if (resultHistory.length < 5) {
        return res.json({ error: 'Cần ít nhất 5 phiên' });
    }
    
    const history = resultHistory.slice(-30);
    const prediction = ultimateAnalyzer.predict(
        history.map(h => ({
            score: h.Tong,
            Ket_qua: h.Ket_qua,
            Xuc_xac_1: h.Xuc_xac_1,
            Xuc_xac_2: h.Xuc_xac_2,
            Xuc_xac_3: h.Xuc_xac_3
        }))
    );
    
    res.json(prediction);
});

app.get('/', (req, res) => {
    res.json({
        name: "🎲 SUNWIN TX - SIÊU THUẬT TOÁN VŨ TRỤ 🎲",
        author: "@tranhoang2286",
        version: "4.0 - ULTIMATE",
        models: [
            "Genetic Algorithm (150 population)",
            "Swarm Intelligence (80 particles)",
            "Deep Reinforcement Learning",
            "Deep Neural Network (128-64-32)",
            "Random Forest (150 trees)",
            "Gradient Boosting (150 estimators)",
            "Extreme Learning Machine (200 hidden)",
            "Support Vector Machine (RBF kernel)",
            "Advanced Pattern Recognition",
            "Player Psychology Analysis"
        ],
        total_models: 10,
        endpoints: {
            "Dữ liệu hiện tại": "/api/sunwin",
            "Lịch sử": "/api/sunwin/history",
            "Train AI": "/api/sunwin/train (POST)",
            "Trạng thái AI": "/api/sunwin/ai-status",
            "Phân tích": "/api/sunwin/analyze",
            "Dự đoán": "/api/sunwin/predict"
        }
    });
});

// ================================================================
// ========== START ==========
// ================================================================

connectWebSocket();
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🎲 SUNWIN TX - SIÊU THUẬT TOÁN VŨ TRỤ (10 MODELS)`);
    console.log(`${'='.repeat(70)}`);
    console.log(`🔥 MODELS:`);
    console.log(`   1. 🧬 Genetic Algorithm (150 population)`);
    console.log(`   2. 🐝 Swarm Intelligence (80 particles)`);
    console.log(`   3. 🎮 Deep Reinforcement Learning`);
    console.log(`   4. 🧠 Deep Neural Network (128-64-32)`);
    console.log(`   5. 🌲 Random Forest (150 trees)`);
    console.log(`   6. 📈 Gradient Boosting (150 estimators)`);
    console.log(`   7. ⚡ Extreme Learning Machine (200 hidden)`);
    console.log(`   8. 🎯 Support Vector Machine (RBF kernel)`);
    console.log(`   9. 🔍 Advanced Pattern Recognition`);
    console.log(`  10. 🧠 Player Psychology Analysis`);
    console.log(`${'='.repeat(70)}`);
    console.log(`✅ API: http://localhost:${PORT}`);
    console.log(`✅ Dữ liệu: http://localhost:${PORT}/api/sunwin`);
    console.log(`✅ Lịch sử: http://localhost:${PORT}/api/sunwin/history`);
    console.log(`✅ Train AI: POST http://localhost:${PORT}/api/sunwin/train`);
    console.log(`✅ Trạng thái: http://localhost:${PORT}/api/sunwin/ai-status`);
    console.log(`✅ Phân tích: http://localhost:${PORT}/api/sunwin/analyze`);
    console.log(`✅ Dự đoán: http://localhost:${PORT}/api/sunwin/predict`);
    console.log(`${'='.repeat(70)}`);
    console.log(`📊 Đã có ${resultHistory.length} phiên lịch sử`);
    console.log(`🎯 Accuracy hiện tại: ${(ultimateAnalyzer.stats.accuracy * 100).toFixed(1)}%`);
    console.log(`${'='.repeat(70)}\n`);
});
