<template>
    <div
        v-show="show"
        class="annotation-tooltip annotation-tooltip--persistent"
        :class="{'annotation-tooltip--dragging': dragging}"
        @mousedown="startDrag"
        >
        <ul class="annotation-tooltip__annotations">
            <li>
                <ul class="annotation-tooltip__labels">
                    <li v-for="label in labels" :key="label.id" v-text="label.name"></li>
                </ul>
            </li>
        </ul>
    </div>
</template>

<script>
import Overlay from '@biigle/ol/Overlay';
import Styles from '../stores/styles.js';
import {
    anchorAnnotationOverlay,
    createAnnotationOverlayConnector,
    dragAnnotationOverlay,
    getInitialAnnotationOverlayPlacement,
} from '../utils.js';
import {markRaw} from 'vue';
import {unByKey} from '@biigle/ol/Observable';

export default {
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
    data() {
        return {
            dragging: false,
            dragStartMousePosition: [0, 0],
            dragStartOverlayOffset: [0, 0],
            isUnmounting: false,
            listenerKeys: [],
        };
    },
    computed: {
        annotation() {
            return this.feature.get('annotation');
        },
        labels() {
            return this.annotation?.labels.map(annotationLabel => annotationLabel.label) || [];
        },
    },
    methods: {
        createOverlay() {
            const geometry = this.feature.getGeometry();
            const extent = geometry.getExtent();
            const centerY = (extent[1] + extent[3]) / 2;
            const overlay = new Overlay({
                element: this.$el,
                position: [extent[2], centerY],
                positioning: 'center-left',
                offset: [15, 0],
                insertFirst: false,
            });

            this.overlay = markRaw(overlay);
            this.overlay._annotationGeometry = geometry;
            this.map.addOverlay(overlay);

            const placement = getInitialAnnotationOverlayPlacement(
                extent,
                this.map.getView().calculateExtent(this.map.getSize()),
                this.map.getView().getResolution(),
                [this.$el.offsetWidth, this.$el.offsetHeight]
            );
            overlay.setPosition(placement.position);
            overlay.setPositioning(placement.positioning);
            overlay.setOffset(placement.offset);
        },
        createConnector() {
            this.lineFeature = markRaw(createAnnotationOverlayConnector(
                this.overlay, this.map, this.feature.get('color'), Styles.editing, () => this.show
            ));
            this.lineSource.addFeature(this.lineFeature);
            this.listenerKeys.push(this.map.getView().on('change:resolution', this.lineFeature._updateCoordinates));
            this.listenerKeys.push(this.overlay._annotationGeometry.on('change', this.lineFeature._updateCoordinates));
            this.listenerKeys.push(this.feature.on('change:color', () => {
                this.lineFeature.set('color', this.feature.get('color'));
                this.lineFeature.setStyle(Styles.editing);
            }));
        },
        startDrag(e) {
            if (this.dragging || e.button !== 0) return;

            e.preventDefault();
            this.dragging = true;
            this.dragStartMousePosition = [e.clientX, e.clientY];
            this.dragStartOverlayOffset = this.overlay.getOffset();
            this.$el.ownerDocument.addEventListener('mousemove', this.handleDrag);
            this.$el.ownerDocument.addEventListener('mouseup', this.endDrag);
        },
        handleDrag(e) {
            dragAnnotationOverlay(this.overlay, this.dragStartOverlayOffset, this.dragStartMousePosition, e);
            this.lineFeature._updateCoordinates();
        },
        endDrag() {
            if (!this.dragging) return;

            this.dragging = false;
            this.removeDragListeners();

            anchorAnnotationOverlay(this.overlay, this.map);
            this.lineFeature._updateCoordinates();
        },
        removeDragListeners() {
            this.$el.ownerDocument.removeEventListener('mousemove', this.handleDrag);
            this.$el.ownerDocument.removeEventListener('mouseup', this.endDrag);
        },
        destroyOverlay() {
            this.removeDragListeners();
            this.listenerKeys.forEach(unByKey);
            this.listenerKeys = [];

            if (this.overlay) {
                this.map.removeOverlay(this.overlay);
                this.overlay = null;
            }

            if (this.lineFeature) {
                this.lineSource.removeFeature(this.lineFeature);
                this.lineFeature = null;
            }
        },
        resetOverlay() {
            this.destroyOverlay();
            this.$nextTick(() => {
                if (this.isUnmounting) return;

                this.createOverlay();
                this.createConnector();
            });
        },
    },
    watch: {
        feature() {
            this.resetOverlay();
        },
        show(show) {
            if (show && this.lineFeature) {
                this.lineFeature._updateCoordinates();
            }
        },
    },
    mounted() {
        this.createOverlay();
        this.createConnector();
    },
    beforeUnmount() {
        this.isUnmounting = true;
        this.destroyOverlay();
    },
};
</script>
