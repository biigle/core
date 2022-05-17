<script>
import {handleErrorResponse} from '../core/messages/store';
import statisticsComponent from './components/statisticsComponent.vue';

export default {
    data() {
        return {
            project: null,
            userId: null,
        };
    },
    components: {
        // html-element : wert
        statisticsComponent:statisticsComponent
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
