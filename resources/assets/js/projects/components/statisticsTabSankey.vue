<template>
     <v-chart class="chart grid-col-span-3" :option="option" ></v-chart>
</template>

<script>
import * as echarts from 'echarts/core';
import { SankeyChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TitleComponent } from 'echarts/components';
import VChart, { THEME_KEY } from "vue-echarts";

echarts.use([
    SankeyChart, 
    CanvasRenderer,
    TitleComponent
    ]);


export default {
    name: "SankeyDiagram",
    components: {
        VChart
    },
    props: {
        volumeAnnotations: {required:true, type:Array},
        names: {required:true, type:Array},
        container: {required:true, type:String},
        
        showImageVolumes: {required:false, type:Boolean},
        volumeAnnotationsVideo: {required:false, type:Array},
        namesVideo: {required:false, type:Array},
        showVideoVolumes: {required:false, type:Boolean},
    },
    provide: {
        [THEME_KEY]: "dark"
    },
    data() {
        return {
            mergedData: [],
            mergedNames: []  
        }
    },
    mounted() {
        // Select either each dataset itself or merge both
        // depending on the buttons selected (showImage, showVideo)
        this.$watch(
            () => [this.showImageVolumes, this.showVideoVolumes],
            () => {
                 // only relevant when in projects-tab
                if(this.container === "project-statistics") {
                    if(this.showImageVolumes && !this.showVideoVolumes) {
                        this.mergedData = this.volumeAnnotations;
                        this.mergedNames = this.names;
                    } else if(!this.showImageVolumes && this.showVideoVolumes) {
                        this.mergedData =  this.volumeAnnotationsVideo;
                        this.mergedNames = this.namesVideo;
                    } else { //both true
                        this.mergedData = this.volumeAnnotations.concat(this.volumeAnnotationsVideo);
                        this.mergedNames = this.names.concat(this.namesVideo);

                    }
                }
            },
            {
            immediate: true
            }
        )
    },
    created() {
        // console.log('DATA: ', this.data);
        // console.log('LINKS: ', this.links);
        // console.log(this.option);
    },
    computed: {
        data() {
            // returns an array of User-names and volume-names
            let volNames = this.mergedData.map(entry => {
                return  this.mergedNames.find(x => x.id ===  entry.volume_id).name;
            });
            volNames = [...new Set(volNames)];

            let userNames = this.mergedData.map(entry => {
                if(entry.fullname === " ") {
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

            for(let obj of this.mergedData) {
                // create a single link-entry
                let entry = {
                    source: obj.fullname === " " ? "Deleted Account" : obj.fullname,
                    target: this.mergedNames.find(x => x.id ===  obj.volume_id).name,
                    value: obj.count
                }
                // append to result array
                result_array.push(entry);
            }

            return result_array;
        },

        option() {
            return {
                backgroundColor: '#222222',
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
                    links: this.links
                }
            }
        }
    }
}
</script>