<script>
import Form from './mixins/reportForm.vue';
import VolumesApi from './api/volumeReports.js';

/**
 * The form for requesting a volume report
 */
export default {
    extends: Form,
    methods: {
        submit() {
            this.request(this.volumeId, VolumesApi);
        },
    },
    created() {
        this.volumeId = biigle.$require('reports.volumeId');
        this.allowedOptions = {
            'ImageAnnotations': [
                'export_area',
                'newest_label',
                'separate_label_trees',
                'separate_users',
                'annotation_session_id',
                'only_labels',
                'aggregate_child_labels',
                'all_labels',
                'skip_attributes',
            ],
            'ImageLabels': [
                'separate_label_trees',
                'separate_users',
                'annotation_session_id',
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
                'annotation_session_id',
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

        this.options.annotation_session_id = null;
    },
};
</script>
