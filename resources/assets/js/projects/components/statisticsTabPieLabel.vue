<template>
     <v-chart class="chart" :option="option" ></v-chart>
</template>

<script>
import * as echarts from 'echarts/core';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components';
import { PieChart } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import VChart, { THEME_KEY } from "vue-echarts";

echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  PieChart,
  CanvasRenderer,
  LabelLayout
]);


export default {
    name: "PieChart",
    components: {
        VChart
    },
    provide: {
        [THEME_KEY]: "dark"
    },
    props: {
        annotationLabels: {required:true, type:Array},
        container: {required:true, type:String},

        volumeType: {required:false, type:String},
        annotationLabelsVideo: {required:false, type:Array},
        showImageVolumes: {required:false, type:Boolean},
        showVideoVolumes: {required:false, type:Boolean}
    },
    data() {
        return {      
            mergedAnnotationLabels: []
        }
    },
    methods: {
        updateData(val) {
            this.mergedAnnotationLabels = val;
        }
    },
    mounted() {
        // handle different locations (modal, project-statistics)
        this.$watch(
            () => this.container, 
            () => {
                if(this.container === "modal-statistics") {
                    // overwrite the mergedAnnotationLabels with default data 
                    this.mergedAnnotationLabels = this.annotationLabels;
                }
            },
            {
                immediate: true
            }
        ),
        // Select either each dataset itself or merge both
        // depending on the buttons selected (showImage, showVideo)
        this.$watch(
            // do not watch if statistics is openend in modal
            () => [this.showImageVolumes, this.showVideoVolumes],
            () => {
                // only relevant when in projects-tab
                if(this.container === "project-statistics") {
                    if (this.showImageVolumes && !this.showVideoVolumes) {
                        this.updateData(this.annotationLabels);
                    } else if(!this.showImageVolumes && this.showVideoVolumes) {
                        this.updateData(this.annotationLabelsVideo);
                    } else { //both true
                        this.updateData(this.annotationLabels.concat(this.annotationLabelsVideo));
                    }
                }
            },
            {
            immediate: true
            }
        )
    },
    created() {
    },
    computed: {
        dat() {
            let ret = [];
            for(let entry of this.mergedAnnotationLabels) {
                let formatObj = {
                    "name": entry.name, 
                    "value": entry.count, 
                    "itemStyle": {"color": "#" + entry.color}};
                ret.push(formatObj);
            }
            return ret;
        },

        subtitle() {
            if(this.container === "project-statistics") {
                let term = () => {
                    return !this.showImageVolumes ? ' video '
                            : !this.showVideoVolumes ? ' image '
                            : ' ';
                }
                return '(across all' + term() + 'volumes of the project)'
            } else {
                return null
            }
        },

        option() {
            return {
                backgroundColor: '#222222',
                title: {
                    text: 'Abundance of annotation labels',
                    subtext: this.subtitle,
                    left: 'center',
                    top: '5%',
                    textStyle: {
                        fontSize: 15
                    },
                },
                tooltip: {
                    trigger: 'item',
                    formatter: '{b} : <b>{c}</b> ({d}%)'
                },
                // legend: {
                //     type: 'scroll',
                //     orient: 'horizontal',
                //     bottom: '5%',
                //     data: ['label1', 'label2', 'label3', 'label4']
                // },
                // color: [
                //     '#7cffb2',
                //     '#ff6e76'
                // ],
                series: [
                {
                    name: 'Annotation Label',
                    type: 'pie',
                    radius: '50%',
                    avoidLabelOverlap: false,
                    label: {
                    show: true,
                    position: 'outside'
                    },
                    labelLine: {
                    show: true
                    },
                    data: this.dat,
                    emphasis: {
                        itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
                ]
            }
        } //end option
    }
}
</script>