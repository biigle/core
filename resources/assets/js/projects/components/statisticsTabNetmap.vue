<template>
     <v-chart class="chart grid-col-span-3" :option="option" ></v-chart>
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



// fill graph struct
// console.log(JSON.stringify(this.graph));
// console.log('cat: ', this.graph.categories);

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
        // console.log(this.option);
    },
    methods: {
        createNodes() {
            
        }
    },
    computed: {
        graph() {
            let obj = {};
            
            obj['nodes'] = this.createNodes();

            return null;
        },
        // graph() {
        //     let obj = {};
        //     obj['nodes'] = [
        //             {id: 0,
        //             name: "protein0",
        //             value: 100,
        //             category: 0,
        //             x: 300,
        //             y: 300,
        //             symbolSize: 20
        //             },
        //             {id: 1,
        //             name: "protein1",
        //             value: 50,
        //             category: 0,
        //             x: 0,
        //             y: 0,
        //             symbolSize: 20
        //             },
        //             {
        //             id: 2,
        //             name: "starfish",
        //             value: 20,
        //             category: 1,
        //             x: 100,
        //             y: 50
        //             },
        //             {
        //             id: 3,
        //             name: "jellyfish",
        //             value: 50,
        //             category: 2,
        //             x: 0,
        //             y: 0,
        //             symbolSize: 20
        //             },
        //             {
        //             id: 4,
        //             name: "seasnail",
        //             value: 99,
        //             category: 1,
        //             x: 0,
        //             y: 0,
        //             symbolSize: 20
        //             }
        //         ];


        //         obj['links'] = [
        //             {
        //                 source: 0,
        //                 target: 2
        //             },
        //             {
        //                 source: 1,
        //                 target: 2
        //             },
        //             {
        //                 source: 2,
        //                 target: 3
        //             },
        //             {
        //                 source: 3,
        //                 target: 4
        //             }
        //         ];
        //         obj['categories'] = [{name: "Proteins"}, {name: "Seaground animal"}, {name: "Jellyfish"}];

        //     return obj;
        // },
        option() {
            return {
                backgroundColor: '#222222',
                title: {
                text: 'NetMap Display',
                textStyle: {
                    fontSize: 15
                },
                top: '5%',
                left: '2%'
                },
                tooltip: {},
                // legend: [
                // {
                //     data: this.graph.categories.map(function (a) {
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
                        layout: 'circular',
                        circular: {
                            rotateLabel: true
                        },
                        // layout: 'force',
                        // force: {
                        //     // initLayout: 'circular'
                        //     // gravity: 0
                        //     repulsion: 60,
                        //     edgeLength: 100
                        // },
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
                        color: 'source',
                        width: 2,
                        curveness: 0
                        }
                    }
                ]
            } //end option
        }
    },
    data() {
        return {
        }
    }
};

</script>