<template>
    <figure class="image-grid__image" :class="classObject" :title="title">
        <div v-if="selectable" class="image-icon">
            <i class="fas" :class="iconClass"></i>
        </div>
        <img @click="toggleSelect" :src="srcUrl" @error="showEmptyImage">
        <div v-if="showAnnotationLink" class="image-buttons">
            <a :href="showAnnotationLink" target="_blank" class="image-button" title="Show the annotation in the annotation tool">
                <span class="fa fa-external-link-square-alt" aria-hidden="true"></span>
            </a>
        </div>
    </figure>
</template>

<script>
import AnnotationPatch from '../mixins/annotationPatch';
import {IMAGE_ANNOTATION} from '../constants';
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
        id() {
            return this.image.id;
        },
        uuid() {
            return this.image.uuid;
        },
        type() {
            return this.image.type;
        },
        urlTemplate() {
            // Usually this would be set in the created function but in this special
            // case this is not possible.
            return biigle.$require('largo.patchUrlTemplate');
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
