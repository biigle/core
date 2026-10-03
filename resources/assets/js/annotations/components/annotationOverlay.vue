<template>
    <div
        v-show="show"
        :class="[dragging && draggingClass]"
        @mousedown="handleRootMouseDown"
        >
        <slot :dragging="dragging" :start-drag="startDrag"></slot>
    </div>
</template>

<script>
import Feature from '@biigle/ol/Feature';
import LineString from '@biigle/ol/geom/LineString';
import Overlay from '@biigle/ol/Overlay';
import Styles from '../stores/styles.js';
import {markRaw} from 'vue';
import {unByKey} from '@biigle/ol/Observable';

export default {
    emits: [
        'dragstart',
        'dragend',
    ],
    props: {
        centered: {
            type: Boolean,
            default: false,
        },
        connectorColor: {
            type: String,
            default: null,
        },
        dragOnRoot: {
            type: Boolean,
            default: false,
        },
        draggingClass: {
            type: String,
            default: null,
        },
        feature: {
            type: Object,
            required: true,
        },
        followGeometry: {
            type: Boolean,
            default: false,
        },
        gap: {
            type: Number,
            default: 15,
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
        zIndex: {
            type: Number,
            default: null,
        },
    },
    data() {
        return {
            dragging: false,
            dragStartMousePosition: [0, 0],
            dragStartOverlayOffset: [0, 0],
            geometryUpdatePending: false,
            isUnmounting: false,
            listenerKeys: [],
            wasDragged: false,
        };
    },
    methods: {
        getConnectorColor() {
            return this.connectorColor || this.feature.get('color');
        },
        getInitialPlacement(extent) {
            const viewportExtent = this.map.getView().calculateExtent(this.map.getSize());
            const resolution = this.map.getView().getResolution();
            const tooltipSize = [this.$el.offsetWidth, this.$el.offsetHeight];
            const centerY = (extent[1] + extent[3]) / 2;
            const rightSpace = (viewportExtent[2] - extent[2]) / resolution;
            const horizontalWidth = this.centered ? tooltipSize[0] / 2 : tooltipSize[0];
            const useRightSide = rightSpace >= horizontalWidth + this.gap;
            const position = useRightSide
                ? [extent[2], centerY]
                : [extent[0], centerY];
            const positioning = this.centered
                ? 'center-center'
                : (useRightSide ? 'center-left' : 'center-right');
            const offset = [useRightSide ? this.gap : -this.gap, 0];

            // Preserve the LabelBOT fallback for annotations spanning the viewport.
            if (this.centered && (position[0] - viewportExtent[0]) / resolution < horizontalWidth + this.gap) {
                offset[0] = this.gap;
            }

            const bottomOverflow = (viewportExtent[1] - centerY) / resolution + tooltipSize[1] / 2;
            const topOverflow = tooltipSize[1] / 2 - (viewportExtent[3] - centerY) / resolution;
            if (bottomOverflow > 0) {
                offset[1] = -bottomOverflow;
            } else if (topOverflow > 0) {
                offset[1] = topOverflow;
            }

            return {position, positioning, offset};
        },
        createOverlay() {
            const geometry = this.feature.getGeometry();
            const extent = geometry.getExtent();
            const centerY = (extent[1] + extent[3]) / 2;
            const overlay = new Overlay({
                element: this.$el,
                position: [extent[2], centerY],
                positioning: this.centered ? 'center-center' : 'center-left',
                offset: [this.gap, 0],
                insertFirst: false,
            });

            this.overlay = markRaw(overlay);
            this.map.addOverlay(overlay);
            const placement = this.getInitialPlacement(extent);
            overlay.setPosition(placement.position);
            overlay.setPositioning(placement.positioning);
            overlay.setOffset(placement.offset);
            this.previousGeometryCenter = [
                (extent[0] + extent[2]) / 2,
                (extent[1] + extent[3]) / 2,
            ];
            this.updateZIndex();
        },
        createConnector() {
            const position = this.overlay.getPosition();
            const line = new LineString([position, position]);
            const feature = new Feature(line);
            feature.set('unselectable', true);
            feature.set('color', this.getConnectorColor());
            feature.setStyle(Styles.editing);
            feature._updateCoordinates = () => {
                if (!this.show || !this.overlay) return;

                const position = this.overlay.getPosition();
                const offset = this.overlay.getOffset();
                const resolution = this.map.getView().getResolution();
                const end = [
                    position[0] + offset[0] * resolution,
                    position[1] - offset[1] * resolution,
                ];
                const start = this.feature.getGeometry().getClosestPoint(end);
                line.setCoordinates([start, end]);
            };

            this.lineFeature = markRaw(feature);
            this.lineSource.addFeature(feature);
            feature._updateCoordinates();
            this.listenerKeys.push(this.map.getView().on('change:resolution', feature._updateCoordinates));
            this.listenerKeys.push(this.feature.getGeometry().on('change', this.scheduleGeometryUpdate));
            this.listenerKeys.push(this.feature.on('change:color', this.updateConnectorColor));
        },
        updateConnectorColor() {
            this.lineFeature.set('color', this.getConnectorColor());
            this.lineFeature.setStyle(Styles.editing);
        },
        scheduleGeometryUpdate() {
            if (this.geometryUpdatePending) return;

            this.geometryUpdatePending = true;
            queueMicrotask(() => {
                this.geometryUpdatePending = false;
                if (this.overlay) {
                    this.updateGeometry();
                }
            });
        },
        updateGeometry() {
            const geometry = this.feature.getGeometry();
            const extent = geometry.getExtent();
            const center = [
                (extent[0] + extent[2]) / 2,
                (extent[1] + extent[3]) / 2,
            ];

            if (this.followGeometry) {
                if (this.wasDragged) {
                    const position = this.overlay.getPosition();
                    const translatedPosition = [
                        position[0] + center[0] - this.previousGeometryCenter[0],
                        position[1] + center[1] - this.previousGeometryCenter[1],
                    ];
                    this.overlay.setPosition(geometry.getClosestPoint(translatedPosition));
                } else {
                    const useRightSide = this.overlay.getPositioning() === 'center-left';
                    this.overlay.setPosition([
                        useRightSide ? extent[2] : extent[0],
                        (extent[1] + extent[3]) / 2,
                    ]);
                }
            }

            this.previousGeometryCenter = center;
            this.lineFeature._updateCoordinates();
        },
        handleRootMouseDown(event) {
            if (this.dragOnRoot) {
                this.startDrag(event);
            }
        },
        startDrag(event) {
            if (this.dragging || event.button !== 0) return;

            event.preventDefault();
            this.dragging = true;
            this.dragStartMousePosition = [event.clientX, event.clientY];
            this.dragStartOverlayOffset = this.overlay.getOffset();
            this.$el.ownerDocument.addEventListener('mousemove', this.handleDrag);
            this.$el.ownerDocument.addEventListener('mouseup', this.endDrag);
            this.$emit('dragstart');
        },
        handleDrag(event) {
            this.overlay.setOffset([
                this.dragStartOverlayOffset[0] + event.clientX - this.dragStartMousePosition[0],
                this.dragStartOverlayOffset[1] + event.clientY - this.dragStartMousePosition[1],
            ]);
            this.lineFeature._updateCoordinates();
        },
        endDrag() {
            if (!this.dragging) return;

            this.dragging = false;
            this.removeDragListeners();

            const position = this.overlay.getPosition();
            const offset = this.overlay.getOffset();
            const resolution = this.map.getView().getResolution();
            const realPosition = [
                position[0] + offset[0] * resolution,
                position[1] - offset[1] * resolution,
            ];
            const newPosition = this.feature.getGeometry().getClosestPoint(realPosition);
            this.overlay.setPosition(newPosition);
            this.overlay.setOffset([
                (realPosition[0] - newPosition[0]) / resolution,
                (newPosition[1] - realPosition[1]) / resolution,
            ]);
            this.wasDragged = true;
            this.lineFeature._updateCoordinates();
            this.$emit('dragend');
        },
        removeDragListeners() {
            this.$el.ownerDocument.removeEventListener('mousemove', this.handleDrag);
            this.$el.ownerDocument.removeEventListener('mouseup', this.endDrag);
        },
        updateZIndex() {
            if (!this.overlay) return;

            this.overlay.getElement().parentNode.style.zIndex = this.zIndex ?? '';
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
            this.wasDragged = false;
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
        zIndex: 'updateZIndex',
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
