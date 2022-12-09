<template>
     <v-chart class="chart" :option="option" ></v-chart>
</template>

<script>
import * as echarts from 'echarts/core';
import {TitleComponent, TooltipComponent} from 'echarts/components';
import { PieChart } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import VChart, { THEME_KEY } from "vue-echarts";

export default {
    components: {
        VChart
    },
    provide: {
        [THEME_KEY]: "dark"
    },
    props: {
        annotationLabels: {
            required: true,
            type: Array,
        },
        subtitle: {
            required:false,
            type:String,
        },
    },
    computed: {
        data() {
            let ret = [];
            for (let entry of this.annotationLabels) {
                let formatObj = {
                    name: entry.name,
                    value: entry.count,
                    itemStyle: {
                        color: "#" + entry.color,
                        borderColor: '#222222',
                    },
                };
                ret.push(formatObj);
            }

            return ret;
        },
        option() {
            return {
                backgroundColor: 'transparent',
                title: {
                    text: 'Abundance of annotation labels',
                    subtext: this.subtitle,
                    left: 'center',
                    top: '5%',
                    textStyle: {
                        fontSize: 15
                    },
                },
                tooltip: {
                    trigger: 'item',
                    formatter: '{b} : <b>{c}</b> ({d}%)'
                },
                series: [
                    {
                        type: 'pie',
                        radius: '50%',
                        avoidLabelOverlap: false,
                        label: {
                            show: true,
                            position: 'outside',
                            width: 150,
                            overflow: 'truncate',
                        },
                        labelLine: {
                            show: true
                        },
                        data: this.data.sort(function(a, b) { return b.value-a.value; }),
                        emphasis: {
                            focus: 'self'
                        },
                    },
                ],
            };
        },
    },
    beforeCreate() {
        echarts.use([
            TitleComponent,
            TooltipComponent,
            PieChart,
            CanvasRenderer,
            LabelLayout,
        ]);
    },
}
</script>
