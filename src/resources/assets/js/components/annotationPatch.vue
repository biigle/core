<script>
import AnnotationPatch from '../mixins/annotationPatch.vue';
import {IMAGE_ANNOTATION} from '../constants.js';

/**
 * An example annotation patch image.
 *
 * @type {Object}
 */
export default {
    mixins: [AnnotationPatch],
    props: {
        _id: {
            type: String,
            required: true,
        },
        _uuid: {
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
        _urlTemplate: {
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
        image() {
            return {
                id: this._id,
                uuid: this._uuid,
                type: IMAGE_ANNOTATION,
            };
        },
        urlTemplate() {
            return this._urlTemplate;
        },
    },
    methods: {
        showEmptyImage() {
            this.url = '';
        },
    },
    created() {
        this.url = this.getThumbnailUrl();
    },
};
</script>
