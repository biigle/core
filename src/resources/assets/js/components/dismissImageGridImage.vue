<template>
    <figure
        class="image-grid__image image-grid__image--largo"
        :class="classObject"
        :title="title"
        >
        <div v-if="selectable" class="image-icon">
            <i class="fas" :class="iconClass"></i>
        </div>
        <img :src="srcUrl" @error="showEmptyImage" @click="toggleSelect">
        <img v-if="this.showAnnotationOutlines" v-show="overlayIsLoaded" :src="svgSrcUrl" @error="handleOverlayError" @load="handleOverlayLoad" class="outlines">
        <div
            v-if="pinnable || isPinned"
            class="image-buttons-bottom"
            >
            <button
                class="image-button image-button__pin"
                @click="emitPin"
                :title="pinTitle"
                >
                <span class="fa fa-thumbtack fa-fw"></span>
            </button>
        </div>
        <div v-if="showAnnotationLink" class="image-buttons">
            <a :href="showAnnotationLink" target="_blank" class="image-button"
                title="Show the annotation in the annotation tool">
                <span class="fa fa-external-link-square-alt fa-fw" aria-hidden="true"></span>
            </a>
        </div>
    </figure>
</template>

<script>
import AnnotationPatch from '../mixins/annotationPatch';
import { ImageGridImage } from '../import';

/**
 * A variant of the image grid image used for the dismiss step of Largo
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
        selected() {
            return this.image.dismissed;
        },
        title() {
            return this.selected ? 'Undo dismissing this annotation' : 'Dismiss this annotation';
        },
        pinTitle() {
            if (this.isPinned) {
                return 'Reset sorting';
            }

            return 'Select as reference (sort by similarity)';
        },
        svgSrcUrl() {
            // Replace file extension by svg file format
            return this.srcUrl.replace(/.[A-Za-z]*$/, '.svg');
        },
        showAnnotationOutlines(){
           return !this.overlayHasError && this.outlines.showAnnotationOutlines;
        },
    },
    methods: {
        handleOverlayLoad() {
            this.overlayIsLoaded = true;
        },
        handleOverlayError() {
            this.overlayHasError = true;
        },
    },
};
</script>
