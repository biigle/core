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
        names: {required:true, type:Array},
        showImageVolumes: {required:true, type:Boolean},
        showVideoVolumes: {required:true, type:Boolean}
    },
    provide: {
        [THEME_KEY]: "dark"
    },
    created() {
        // console.log(this.axisData);
    },
    computed: {
        axisData() {
            let idList = this.volumeAnnotations.map(function (entry) {
                    return entry.volume_id;
                    });

            let series = {}
            // create series-Dict with volume-ids as keys
            for(let x = 0; x < idList.length; x++) {
                series[idList[x]] = 0;
            }

            // fill the seriesDict with values
            this.volumeAnnotations.map(function (a) {
                series[a.volume_id] += a.count;
            });

            const sortedSeriesObj = Object.fromEntries(
                Object.entries(series).sort(([,a],[,b]) => a-b)
            );

            let volNames = [];
            // create list of volume-Names from seriesDict keys (aka volume-ids)
            for(const entry in sortedSeriesObj) {
                let name = this.names.find(x => x.id === parseInt(entry)).name;
                volNames.push( name );
            }

            return [volNames, Object.values(sortedSeriesObj)];
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
                    data: this.axisData[0],
                    inverse: false,
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
                    // realtimeSort: true,
                    name: 'Annotations',
                    type: 'bar',
                    stack: 'total',
                    label: {
                        show: true
                    },
                    emphasis: {
                        focus: 'series'
                    },
                    data: this.axisData[1]
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
