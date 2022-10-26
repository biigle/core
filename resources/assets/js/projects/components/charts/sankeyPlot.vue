<template>
     <v-chart class="chart grid-col-span-3" :option="option" ></v-chart>
</template>

<script>
import * as echarts from 'echarts/core';
import { SankeyChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TitleComponent, TooltipComponent } from 'echarts/components';
import VChart, { THEME_KEY } from "vue-echarts";

export default {
    components: {
        VChart
    },
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
    provide: {
        [THEME_KEY]: "dark"
    },
    computed: {
        data() {
            // returns an array of User-names and volume-names
            let volNames = this.volumeAnnotations.map(entry => {
                return this.names.find(x => x.id ===  entry.volume_id).name;
            });
            volNames = [...new Set(volNames)];

            let userNames = this.volumeAnnotations.map(entry => {
                if (entry.fullname === " ") {
                    return "Deleted Account"
                }
                return entry.fullname;
            })
            userNames = [...new Set(userNames)];

            let combined = userNames.concat(...volNames);
            combined = combined.map(entry => {
                return {name: entry}
            })

            return combined;
        },

        links() {
            let result_array = [];

            for(let obj of this.volumeAnnotations) {
                // create a single link-entry
                let entry = {
                    source: obj.fullname === " " ? "Deleted Account" : obj.fullname,
                    target: this.names.find(x => x.id ===  obj.volume_id).name,
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
                        position: "right"
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
    beforeCreate() {
        echarts.use([
            SankeyChart,
            CanvasRenderer,
            TitleComponent,
            TooltipComponent,
        ]);
    },
}
</script>
