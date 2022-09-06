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
        sourceTargetLabels: {required:true, type:Object},
        container: {required:true, type:String},

        volumeType: {required:false, type:String},
        annotationLabelsVideo: {required:false, type:Array},
        sourceTargetLabelsVideo: {required:false, type:Object},
        showImageVolumes: {required:false, type:Boolean},
        showVideoVolumes: {required:false, type:Boolean},
    },
    data() {
        return {
            layoutType: 'circular',
            mergedAnnotationLabels: [],
            mergedSourceTarget: {}
        }
    },
    mounted() {
        // handle different locations (modal, project-statistics)
        this.$watch(
            () => this.container, 
            () => {
                if(this.container === "modal-statistics") {
                    this.mergedAnnotationLabels = this.annotationLabels;
                    this.mergedSourceTarget = this.sourceTargetLabels;
                }
            },
            {
                immediate: true
            }
        ),
        // Select either each dataset itself or merge both
        // depending on the buttons selected (showImage, showVideo)
        this.$watch(
            () => [this.showImageVolumes, this.showVideoVolumes],
            () => {
                 // only relevant when in projects-tab
                if(this.container === "project-statistics") {
                    if(this.showImageVolumes && !this.showVideoVolumes) {
                        this.updateData(this.annotationLabels, this.sourceTargetLabels);
                    } else if(!this.showImageVolumes && this.showVideoVolumes) {
                        this.updateData(this.annotationLabelsVideo, this.sourceTargetLabelsVideo);
                    } else { //both true
                        this.updateData(this.annotationLabels.concat(this.annotationLabelsVideo),
                        {...this.sourceTargetLabels, ...this.sourceTargetLabelsVideo});
                    }
                }
            },
            {
            immediate: true
            }
        )
    },
    created() {
        // console.log('layoutType:', this.layoutType);
        // console.log(JSON.stringify(this.annotationLabelsVideo));
        // console.log(JSON.stringify(this.sourceTargetLabelsVideo));
    },
    methods: {
        updateData(annot, sourceTarget) {
            this.mergedAnnotationLabels = annot;
            this.mergedSourceTarget = sourceTarget;
        },
        changeLayout(event) {
            this.layoutType = event;
        },
        createNodesAndCategories() {
            let nodes = [];
            let cat = [];

            for(let entry of this.mergedAnnotationLabels) {
                let nodeObj = {
                    "id": entry.id.toString(),
                    "name": entry.name,
                    "value": entry.count,
                    "symbolSize": 15, //( Math.log(entry.count) + 1 * 5 ),
                    "category": entry.name
                    };
                let catObj = {
                    "name": entry.name,
                    "itemStyle": {"color": "#" + entry.color}
                };

                nodes.push(nodeObj);
                cat.push(catObj);
            }

            return [nodes, cat];
        },
        createLinks() {
            let arr = [];
            
            // iterate over all ids
            for (const [id, values] of Object.entries(this.mergedSourceTarget)) {
                // iterate over all values of each id
                for(let val of values) {
                    let entry = {
                        "source": id,
                        "target": val.toString()
                    }
                    arr.push(entry);
                }
            }
          
          return arr;
        }
    },
    computed: {
        graph() {
            let obj = {};
            
            const [nodes, cat] = this.createNodesAndCategories();
            obj['nodes'] = nodes;
            obj['categories'] = cat;
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
                            gravity: 0.2,
                            repulsion: 500,
                            edgeLength: 300,
                            layoutAnimation: true
                        },
                        draggable: false,
                        edgeSymbol: ['circle'],
                        edgeSymbolSize: [4, 10],
                        data: this.graph.nodes,
                        links: this.graph.links,
                        categories: this.graph.categories,
                        roam: true,
                        label: {
                        show: true
                        },
                        lineStyle: {
                        color: 'source',
                        width: 1,
                        curveness: 0
                        }
                    }
                ]
            } //end option
        }
    }
};

</script>