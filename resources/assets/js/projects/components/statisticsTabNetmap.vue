<template>
    <div class="chart grid-col-span-3" style="height: 600px;">
        <v-chart class="chart" :option="option" ></v-chart>
        <button class="btn btn-default" title="circular" v-on:click="changeLayout('circular')" >circular layout</button>
        <button class="btn btn-default" title="force" v-on:click="changeLayout('force')" >forced layout</button>
    </div>
</template>

<script>
import * as echarts from 'echarts/core';
import {
    TitleComponent,
    TooltipComponent,
    LegendComponent } from 'echarts/components';
import { GraphChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import VChart, { THEME_KEY } from "vue-echarts";

echarts.use([
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GraphChart,
    CanvasRenderer
]);

export default {
    name: "NetmapDisplay",
    components: {
        VChart
    },
    provide: {
        [THEME_KEY]: "dark"
    },
    props: {
        annotationLabels: {required:true, type:Array},
        sourceTargetLabels: {required:true, type:Object}
    },
    created() {
        // console.log('layoutType:', this.layoutType);
    },
    methods: {
        changeLayout(event) {
            this.layoutType = event;
        },
        createNodes() {
            let ret = [];
            for(let entry of this.annotationLabels) {
                let formatObj = {
                    "id": entry.id.toString(),
                    "name": entry.name,
                    "value": entry.count,
                    "symbolSize": 15, //( Math.log(entry.count) + 1 * 5 ),
                    "itemStyle": {"color": "#" + entry.color}
                    };
                ret.push(formatObj);
            }

            return ret;
        },
        createLinks() {
            let arr = [];
            
            // iterate over all ids
            for (const [id, values] of Object.entries(this.sourceTargetLabels)) {
                // iterate over all values of each id
                for(let val of values) {
                    let entry = {
                        "source": id,
                        "target": val.toString()
                        };
                    arr.push(entry);
                }
            }
          
          return arr;
        }
    },
    computed: {
        graph() {
            let obj = {};
            
            obj['nodes'] = this.createNodes();
            obj['links'] = this.createLinks();

            return obj;
        },
        option() {
            return {
                backgroundColor: '#222222',
                title: {
                text: 'NetMap Display',
                textStyle: {
                    fontSize: 15
                },
                top: '2%',
                left: '2%'
                },
                tooltip: {},
                // legend: [
                // {
                //     data: this.graph.nodes.map(function (a) {
                //     return a.name;
                //     })
                // }
                // ],
                animationDurationUpdate: 1500,
                animationEasingUpdate: 'quinticInOut',
                series: [
                    {
                        name: 'NetmapDisplay',
                        type: 'graph',
                        layout: this.layoutType,
                        circular: {
                            rotateLabel: true
                        },
                        force: {
                            initLayout: 'circular',
                            // gravity: 0,
                            repulsion: 100,
                            edgeLength: 200
                        },
                        edgeSymbol: ['circle'],
                        edgeSymbolSize: [4, 10],
                        data: this.graph.nodes,
                        links: this.graph.links,
                        // categories: this.graph.categories,
                        roam: true,
                        label: {
                        show: true
                        },
                        lineStyle: {
                        // color: (params: Object) => params,
                        width: 1,
                        curveness: 0
                        }
                    }
                ]
            } //end option
        }
    },
    data() {
        return {
            layoutType: 'circular'

        }
    }
};

</script>