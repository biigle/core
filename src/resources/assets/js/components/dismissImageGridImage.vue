<template>
    <figure class="image-grid__image" :class="classObject" :title="title">
        <div v-if="selectable" class="image-icon">
            <i class="fas" :class="iconClass"></i>
        </div>
        <div class="overlay svg">
            <img @click="toggleSelect" :src="srcUrl" @error="showEmptyImage">
            <span v-html="this.svg" class="stroke" :style="this.getSVGStyle(true)"></span>
            <span v-if="this.isPoint" v-html="this.svg" class="stroke fill" :style="this.getSVGStyle(false)"></span>
            <span v-else v-html="this.svg" class="stroke" :style="this.getSVGStyle(false)"></span>
        </div>
        <div v-if="showAnnotationLink" class="image-buttons">
            <a :href="showAnnotationLink" target="_blank" class="image-button"
                title="Show the annotation in the annotation tool">
                <span class="fa fa-external-link-square-alt fa-fw" aria-hidden="true"></span>
            </a>
        </div>
    </figure>
</template>

<style scoped>
.stroke ::v-deep svg * {
    stroke: var(--color);
    stroke-width: var(--width);
    fill: none;
    stroke-linejoin: round;
}

.fill ::v-deep svg circle {
    fill: var(--color);
}
</style>

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
            svg: null,
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
        isPoint() {
            return this.svg !== null ? this.svg.includes('r="1"') : false;
        }
    },
    methods: {
        svgSrcUrl() {
            // Replace file extension by svg file format
            return this.srcUrl.replace(/.[A-Za-z]*$/, '.svg');
        },
        async fetchSVG() {
            await fetch(this.svgSrcUrl()).then(res => res.text()).then(data => { this.svg = data; });
        },
        getSVGStyle(isOutline) {
            return isOutline ? '--color: white; --width: 5px;'
                : '--color: #' + this.image.label_color + '; --width: 3px;';
        }
    },
    created() {
        this.fetchSVG();
    }
};
</script>
