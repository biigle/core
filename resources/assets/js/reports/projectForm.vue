<script>
import Form from './mixins/reportForm.vue';
import ProjectsApi from './api/projectReports.js';

/**
 * The form for requesting a project report
 */
export default {
    extends: Form,
    data() {
        return {
            projectId: null,
        };
    },
    methods: {
        submit() {
            this.request(this.projectId, ProjectsApi);
        }
    },
    created() {
        this.projectId = biigle.$require('reports.projectId');
        this.allowedOptions = {
            'ImageAnnotations': [
                'export_area',
                'newest_label',
                'separate_label_trees',
                'separate_users',
                'only_labels',
                'aggregate_child_labels',
                'all_labels',
                'skip_attributes',
            ],
            'ImageLabels': [
                'separate_label_trees',
                'separate_users',
                'only_labels',
            ],
            'VideoAnnotations': [
                'newest_label',
                'separate_label_trees',
                'separate_users',
                'annotation_session_id',
                'only_labels',
                'skip_attributes',
            ],
            'VideoLabels': [
                'separate_label_trees',
                'separate_users',
                'only_labels',
            ],
            'ImageIfdo': [
                'export_area',
                'newest_label',
                'only_labels',
                'strip_ifdo',
            ],
            'VideoIfdo': [
                'newest_label',
                'only_labels',
                'strip_ifdo',
            ],
        };
    },
};
</script>
