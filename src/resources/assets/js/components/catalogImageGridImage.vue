<template>
    <figure class="image-grid__image image-grid__image--catalog" :class="classObject">
        <a v-if="showAnnotationLink" :href="showAnnotationLink" target="_blank" title="Show the annotation in the annotation tool">
            <img :src="srcUrl" @error="showEmptyImage">
            <img v-if="this.showOutlines" v-show="overlayIsLoaded" :src="svgSrcUrl" @error="handleOverlayError" @load="handleOverlayLoad" class="outlines">
        </a>
        <img v-else :src="srcUrl" @error="showEmptyImage">
    </figure>
</template>

<script>
import AnnotationPatch from '../mixins/annotationPatch';
import {IMAGE_ANNOTATION} from '../constants';
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
            overlayIsLoaded: false,
            overlayHasError: false,
        };
    },
    inject: ['outlines'],
    computed: {
        showAnnotationLink() {
            return this.showAnnotationRoute ? (this.showAnnotationRoute + this.image.id) : '';
        },
        svgSrcUrl() {
            // Replace file extension by svg file format
            return this.srcUrl.replace(/.[A-Za-z]*$/, '.svg');
        },
        showOutlines(){
            return !this.overlayHasError && this.outlines.showAnnotationOutlines;
        }
    },
    methods: {
        handleOverlayLoad() {
            this.overlayIsLoaded = true;
        },
        handleOverlayError() {
            this.overlayHasError = true;
        },
    },
    created() {
        if (this.type === IMAGE_ANNOTATION) {
            this.showAnnotationRoute = biigle.$require('annotationCatalog.showImageAnnotationRoute');
        } else {
            this.showAnnotationRoute = biigle.$require('annotationCatalog.showVideoAnnotationRoute');
        }
    },
};
</script>

