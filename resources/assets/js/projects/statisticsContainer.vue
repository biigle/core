<script>
import {handleErrorResponse} from '../core/messages/store';
import AnnotationTimeline from './components/statisticsTabTimeline.vue';
import BarPlot from './components/statisticsTabBar.vue';
import SankeyPlot from './components/statisticsTabSankey.vue';
import PieChart from './components/statisticsTabPie.vue';

export default {
    data() {
        return {
            project: null,
            userId: null,
        };
    },
    components: {
        // html-element : wert
        AnnotationTimeline:AnnotationTimeline,
        BarPlot:BarPlot,
        SankeyPlot:SankeyPlot,
        PieChart:PieChart
    },
    methods: {
        //
    },
    created() {
        this.project = biigle.$require('projects.project');
        this.userId = biigle.$require('projects.userId');
    },
};
</script>

<style scoped>
.project-statistics {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(3, 1fr);
    padding-bottom: 1.5rem;
}

.grid-col-span-3 {
    grid-column: 1 / span 3;
}

.chart {
  height: 400px;
  outline: solid #424242 1px;
}
</style>