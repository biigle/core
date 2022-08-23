<template>
    <modal id="modal-show-statistics" ref="modal" v-model="show" title="Statistics" size="lg">
        <div v-if="showCharts" class="modal-statistics">
            <annotation-timeline :annotation-time-series="annotationTimeSeries"></annotation-timeline>
            <!-- <bar-plot :volume-annotations="volumeAnnotations" :names="volumeNames"></bar-plot> -->
            <sankey-plot :volume-annotations="volumeAnnotations" :names="volumeName"></sankey-plot>
            <pie-chart :total-images="totalImages" :annotated-images="annotatedImages"></pie-chart>
            <pie-label :annotation-labels="annotationLabels"></pie-label>
            <net-map :annotation-labels="annotationLabels" :source-target-labels="sourceTargetLabels"></net-map>
        </div>
    </modal>
</template>

<script>
import { Modal } from 'uiv';
import AnnotationTimeline from './statisticsTabTimeline.vue';
import BarPlot from './statisticsTabBar.vue';
import SankeyPlot from './statisticsTabSankey.vue';
import PieChart from './statisticsTabPie.vue';
import NetMap from './statisticsTabNetmap.vue';
import PieLabel from './statisticsTabPieLabel.vue';


export default{
    name: "statisticsModal",
    components: {
        modal: Modal,
        AnnotationTimeline:AnnotationTimeline,
        // BarPlot:BarPlot,
        PieChart:PieChart,
        SankeyPlot:SankeyPlot,
        PieLabel:PieLabel,
        NetMap:NetMap
    },
    props: {
        showModal: {required:true, type:Boolean}
    },
    data() {
        return {
            show: false,
            // Use this extra variable to show the ECharts only after the modal was
            // initialized (using $nextTick). Otherwise ECharts cannot determine the
            // DOM element width.
            showCharts: false,
            annotatedImages: 1,
            annotationLabels:[
                    {color:"0099ff", count:1, id:1, name:"homenick.mary"},
                    {color:"0099ff", count:1, id:2, name:"schmeler.heath"}
            ],
            annotationTimeSeries: [
                {count:1, fullname:"Aurore Hintz", user_id:5, year:2022},
                {count:1, fullname:"Maybelle Balistreri", user_id:6, year:2022}
            ],
            sourceTargetLabels:{1:[2]},
            totalImages:2,
            volumeAnnotations:[
                {count:1, fullname:"Aurore Hintz", user_id:5, volume_id:1},
                {count:1, fullname:"Maybelle Balistreri", user_id:6, volume_id:1}
            ],
            volumeName:[
                {id:1, name:"Hand-Lindgren"}
            ]
        };
    },
    created() {
        // console.log("Full Object: ", this.annotatedImages);
    //     console.log("Volume-Name: ", this.allData.volumeName);
    },
    methods: {
    },
    watch: {
        // if volume-statistics-button pressed, trigger modal
        showModal: function(){
            if (this.showModal){
                this.show = true;
            }
        },
        // if modal is closed, trigger the close-modal-event, which sets 'showModal' in parent container to false again
        show: function() {
            if (this.show) {
                this.$nextTick(() => this.showCharts = true);
            } else {
                this.$emit('close-modal');
                // console.log('SHOW: ', this.show);
                this.showCharts = false;
            }
        }
    }
}
</script>


<style scoped>
.modal-statistics {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(2, 1fr);
    padding-bottom: 1.5rem;
}

.grid-col-span-3 {
    grid-column: 1 / span 2;
}

.chart {
  height: 400px;
  width: 100%;
  outline: solid #424242 1px;
}
</style>
