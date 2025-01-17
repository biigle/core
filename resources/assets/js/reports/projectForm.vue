<script>
import Form from './mixins/reportForm';
import ProjectsApi from './api/projectReports';

/**
 * The form for requesting a project report
 */
export default {
    mixins: [Form],
    data() {
        return {
            projectId: null,
            allowedOptions: {
                'ImageAnnotations': [
                    'export_area',
                    'newest_label',
                    'separate_label_trees',
                    'separate_users',
                    'only_labels',
                    'aggregate_child_labels',
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
            },
        };
    },
    methods: {
        submit() {
            this.request(this.projectId, ProjectsApi);
        }
    },
    created() {
        this.projectId = biigle.$require('reports.projectId');
    },
};
</script>
