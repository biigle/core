<template>
     <v-chart class="chart" :option="option" ></v-chart>
</template>

<script>
import * as echarts from 'echarts/core';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { PieChart } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { TitleComponent } from 'echarts/components';
import VChart, { THEME_KEY } from "vue-echarts";

echarts.use([
    TooltipComponent,
    LegendComponent,
    PieChart,
    CanvasRenderer,
    LabelLayout,
    TitleComponent
]);


export default {
    components: {
        VChart
    },
    provide: {
        [THEME_KEY]: "dark"
    },
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
    computed: {
        option() {
            return {
                backgroundColor: 'transparent',
                title: {
                    text: 'Annotated vs. not annotated',
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
    }
}
</script>
