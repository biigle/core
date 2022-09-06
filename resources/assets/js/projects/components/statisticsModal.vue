<template>
    <modal id="modal-show-statistics" ref="modal" v-model="show" title="Statistics" size="lg" ok-text="Ok" ok-type="primary">
        <div v-if="showCharts" class="modal-statistics">
            <annotation-timeline v-if="showTimeline" :annotation-time-series="dat.annotationTimeSeries" :volumeType="dat.volumeType" :container="container"></annotation-timeline>
            <!-- <bar-plot :volume-annotations="dat.volumeAnnotations" :names="dat.volumeName"></bar-plot> -->
            <!-- <sankey-plot v-if="showSankey" :volume-annotations="dat.volumeAnnotations" :names="dat.volumeName"></sankey-plot> -->
            <pie-chart :total-images="dat.totalImages" :annotated-images="dat.annotatedImages" :volumeType="dat.volumeType" :container="container"></pie-chart>
            <pie-label v-if="showPieLabel" :annotation-labels="dat.annotationLabels" :volumeType="dat.volumeType" :container="container"></pie-label>
            <net-map v-if="showNetMap" :annotation-labels="dat.annotationLabels" :source-target-labels="dat.sourceTargetLabels" :volumeType="dat.volumeType" :container="container"></net-map>
        </div>
    </modal>
</template>

<script>
import { Modal } from 'uiv';
import AnnotationTimeline from './statisticsTabTimeline.vue';
import PieChart from './statisticsTabPie.vue';
import NetMap from './statisticsTabNetmap.vue';
import PieLabel from './statisticsTabPieLabel.vue';


export default{
    name: "statisticsModal",
    components: {
        modal: Modal,
        AnnotationTimeline:AnnotationTimeline,
        PieChart:PieChart,
        PieLabel:PieLabel,
        NetMap:NetMap
    },
    props: {
        showModal: {required:true, type:Boolean},
        statisticsData: {required:true, type:Object}
    },
    data() {
        return {
            show: false,
            // Use this extra variable to show the ECharts only after the modal was
            // initialized (using $nextTick). Otherwise ECharts cannot determine the
            // DOM element width.
            showCharts: false,
            showTimeline: true,
            showSankey: true,
            showPieLabel: true,
            showNetMap: true,
            dat: {},
            container: "modal-statistics"
        };
    },
    created() {
        // console.log("Full Object: ", this.annotatedImages);
        // console.log("Volume-sourceTarget: ", JSON.stringify(this.dat.annotationLabel));
    },
    methods: {
        checkForEmptyVals() {
            // check for each statistics-vis if corresponding arrays/objects are empty
            if(this.dat.annotationTimeSeries.length === 0) {
                this.showTimeline = false;
            }
            if(this.dat.volumeAnnotations.length === 0) {
                this.showSankey = false;
            }
            if(this.dat.annotationLabels.length === 0) {
                this.showPieLabel = false;
            }
            if(Object.keys(this.dat.sourceTargetLabels).length === 0 && this.dat.annotationLabels.length == 0) {
                this.showNetMap = false;
            }
        }
    },
    watch: {
        // if volume-statistics-button pressed, trigger modal
        showModal: function(){
            if (this.showModal){
                this.dat = this.statisticsData
                this.checkForEmptyVals();
                this.show = true;
                // console.log("Volume: ", JSON.stringify(this.dat.annotationLabels));
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
                this.showTimeline = true;
                this.showSankey = true;
                this.showPieLabel = true;
                this.showNetMap = true;
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

.modal-footer .btn-default {
    visibility: hidden;
    display: none;
}
</style>
