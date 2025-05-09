<template>
     <span ref="root" class="chart" ></span>
</template>

<script>
import { use, init } from 'echarts/core';
import { TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import { PieChart } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { SVGRenderer } from 'echarts/renderers';
import { markRaw } from "vue";

export default {
    props: {
        annotatedFiles: {
            required: true,
            type: Number,
        },
        totalFiles: {
            required: true,
            type: Number,
        },
        volumeType: {
            required: false,
            type: String,
        },
        subtitle: {
            required: false,
            type: String,
        },
    },
    data() {
        return {
            chart: null,
        };
    },
    computed: {
        option() {
            return {
                backgroundColor: 'transparent',
                title: {
                    text: 'Annotated vs. not annotated files',
                    subtext: this.subtitle,
                    left: 'center',
                    top: '5%',
                    textStyle: {
                        fontSize: 15
                    },
                },
                tooltip: {
                    trigger: 'item'
                },
                legend: {
                    bottom: '5%',
                    left: 'center'
                },
                color: [
                    '#5cb85c', // $brand-success
                    '#888888',
                ],
                series: [
                    {
                        type: 'pie',
                        radius: ['30%', '60%'],
                        avoidLabelOverlap: false,
                        label: {
                            show: false,
                            position: 'center'
                        },
                        labelLine: {
                            show: false
                        },
                        data: [
                            {
                                value: this.annotatedFiles,
                                name: 'Annotated',
                            },
                            {
                                value: (this.totalFiles - this.annotatedFiles),
                                name: 'Not Annotated',
                            },
                        ],
                    },
                ],
            };
        }
    },
    watch: {
        option() {
            if (this.chart) {
                this.chart.setOption(this.option);
            }
        },
    },
    beforeCreate() {
        use([
            TooltipComponent,
            LegendComponent,
            PieChart,
            SVGRenderer,
            LabelLayout,
            TitleComponent,
        ]);
    },
    mounted() {
        this.chart = markRaw(init(this.$refs.root, 'dark', { renderer: 'svg' }));
        this.chart.setOption(this.option);
    },
}
</script>
