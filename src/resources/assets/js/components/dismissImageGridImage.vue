<template>
    <figure
        class="image-grid__image image-grid__image--largo"
        :class="specialClassObject"
        :title="title"
        @mouseenter="handleEnter"
        @mouseleave="handleLeave"
        >
        <div v-if="selectable" class="image-icon">
            <i class="fas" :class="specialIconClass"></i>
        </div>
        <img :src="srcUrl" @error="showEmptyImage" @click="toggleSelect">
        <img v-if="this.showAnnotationOutlines" v-show="overlayIsLoaded" :src="svgSrcUrl" @error="handleOverlayError" @load="handleOverlayLoad" class="outlines">
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
            hovered: false,
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
            if (this.pinnable) {
                return 'Select this annotation as a reference';
            }

            return this.selected ? 'Undo dismissing this annotation' : 'Dismiss this annotation';
        },
        svgSrcUrl() {
            // Replace file extension by svg file format
            return this.srcUrl.replace(/.[A-Za-z]*$/, '.svg');
        },
        showAnnotationOutlines(){
           return !this.overlayHasError && this.outlines.showAnnotationOutlines;
        },
        specialIconClass() {
            if (this.pinnable && this.hovered) {
                return 'fa-thumbtack';
            }

            return this.iconClass;
        },
        specialClassObject() {
            let obj = Object.assign({}, this.classObject);
            obj['image-grid__image--small-icon'] ||= this.pinnable && this.hovered;

            return obj;
        },
    },
    methods: {
        handleOverlayLoad() {
            this.overlayIsLoaded = true;
        },
        handleOverlayError() {
            this.overlayHasError = true;
        },
        handleEnter() {
            this.hovered = true;
        },
        handleLeave() {
            if (this.selected) {
                this.hovered = false;
            } else {
                // Wait for the CSS transition to finish.
                setTimeout(() => this.hovered = false, 250);
            }
        },
    },
};
</script>
