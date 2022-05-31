<template>
     <v-chart class="chart" :option="option" ></v-chart>
</template>

<script>
import * as echarts from 'echarts/core';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { PieChart } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import VChart, { THEME_KEY } from "vue-echarts";

echarts.use([
  TooltipComponent,
  LegendComponent,
  PieChart,
  CanvasRenderer,
  LabelLayout
]);


export default {
    name: "PieChart",
    components: {
        VChart
    },
    provide: {
        [THEME_KEY]: "dark"
    },
    data() {
        return {        
            option: {
                backgroundColor: '#222222',
                title: {
                    text: 'Total contribution',
                    subtext: 'across all volumes of the project',
                    left: 'center',
                    top: '5%',
                    textStyle: {
                        fontSize: 10,
                        color: "rgba(245, 17, 17, 1)"
                    },
                },
                tooltip: {
                trigger: 'item'
                },
                legend: {
                bottom: '5%',
                left: 'center'
                },
                series: [
                {
                    name: 'User',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    label: {
                    show: false,
                    position: 'center'
                    },
                    emphasis: {
                    label: {
                        show: true,
                        fontSize: '10',
                        fontWeight: 'regular'
                    }
                    },
                    labelLine: {
                    show: false
                    },
                    data: [
                    { value: 1048, name: 'User 1' },
                    { value: 735, name: 'User 2' },
                    { value: 580, name: 'User 3' },
                    { value: 484, name: 'User 4' }
                    ]
                }
                ]
            }
        }
    }
}
</script>