<template>
    <div class="grid-col-span-3">
        <v-chart class="chart w_buttons" :option="option" @click="toggleColor"></v-chart>
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
    },
    data() {
        return {
            layoutType: 'circular',
            currentNode: {id: null, name: null, color: null},
            // Init the ECharts base on DOM
        }
    },
    mounted() {
    },
    created() {
        console.log('NETMAP:', this.graph);
        // this.$watch(() => this.graph.categories, (newVal) => {
        //     consolole.log("cat changed: ", newVal);
        // });
        // console.log(JSON.stringify(this.annotationLabelsVideo));
        // console.log(JSON.stringify(this.sourceTargetLabelsVideo));
    },
    methods: {
        changeLayout(event) {
            this.layoutType = event;
        },
        toggleColor(event) {
            if(event.dataType == 'node') {
                // change color back when next click on Graph occured & it was not first click
                if(this.currentNode.id !== null) {
                    this.graph.categories[this.currentNode.id].itemStyle.color = this.currentNode.color;
                }
                console.log("Reached FUNC: ", event);
                // get entry-index of the selected category
                let idx = this.graph.categories.findIndex(x => x.name === event.name);
                // save the attributes of the current node
                this.currentNode.name = event.name;
                this.currentNode.color = this.graph.categories[idx].itemStyle.color;
                this.currentNode.id = idx;
                // change the color to white
                this.graph.categories[idx].itemStyle.color = "#ffffff";
                console.log(JSON.stringify(this.graph.categories[idx]));
            }
        },
        createNodesAndCategories() {
            let nodes = [];
            let cat = [];

            for(let entry of this.annotationLabels) {
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
            for (const [id, values] of Object.entries(this.sourceTargetLabels)) {
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
        // selectedNode(name) {
        //     return name;
        // },
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
                tooltip: {
                    trigger: 'item',
                    showContent: true,
                    // triggerOn: 'click'
                    // formatter: function(params) {
                    //     this.selectedNode = params.name;
                    //     // console.log("formatterFunc: ", this.selectedNode);
                    // }
                },
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
                        // selectMode: 'single',
                        // disabled: false,
                        // select: {
                        //     itemStyle: {
                        //         color: "rgba(255, 255, 255, 1)"
                        //     }
                        // }
                    }
                ]
            } //end option
        }
    }
};

</script>