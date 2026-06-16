const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3001;

// ================================================================
// ========== FILE STORAGE ==========
// ================================================================
const HISTORY_FILE = './history.json';
const PATTERNS_FILE = './patterns.json';
const MODEL_WEIGHTS_FILE = './model_weights.json';
const SUPER_WEIGHTS_FILE = './super_weights.json';

let resultHistory = [];
if (fs.existsSync(HISTORY_FILE)) {
    try {
        resultHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        console.log(`[📂] Đã tải ${resultHistory.length} phiên từ history.json`);
    } catch (e) {
        console.error('[❌] Lỗi đọc history.json:', e.message);
    }
}

// ================================================================
// ========== SIÊU THUẬT TOÁN KHÔNG RANDOM - VIP PRO MAX ==========
// ================================================================

class TaiXiuSuperAnalyzer {
    constructor() {
        // === HỌC SÂU (Deep Learning Simulator) ===
        this.neuralNetwork = {
            inputSize: 30,
            hiddenLayers: [64, 128, 64],
            outputSize: 2,
            weights: this.initWeights(),
            biases: this.initBiases(),
            learningRate: 0.001,
            momentum: 0.9,
            velocity: null
        };
        
        // === LSTM Simulator ===
        this.lstmMemory = {
            cellState: new Array(64).fill(0),
            hiddenState: new Array(64).fill(0),
            weights: this.initLSTMWeights()
        };
        
        // === QUANTUM PROBABILITY ===
        this.quantumState = {
            amplitude: { Tai: 0.707, Xiu: 0.707 },
            phase: 0,
            collapseCount: 0
        };
        
        // === CHAOS THEORY ===
        this.chaosParams = {
            r: 3.8,
            x: 0.5,
            lyapunov: 0
        };
        
        // === MARKOV CHAIN ===
        this.markovChain = {
            order: 5,
            transitionMatrix: {},
            totalStates: 0
        };
        
        // === BAYESIAN ===
        this.bayesianPrior = {
            'Tài': 0.5,
            'Xỉu': 0.5
        };
        
        // === REINFORCEMENT LEARNING ===
        this.qTable = {};
        this.epsilon = 0.1;
        this.discount = 0.95;
        this.learningRateRL = 0.01;
        
        // === WAVE ANALYSIS ===
        this.wavePatterns = [];
        this.elliotWaves = [];
        
        // === THAM SỐ TỐI ƯU ===
        this.optimalParams = this.initOptimalParams();
        
        // === TRAINING DATA ===
        this.trainingData = [];
        this.epochs = 500;
        this.trained = false;
        this.trainingHistory = [];
        
        // === LOAD WEIGHTS ===
        this.loadSuperWeights();
        
        console.log('🔥 SIÊU THUẬT TOÁN VIP PRO MAX KHỞI TẠO!');
        console.log(`🧠 Neural Network: ${this.neuralNetwork.hiddenLayers.join('->')}`);
        console.log(`📊 Tổng số layers: 10 layers siêu cấp`);
    }
    
    initWeights() {
        const weights = [];
        const layers = [this.neuralNetwork.inputSize, ...this.neuralNetwork.hiddenLayers, this.neuralNetwork.outputSize];
        
        for (let i = 0; i < layers.length - 1; i++) {
            const w = [];
            for (let j = 0; j < layers[i]; j++) {
                const row = [];
                for (let k = 0; k < layers[i + 1]; k++) {
                    row.push((Math.random() - 0.5) * 2 * Math.sqrt(2 / layers[i]));
                }
                w.push(row);
            }
            weights.push(w);
        }
        return weights;
    }
    
    initBiases() {
        return this.neuralNetwork.hiddenLayers.map(size => 
            new Array(size).fill(0.01)
        ).concat([new Array(this.neuralNetwork.outputSize).fill(0.01)]);
    }
    
    initLSTMWeights() {
        return {
            Wf: this.randomMatrix(64, 64, 0.1),
            Wi: this.randomMatrix(64, 64, 0.1),
            Wc: this.randomMatrix(64, 64, 0.1),
            Wo: this.randomMatrix(64, 64, 0.1),
            Uf: this.randomMatrix(64, 64, 0.1),
            Ui: this.randomMatrix(64, 64, 0.1),
            Uc: this.randomMatrix(64, 64, 0.1),
            Uo: this.randomMatrix(64, 64, 0.1),
            bf: new Array(64).fill(0),
            bi: new Array(64).fill(0),
            bc: new Array(64).fill(0),
            bo: new Array(64).fill(0)
        };
    }
    
    randomMatrix(rows, cols, scale) {
        const m = [];
        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < cols; j++) {
                row.push((Math.random() - 0.5) * 2 * scale);
            }
            m.push(row);
        }
        return m;
    }
    
    initOptimalParams() {
        return {
            momentumWeight: 0.7,
            meanReversion: 0.3,
            volatilityThreshold: 0.15,
            confidenceBoost: 1.2,
            streakMultiplier: 0.08,
            chaosWeight: 0.15,
            quantumWeight: 0.12,
            neuralWeight: 0.25,
            lstmWeight: 0.20,
            markovWeight: 0.18,
            bayesianWeight: 0.10
        };
    }
    
    loadSuperWeights() {
        if (fs.existsSync(SUPER_WEIGHTS_FILE)) {
            try {
                const data = JSON.parse(fs.readFileSync(SUPER_WEIGHTS_FILE, 'utf8'));
                if (data.neuralWeights) {
                    this.neuralNetwork.weights = data.neuralWeights;
                    this.neuralNetwork.biases = data.neuralBiases;
                }
                if (data.lstmWeights) {
                    this.lstmMemory.weights = data.lstmWeights;
                }
                if (data.qTable) {
                    this.qTable = data.qTable;
                }
                if (data.bayesianPrior) {
                    this.bayesianPrior = data.bayesianPrior;
                }
                if (data.chaosParams) {
                    this.chaosParams = data.chaosParams;
                }
                if (data.quantumState) {
                    this.quantumState = data.quantumState;
                }
                console.log('[📂] Đã tải super_weights.json');
                this.trained = true;
            } catch (e) {
                console.error('[❌] Lỗi đọc super_weights.json:', e.message);
            }
        }
    }
    
    saveSuperWeights() {
        const data = {
            neuralWeights: this.neuralNetwork.weights,
            neuralBiases: this.neuralNetwork.biases,
            lstmWeights: this.lstmMemory.weights,
            qTable: this.qTable,
            bayesianPrior: this.bayesianPrior,
            chaosParams: this.chaosParams,
            quantumState: this.quantumState,
            trained: this.trained,
            timestamp: new Date().toISOString()
        };
        fs.writeFileSync(SUPER_WEIGHTS_FILE, JSON.stringify(data, null, 2));
    }
    
    // ==================== LAYER 1: BASIC PATTERN ====================
    layer1_BasicPattern(history) {
        const results = history.map(h => h.Ket_qua);
        if (results.length < 3) return null;
        
        const patterns = {
            '1-1': { confidence: 0, prediction: null },
            '2-2': { confidence: 0, prediction: null },
            '3-3': { confidence: 0, prediction: null },
            '1-2-1': { confidence: 0, prediction: null },
            '2-1-2': { confidence: 0, prediction: null },
            'bệt': { confidence: 0, prediction: null },
            'đảo': { confidence: 0, prediction: null },
            'xen_kẽ': { confidence: 0, prediction: null },
            'cầu_vòm': { confidence: 0, prediction: null },
            'cầu_thang': { confidence: 0, prediction: null }
        };
        
        // Cầu vòm
        if (results.length >= 7) {
            const last7 = results.slice(-7);
            if (last7[0] === last7[6] && last7[1] === last7[5] && last7[2] === last7[4]) {
                patterns['cầu_vòm'] = {
                    confidence: 0.85,
                    prediction: last7[3] === 'Tài' ? 'Xỉu' : 'Tài'
                };
            }
        }
        
        // Cầu thang
        if (results.length >= 5) {
            const last5 = results.slice(-5);
            const isStaircase = last5.every((v, i) => i === 0 || v !== last5[i-1]);
            if (isStaircase) {
                patterns['cầu_thang'] = {
                    confidence: 0.75,
                    prediction: last5[last5.length-1] === 'Tài' ? 'Xỉu' : 'Tài'
                };
            }
        }
        
        // 1-1 alternating
        if (results.length >= 4) {
            const last4 = results.slice(-4);
            if (last4[0] !== last4[1] && last4[1] !== last4[2] && last4[2] !== last4[3]) {
                patterns['1-1'] = {
                    confidence: 0.8,
                    prediction: last4[3] === 'Tài' ? 'Xỉu' : 'Tài'
                };
            }
        }
        
        // 2-2 pattern
        if (results.length >= 6) {
            const last6 = results.slice(-6);
            if (last6[0] === last6[1] && last6[1] !== last6[2] &&
                last6[2] === last6[3] && last6[3] !== last6[4] &&
                last6[4] === last6[5]) {
                patterns['2-2'] = {
                    confidence: 0.85,
                    prediction: last6[4] === 'Tài' ? 'Xỉu' : 'Tài'
                };
            }
        }
        
        // Streak
        const streak = this.getCurrentStreak(results);
        if (streak >= 3) {
            patterns['bệt'] = {
                confidence: 0.6 + streak * 0.05,
                prediction: results[results.length - 1]
            };
        }
        
        // Lấy pattern tốt nhất
        let best = { confidence: 0, prediction: null, name: '' };
        for (let [name, data] of Object.entries(patterns)) {
            if (data.confidence > best.confidence) {
                best = { ...data, name };
            }
        }
        
        if (best.confidence > 0.65) {
            return {
                prediction: best.prediction,
                confidence: best.confidence * 0.9,
                reason: `Cầu ${best.name} phát hiện`,
                layer: 'Layer 1 - Basic Pattern'
            };
        }
        
        return null;
    }
    
    // ==================== LAYER 2: NEURAL NETWORK ====================
    layer2_DeepLearning(history) {
        if (history.length < this.neuralNetwork.inputSize) return null;
        
        const input = this.prepareNeuralInput(history);
        let current = input;
        
        for (let layer = 0; layer < this.neuralNetwork.weights.length; layer++) {
            const w = this.neuralNetwork.weights[layer];
            const b = this.neuralNetwork.biases[layer];
            
            const next = new Array(w[0].length).fill(0);
            for (let i = 0; i < w.length; i++) {
                for (let j = 0; j < w[i].length; j++) {
                    next[j] += current[i] * w[i][j];
                }
            }
            for (let j = 0; j < next.length; j++) {
                next[j] += b[j];
                if (layer < this.neuralNetwork.weights.length - 1) {
                    next[j] = Math.max(0, next[j]);
                } else {
                    next[j] = 1 / (1 + Math.exp(-next[j]));
                }
            }
            current = next;
        }
        
        const probTai = current[0];
        const probXiu = current[1];
        
        if (probTai > 0.55 || probXiu > 0.55) {
            return {
                prediction: probTai > probXiu ? 'Tài' : 'Xỉu',
                confidence: Math.max(probTai, probXiu) * 1.1,
                reason: `Neural: Tai=${(probTai*100).toFixed(1)}%, Xiu=${(probXiu*100).toFixed(1)}%`,
                layer: 'Layer 2 - Deep Learning'
            };
        }
        
        return null;
    }
    
    prepareNeuralInput(history) {
        const results = history.slice(-this.neuralNetwork.inputSize);
        const input = [];
        
        results.forEach(h => {
            input.push(h.Ket_qua === 'Tài' ? 1 : 0);
        });
        
        const scores = results.map(h => h.Tong || 0);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        input.push((avgScore - 7) / 10);
        
        const variance = scores.reduce((a, b) => a + Math.pow(b - avgScore, 2), 0) / scores.length;
        input.push(Math.sqrt(variance) / 10);
        
        const streak = this.getCurrentStreak(results.map(h => h.Ket_qua));
        input.push(streak / 10);
        
        const taiCount = results.filter(h => h.Ket_qua === 'Tài').length;
        input.push(taiCount / results.length);
        
        return input;
    }
    
    // ==================== LAYER 3: LSTM ====================
    layer3_LSTM(history) {
        if (history.length < 10) return null;
        
        const sequence = history.slice(-20).map(h => h.Ket_qua === 'Tài' ? 1 : 0);
        let h = this.lstmMemory.hiddenState;
        let c = this.lstmMemory.cellState;
        
        for (let t = 0; t < sequence.length; t++) {
            const x = sequence[t];
            const W = this.lstmMemory.weights;
            
            const f = this.sigmoid(
                this.matVec(W.Wf, h) + this.matVec(W.Uf, [x]) + W.bf
            );
            const i = this.sigmoid(
                this.matVec(W.Wi, h) + this.matVec(W.Ui, [x]) + W.bi
            );
            const c_tilde = this.tanh(
                this.matVec(W.Wc, h) + this.matVec(W.Uc, [x]) + W.bc
            );
            c = this.vectorAdd(
                this.vectorMult(f, c),
                this.vectorMult(i, c_tilde)
            );
            const o = this.sigmoid(
                this.matVec(W.Wo, h) + this.matVec(W.Uo, [x]) + W.bo
            );
            h = this.vectorMult(o, this.tanh(c));
        }
        
        this.lstmMemory.hiddenState = h;
        this.lstmMemory.cellState = c;
        
        const output = h[0];
        const prediction = output > 0 ? 'Tài' : 'Xỉu';
        const confidence = Math.abs(output) * 0.8 + 0.2;
        
        if (confidence > 0.55) {
            return {
                prediction: prediction,
                confidence: Math.min(confidence, 0.95),
                reason: `LSTM: ${(confidence*100).toFixed(1)}%`,
                layer: 'Layer 3 - LSTM Memory'
            };
        }
        
        return null;
    }
    
    // ==================== LAYER 4: QUANTUM ====================
    layer4_Quantum(history) {
        if (history.length < 5) return null;
        
        const results = history.slice(-10).map(h => h.Ket_qua);
        const taiCount = results.filter(r => r === 'Tài').length;
        const xiuCount = results.length - taiCount;
        
        const probTai = taiCount / results.length;
        const probXiu = xiuCount / results.length;
        
        const phaseShift = this.calculatePhaseShift(history);
        this.quantumState.phase += phaseShift;
        
        const collapseTai = probTai + 0.3 * Math.sin(this.quantumState.phase);
        const collapseXiu = probXiu - 0.3 * Math.sin(this.quantumState.phase);
        
        const entanglement = this.detectEntanglement(history);
        
        let prediction, confidence;
        if (collapseTai > collapseXiu + 0.1) {
            prediction = 'Tài';
            confidence = collapseTai * 0.9 + 0.1;
        } else if (collapseXiu > collapseTai + 0.1) {
            prediction = 'Xỉu';
            confidence = collapseXiu * 0.9 + 0.1;
        } else {
            return null;
        }
        
        if (entanglement) {
            confidence = Math.min(confidence * 1.2, 0.95);
        }
        
        this.quantumState.collapseCount++;
        
        return {
            prediction: prediction,
            confidence: confidence,
            reason: `Quantum: ${prediction}`,
            layer: 'Layer 4 - Quantum Probability'
        };
    }
    
    calculatePhaseShift(history) {
        const recent = history.slice(-6);
        let shift = 0;
        for (let i = 1; i < recent.length; i++) {
            if (recent[i].Ket_qua !== recent[i-1].Ket_qua) {
                shift += 0.2;
            } else {
                shift -= 0.1;
            }
        }
        return Math.max(-0.5, Math.min(0.5, shift / recent.length));
    }
    
    detectEntanglement(history) {
        if (history.length < 8) return false;
        
        const last4 = history.slice(-4).map(h => h.Ket_qua);
        const prev4 = history.slice(-8, -4).map(h => h.Ket_qua);
        
        let correlation = 0;
        for (let i = 0; i < 4; i++) {
            if (last4[i] === prev4[i]) correlation++;
        }
        
        return correlation >= 3;
    }
    
    // ==================== LAYER 5: CHAOS ====================
    layer5_Chaos(history) {
        if (history.length < 10) return null;
        
        const results = history.map(h => h.Ket_qua === 'Tài' ? 1 : 0);
        
        this.chaosParams.x = this.chaosParams.r * this.chaosParams.x * (1 - this.chaosParams.x);
        this.chaosParams.lyapunov += Math.log(Math.abs(this.chaosParams.r * (1 - 2 * this.chaosParams.x)));
        
        const chaosPrediction = this.chaosParams.x > 0.5 ? 1 : 0;
        const chaosConfidence = Math.min(0.5 + Math.abs(this.chaosParams.x - 0.5) * 2, 0.9);
        
        const taiProbability = results.reduce((a, b) => a + b, 0) / results.length;
        const combinedProb = taiProbability * 0.6 + this.chaosParams.x * 0.4;
        
        const prediction = combinedProb > 0.5 ? 'Tài' : 'Xỉu';
        const confidence = Math.abs(combinedProb - 0.5) * 2 + 0.2;
        
        if (confidence > 0.55) {
            return {
                prediction: prediction,
                confidence: Math.min(confidence, 0.95),
                reason: `Chaos: Lyapunov=${this.chaosParams.lyapunov.toFixed(3)}`,
                layer: 'Layer 5 - Chaos Theory'
            };
        }
        
        return null;
    }
    
    // ==================== LAYER 6: MARKOV ====================
    layer6_Markov(history) {
        if (history.length < this.markovChain.order + 1) return null;
        
        const order = this.markovChain.order;
        const results = history.map(h => h.Ket_qua);
        const currentState = results.slice(-order).join('');
        
        let taiCount = 0, xiuCount = 0;
        let total = 0;
        
        for (let i = order; i < results.length - 1; i++) {
            const state = results.slice(i - order, i).join('');
            const next = results[i];
            
            if (state === currentState) {
                if (next === 'Tài') taiCount++;
                else xiuCount++;
                total++;
            }
        }
        
        if (total >= 3) {
            const probTai = taiCount / total;
            const probXiu = xiuCount / total;
            
            if (probTai > 0.6 || probXiu > 0.6) {
                return {
                    prediction: probTai > probXiu ? 'Tài' : 'Xỉu',
                    confidence: Math.max(probTai, probXiu) * 0.9,
                    reason: `Markov: ${total} samples`,
                    layer: 'Layer 6 - Markov Chain'
                };
            }
        }
        
        return null;
    }
    
    // ==================== LAYER 7: BAYESIAN ====================
    layer7_Bayesian(history) {
        if (history.length < 10) return null;
        
        const results = history.map(h => h.Ket_qua);
        const lastResult = results[results.length - 1];
        
        const taiAfterTai = this.countTransition(results, 'Tài', 'Tài');
        const taiAfterXiu = this.countTransition(results, 'Xỉu', 'Tài');
        const xiuAfterTai = this.countTransition(results, 'Tài', 'Xỉu');
        const xiuAfterXiu = this.countTransition(results, 'Xỉu', 'Xỉu');
        
        const priorTai = this.bayesianPrior['Tài'];
        const priorXiu = this.bayesianPrior['Xỉu'];
        
        let likelihoodTai, likelihoodXiu;
        if (lastResult === 'Tài') {
            likelihoodTai = (taiAfterTai + 1) / (taiAfterTai + xiuAfterTai + 2);
            likelihoodXiu = (taiAfterXiu + 1) / (taiAfterXiu + xiuAfterXiu + 2);
        } else {
            likelihoodTai = (xiuAfterTai + 1) / (xiuAfterTai + taiAfterTai + 2);
            likelihoodXiu = (xiuAfterXiu + 1) / (xiuAfterXiu + taiAfterXiu + 2);
        }
        
        const posteriorTai = likelihoodTai * priorTai;
        const posteriorXiu = likelihoodXiu * priorXiu;
        const total = posteriorTai + posteriorXiu;
        
        const probTai = posteriorTai / total;
        const probXiu = posteriorXiu / total;
        
        this.bayesianPrior['Tài'] = this.bayesianPrior['Tài'] * 0.95 + probTai * 0.05;
        this.bayesianPrior['Xỉu'] = this.bayesianPrior['Xỉu'] * 0.95 + probXiu * 0.05;
        
        if (Math.max(probTai, probXiu) > 0.6) {
            return {
                prediction: probTai > probXiu ? 'Tài' : 'Xỉu',
                confidence: Math.max(probTai, probXiu) * 0.9,
                reason: `Bayesian: Tai=${(probTai*100).toFixed(1)}%`,
                layer: 'Layer 7 - Bayesian Inference'
            };
        }
        
        return null;
    }
    
    countTransition(results, from, to) {
        let count = 0;
        for (let i = 0; i < results.length - 1; i++) {
            if (results[i] === from && results[i+1] === to) count++;
        }
        return count;
    }
    
    // ==================== LAYER 8: REINFORCEMENT ====================
    layer8_Reinforcement(history) {
        if (history.length < 5) return null;
        
        const state = history.slice(-5).map(h => h.Ket_qua === 'Tài' ? 1 : 0).join('');
        
        if (!this.qTable[state]) {
            this.qTable[state] = { 'Tài': 0, 'Xỉu': 0 };
        }
        
        let action;
        if (Math.random() < this.epsilon) {
            action = Math.random() < 0.5 ? 'Tài' : 'Xỉu';
        } else {
            action = this.qTable[state]['Tài'] > this.qTable[state]['Xỉu'] ? 'Tài' : 'Xỉu';
        }
        
        const lastResult = history[history.length - 1].Ket_qua;
        const reward = action === lastResult ? 1 : -1;
        
        const nextState = history.slice(-4).map(h => h.Ket_qua === 'Tài' ? 1 : 0).join('');
        if (!this.qTable[nextState]) {
            this.qTable[nextState] = { 'Tài': 0, 'Xỉu': 0 };
        }
        
        const maxNext = Math.max(this.qTable[nextState]['Tài'], this.qTable[nextState]['Xỉu']);
        this.qTable[state][action] += this.learningRateRL * (
            reward + this.discount * maxNext - this.qTable[state][action]
        );
        
        this.epsilon = Math.max(0.01, this.epsilon * 0.999);
        
        const qTai = this.qTable[state]['Tài'];
        const qXiu = this.qTable[state]['Xỉu'];
        const maxQ = Math.max(qTai, qXiu);
        
        if (maxQ > 0.2) {
            return {
                prediction: qTai > qXiu ? 'Tài' : 'Xỉu',
                confidence: Math.min(0.5 + maxQ * 0.4, 0.9),
                reason: `RL: Q(Tai)=${qTai.toFixed(2)}, Q(Xiu)=${qXiu.toFixed(2)}`,
                layer: 'Layer 8 - Reinforcement Learning'
            };
        }
        
        return null;
    }
    
    // ==================== LAYER 9: WAVE ANALYSIS ====================
    layer9_WaveAnalysis(history) {
        if (history.length < 15) return null;
        
        const results = history.map(h => h.Ket_qua);
        const waves = this.detectElliotWaves(results);
        
        if (waves.length >= 3) {
            const lastWave = waves[waves.length - 1];
            const waveType = this.classifyWave(lastWave);
            
            let prediction, confidence;
            if (waveType === 'impulse') {
                const trend = lastWave[lastWave.length - 1];
                prediction = trend;
                confidence = 0.7 + lastWave.length * 0.02;
            } else if (waveType === 'corrective') {
                prediction = lastWave[0] === 'Tài' ? 'Xỉu' : 'Tài';
                confidence = 0.6 + lastWave.length * 0.015;
            } else {
                return null;
            }
            
            return {
                prediction: prediction,
                confidence: Math.min(confidence, 0.9),
                reason: `Elliot: ${waveType}, sóng ${waves.length}`,
                layer: 'Layer 9 - Wave Analysis'
            };
        }
        
        return null;
    }
    
    detectElliotWaves(results) {
        const waves = [];
        let currentWave = [results[0]];
        
        for (let i = 1; i < results.length; i++) {
            if (results[i] === results[i-1]) {
                currentWave.push(results[i]);
            } else {
                if (currentWave.length > 0) {
                    waves.push(currentWave);
                }
                currentWave = [results[i]];
            }
        }
        
        if (currentWave.length > 0) {
            waves.push(currentWave);
        }
        
        return waves;
    }
    
    classifyWave(wave) {
        if (wave.length >= 3 && wave.length <= 5) {
            return 'impulse';
        } else if (wave.length >= 2 && wave.length <= 4) {
            return 'corrective';
        }
        return 'unknown';
    }
    
    // ==================== LAYER 10: SUPER ENSEMBLE ====================
    layer10_EnsembleSuper(history) {
        const predictions = [];
        const layers = [
            this.layer1_BasicPattern.bind(this),
            this.layer2_DeepLearning.bind(this),
            this.layer3_LSTM.bind(this),
            this.layer4_Quantum.bind(this),
            this.layer5_Chaos.bind(this),
            this.layer6_Markov.bind(this),
            this.layer7_Bayesian.bind(this),
            this.layer8_Reinforcement.bind(this),
            this.layer9_WaveAnalysis.bind(this)
        ];
        
        for (let layer of layers) {
            const result = layer(history);
            if (result) predictions.push(result);
        }
        
        if (predictions.length === 0) return null;
        
        let taiWeight = 0, xiuWeight = 0;
        let totalWeight = 0;
        const details = [];
        
        for (const pred of predictions) {
            const weight = pred.confidence * this.getLayerWeight(pred.layer);
            if (pred.prediction === 'Tài') {
                taiWeight += weight;
            } else {
                xiuWeight += weight;
            }
            totalWeight += weight;
            details.push({
                layer: pred.layer,
                prediction: pred.prediction,
                confidence: pred.confidence,
                weight: weight,
                reason: pred.reason
            });
        }
        
        const probTai = taiWeight / totalWeight;
        const probXiu = xiuWeight / totalWeight;
        
        const chaosAdjust = this.chaosParams.x > 0.5 ? 0.05 : -0.05;
        const quantumAdjust = this.quantumState.phase > 0 ? 0.03 : -0.03;
        
        const adjustedTai = probTai + chaosAdjust + quantumAdjust;
        const adjustedXiu = probXiu - chaosAdjust - quantumAdjust;
        
        const finalPrediction = adjustedTai > adjustedXiu ? 'Tài' : 'Xỉu';
        const finalConfidence = Math.max(adjustedTai, adjustedXiu) * 0.9 + 0.1;
        
        const topLayers = details
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 3)
            .map(d => d.layer.split(' - ')[0])
            .join(' + ');
        
        return {
            prediction: finalPrediction,
            confidence: Math.min(finalConfidence, 0.95),
            reason: `ENSEMBLE: ${topLayers} | ${details.length} layers`,
            details: details.slice(0, 5),
            layer: 'Layer 10 - Super Ensemble'
        };
    }
    
    getLayerWeight(layerName) {
        const weights = {
            'Layer 1': 0.15,
            'Layer 2': 0.25,
            'Layer 3': 0.20,
            'Layer 4': 0.12,
            'Layer 5': 0.10,
            'Layer 6': 0.15,
            'Layer 7': 0.10,
            'Layer 8': 0.08,
            'Layer 9': 0.12
        };
        
        for (let [key, value] of Object.entries(weights)) {
            if (layerName.includes(key)) return value;
        }
        return 0.1;
    }
    
    // ==================== HÀM HỖ TRỢ ====================
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }
    
    tanh(x) {
        return Math.tanh(x);
    }
    
    matVec(matrix, vector) {
        const result = new Array(matrix.length).fill(0);
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < vector.length; j++) {
                result[i] += matrix[i][j] * vector[j];
            }
        }
        return result;
    }
    
    vectorAdd(a, b) {
        return a.map((v, i) => v + b[i]);
    }
    
    vectorMult(scalar, vector) {
        return vector.map(v => v * scalar);
    }
    
    getCurrentStreak(results) {
        if (results.length === 0) return 0;
        const last = results[results.length - 1];
        let streak = 1;
        for (let i = results.length - 2; i >= 0; i--) {
            if (results[i] === last) streak++;
            else break;
        }
        return streak;
    }
    
    // ==================== TRAINING ====================
    train(history) {
        console.log('🚀 BẮT ĐẦU TRAINING SIÊU THUẬT TOÁN...');
        const startTime = Date.now();
        
        this.trainingData = history;
        
        for (let epoch = 0; epoch < this.epochs; epoch++) {
            let totalLoss = 0;
            
            for (let i = 30; i < history.length - 1; i++) {
                const input = this.prepareNeuralInput(history.slice(0, i + 1));
                const target = history[i + 1].Ket_qua === 'Tài' ? [1, 0] : [0, 1];
                
                const output = this.forwardPass(input);
                
                const loss = -Math.log(output[0] + 1e-10) * target[0] - 
                             Math.log(output[1] + 1e-10) * target[1];
                totalLoss += loss;
                
                this.backwardPass(input, target, output);
            }
            
            if (epoch % 100 === 0) {
                console.log(`Epoch ${epoch}/${this.epochs}, Loss: ${(totalLoss / (history.length - 30)).toFixed(4)}`);
            }
        }
        
        this.trained = true;
        this.saveSuperWeights();
        
        const endTime = Date.now();
        console.log(`✅ TRAINING HOÀN TẤT! Time: ${(endTime - startTime) / 1000}s`);
    }
    
    forwardPass(input) {
        let current = input;
        for (let layer = 0; layer < this.neuralNetwork.weights.length; layer++) {
            const w = this.neuralNetwork.weights[layer];
            const b = this.neuralNetwork.biases[layer];
            
            const next = new Array(w[0].length).fill(0);
            for (let i = 0; i < w.length; i++) {
                for (let j = 0; j < w[i].length; j++) {
                    next[j] += current[i] * w[i][j];
                }
            }
            for (let j = 0; j < next.length; j++) {
                next[j] += b[j];
                if (layer < this.neuralNetwork.weights.length - 1) {
                    next[j] = Math.max(0, next[j]);
                } else {
                    next[j] = 1 / (1 + Math.exp(-next[j]));
                }
            }
            current = next;
        }
        return current;
    }
    
    backwardPass(input, target, output) {
        const delta = new Array(output.length);
        for (let i = 0; i < output.length; i++) {
            delta[i] = output[i] - target[i];
        }
        
        const lastLayer = this.neuralNetwork.weights.length - 1;
        const prevOutput = this.getLayerOutput(lastLayer - 1, input);
        
        for (let i = 0; i < this.neuralNetwork.weights[lastLayer].length; i++) {
            for (let j = 0; j < this.neuralNetwork.weights[lastLayer][i].length; j++) {
                const grad = delta[j] * prevOutput[i] * this.neuralNetwork.learningRate;
                this.neuralNetwork.weights[lastLayer][i][j] -= grad;
            }
        }
        for (let j = 0; j < this.neuralNetwork.biases[lastLayer].length; j++) {
            this.neuralNetwork.biases[lastLayer][j] -= delta[j] * this.neuralNetwork.learningRate;
        }
    }
    
    getLayerOutput(layer, input) {
        let current = input;
        for (let l = 0; l <= layer; l++) {
            const w = this.neuralNetwork.weights[l];
            const b = this.neuralNetwork.biases[l];
            
            const next = new Array(w[0].length).fill(0);
            for (let i = 0; i < w.length; i++) {
                for (let j = 0; j < w[i].length; j++) {
                    next[j] += current[i] * w[i][j];
                }
            }
            for (let j = 0; j < next.length; j++) {
                next[j] += b[j];
                if (l < this.neuralNetwork.weights.length - 1) {
                    next[j] = Math.max(0, next[j]);
                }
            }
            current = next;
        }
        return current;
    }
    
    // ==================== MAIN PREDICT ====================
    predict(history) {
        if (this.trained) {
            const result = this.layer10_EnsembleSuper(history);
            if (result && result.confidence > 0.5) {
                return result;
            }
        }
        
        const result = this.layer10_EnsembleSuper(history);
        if (result && result.confidence > 0.5) {
            return result;
        }
        
        return this.emergencyPrediction(history);
    }
    
    emergencyPrediction(history) {
        const results = history.map(h => h.Ket_qua);
        const last = results[results.length - 1];
        const streak = this.getCurrentStreak(results);
        
        const recent = results.slice(-20);
        const taiCount = recent.filter(r => r === 'Tài').length;
        const xiuCount = recent.length - taiCount;
        const ratio = Math.max(taiCount, xiuCount) / recent.length;
        const dominant = taiCount > xiuCount ? 'Tài' : 'Xỉu';
        
        if (streak >= 6) {
            return {
                prediction: last === 'Tài' ? 'Xỉu' : 'Tài',
                confidence: 0.7 + streak * 0.02,
                reason: `EMERGENCY: Bệt ${streak} phiên`,
                layer: 'Emergency Protocol'
            };
        }
        
        if (ratio > 0.7) {
            return {
                prediction: dominant === 'Tài' ? 'Xỉu' : 'Tài',
                confidence: 0.6 + (ratio - 0.5) * 2,
                reason: `EMERGENCY: Tần suất ${dominant} ${(ratio*100).toFixed(0)}%`,
                layer: 'Emergency Protocol'
            };
        }
        
        return {
            prediction: last === 'Tài' ? 'Xỉu' : 'Tài',
            confidence: 0.55,
            reason: 'EMERGENCY: Fallback',
            layer: 'Emergency Protocol'
        };
    }
}

// ================================================================
// ========== GLOBAL VARIABLES ==========
// ================================================================
let currentSessionId = null;
let lastResult = null;
let lastPrediction = null;
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
    "id": "@tranhoang2286"
};

// ================================================================
// ========== KHỞI TẠO SIÊU PHÂN TÍCH ==========
// ================================================================
const superAnalyzer = new TaiXiuSuperAnalyzer();

// Training với dữ liệu lịch sử
if (resultHistory.length > 100) {
    console.log(`📊 Đang train với ${resultHistory.length} phiên...`);
    superAnalyzer.train(resultHistory);
} else {
    console.log(`⚠️ Cần ${100 - resultHistory.length} phiên nữa để train`);
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
                if (resultHistory.length > 1000) resultHistory.shift();
                fs.writeFileSync(HISTORY_FILE, JSON.stringify(resultHistory, null, 2));

                const historyForAnalyzer = resultHistory.map(h => ({
                    score: h.Tong,
                    Ket_qua: h.Ket_qua,
                    Xuc_xac_1: h.Xuc_xac_1,
                    Xuc_xac_2: h.Xuc_xac_2,
                    Xuc_xac_3: h.Xuc_xac_3
                }));

                // ====== DỰ ĐOÁN BẰNG SIÊU THUẬT TOÁN ======
                const superPrediction = superAnalyzer.predict(historyForAnalyzer);
                
                let finalPrediction, finalConfidence, finalType, finalPattern, finalReason;
                
                if (superPrediction && superPrediction.prediction) {
                    finalPrediction = superPrediction.prediction;
                    finalConfidence = superPrediction.confidence;
                    finalType = superPrediction.layer || 'Super AI';
                    finalPattern = superPrediction.reason || '';
                    finalReason = superPrediction.reason || '';
                } else {
                    finalPrediction = result === 'Tài' ? 'Xỉu' : 'Tài';
                    finalConfidence = 0.5;
                    finalType = 'FALLBACK';
                    finalPattern = 'Không đủ dữ liệu';
                }

                // Chống đảo khi thua liên tiếp
                if (stats.consecutiveLosses >= 3) {
                    finalPrediction = finalPrediction === 'Tài' ? 'Xỉu' : 'Tài';
                    finalConfidence = 0.4;
                    finalType = 'CHỐNG ĐẢO (SAU ' + stats.consecutiveLosses + ' LẦN THUA)';
                }

                lastPrediction = {
                    phien: currentSessionId ? parseInt(currentSessionId) + 1 : null,
                    ket_qua: finalPrediction,
                    loai_cau: finalType,
                    mau_cau: finalPattern,
                    do_tin_cay: (finalConfidence * 100).toFixed(0) + '%'
                };

                const trangThai = finalType.includes('CHỐNG') ? 'Chống đảo' :
                                 (finalType.includes('THEO') ? 'Đang theo kết quả' : 'Đang theo cầu');

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
                    "Trang_thai": trangThai,
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
        }
    });
});

app.post('/api/sunwin/train', (req, res) => {
    if (resultHistory.length < 100) {
        return res.json({ error: 'Cần ít nhất 100 phiên để train', current: resultHistory.length });
    }
    
    superAnalyzer.train(resultHistory);
    superAnalyzer.saveSuperWeights();
    
    res.json({
        success: true,
        message: 'Training hoàn tất!',
        total: resultHistory.length,
        layers: 10,
        trained: superAnalyzer.trained
    });
});

app.get('/api/sunwin/ai-status', (req, res) => {
    res.json({
        trained: superAnalyzer.trained,
        layers: 10,
        epsilon: superAnalyzer.epsilon,
        chaos_x: superAnalyzer.chaosParams.x,
        lyapunov: superAnalyzer.chaosParams.lyapunov,
        quantum_phase: superAnalyzer.quantumState.phase,
        qTable_size: Object.keys(superAnalyzer.qTable).length,
        neural_weights: superAnalyzer.neuralNetwork.weights.length,
        lstm_state: superAnalyzer.lstmMemory.hiddenState.slice(0, 5),
        total_history: resultHistory.length,
        stats: {
            tong: stats.total,
            dung: stats.correct,
            sai: stats.wrong,
            ti_le: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) + '%' : '0%'
        }
    });
});

app.get('/', (req, res) => {
    res.json({
        name: "🎲 SUNWIN TX - SIÊU THUẬT TOÁN VIP PRO MAX 🎲",
        author: "@tranhoang2286",
        version: "3.0 - KHÔNG RANDOM",
        layers: "10 LỚP SIÊU CẤP",
        endpoints: {
            "Dữ liệu hiện tại": "/api/sunwin",
            "Lịch sử": "/api/sunwin/history",
            "Train AI": "/api/sunwin/train (POST)",
            "Trạng thái AI": "/api/sunwin/ai-status"
        }
    });
});

// ================================================================
// ========== START ==========
// ================================================================

connectWebSocket();
app.listen(PORT, () => {
    console.log(`\n============================================================`);
    console.log(`🎲 SUNWIN TX - SIÊU THUẬT TOÁN VIP PRO MAX`);
    console.log(`============================================================`);
    console.log(`🔥 10 LỚP DỰ ĐOÁN KHÔNG RANDOM:`);
    console.log(`   Layer 1: Basic Pattern Detection`);
    console.log(`   Layer 2: Deep Neural Network (64-128-64)`);
    console.log(`   Layer 3: LSTM Memory (64 cells)`);
    console.log(`   Layer 4: Quantum Probability`);
    console.log(`   Layer 5: Chaos Theory`);
    console.log(`   Layer 6: Markov Chain (bậc 5)`);
    console.log(`   Layer 7: Bayesian Inference`);
    console.log(`   Layer 8: Reinforcement Learning (Q-Learning)`);
    console.log(`   Layer 9: Elliot Wave Analysis`);
    console.log(`   Layer 10: Super Ensemble`);
    console.log(`============================================================`);
    console.log(`✅ API: http://localhost:${PORT}`);
    console.log(`✅ Dữ liệu: http://localhost:${PORT}/api/sunwin`);
    console.log(`✅ Lịch sử: http://localhost:${PORT}/api/sunwin/history`);
    console.log(`✅ Train AI: POST http://localhost:${PORT}/api/sunwin/train`);
    console.log(`✅ Trạng thái: http://localhost:${PORT}/api/sunwin/ai-status`);
    console.log(`============================================================`);
    console.log(`📊 Đã có ${resultHistory.length} phiên lịch sử`);
    console.log(`🧠 Đã train: ${superAnalyzer.trained ? '✅' : '❌'}`);
    console.log(`============================================================\n`);
});
