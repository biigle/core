<template>
    <span ref="root" class="chart grid-col-span-3"></span>
</template>

<script>
import { use, init } from 'echarts/core';
import { SankeyChart } from 'echarts/charts';
import { SVGRenderer } from 'echarts/renderers';
import { TitleComponent, TooltipComponent } from 'echarts/components';
import { IDToColor } from "./IDToColor";
import { markRaw } from "vue";

export default {
    props: {
        volumeAnnotations: {
            required: true,
            type: Array,
        },
        names: {
            required: true,
            type: Array,
        },
        container: {
            required: true,
            type: String,
        },
    },
    data() {
        return {
            chart: null,
        };
    },
    computed: {
        data() {
            // returns an array of User-names and volume-names
            let volNames = this.volumeAnnotations.map(entry => {
                return this.names.find(x => x.id === entry.volume_id).name;
            });
            volNames = [...new Set(volNames)];

            let userNames = this.volumeAnnotations.map(entry => {
                if (entry.fullname === " ") {
                    return "Deleted Account"
                }
                return entry.fullname;
            })
            userNames = [...new Set(userNames)];

            let userIds = this.volumeAnnotations.map(entry => {
                return entry.user_id;
            })
            userIds = [...new Set(userIds)];

            let volIds = this.volumeAnnotations.map(entry => {
                return entry.volume_id;
            });
            volIds = [...new Set(volIds)];


            let combined = userNames.concat(...volNames);
            let combinedIds = userIds.concat(...volIds);

            combined = combined.map((entry, index) => {
                return { name: entry, itemStyle: { color: IDToColor(combinedIds[index]) } };
            });
            return combined;
        },

        links() {
            let result_array = [];

            for (let obj of this.volumeAnnotations) {
                // create a single link-entry
                let entry = {
                    source: obj.fullname === " " ? "Deleted Account" : obj.fullname,
                    target: this.names.find(x => x.id === obj.volume_id).name,
                    value: obj.count
                };
                // append to result array
                result_array.push(entry);
            }

            return result_array;
        },

        option() {
            return {
                backgroundColor: 'transparent',
                title: {
                    text: 'User contribution to volumes',
                    top: '5%',
                    left: 'center',
                    textStyle: {
                        fontSize: 15
                    },
                },
                tooltip: {
                    trigger: "item",
                    triggerOn: "mousemove"
                },
                series: {
                    type: 'sankey',
                    layout: 'none',
                    top: "15%",
                    draggable: false,
                    label: {
                        position: "right",
                        width: 200,
                        overflow: 'truncate',
                    },
                    emphasis: {
                        focus: 'adjacency'
                    },
                    data: this.data,
                    links: this.links,
                },
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
            SankeyChart,
            SVGRenderer,
            TitleComponent,
            TooltipComponent,
        ]);
    },
    mounted() {
        this.chart = markRaw(init(this.$refs.root, 'dark', { renderer: 'svg' }));
        this.chart.setOption(this.option);
    },
}
</script>
