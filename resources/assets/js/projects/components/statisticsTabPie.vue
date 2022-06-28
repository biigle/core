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
    name: "PieChart",
    components: {
        VChart
    },
    provide: {
        [THEME_KEY]: "dark"
    },
    props: {
        annotatedImages: {required:true, type:Number},
        totalImages: {required:true, type:Number}
    },
    data() {
        return {        
            option: {
                backgroundColor: '#222222',
                title: {
                    text: 'Annotated vs. not annotated',
                    subtext: '(across all volumes of the project)',
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
                    '#7cffb2',
                    '#ff6e76'
                ],
                series: [
                {
                    name: 'Files',
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
                    { value: this.annotatedImages, name: 'Annotated' },
                    { value: (this.totalImages - this.annotatedImages), name: 'Not Annotated' },
                    ]
                }
                ]
            }
        }
    }
}
</script>