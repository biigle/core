<template>
    <figure class="image-grid__image" :class="classObject" :title="title">
        <div v-if="selectable" class="image-icon">
            <i class="fas" :class="iconClass"></i>
        </div>
        <img @click="toggleSelect" :src="srcUrl" @error="showEmptyImage">
        <div v-if="showAnnotationLink" class="image-buttons">
            <a :href="showAnnotationLink" target="_blank" class="image-button" title="Show the annotation in the annotation tool">
                <span class="fa fa-external-link-square-alt fa-fw" aria-hidden="true"></span>
            </a>
        </div>
    </figure>
</template>

<script>
import AnnotationPatch from '../mixins/annotationPatch';
import {ImageGridImage} from '../import';

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
        };
    },
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
    },
};
</script>
