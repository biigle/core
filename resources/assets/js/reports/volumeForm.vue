<script>
import Form from './mixins/reportForm';
import VolumesApi from './api/volumeReports';

/**
 * The form for requesting a volume report
 */
export default {
    mixins: [Form],
    data() {
        return {
            allowedOptions: {
                'ImageAnnotations': [
                    'export_area',
                    'newest_label',
                    'separate_label_trees',
                    'separate_users',
                    'annotation_session_id',
                    'only_labels',
                    'aggregate_child_labels',
                    'all_labels'
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
            },
            options: {
                annotation_session_id: null,
            },
        };
    },
    methods: {
        submit() {
            this.request(this.volumeId, VolumesApi);
        },
    },
    created() {
        this.volumeId = biigle.$require('reports.volumeId');
    },
};
</script>
