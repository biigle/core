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
        
        <div v-else-if="hasLoaded && data && data.length > 0" ref="root" class="chart-container"></div>
    </div>
</template>

<script>
import { use, init } from 'echarts/core';
import { ScatterChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
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
                        type: 'scatter',
                        data: [],
                        itemStyle: {
                            color: '#' + point.label_color,
                        },
                    });
                }
                labelGroups.get(key).data.push([point.x, point.y]);
            });
            
            return Array.from(labelGroups.values());
        },
        chartOption() {
            return {
                backgroundColor: 'transparent',
                title: {
                    text: 'PCA Feature Visualization',
                    subtext: 'Principal Components of annotation feature vectors',
                    left: 'center',
                    top: '5%',
                    textStyle: {
                        fontSize: 15,
                    },
                },
                tooltip: {
                    trigger: 'item',
                    formatter: function(params) {
                        return `${params.seriesName}<br/>PC1: ${params.value[0].toFixed(3)}<br/>PC2: ${params.value[1].toFixed(3)}`;
                    },
                },
                legend: {
                    type: 'scroll',
                    orient: 'horizontal',
                    bottom: '5%',
                    left: 'center',
                    pageButtonPosition: 'end',
                },
                grid: {
                    left: '3%',
                    right: '3%',
                    top: '12%',
                    bottom: '15%',
                },
                xAxis: {
                    type: 'value',
                    name: 'Principal Component 1',
                    nameLocation: 'middle',
                    nameGap: 30,
                    splitLine: {
                        show: true,
                        lineStyle: {
                            type: 'dashed',
                        },
                    },
                },
                yAxis: {
                    type: 'value',
                    name: 'Principal Component 2',
                    nameLocation: 'middle',
                    nameGap: 50,
                    splitLine: {
                        show: true,
                        lineStyle: {
                            type: 'dashed',
                        },
                    },
                },
                series: this.chartData,
                animation: true,
                animationDuration: 1000,
            };
        },
    },
    watch: {
        chartOption() {
            if (this.chart) {
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
}

.chart-container {
    width: 100%;
    height: 500px;
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
</style>
