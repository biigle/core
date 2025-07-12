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
                    <label class="control-label">Visualization:</label>
                    <div class="toggle-buttons">
                        <button 
                            class="btn btn-sm"
                            :class="{ 'btn-primary': !is3D, 'btn-default': is3D }"
                            @click="is3D = false"
                        >
                            2D
                        </button>
                        <button 
                            class="btn btn-sm"
                            :class="{ 'btn-primary': is3D, 'btn-default': !is3D }"
                            @click="is3D = true"
                        >
                            3D
                        </button>
                    </div>
                </div>
                
                <div v-if="!is3D" class="control-group">
                    <label class="control-label">Components:</label>
                    <div class="toggle-buttons">
                        <button 
                            class="btn btn-sm"
                            :class="{ 'btn-primary': pcComponents === 'PC1_PC2', 'btn-default': pcComponents !== 'PC1_PC2' }"
                            @click="pcComponents = 'PC1_PC2'"
                        >
                            PC1 vs PC2
                        </button>
                        <button 
                            class="btn btn-sm"
                            :class="{ 'btn-primary': pcComponents === 'PC2_PC3', 'btn-default': pcComponents !== 'PC2_PC3' }"
                            @click="pcComponents = 'PC2_PC3'"
                        >
                            PC2 vs PC3
                        </button>
                        <button 
                            class="btn btn-sm"
                            :class="{ 'btn-primary': pcComponents === 'PC1_PC3', 'btn-default': pcComponents !== 'PC1_PC3' }"
                            @click="pcComponents = 'PC1_PC3'"
                        >
                            PC1 vs PC3
                        </button>
                    </div>
                </div>
            </div>
            
            <div ref="root" class="chart-container"></div>
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
            pcComponents: 'PC1_PC2', // 'PC1_PC2', 'PC2_PC3', or 'PC1_PC3'
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
                } else if (this.pcComponents === 'PC1_PC2') {
                    coords = [point.x, point.y];
                } else if (this.pcComponents === 'PC2_PC3') {
                    coords = [point.y, point.z || 0];
                } else { // PC1_PC3
                    coords = [point.x, point.z || 0];
                }
                
                labelGroups.get(key).data.push(coords);
            });
            
            return Array.from(labelGroups.values());
        },
        chartOption() {
            const baseOption = {
                backgroundColor: 'transparent',
                title: {
                    text: 'PCA Feature Visualization',
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
                        left: '10%',
                        right: '10%',
                        top: '20%',
                        bottom: '25%',
                        viewControl: {
                            projection: 'perspective',
                            autoRotate: false,
                            rotateSensitivity: 1,
                            zoomSensitivity: 1,
                            panSensitivity: 1,
                            alpha: 20,
                            beta: 40,
                            distance: 200,
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
                    xAxis3D: {
                        type: 'value',
                        name: 'Principal Component 1',
                        nameTextStyle: {
                            fontSize: 12
                        }
                    },
                    yAxis3D: {
                        type: 'value',
                        name: 'Principal Component 2',
                        nameTextStyle: {
                            fontSize: 12
                        }
                    },
                    zAxis3D: {
                        type: 'value',
                        name: 'Principal Component 3',
                        nameTextStyle: {
                            fontSize: 12
                        }
                    },
                };
            } else {
                let xAxisName, yAxisName;
                if (this.pcComponents === 'PC1_PC2') {
                    xAxisName = 'Principal Component 1';
                    yAxisName = 'Principal Component 2';
                } else if (this.pcComponents === 'PC2_PC3') {
                    xAxisName = 'Principal Component 2';
                    yAxisName = 'Principal Component 3';
                } else { // PC1_PC3
                    xAxisName = 'Principal Component 1';
                    yAxisName = 'Principal Component 3';
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
                this.chart.setOption(this.chartOption);
            }
        },
        pcComponents() {
            if (this.chart && this.hasLoaded) {
                this.chart.setOption(this.chartOption);
            }
        },
        is3D() {
            if (this.chart && this.hasLoaded) {
                this.chart.setOption(this.chartOption);
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
            if (this.is3D) {
                return 'Principal Components 1, 2, and 3 of annotation feature vectors (3D)';
            } else if (this.pcComponents === 'PC1_PC2') {
                return 'Principal Components 1 vs 2 of annotation feature vectors';
            } else if (this.pcComponents === 'PC2_PC3') {
                return 'Principal Components 2 vs 3 of annotation feature vectors';
            } else { // PC1_PC3
                return 'Principal Components 1 vs 3 of annotation feature vectors';
            }
        },
        getTooltipFormatter() {
            if (this.is3D) {
                return function(params) {
                    return `${params.seriesName}<br/>PC1: ${params.value[0].toFixed(3)}<br/>PC2: ${params.value[1].toFixed(3)}<br/>PC3: ${params.value[2].toFixed(3)}`;
                };
            } else if (this.pcComponents === 'PC1_PC2') {
                return function(params) {
                    return `${params.seriesName}<br/>PC1: ${params.value[0].toFixed(3)}<br/>PC2: ${params.value[1].toFixed(3)}`;
                };
            } else if (this.pcComponents === 'PC2_PC3') {
                return function(params) {
                    return `${params.seriesName}<br/>PC2: ${params.value[0].toFixed(3)}<br/>PC3: ${params.value[1].toFixed(3)}`;
                };
            } else { // PC1_PC3
                return function(params) {
                    return `${params.seriesName}<br/>PC1: ${params.value[0].toFixed(3)}<br/>PC3: ${params.value[1].toFixed(3)}`;
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
            
            this.chart.setOption(this.chartOption);
            
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
    min-height: 620px;
}

.chart-container {
    width: 100%;
    height: 600px;
    display: block;
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
</style>
