<script>
import {VIDEO_ANNOTATION, IMAGE_ANNOTATION} from '../constants.js';

export default {
    computed: {
        id() {
            return this.image.id;
        },
        uuid() {
            return this.image.uuid;
        },
        type() {
            return this.image.type;
        },
        patchPrefix() {
            return this.uuid[0] + this.uuid[1] + '/' + this.uuid[2] + this.uuid[3] + '/' + this.uuid;
        },
        urlTemplate() {
            // Usually this would be set in the created function but in this special
            // case this is not possible.
            return biigle.$require('largo.patchUrlTemplate');
        },
    },
    methods: {
        getThumbnailUrl() {
            if (this.type === VIDEO_ANNOTATION) {
                return this.urlTemplate
                    .replace(':prefix', this.patchPrefix)
                    .replace(':id', `v-${this.id}`);
            }

            return this.urlTemplate
                .replace(':prefix', this.patchPrefix)
                .replace(':id', this.id);
        },
    },
    created() {
        if (this.type === IMAGE_ANNOTATION) {
            this.showAnnotationRoute = biigle.$require('largo.showImageAnnotationRoute');
        } else {
            this.showAnnotationRoute = biigle.$require('largo.showVideoAnnotationRoute');
        }
    },
};
</script>
