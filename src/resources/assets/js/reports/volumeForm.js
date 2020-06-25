import Form from './mixins/reportForm';
import VolumesApi from './api/volumeReports';

/**
 * The form for requesting a volume report
 */
export default {
    mixins: [Form],
    data: {
        allowedOptions: {
            'Annotations': [
                'export_area',
                'newest_label',
                'separate_label_trees',
                'annotation_session_id',
                'only_labels',
                'aggregate_child_labels',
            ],
            'ImageLabels': [
                'separate_label_trees',
                'annotation_session_id',
                'only_labels',
            ],
        },
        options: {
            annotation_session_id: null,
        },
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
