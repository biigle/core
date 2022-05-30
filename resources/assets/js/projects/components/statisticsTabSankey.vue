<template>
     <v-chart class="chart" :option="option" ></v-chart>
</template>

<script>
import * as echarts from 'echarts/core';
import { SankeyChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import VChart, { THEME_KEY } from "vue-echarts";

echarts.use([SankeyChart, CanvasRenderer]);


export default {
    name: "SankeyDiagram",
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
                series: {
                    type: 'sankey',
                    layout: 'none',
                    emphasis: {
                    focus: 'adjacency'
                    },
                    data: [
                    {
                        name: 'User 1'
                    },
                    {
                        name: 'User 2'
                    },
                    {
                        name: 'Volume 1'
                    },
                    {
                        name: 'Volume 2'
                    },
                    {
                        name: 'Volume 3'
                    }
                    ],
                    links: [
                    {
                        source: 'User 1',
                        target: 'Volume 1',
                        value: 200
                    },
                    {
                        source: 'User 1',
                        target: 'Volume 2',
                        value: 80
                    },
                    {
                        source: 'User 2',
                        target: 'Volume 3',
                        value: 150
                    },
                    {
                        source: 'User 1',
                        target: 'Volume 3',
                        value: 20
                    }
                    ]
                }
            }
        }
    }
}
</script>