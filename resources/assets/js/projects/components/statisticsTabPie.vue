<template>
     <v-chart class="chart" :option="option" ></v-chart>
</template>

<script>
import * as echarts from 'echarts/core';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { PieChart } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { TitleComponent } from 'echarts/components';
import VChart, { THEME_KEY } from "vue-echarts";

echarts.use([
  TooltipComponent,
  LegendComponent,
  PieChart,
  CanvasRenderer,
  LabelLayout,
  TitleComponent
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
        annotatedImages: {required:true, type:Number},
        annotatedVideos: {required:false, type:Number},
        totalImages: {required:true, type:Number},
        totalVideos: {required:false, type:Number},
        container: {required:true, type:String},
        showImageVolumes: {required:false, type:Boolean},
        showVideoVolumes: {required:false, type:Boolean},
    },
    data() {
        return {      
            mergedAnnotated: null,
            mergedTotal: null,
        }
    },
    methods: {
        updateData(annot, total) {
            this.mergedAnnotated = annot;
            this.mergedTotal = total;
        }
    },
    mounted() {
        // handle different locations (modal, project-statistics)
        this.$watch(() => this.container, 
            () => {
                // console.log("PieLabel: ", this.container);
                if(this.container === "modal-statistics") {
                    // TODO: if(volumeType === "image") ...
                    this.mergedAnnotated = this.annotatedImages;
                    this.mergedTotal = this.totalImages;
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
                if(this.showImageVolumes && !this.showVideoVolumes) {
                    this.updateData(this.annotatedImages, this.totalImages);
                } else if(!this.showImageVolumes && this.showVideoVolumes) {
                    this.updateData(this.annotatedVideos, this.totalVideos);
                } else { //both true
                    this.updateData(this.annotatedImages + this.annotatedVideos,
                                    this.totalImages + this.totalVideos);
                }
            },
            {
            immediate: true
            }
        )
    },
    computed: {
        subtitle() {
            if(this.container === "project-statistics") {
                return '(across all volumes of the project)'
            } else {
                return null
            }
        },

        option() {
            return {
                backgroundColor: '#222222',
                title: {
                    text: 'Annotated vs. not annotated',
                    subtext: this.subtitle,
                    left: 'center',
                    top: '5%',
                    textStyle: {
                        fontSize: 15
                    },
                },
                tooltip: {
                    trigger: 'item'
                },
                legend: {
                    bottom: '5%',
                    left: 'center'
                },
                color: [
                    '#7cffb2',
                    '#ff6e76'
                ],
                series: [
                {
                    name: 'Files',
                    type: 'pie',
                    radius: ['30%', '60%'],
                    avoidLabelOverlap: false,
                    label: {
                    show: false,
                    position: 'center'
                    },
                    labelLine: {
                    show: false
                    },
                    data: [
                    { value: this.mergedAnnotated, name: 'Annotated' },
                    { value: (this.mergedTotal - this.mergedAnnotated), name: 'Not Annotated' },
                    ]
                }
                ]
            }
        }
    }
}
</script>