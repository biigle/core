<template>
    <div class="grid-col-span-3 netmap-chart">
        <v-chart class="chart" :option="option" @click="toggleColor"></v-chart>
        <button class="btn btn-default force-button" title="Toggle force layout" v-on:click="toggleForceLayout" :class="buttonClass"><i class="fa fa-project-diagram"></i></button>
    </div>
</template>

<script>
import * as echarts from 'echarts/core';
import {TitleComponent, TooltipComponent } from 'echarts/components';
import { GraphChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import VChart, { THEME_KEY } from "vue-echarts";

export default {
    name: "NetmapDisplay",
    components: {
        VChart,
    },
    provide() {
        return {
            [THEME_KEY]: "dark",
        };
    },
    props: {
        annotationLabels: {
            required: true,
            type: Array
        },
        sourceTargetLabels: {
            required: true,
            type: Object
        },
        volumeType: {
            required: false,
            type: String
        },
    },
    data() {
        return {
            layoutType: 'circular',
            currentNode: {
                id: null,
                name: null,
                color: null
            },
            selectedNodeId: null,
        }
    },
    methods: {
        toggleForceLayout() {
            if (this.layoutType === 'circular') {
                this.layoutType = 'force';
            } else {
                this.layoutType = 'circular';
            }
        },
        toggleColor(event) {
            if (event.dataType === 'node') {
                if (this.selectedNodeId === event.data.id) {
                    this.selectedNodeId = null;
                } else {
                    this.selectedNodeId = event.data.id;
                }
            }
        },
        createNodesAndCategories() {
            let nodes = [];
            let cat = [];

            for (let entry of this.annotationLabels) {
                let nodeObj = {
                    id: entry.id.toString(),
                    name: entry.name,
                    value: entry.count,
                    symbolSize: 15,
                    category: entry.name
                };
                let catObj = {};
                // if a specific node is selected, paint white
                if (this.selectedNodeId === entry.id.toString()) {
                    catObj = {
                        name: entry.name,
                        itemStyle: {
                            color: "#ffffff",
                        },
                    };
                } else { // use default color
                    catObj = {
                        name: entry.name,
                        itemStyle: {
                            color: "#" + entry.color,
                        },
                    };

                    if (this.sourceTargetLabels[this.selectedNodeId] && !this.sourceTargetLabels[this.selectedNodeId].includes(entry.id)) {
                        catObj.itemStyle.opacity = 0.25;
                    }
                }

                nodes.push(nodeObj);
                cat.push(catObj);
            }

            return [nodes, cat];
        },
        createLinks() {
            let arr = [];

            // iterate over all ids
            for (const [id, values] of Object.entries(this.sourceTargetLabels)) {
                let opacity = 0;
                if (this.selectedNodeId === id || this.selectedNodeId === null) {
                    opacity = 0.5;
                }

                // iterate over all values of each id
                for (let val of values) {
                    let entry = {
                        source: id,
                        target: val.toString(),
                        lineStyle: {
                            opacity: opacity,
                        },
                    };
                    arr.push(entry);
                }
            }

          return arr;
        },
    },
    computed: {
        buttonClass() {
            return {
                active: this.layoutType === 'force',
                'btn-info': this.layoutType === 'force',
            };
        },
        graph() {
            const [nodes, cat] = this.createNodesAndCategories();

            return {
                nodes: nodes,
                categories: cat,
                links: this.createLinks(),
            }
        },
        option() {
            return {
                backgroundColor: 'transparent',
                title: {
                    text: 'NetMap Display',
                    subtext: 'shows which labels occur together in the same files',
                    textStyle: {
                        fontSize: 15
                    },
                    subtextStyle: {
                        width: 250,
                        overflow: "break",
                        lineHeight: 15,
                        align: "center",
                        verticalAlign: "top"
                    },
                    top: '2%',
                    left: '2%',
                },
                tooltip: {
                    trigger: 'item',
                    showContent: true,
                },
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
            GraphChart,
            CanvasRenderer,
        ]);
    },
};

</script>
