<template>
    <v-chart class="chart grid-col-span-3" :option="option" ></v-chart>
</template>

<script>
import * as echarts from 'echarts/core';
import {
  DatasetComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components';
import { LineChart, PieChart } from 'echarts/charts';
import { UniversalTransition, LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import VChart, { THEME_KEY, INIT_OPTIONS_KEY, UPDATE_OPTIONS_KEY } from "vue-echarts";


echarts.use([
  DatasetComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  PieChart,
  CanvasRenderer,
  UniversalTransition,
  LabelLayout
]);


// setTimeout(function () {
// VChart.on('updateAxisPointer', function (event) {
//             const xAxisInfo = event.axesInfo[0];
//             if (xAxisInfo) {
//             const dimension = xAxisInfo.value + 1;
//             VChart.setOption({
//                 series: {
//                 id: 'pie',
//                 label: {
//                     formatter: '{b}: {@[' + dimension + ']} ({d}%)'
//                 },
//                 encode: {
//                     value: dimension,
//                     tooltip: dimension
//                 }
//                 }
//             })
//         }
//     });
// });

export default {
    name: "Annotation-Timeline",
    components: {
        VChart
    },
    provide: {
        [THEME_KEY]: "dark"
        // [UPDATE_OPTIONS_KEY]: this.option
    },
    data() {
        return {
            option: {
                legend: {},
                tooltip: {
                trigger: 'axis',
                showContent: false
                },
                backgroundColor: '#222222',
                dataset: {
                source: [
                    ['product', '2012', '2013', '2014', '2015', '2016', '2017'],
                    ['User 1', 56.5, 82.1, 88.7, 70.1, 53.4, 85.1],
                    ['User 2', 51.1, 51.4, 55.1, 53.3, 73.8, 68.7],
                    ['User 3', 40.1, 62.2, 69.5, 36.4, 45.2, 32.5],
                    ['User 4', 25.2, 37.1, 41.2, 18, 33.9, 49.1]
                ]
                },
                xAxis: { type: 'category' },
                yAxis: { gridIndex: 0 },
                grid: { top: '55%' },
                series: [
                {
                    type: 'line',
                    smooth: true,
                    seriesLayoutBy: 'row',
                    emphasis: { focus: 'series' }
                },
                {
                    type: 'line',
                    smooth: true,
                    seriesLayoutBy: 'row',
                    emphasis: { focus: 'series' }
                },
                {
                    type: 'line',
                    smooth: true,
                    seriesLayoutBy: 'row',
                    emphasis: { focus: 'series' }
                },
                {
                    type: 'line',
                    smooth: true,
                    seriesLayoutBy: 'row',
                    emphasis: { focus: 'series' }
                },
                {
                    type: 'pie',
                    id: 'pie',
                    radius: '30%',
                    center: ['50%', '25%'],
                    emphasis: {
                    focus: 'self'
                    },
                    label: {
                    formatter: '{b}: {@2012} ({d}%)'
                    },
                    encode: {
                    itemName: 'product',
                    value: '2012',
                    tooltip: '2012'
                    }
                }
                ]
            }
        }
    }
};
</script>

<style scoped>
/* .chart {
    height: 400px;
} */
</style>