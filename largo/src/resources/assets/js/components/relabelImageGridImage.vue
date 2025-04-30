<template>
    <figure class="image-grid__image image-grid__image--largo image-grid__image--relabel" :class="classObject" :title="title">
        <div v-if="selectable" class="image-icon">
            <i class="fas" :class="iconClass"></i>
        </div>
        <img @click="toggleSelect" :src="srcUrl" @error="showEmptyImage">
        <img v-if="this.showAnnotationOutlines" v-show="overlayIsLoaded" :src="svgSrcUrl" @error="handleOverlayError" @load="handleOverlayLoad" class="outlines">
        <div v-if="showAnnotationLink" class="image-buttons">
            <a :href="showAnnotationLink" target="_blank" class="image-button" title="Show the annotation in the annotation tool">
                <span class="fa fa-external-link-square-alt" aria-hidden="true"></span>
            </a>
        </div>
        <div v-if="selected" class="new-label">
            <span class="new-label__color" :style="newLabelStyle"></span>
            <span class="new-label__name" v-text="image.newLabel.name"></span>
        </div>
    </figure>
</template>

<script>
import AnnotationPatch from '../mixins/annotationPatch.vue';
import {ImageGridImage} from '../import.js';

/**
 * A variant of the image grid image used for the relabel step of Largo
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
            return this.image.newLabel;
        },
        title() {
            return this.selected ? 'Revert changing the label of this annotation' : 'Change the label of this annotation';
        },
        newLabelStyle() {
            return {
                'background-color': '#' + this.image.newLabel.color,
            };
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
