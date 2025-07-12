<template>
    <div class="chart grid-col-span-3">
        <div v-if="!hasLoaded" class="pca-show-button">
            <button 
                class="btn btn-sm btn-default"
                @click="handleShowClick"
                :disabled="loading"
            >
                <i v-if="loading" class="fa fa-spinner fa-spin"></i>
                <i v-else class="fa fa-play"></i>
                {{ loading ? 'Loading...' : 'Show PCA Feature Visualization' }}
            </button>
        </div>
        
        <div v-if="error" class="alert alert-warning">
            <i class="fa fa-exclamation-triangle"></i> {{ error }}
            <button 
                class="btn btn-sm btn-default retry-btn"
                @click="handleShowClick"
                :disabled="loading"
            >
                <i v-if="loading" class="fa fa-spinner fa-spin"></i>
                <i v-else class="fa fa-refresh"></i>
                Retry
            </button>
        </div>
        
        <div v-else-if="hasLoaded && (!data || data.length === 0)" class="alert alert-info">
            <i class="fa fa-info-circle"></i> No feature vectors found for this project.
        </div>
        
        <div v-else-if="hasLoaded && data && data.length > 0">
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
            
            <div ref="root" class="chart-container" :class="{ 'chart-3d': is3D }"></div>
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
            data: [],
            dataCount: 0,
            chart: null,
            hasLoaded: false,
            is3D: false,
            showPC2vsPC3: false, // false = PC1 vs PC2, true = PC3 vs PC2
            method: 'pca', // 'pca', 'umap', or 'tsne'
        };
    },
    computed: {
        uniqueLabels() {
            if (!this.data || this.data.length === 0) {
                return [];
            }
            
            const labelMap = new Map();
            this.data.forEach(point => {
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
            if (!this.data || this.data.length === 0) {
                return [];
            }
            
            // Group data by label for better visualization
            const labelGroups = new Map();
            this.data.forEach(point => {
                const key = point.label_name;
                if (!labelGroups.has(key)) {
                    labelGroups.set(key, {
                        name: key,
                        type: this.is3D ? 'scatter3D' : 'scatter',
                        data: [],
                        itemStyle: {
                            color: '#' + point.label_color,
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
            
            return Array.from(labelGroups.values());
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
        async loadData() {
            this.loading = true;
            this.error = null;
            
            try {
                const PcaVisualizationApi = biigle.$require('api.pcaVisualization');
                const response = await PcaVisualizationApi.get({id: this.projectId});
                this.data = response.body.data;
                this.dataCount = response.body.count;
                this.hasLoaded = true;
                
                if (response.body.message) {
                    this.error = response.body.message;
                } else if (this.data && this.data.length > 0) {
                    // Wait for Vue to update DOM before initializing chart
                    setTimeout(() => {
                        this.initChart();
                    }, 50);
                }
            } catch (error) {
                console.error('Error loading PCA data:', error);
                this.error = 'Failed to load feature vectors. Please try again later.';
                this.hasLoaded = true;
            } finally {
                this.loading = false;
            }
        },
        initChart() {
            if (!this.$refs.root) {
                return;
            }
            
            // Initialize with explicit sizing options
            this.chart = markRaw(init(this.$refs.root, 'dark', { 
                renderer: 'canvas',
                width: 'auto',
                height: 'auto'
            }));
            
            this.chart.setOption(this.chartOption, true); // true = notMerge
            
            // Force resize after initialization
            setTimeout(() => {
                if (this.chart) {
                    this.chart.resize();
                }
            }, 100);
            
            // Handle window resize
            window.addEventListener('resize', this.handleResize);
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
</style>
