<script>
import {handleErrorResponse} from '../core/messages/store';

export default {
    data() {
        return {
            project: null,
            userId: null,
        };
    },
    components: {
        //
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
