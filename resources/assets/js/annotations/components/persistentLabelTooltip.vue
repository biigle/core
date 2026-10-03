<template>
    <annotation-overlay
        class="annotation-tooltip annotation-tooltip--persistent"
        drag-on-root
        dragging-class="annotation-tooltip--dragging"
        follow-geometry
        :feature="feature"
        :line-source="lineSource"
        :map="map"
        :show="show"
        >
        <ul class="annotation-tooltip__annotations">
            <li>
                <ul class="annotation-tooltip__labels">
                    <li v-for="label in labels" :key="label.id" v-text="label.name"></li>
                </ul>
            </li>
        </ul>
    </annotation-overlay>
</template>

<script>
import AnnotationOverlay from './annotationOverlay.vue';

export default {
    components: {
        annotationOverlay: AnnotationOverlay,
    },
    props: {
        feature: {
            type: Object,
            required: true,
        },
        lineSource: {
            type: Object,
            required: true,
        },
        map: {
            type: Object,
            required: true,
        },
        show: {
            type: Boolean,
            default: true,
        },
    },
    computed: {
        annotation() {
            return this.feature.get('annotation');
        },
        labels() {
            return this.annotation?.labels.map(annotationLabel => annotationLabel.label) || [];
        },
    },
};
</script>
