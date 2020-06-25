import Form from './mixins/reportForm';
import VideosApi from './api/videoReports';

/**
 * The form for requesting a video report
 */
export default {
    mixins: [Form],
    data: {
        videoId: null,
        selectedType: 'VideoAnnotations',
        selectedVariant: 'Csv',
        allowedOptions: {
            'VideoAnnotations': [
                'separate_label_trees',
                'only_labels',
            ],
        },
    },
    methods: {
        submit() {
            this.request(this.videoId, VideosApi);
        },
    },
    created() {
        this.videoId = biigle.$require('reports.videoId');
    },
};
