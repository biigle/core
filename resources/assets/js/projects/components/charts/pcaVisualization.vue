<template>
    <div class="chart grid-col-span-3">
        <div v-if="!hasLoaded" class="pca-show-button">
            <button 
                class="btn btn-sm btn-default"
                @click="handleShowClick"
                :disabled="loading || processing"
            >
                <i v-if="loading || processing" class="fa fa-spinner fa-spin"></i>
                <i v-else class="fa fa-play"></i>
                {{ getLoadingText() }}
            </button>
        </div>
        
        <div v-if="error" class="alert alert-warning">
            <i class="fa fa-exclamation-triangle"></i> {{ error }}
            <button 
                class="btn btn-sm btn-default retry-btn"
                @click="handleShowClick"
                :disabled="loading || processing"
            >
                <i v-if="loading || processing" class="fa fa-spinner fa-spin"></i>
                <i v-else class="fa fa-refresh"></i>
                Retry
            </button>
        </div>
        
        <div v-else-if="hasLoaded && (!hasValidData)" class="alert alert-info">
            <i class="fa fa-info-circle"></i> No feature vectors found for this project.
        </div>
        
        <div v-else-if="hasLoaded && hasValidData">
            <div v-if="processing" class="processing-indicator">
                <div class="text-center">
                    <i class="fa fa-spinner fa-spin fa-2x"></i>
                    <p class="mt-2">Computing {{ method.toUpperCase() }}... This may take a few moments.</p>
                </div>
            </div>
            <div class="controls-panel">
                <div class="control-group">
                    <label class="control-label">Method:</label>
                    <div class="toggle-buttons">
                        <button 
                            class="btn btn-sm"
                            :class="{ 'btn-primary': method === 'pca', 'btn-default': method !== 'pca' }"
                            @click="method = 'pca'"
                        >
                            PCA
                        </button>
                        <button 
                            class="btn btn-sm"
                            :class="{ 'btn-primary': method === 'umap', 'btn-default': method !== 'umap' }"
                            @click="method = 'umap'"
                        >
                            UMAP
                        </button>
                        <button 
                            class="btn btn-sm"
                            :class="{ 'btn-primary': method === 'tsne', 'btn-default': method !== 'tsne' }"
                            @click="method = 'tsne'"
                        >
                            t-SNE
                        </button>
                    </div>
                </div>
                
                <div class="control-group">
                    <label class="control-label">Visualization:</label>
                    <div class="toggle-switch">
                        <input 
                            type="checkbox" 
                            id="dimension-toggle" 
                            v-model="is3D"
                            class="toggle-input"
                        >
                        <label for="dimension-toggle" class="toggle-label">
                            <span class="toggle-option">2D</span>
                            <span class="toggle-slider"></span>
                            <span class="toggle-option">3D</span>
                        </label>
                    </div>
                </div>
                
                <div v-if="!is3D" class="control-group">
                    <label class="control-label">Components:</label>
                    <div class="toggle-switch">
                        <input 
                            type="checkbox" 
                            id="components-toggle" 
                            v-model="showPC2vsPC3"
                            class="toggle-input"
                        >
                        <label for="components-toggle" class="toggle-label">
                            <span class="toggle-option">PC1 vs PC2</span>
                            <span class="toggle-slider"></span>
                            <span class="toggle-option">PC3 vs PC2</span>
                        </label>
                    </div>
                </div>
            </div>
            
            <div v-if="!processing" ref="root" class="chart-container" :class="{ 'chart-3d': is3D }"></div>
        </div>
    </div>
</template>

<script>
import { use, init } from 'echarts/core';
import { ScatterChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import 'echarts-gl';
import { markRaw } from 'vue';

export default {
    name: 'PcaVisualization',
    props: {
        projectId: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            loading: false,
            error: null,
            rawData: [], // Raw data from backend for frontend processing
            processedData: [], // Processed data ready for visualization
            dataCount: 0,
            chart: null,
            hasLoaded: false,
            is3D: false,
            showPC2vsPC3: false, // false = PC1 vs PC2, true = PC3 vs PC2
            method: 'pca', // 'pca', 'umap', or 'tsne'
            processing: false, // Flag for frontend processing
        };
    },
    computed: {
        hasValidData() {
            // Check if we have raw data (for t-SNE/UMAP) or processed data (for PCA or completed processing)
            return (this.rawData && this.rawData.length > 0) || (this.processedData && this.processedData.length > 0);
        },
        uniqueLabels() {
            const data = this.processedData || [];
            if (data.length === 0) {
                return [];
            }
            
            const labelMap = new Map();
            data.forEach(point => {
                const key = point.label_id;
                if (labelMap.has(key)) {
                    labelMap.get(key).count++;
                } else {
                    labelMap.set(key, {
                        id: point.label_id,
                        name: point.label_name,
                        color: point.label_color,
                        count: 1,
                    });
                }
            });
            
            return Array.from(labelMap.values()).sort((a, b) => b.count - a.count);
        },
        chartData() {
            const data = this.processedData || [];
            if (data.length === 0 || this.processing) {
                return [];
            }
            
            // Group data by label for better visualization
            const labelGroups = new Map();
            data.forEach(point => {
                // Ensure we have the required properties
                if (!point || typeof point.x === 'undefined' || typeof point.y === 'undefined') {
                    return; // Skip invalid points
                }
                
                const key = point.label_name || 'Unknown';
                if (!labelGroups.has(key)) {
                    labelGroups.set(key, {
                        name: key,
                        type: this.is3D ? 'scatter3D' : 'scatter',
                        data: [],
                        symbolSize: 6,
                        symbol: 'circle',
                        itemStyle: {
                            color: point.label_color ? '#' + point.label_color : '#1f77b4',
                            opacity: 0.8,
                        },
                    });
                }
                
                // Select which components to display
                let coords;
                if (this.is3D) {
                    coords = [point.x, point.y, point.z || 0];
                } else if (!this.showPC2vsPC3) {
                    coords = [point.x, point.y]; // PC1 vs PC2
                } else {
                    coords = [point.z || 0, point.y]; // PC3 vs PC2 (PC2 on y-axis)
                }
                
                labelGroups.get(key).data.push(coords);
            });
            
            const result = Array.from(labelGroups.values());
            
            // Debug: Ensure we have data
            if (result.length === 0) {
                // If no groups found, create a single group with all points
                const allPoints = [];
                data.forEach(point => {
                    if (point && typeof point.x !== 'undefined' && typeof point.y !== 'undefined') {
                        if (this.is3D) {
                            allPoints.push([point.x, point.y, point.z || 0]);
                        } else if (!this.showPC2vsPC3) {
                            allPoints.push([point.x, point.y]);
                        } else {
                            allPoints.push([point.z || 0, point.y]);
                        }
                    }
                });
                
                if (allPoints.length > 0) {
                    return [{
                        name: 'Data Points',
                        type: this.is3D ? 'scatter3D' : 'scatter',
                        data: allPoints,
                        symbolSize: 6,
                        symbol: 'circle',
                        itemStyle: {
                            color: '#1f77b4',
                            opacity: 0.8,
                        },
                    }];
                }
            }
            
            return result;
        },
        chartOption() {
            const baseOption = {
                backgroundColor: 'transparent',
                title: {
                    text: `${this.method.toUpperCase()} Feature Visualization`,
                    subtext: this.getSubtitle(),
                    left: 'center',
                    top: '2%',
                    textStyle: {
                        fontSize: 15,
                    },
                    subtextStyle: {
                        fontSize: 12,
                    },
                },
                tooltip: {
                    trigger: 'item',
                    formatter: this.getTooltipFormatter(),
                },
                legend: {
                    type: 'scroll',
                    orient: 'horizontal',
                    bottom: '5%',
                    left: 'center',
                    pageButtonPosition: 'end',
                },
                series: this.chartData,
                animation: true,
                animationDuration: 1000,
            };
            
            if (this.is3D) {
                return {
                    ...baseOption,
                    grid3D: {
                        left: '5%',
                        right: '5%',
                        top: '12%',
                        bottom: '15%', // Reduced space for legend to fit within container
                        width: '90%',
                        height: '65%', // Increased height since legend space is reduced
                        viewControl: {
                            projection: 'perspective',
                            autoRotate: false,
                            rotateSensitivity: 1,
                            zoomSensitivity: 1,
                            panSensitivity: 1,
                            alpha: 20,
                            beta: 40,
                            distance: 200, // Further increased distance to zoom out more and fit within canvas
                        },
                        postEffect: {
                            enable: false
                        },
                        light: {
                            main: {
                                intensity: 1.2,
                                shadow: false
                            },
                            ambient: {
                                intensity: 0.3
                            }
                        }
                    },
                    legend: {
                        type: 'scroll',
                        orient: 'horizontal',
                        bottom: '1%', // Move legend closer to bottom edge but within container
                        left: 'center',
                        pageButtonPosition: 'end',
                        itemWidth: 12, // Smaller legend items for better fit
                        itemHeight: 12,
                        textStyle: {
                            fontSize: 10 // Smaller text for more compact legend
                        },
                        padding: [2, 5, 2, 5] // Reduced padding to save space
                    },
                    xAxis3D: {
                        type: 'value',
                        name: `${this.method.toUpperCase()}1`,
                        nameTextStyle: {
                            fontSize: 11
                        }
                    },
                    yAxis3D: {
                        type: 'value',
                        name: `${this.method.toUpperCase()}2`,
                        nameTextStyle: {
                            fontSize: 11
                        }
                    },
                    zAxis3D: {
                        type: 'value',
                        name: `${this.method.toUpperCase()}3`,
                        nameTextStyle: {
                            fontSize: 11
                        }
                    },
                };
            } else {
                let xAxisName, yAxisName;
                const methodName = this.method === 'tsne' ? 't-SNE' : this.method.toUpperCase();
                if (!this.showPC2vsPC3) {
                    xAxisName = `${methodName} Component 1`;
                    yAxisName = `${methodName} Component 2`;
                } else {
                    xAxisName = `${methodName} Component 3`;
                    yAxisName = `${methodName} Component 2`;
                }
                
                return {
                    ...baseOption,
                    grid: {
                        left: '8%',
                        right: '5%',
                        top: '18%',
                        bottom: '25%',
                    },
                    xAxis: {
                        type: 'value',
                        name: xAxisName,
                        nameLocation: 'middle',
                        nameGap: 25,
                        splitLine: {
                            show: true,
                            lineStyle: {
                                type: 'dashed',
                            },
                        },
                    },
                    yAxis: {
                        type: 'value',
                        name: yAxisName,
                        nameLocation: 'middle',
                        nameGap: 35,
                        splitLine: {
                            show: true,
                            lineStyle: {
                                type: 'dashed',
                            },
                        },
                    },
                };
            }
        },
    },
    watch: {
        chartOption() {
            if (this.chart) {
                this.chart.setOption(this.chartOption, true); // true = notMerge, completely replace options
            }
        },
        pcComponents() {
            if (this.chart && this.hasLoaded) {
                this.chart.setOption(this.chartOption, true);
            }
        },
        showPC2vsPC3() {
            if (this.chart && this.hasLoaded) {
                this.chart.setOption(this.chartOption, true);
            }
        },
        is3D() {
            if (this.chart && this.hasLoaded) {
                // Clear and recreate chart when switching between 2D/3D to prevent axis overlap
                this.chart.dispose();
                this.initChart();
            }
        },
        method() {
            if (this.hasLoaded && !this.processing) {
                // Reload data when method changes (only if not currently processing)
                this.processedData = [];
                this.loadData();
            }
        },
    },
    beforeCreate() {
        use([
            ScatterChart,
            TitleComponent,
            TooltipComponent,
            LegendComponent,
            GridComponent,
            CanvasRenderer,
        ]);
    },
    async mounted() {
        // Don't load data automatically - wait for user to click Show button
    },
    beforeUnmount() {
        if (this.chart) {
            this.chart.dispose();
        }
    },
    methods: {
        getSubtitle() {
            const methodName = this.method === 'tsne' ? 't-SNE' : this.method.toUpperCase();
            if (this.is3D) {
                return `${methodName} Components 1, 2, and 3 of annotation feature vectors (3D)`;
            } else if (!this.showPC2vsPC3) {
                return `${methodName} Components 1 vs 2 of annotation feature vectors`;
            } else {
                return `${methodName} Components 3 vs 2 of annotation feature vectors`;
            }
        },
        getTooltipFormatter() {
            const prefix = this.method === 'tsne' ? 'tSNE' : this.method.toUpperCase();
            if (this.is3D) {
                return function(params) {
                    return `${params.seriesName}<br/>${prefix}1: ${params.value[0].toFixed(3)}<br/>${prefix}2: ${params.value[1].toFixed(3)}<br/>${prefix}3: ${params.value[2].toFixed(3)}`;
                };
            } else if (!this.showPC2vsPC3) {
                return function(params) {
                    return `${params.seriesName}<br/>${prefix}1: ${params.value[0].toFixed(3)}<br/>${prefix}2: ${params.value[1].toFixed(3)}`;
                };
            } else {
                return function(params) {
                    return `${params.seriesName}<br/>${prefix}3: ${params.value[0].toFixed(3)}<br/>${prefix}2: ${params.value[1].toFixed(3)}`;
                };
            }
        },
        handleShowClick() {
            this.loadData();
        },
        getLoadingText() {
            if (this.loading) return 'Loading...';
            if (this.processing) return `Computing ${this.method.toUpperCase()}...`;
            return 'Show Feature Visualization';
        },
        async loadData() {
            this.loading = true;
            this.error = null;
            
            try {
                const PcaVisualizationApi = biigle.$require('api.pcaVisualization');
                
                // Pass method parameter directly in URL parameters
                const response = await PcaVisualizationApi.get({
                    id: this.projectId,
                    method: this.method
                });
                
                this.rawData = response.body.data;
                this.dataCount = response.body.count;
                this.hasLoaded = true;
                
                if (response.body.message) {
                    this.error = response.body.message;
                    return;
                }
                
                if (!this.rawData || this.rawData.length === 0) {
                    this.processedData = [];
                    return;
                }

                // Process data based on method
                await this.processData();
                
            } catch (error) {
                console.error('Error loading feature visualization data:', error);
                this.error = 'Failed to load feature vectors. Please try again later.';
                this.hasLoaded = true;
            } finally {
                this.loading = false;
            }
        },
        async processData() {
            if (this.method === 'pca') {
                // PCA data is already processed by backend
                this.processedData = this.rawData;
            } else if (this.method === 'tsne') {
                await this.computeTSNE();
            } else if (this.method === 'umap') {
                await this.computeUMAP();
            }
            
            // Initialize chart after processing
            if (this.processedData && this.processedData.length > 0) {
                setTimeout(() => {
                    this.initChart();
                }, 50);
            }
        },
        async computeTSNE() {
            this.processing = true;
            
            try {
                // Check if we have valid raw data
                if (!this.rawData || !Array.isArray(this.rawData) || this.rawData.length === 0) {
                    throw new Error('No valid raw data available for t-SNE computation');
                }
                
                // Extract vectors from raw data
                let vectors;
                const firstItem = this.rawData[0];
                
                // Check if this has the structure expected for t-SNE (raw vectors with metadata)
                if (firstItem && firstItem.vector && Array.isArray(firstItem.vector)) {
                    vectors = this.rawData.map(item => {
                        if (!item || !item.vector || !Array.isArray(item.vector)) {
                            throw new Error('Invalid data format: missing or invalid vector property');
                        }
                        return item.vector;
                    });
                } else {
                    // Check if data has already processed coordinates (x, y, z) - indicates PCA data
                    if (firstItem && (typeof firstItem.x !== 'undefined' || 
                                     typeof firstItem.y !== 'undefined' || 
                                     typeof firstItem.z !== 'undefined')) {
                        throw new Error('Backend returned processed coordinates instead of raw vectors. Check backend method handling.');
                    } else {
                        throw new Error('Unknown data format - cannot extract vectors for t-SNE');
                    }
                }
                
                // Validate vectors
                if (!vectors || vectors.length === 0) {
                    throw new Error('No vectors extracted from raw data');
                }
                
                const numSamples = vectors.length;
                
                // Configure t-SNE parameters
                const perplexity = Math.min(30, Math.max(5, Math.floor(numSamples / 4)));
                
                // Simple t-SNE implementation
                const embedding = await this.runSimpleTSNE(vectors, perplexity);
                
                // Check if embedding was computed successfully
                if (!embedding || embedding.length === 0) {
                    throw new Error('t-SNE computation returned empty result');
                }
                
                // Convert to 3D format (adding z=0)
                const embedding3D = embedding.map(point => [point[0], point[1], 0]);
                
                // Normalize to [-1, 1] range and combine with metadata
                this.processedData = this.normalizeEmbedding(embedding3D);
                
                // Ensure we have valid processed data
                if (!this.processedData || this.processedData.length === 0) {
                    throw new Error('Failed to normalize t-SNE embedding data');
                }
                
                // Force chart update in next tick
                this.$nextTick(() => {
                    if (this.chart) {
                        this.chart.dispose();
                    }
                    this.initChart();
                });
                
            } catch (error) {
                console.error('t-SNE computation error:', error);
                this.error = 't-SNE computation failed. Falling back to PCA.';
                
                // Fallback to PCA by reloading with PCA method
                this.method = 'pca';
                await this.loadData();
            } finally {
                this.processing = false;
            }
        },
        async computeUMAP() {
            // UMAP implementation placeholder
            this.processing = true;
            
            try {
                // For now, show an error message
                this.error = 'UMAP is not yet implemented. Please use PCA or t-SNE.';
                
                // Fallback to PCA
                this.method = 'pca';
                await this.loadData();
            } finally {
                this.processing = false;
            }
        },
        async runSimpleTSNE(vectors, perplexity = 30) {
            const n = vectors.length;
            const dims = vectors[0].length;
            
            // Initialize 2D embedding randomly
            const Y = [];
            for (let i = 0; i < n; i++) {
                Y.push([
                    (Math.random() - 0.5) * 0.0001, // Very small initial values
                    (Math.random() - 0.5) * 0.0001
                ]);
            }
            
            // Calculate pairwise squared distances in high dimension
            const distances = [];
            for (let i = 0; i < n; i++) {
                distances[i] = [];
                for (let j = 0; j < n; j++) {
                    let dist = 0;
                    for (let k = 0; k < dims; k++) {
                        const diff = vectors[i][k] - vectors[j][k];
                        dist += diff * diff;
                    }
                    distances[i][j] = dist;
                }
            }
            
            // Calculate P matrix with simpler approach
            const P = [];
            const targetEntropy = Math.log(perplexity);
            
            for (let i = 0; i < n; i++) {
                P[i] = [];
                let beta = 1.0;
                let tries = 0;
                
                while (tries < 50) {
                    let sum = 0;
                    let probs = [];
                    
                    // Calculate probabilities
                    for (let j = 0; j < n; j++) {
                        if (i !== j) {
                            const prob = Math.exp(-beta * distances[i][j]);
                            probs.push(prob);
                            sum += prob;
                        } else {
                            probs.push(0);
                        }
                    }
                    
                    if (sum === 0) {
                        beta /= 2;
                        tries++;
                        continue;
                    }
                    
                    // Normalize and calculate entropy
                    let entropy = 0;
                    for (let j = 0; j < n; j++) {
                        if (i !== j) {
                            probs[j] /= sum;
                            if (probs[j] > 1e-12) {
                                entropy -= probs[j] * Math.log(probs[j]);
                            }
                        }
                    }
                    
                    const entropyDiff = entropy - targetEntropy;
                    
                    if (Math.abs(entropyDiff) < 1e-4 || tries >= 49) {
                        P[i] = probs;
                        break;
                    }
                    
                    if (entropyDiff > 0) {
                        beta *= 1.5;
                    } else {
                        beta /= 1.5;
                    }
                    tries++;
                }
                
                if (!P[i]) {
                    // Fallback
                    P[i] = new Array(n).fill(0);
                    for (let j = 0; j < n; j++) {
                        if (i !== j) {
                            P[i][j] = 1 / (n - 1);
                        }
                    }
                }
            }
            
            // Make P symmetric
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    P[i][j] = (P[i][j] + P[j][i]) / (2 * n);
                    P[i][j] = Math.max(P[i][j], 1e-12);
                }
            }
            
            // Gradient descent with simpler approach
            const learningRate = 200;
            const momentum = 0.8;
            let gains = [];
            let uY = [];
            
            // Initialize gains and momentum
            for (let i = 0; i < n; i++) {
                gains[i] = [1, 1];
                uY[i] = [0, 0];
            }
            
            // Run optimization
            for (let iter = 0; iter < 300; iter++) {
                // Calculate Q matrix (similarities in low dimension)
                let Q = [];
                let qSum = 0;
                
                for (let i = 0; i < n; i++) {
                    Q[i] = [];
                    for (let j = 0; j < n; j++) {
                        if (i !== j) {
                            const dx = Y[i][0] - Y[j][0];
                            const dy = Y[i][1] - Y[j][1];
                            const dist = dx * dx + dy * dy;
                            Q[i][j] = 1 / (1 + dist);
                            qSum += Q[i][j];
                        } else {
                            Q[i][j] = 0;
                        }
                    }
                }
                
                // Normalize Q
                qSum = Math.max(qSum, 1e-12);
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < n; j++) {
                        if (i !== j) {
                            Q[i][j] = Math.max(Q[i][j] / qSum, 1e-12);
                        }
                    }
                }
                
                // Calculate gradients
                let dY = [];
                for (let i = 0; i < n; i++) {
                    dY[i] = [0, 0];
                    for (let j = 0; j < n; j++) {
                        if (i !== j) {
                            const mult = 4 * (P[i][j] - Q[i][j]) * Q[i][j] * qSum;
                            dY[i][0] += mult * (Y[i][0] - Y[j][0]);
                            dY[i][1] += mult * (Y[i][1] - Y[j][1]);
                        }
                    }
                }
                
                // Update Y using momentum and adaptive gains
                for (let i = 0; i < n; i++) {
                    for (let dim = 0; dim < 2; dim++) {
                        if (Math.sign(dY[i][dim]) !== Math.sign(uY[i][dim])) {
                            gains[i][dim] += 0.2;
                        } else {
                            gains[i][dim] *= 0.8;
                        }
                        gains[i][dim] = Math.max(gains[i][dim], 0.01);
                        
                        uY[i][dim] = momentum * uY[i][dim] - learningRate * gains[i][dim] * dY[i][dim];
                        Y[i][dim] += uY[i][dim];
                        
                        // Prevent explosion
                        if (Math.abs(Y[i][dim]) > 1000) {
                            Y[i][dim] = Math.sign(Y[i][dim]) * 1000;
                        }
                    }
                }
                
                // Center the data
                if (iter % 10 === 0) {
                    let meanY = [0, 0];
                    for (let i = 0; i < n; i++) {
                        meanY[0] += Y[i][0];
                        meanY[1] += Y[i][1];
                    }
                    meanY[0] /= n;
                    meanY[1] /= n;
                    
                    for (let i = 0; i < n; i++) {
                        Y[i][0] -= meanY[0];
                        Y[i][1] -= meanY[1];
                    }
                }
                
                // Yield control periodically
                if (iter % 50 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
            }
            
            // Final validation
            const result = Y.map(point => [
                isNaN(point[0]) || !isFinite(point[0]) ? 0 : point[0],
                isNaN(point[1]) || !isFinite(point[1]) ? 0 : point[1]
            ]);
            
            return result;
        },
        normalizeEmbedding(embedding) {
            if (!embedding || embedding.length === 0) {
                return [];
            }
            
            if (!this.rawData || this.rawData.length === 0) {
                return [];
            }
            
            if (embedding.length !== this.rawData.length) {
                return [];
            }
            
            // Extract x, y, z coordinates
            const x_values = embedding.map(point => point[0]);
            const y_values = embedding.map(point => point[1]);
            const z_values = embedding.map(point => point[2] || 0);
            
            // Check if we have valid coordinates
            if (x_values.some(x => x === null || x === undefined || isNaN(x)) ||
                y_values.some(y => y === null || y === undefined || isNaN(y))) {
                return [];
            }
            
            // Calculate ranges
            const x_min = Math.min(...x_values);
            const x_max = Math.max(...x_values);
            const y_min = Math.min(...y_values);
            const y_max = Math.max(...y_values);
            const z_min = Math.min(...z_values);
            const z_max = Math.max(...z_values);
            
            const x_range = x_max - x_min || 1;
            const y_range = y_max - y_min || 1;
            const z_range = z_max - z_min || 1;
            
            // Normalize and combine with original data
            const result = this.rawData.map((item, i) => {
                if (i >= embedding.length) {
                    return item;
                }
                
                const normalized = {
                    ...item,
                    x: ((x_values[i] - x_min) / x_range) * 2 - 1,
                    y: ((y_values[i] - y_min) / y_range) * 2 - 1,
                    z: ((z_values[i] - z_min) / z_range) * 2 - 1,
                };
                
                // Check for NaN values
                if (isNaN(normalized.x) || isNaN(normalized.y)) {
                    // Return with fallback coordinates instead of breaking everything
                    return {
                        ...item,
                        x: 0,
                        y: 0,
                        z: 0
                    };
                }
                
                return normalized;
            });
            
            // Final validation
            if (result.length === 0) {
                return [];
            }
            
            return result;
        },
        initChart() {
            if (!this.$refs.root) {
                console.warn('Chart root element not available');
                return;
            }
            
            // Dispose existing chart first
            if (this.chart) {
                this.chart.dispose();
                this.chart = null;
            }
            
            try {
                // Initialize with explicit sizing options
                this.chart = markRaw(init(this.$refs.root, null, { 
                    renderer: 'canvas',
                    width: 'auto',
                    height: 'auto'
                }));
                
                if (!this.chart) {
                    console.error('Failed to initialize chart');
                    return;
                }
                
                // Check if we have valid chart data
                if (!this.chartData || this.chartData.length === 0) {
                    console.warn('No chart data available for rendering');
                    return;
                }
                
                this.chart.setOption(this.chartOption, true); // true = notMerge
                
                // Force resize after initialization
                setTimeout(() => {
                    if (this.chart) {
                        this.chart.resize();
                    }
                }, 100);
                
                // Handle window resize
                window.addEventListener('resize', this.handleResize);
            } catch (error) {
                console.error('Error initializing chart:', error);
                this.error = 'Failed to initialize visualization. Please try again.';
            }
        },
        handleResize() {
            if (this.chart) {
                this.chart.resize();
            }
        },
    },
};
</script>

<style scoped>
.chart {
    margin-bottom: 20px;
    min-height: 800px; /* Increased height to accommodate legend without overflow */
}

.chart-container {
    width: 100%;
    height: 600px;
    display: block;
}

.chart-container.chart-3d {
    height: 720px; /* Reduced height to better contain the 3D visualization and legend */
}

.pca-show-button {
    text-align: center;
    padding: 40px 0;
}

.alert {
    padding: 12px 15px;
    margin-bottom: 20px;
    border: 1px solid transparent;
    border-radius: 4px;
    font-size: 14px;
    position: relative;
}

.alert-warning {
    color: #856404;
    background-color: #fff3cd;
    border-color: #ffeaa7;
}

.alert-info {
    color: #0c5460;
    background-color: #d1ecf1;
    border-color: #bee5eb;
}

.retry-btn {
    float: right;
    margin-top: -2px;
}

.btn {
    display: inline-block;
    padding: 6px 12px;
    margin-bottom: 0;
    font-size: 14px;
    font-weight: normal;
    line-height: 1.42857143;
    text-align: center;
    white-space: nowrap;
    vertical-align: middle;
    cursor: pointer;
    background-image: none;
    border: 1px solid transparent;
    border-radius: 4px;
    text-decoration: none;
}

.btn-default {
    color: #333;
    background-color: #fff;
    border-color: #ccc;
}

.btn-default:hover:not(:disabled) {
    color: #333;
    background-color: #e6e6e6;
    border-color: #adadad;
}

.btn:disabled {
    cursor: not-allowed;
    opacity: 0.65;
}

.btn-sm {
    padding: 5px 10px;
    font-size: 12px;
    line-height: 1.5;
    border-radius: 3px;
}

.fa {
    margin-right: 4px;
}

.controls-panel {
    padding: 15px 0;
    border-bottom: 1px solid #e5e5e5;
    margin-bottom: 15px;
}

.control-group {
    display: inline-block;
    margin-right: 30px;
    vertical-align: top;
}

.control-label {
    display: inline-block;
    margin-right: 10px;
    font-weight: 500;
    color: #333;
}

.toggle-buttons {
    display: inline-block;
}

.toggle-buttons .btn {
    margin-right: 5px;
}

.toggle-buttons .btn:last-child {
    margin-right: 0;
}

.btn-primary {
    color: #fff;
    background-color: #337ab7;
    border-color: #2e6da4;
}

.btn-primary:hover:not(:disabled) {
    color: #fff;
    background-color: #286090;
    border-color: #204d74;
}

/* Toggle Switch Styles */
.toggle-switch {
    display: inline-block;
    vertical-align: middle;
}

.toggle-input {
    display: none;
}

.toggle-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 20px;
    padding: 4px 6px;
    position: relative;
    transition: all 0.3s ease;
    user-select: none;
}

.toggle-option {
    font-size: 11px;
    font-weight: 500;
    color: #666;
    padding: 4px 8px;
    transition: color 0.3s ease;
    white-space: nowrap;
    z-index: 2;
    position: relative;
}

.toggle-slider {
    position: absolute;
    top: 2px;
    left: 2px;
    height: calc(100% - 4px);
    background-color: #337ab7;
    border-radius: 16px;
    transition: all 0.3s ease;
    z-index: 1;
}

/* Default state - first option selected */
.toggle-input:not(:checked) + .toggle-label .toggle-slider {
    width: calc(50% - 2px);
    transform: translateX(0);
}

.toggle-input:not(:checked) + .toggle-label .toggle-option:first-child {
    color: #fff;
}

/* Checked state - second option selected */
.toggle-input:checked + .toggle-label .toggle-slider {
    width: calc(50% - 2px);
    transform: translateX(calc(100% + 4px));
}

.toggle-input:checked + .toggle-label .toggle-option:last-child {
    color: #fff;
}

.processing-indicator {
    padding: 40px 0;
    text-align: center;
}

.processing-indicator p {
    margin: 10px 0 0 0;
    color: #666;
    font-size: 14px;
}

.mt-2 {
    margin-top: 0.5rem;
}
</style>
