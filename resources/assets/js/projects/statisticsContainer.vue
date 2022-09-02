<script>
import AnnotationTimeline from './components/statisticsTabTimeline.vue';
import SankeyPlot from './components/statisticsTabSankey.vue';
import PieChart from './components/statisticsTabPie.vue';
import NetMap from './components/statisticsTabNetmap.vue';
import PieLabel from './components/statisticsTabPieLabel.vue';

export default {
    data() {
        return {
            project: null,
            userId: null,
            annotationTimeSeries: null,
            volumeAnnotations: null,
            volumeNames: null,
            annotatedImages: null,
            totalImages: null,
            annotationLabels: null,
            sourceTargetLabels: null,
            showTimeline: true,
            showSankey: true,
            showPieLabel: true,
            showNetMap: true,
            container: "project-statistics",
        };
    },
    components: {
        // html-element : wert
        AnnotationTimeline:AnnotationTimeline,
        // BarPlot:BarPlot,
        PieChart:PieChart,
        SankeyPlot:SankeyPlot,
        PieLabel:PieLabel,
        NetMap:NetMap
    },
    methods: {
        checkForEmptyVals() {
            // check for each statistics-vis if corresponding arrays/objects are empty
            if(this.annotationTimeSeries.length === 0) {
                this.showTimeline = false;
            }
            if(this.volumeAnnotations.length === 0) {
                this.showSankey = false;
            }
            if(this.annotationLabels.length === 0) {
                this.showPieLabel = false;
            }
            if(Object.keys(this.sourceTargetLabels).length === 0 && this.annotationLabels.length == 0) {
                this.showNetMap = false;
            }
        }
    },
    created() {
        this.project = biigle.$require('projects.project');
        this.userId = biigle.$require('projects.userId');
        this.annotationTimeSeries = biigle.$require('projects.annotationTimeSeries');
        this.volumeAnnotations = biigle.$require('projects.volumeAnnotations');
        this.volumeNames = biigle.$require('projects.volumeNames');
        this.annotatedImages = biigle.$require('projects.annotatedImages');
        this.totalImages = biigle.$require('projects.totalImages');
        this.annotationLabels =  biigle.$require('projects.annotationLabels');
        this.sourceTargetLabels =  biigle.$require('projects.sourceTargetLabels');

        this.checkForEmptyVals();
        // console.log(JSON.stringify(this.annotatedImages));
        // console.log(JSON.stringify(this.totalImages));
        // console.log(JSON.stringify(this.sourceTargetLabels));
        // console.log(JSON.stringify(this.volumeAnnotations));
    },
};
</script>

<style scoped>
.project-statistics {
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
  outline: solid #424242 1px;
}
</style>
