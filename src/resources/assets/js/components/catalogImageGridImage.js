import {ImageGridImage} from '../import';
import AnnotationPatch from '../mixins/annotationPatch';

/**
 * A variant of the image grid image used for the annotation catalog
 *
 * @type {Object}
 */
export default {
    mixins: [
        ImageGridImage,
        AnnotationPatch,
    ],
    template: `<figure class="image-grid__image image-grid__image--catalog" :class="classObject">
        <a v-if="showAnnotationLink" :href="showAnnotationLink" target="_blank" title="Show the annotation in the annotation tool">
            <img :src="url || emptyUrl" @error="showEmptyImage">
        </a>
        <img v-else :src="url || emptyUrl" @error="showEmptyImage">
    </figure>`,
    data() {
        return {
            showAnnotationRoute: null,
        };
    },
    computed: {
        showAnnotationLink() {
            return this.showAnnotationRoute ? (this.showAnnotationRoute + this.image.id) : '';
        },
        id() {
            return this.image.id;
        },
        uuid() {
            return this.image.uuid;
        },
        urlTemplate() {
            // Usually this would be set in the created function but in this special
            // case this is not possible.
            return biigle.$require('largo.patchUrlTemplate');
        },
    },
    created() {
        this.showAnnotationRoute = biigle.$require('annotationCatalog.showAnnotationRoute');
    },
};
