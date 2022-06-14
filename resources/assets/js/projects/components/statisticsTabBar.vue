<template>
     <v-chart class="chart" :option="option" ></v-chart>
</template>

<script>
import * as echarts from 'echarts/core';
import {
    TooltipComponent,
    GridComponent,
    LegendComponent
} from 'echarts/components';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TitleComponent } from 'echarts/components';
import VChart, { THEME_KEY } from "vue-echarts";

echarts.use([
    TooltipComponent,
    GridComponent,
    LegendComponent,
    BarChart,
    CanvasRenderer,
    TitleComponent
]);

export default {
    name: "BarPlot",
    components: {
        VChart
    },
    props: {
        volumeAnnotations: {required:true, type:Array},
        names: {required:true, type:Array}
    },
    provide: {
        [THEME_KEY]: "dark"
    },
    computed: {
        axisData() {
            let idList = this.volumeAnnotations.map(function (entry) {
                    return entry.volume_id;
                    });

            let res = [];
            for(let entry of idList) {
                res.push( this.names.find(x => x.id === entry).name );
            }

            return res;
        },
        seriesData() {
            let res = this.volumeAnnotations.map(function (a) {
                    return a.count;
                    });

            return res;
        },
        option() {
            return {
                backgroundColor: '#222222',
                title: {
                    text: 'Annotations per volume',
                    top: '5%',
                    left: 'center',
                    textStyle: {
                        fontSize: 15
                    },
                },
                tooltip: {
                    triggerOn: 'mousemove', 
                    trigger: 'axis',
                    axisPointer: {
                    //  Use axis to trigger tooltip
                    axis: 'y',
                    type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
                    },
                    // position: function (pos, params, dom, rect, size) {
                    //     // tooltip will be fixed on the right if mouse hovering on the left,
                    //     // and on the left if hovering on the right.
                    // return [pos[0], pos[130]];
                    // }
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    type: 'value',
                    axisLabel: {
                        rotate: -60
                    }
                },
                yAxis: {
                    type: 'category',
                    data: this.axisData,
                    inverse: true,
                    axisLabel: {
                        width: 90,
                        overflow: "truncate",
                        ellipsis: '...'
                    },
                    axisTick: {
                        alignWithLabel: true
                    }
                },
                series: [
                    {
                    realtimeSort: true,
                    name: 'Annotations',
                    type: 'bar',
                    stack: 'total',
                    label: {
                        show: true
                    },
                    emphasis: {
                        focus: 'series'
                    },
                    data: this.seriesData
                    }
                ]
            }
        }
    },
    data() {
        return {
        }
    }
}
</script>
