<template>
    <modal id="modal-show-statistics" ref="modal" v-model="show" title="Volume Charts" size="lg" :footer="false" @hide="handleHide">
        <div v-if="showCharts" class="project-volume-charts">
            <annotation-timeline v-if="showTimeline" :annotation-time-series="statisticsData.annotationTimeSeries" :volumeType="statisticsData.volumeType" :subtitle="subtitle"></annotation-timeline>
            <pie-chart :total-files="statisticsData.totalFiles" :annotated-files="statisticsData.annotatedFiles" :volumeType="statisticsData.volumeType"></pie-chart>
            <pie-label v-if="showPieLabel" :annotation-labels="statisticsData.annotationLabels" :volumeType="statisticsData.volumeType"></pie-label>
            <net-map v-if="showNetMap" :annotation-labels="statisticsData.annotationLabels" :source-target-labels="statisticsData.sourceTargetLabels" :volumeType="statisticsData.volumeType"></net-map>
        </div>
    </modal>
</template>

<script>
import AnnotationTimeline from './charts/timelinePlot.vue';
import NetMap from './charts/netmapDisplay.vue';
import PieChart from './charts/pieChart.vue';
import PieLabel from './charts/pieLabelChart.vue';
import { Modal } from 'uiv';


export default {
    components: {
        modal: Modal,
        annotationTimeline: AnnotationTimeline,
        pieChart: PieChart,
        pieLabel: PieLabel,
        netMap: NetMap,
    },
    props: {
        showModal: {
            required: true,
            type: Boolean,
        },
        statisticsData: {
            required: true,
            type: Object,
        },
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
            subtitle: 'per user annotations of this volume, sorted by year'
        };
    },
    methods: {
        checkForEmptyVals() {
            // check for each statistics-vis if corresponding arrays/objects are empty
            if (this.statisticsData.annotationTimeSeries.length === 0) {
                this.showTimeline = false;
            }
            if (this.statisticsData.volumeAnnotations.length === 0) {
                this.showSankey = false;
            }
            if (this.statisticsData.annotationLabels.length === 0) {
                this.showPieLabel = false;
            }
            if (Object.keys(this.statisticsData.sourceTargetLabels).length === 0 && this.statisticsData.annotationLabels.length === 0) {
                this.showNetMap = false;
            }
        },
        handleHide() {
            this.showCharts = false;
            this.showTimeline = true;
            this.showSankey = true;
            this.showPieLabel = true;
            this.showNetMap = true;
        },
    },
    watch: {
        // if volume-statistics-button pressed, trigger modal
        showModal: function () {
            if (this.showModal) {
                this.checkForEmptyVals();
                this.show = true;
            }
        },
        // if modal is closed, trigger the close-modal-event, which sets 'showModal' in parent container to false again
        show: function() {
            if (this.show) {
                this.$nextTick(() => this.showCharts = true);
            } else {
                this.$emit('close-modal');
            }
        }
    }
}
</script>
