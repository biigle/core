<template>
    <v-chart :option="option"></v-chart>
</template>
<script>
import * as echarts from 'echarts/core';
import {TooltipComponent, GridComponent} from 'echarts/components';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import VChart, { THEME_KEY } from "vue-echarts";

export default {
    components: {
        VChart,
    },
    provide: {
        [THEME_KEY]: "dark",
    },
    props: {
        data: {
            required: true,
            type: Array,
        },
    },
    computed: {
        option() {
            return {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow',
                    },
                },
                grid: {
                    left: 0,
                    right: 0,
                    top: 50,
                },
                xAxis: {
                    type: 'category',
                    data: this.data[0],
                    axisTick: {
                        alignWithLabel: true,
                    },
                    axisLabel: {
                        fontSize: 10,
                        margin: 8,
                    },
                },
                yAxis:{
                    show: false,
                    axisLabel: {
                        show: false,
                    },
                },
                series: [
                    {
                        type: 'bar',
                        barWidth: '60%',
                        data: this.data[1],
                    },
                ],
            };
        },
    },
    beforeCreate() {
        echarts.use([
            TooltipComponent,
            GridComponent,
            BarChart,
            CanvasRenderer,
        ]);
    },
}
</script>
