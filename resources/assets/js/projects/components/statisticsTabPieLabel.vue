<template>
     <v-chart class="chart" :option="option" ></v-chart>
</template>

<script>
import * as echarts from 'echarts/core';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components';
import { PieChart } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import VChart, { THEME_KEY } from "vue-echarts";

echarts.use([
  TitleComponent,
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
    props: {
        
    },
    data() {
        return {        
            option: {
                backgroundColor: '#222222',
                title: {
                    text: 'Abundance of annotation labels',
                    subtext: '(across all volumes of the project)',
                    left: 'center',
                    top: '5%',
                    textStyle: {
                        fontSize: 15
                    },
                },
                tooltip: {
                    trigger: 'item',
                    formatter: '{a} <br/>{b} : <b>{c}</b> ({d}%)'
                },
                legend: {
                    type: 'scroll',
                    orient: 'horizontal',
                    bottom: '5%',
                    data: ['label1', 'label2', 'label3', 'label4']
                },
                // color: [
                //     '#7cffb2',
                //     '#ff6e76'
                // ],
                series: [
                {
                    name: 'Annotation Label',
                    type: 'pie',
                    // radius: ['40%', '70%'],
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
                            name:'label1',
                            value: 100
                        },
                        {
                            name:'label2',
                            value: 500
                        },
                        {
                            name:'label3',
                            value: 400
                        },
                        {
                            name:'label4',
                            value: 400
                        },
                        {
                            name:'label5',
                            value: 1000
                        }],
                    emphasis: {
                        itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
                ]
            }
        }
    }
}
</script>