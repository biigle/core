<template>
    <div class="grid-col-span-3 netmap-chart">
        <div ref="chart" class="chart chart--netmap"></div>
        <button class="btn btn-default force-button" title="Toggle force layout" v-on:click="toggleForceLayout" :class="buttonClass"><i class="fa fa-project-diagram"></i></button>
    </div>
</template>

<script>
import { use, init } from 'echarts/core';
import { TitleComponent, TooltipComponent } from 'echarts/components';
import { GraphChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { markRaw } from "vue";

export default {
    name: "NetmapDisplay",
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
            chart: null,
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
                        height: '70%',
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
                        scaleLimit: {
                            min: 1,
                            max: 15,
                        },
                        label: {
                            show: true,
                            width: 100,
                            overflow: 'truncate',
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
    watch: {
        option() {
            if (this.chart) {
                this.chart.setOption(this.option);
            }
        },
    },
    beforeCreate() {
        use([
            TitleComponent,
            TooltipComponent,
            GraphChart,
            CanvasRenderer,
        ]);
    },
    mounted() {
        this.chart = markRaw(init(this.$refs.chart, 'dark', { renderer: 'canvas' }));
        this.chart.setOption(this.option);
        this.chart.on('click', this.toggleColor);
    },
};

</script>
