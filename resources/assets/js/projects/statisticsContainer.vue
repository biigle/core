<script>
import {handleErrorResponse} from '../core/messages/store';
import AnnotationTimeline from './components/statisticsTabTimeline.vue';

export default {
    data() {
        return {
            project: null,
            userId: null,
        };
    },
    components: {
        // html-element : wert
        AnnotationTimeline:AnnotationTimeline
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
