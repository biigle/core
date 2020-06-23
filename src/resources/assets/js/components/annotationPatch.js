import AnnotationPatch from '../mixins/annotationPatch';

/**
 * An example annotation patch image.
 *
 * @type {Object}
 */
export default {
    mixins: [AnnotationPatch],
    props: {
        id: {
            type: String,
            required: true,
        },
        uuid: {
            type: String,
            required: true,
        },
        label: {
            type: Object,
            required: true,
        },
        emptySrc: {
            type: String,
            required: true,
        },
        urlTemplate: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            url: '',
        };
    },
    computed: {
        title() {
            return 'Example annotation for label ' + this.label.name;
        },
        src() {
            return this.url || this.emptySrc;
        },
    },
    methods: {
        showEmptyImage() {
            this.url = '';
        },
    },
    created() {
        this.url = this.getUrl();
    },
};
