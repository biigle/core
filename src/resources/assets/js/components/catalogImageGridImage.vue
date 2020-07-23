<template>
    <figure class="image-grid__image image-grid__image--catalog" :class="classObject">
        <a v-if="showAnnotationLink" :href="showAnnotationLink" target="_blank" title="Show the annotation in the annotation tool">
            <img :src="srcUrl" @error="showEmptyImage">
        </a>
        <img v-else :src="srcUrl" @error="showEmptyImage">
    </figure>
</template>

<script>
import AnnotationPatch from '../mixins/annotationPatch';
import {ImageGridImage} from '../import';

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
</script>

