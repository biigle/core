<template>
<div
    class="labelbot-popup"
    :class="classObject"
    @mouseover="emitFocus"
    >
    <div class="labelbot-popup-grap-area" @mousedown="startDrag">
        <div class="labelbot-popup-grap-area-notch"></div>
    </div>
    <ul class="labelbot-labels">
        <li
            v-for="(label, index) in labels"
            class="labelbot-label" :class="{ 'labelbot-label--highlighted': index === highlightedLabel }"
            :key="index"
            @mouseover="handleLabelbotFocus(index)"
            @click="selectLabelbotLabel(label)"
            :title="`Choose label ${label.name}`"
            >
                <div
                    v-if="index === 0 && hasProgressBar"
                    class="labelbot-label__progress-bar"
                    @animationend="emitClose"
                    ></div>
                <div class="labelbot-label__name">
                    <span class="labelbot-label__color" :style="{ backgroundColor: '#'+label.color }"></span>
                    <span>{{ label.name }}</span>
                    <span class="labelbot-label__keyboard">
                        <span class="fa fa-keyboard" aria-hidden="true"></span>
                        <span v-text="index + 1"></span>
                    </span>
                </div>
        </li>
        <li>
            <typeahead
                :items="allLabels"
                class="typeahead--block"
                more-info="tree.versionedName"
                placeholder="Find label"
                ref="popupTypeahead"
                title="Choose a different label"
                @focus="handleTypeaheadFocus"
                @select="selectLabelbotLabel"
                ></typeahead>
        </li>
    </ul>
</div>
</template>

<script>
import Feature from '@biigle/ol/Feature';
import Keyboard from '../../core/keyboard';
import LineString from '@biigle/ol/geom/LineString';
import Overlay from '@biigle/ol/Overlay';
import Styles from '../stores/styles.js';
import Typeahead from '../../label-trees/components/labelTypeahead.vue';
import {markRaw} from 'vue';
import {unByKey} from '@biigle/ol/Observable';

// Offset is half of max-width (300px) plus 50px.
const LABELBOT_OVERLAY_OFFSET = 200;

export default {
    emits: [
        'update',
        'close',
        'delete',
        'focus',
        'grab',
        'release',
    ],
    components: {
        typeahead: Typeahead,
    },
    props: {
        focusedPopupKey: {
            type: Number,
            required: true,
        },
        annotation: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            hasProgressBar: true,
            highlightedLabel: 0,
            typeaheadFocused: false,
            selectedLabel: null,
            trees: [],
            overlay: null,
            lineFeature: null,
            listenerKeys: [],
            dragging: false,
            dragStartMousePosition: [0, 0],
            dragStartOverlayOffset: [0, 0],
        };
    },
    computed: {
        localeCompareSupportsLocales() {
            try {
                'foo'.localeCompare('bar', 'i');
            } catch (e) {
                    return e.name === 'RangeError';
            }

            return false;
        },
        allLabels() {
            let labels = [];
            this.trees.forEach(function (tree) {
                Array.prototype.push.apply(labels, tree.labels);
            });

            if (this.localeCompareSupportsLocales) {
                let collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
                labels.sort(function (a, b) {
                        return collator.compare(a.name, b.name);
                });
            } else {
                labels.sort(function (a, b) {
                        return a.name < b.name ? -1 : 1;
                });
            }

            return labels;
        },
        isFocused() {
            return this.popupKey === this.focusedPopupKey;
        },
        labels() {
            return [this.annotation.labels[0].label].concat(this.annotation.labelBOTLabels);
        },
        classObject() {
            return {
                'labelbot-popup--focused': this.isFocused,
                'labelbot-popup--dragging': this.dragging,
            };
        },
        popupKey() {
            return this.annotation.id;
        },
    },
    watch: {
        highlightedLabel() {
            this.hasProgressBar = false;
        },
        dragging() {
            if (this.dragging && this.hasProgressBar) {
                this.hasProgressBar = false;
            }
        },
        isFocused(isFocused) {
            this.overlay.getElement().parentNode.style.zIndex = isFocused ? 100 : '';
        },
    },
    methods: {
        selectLabelbotLabel(label) {
            // Top 1 label is already attached/selected
            if (this.selectedLabel.id !== label.id) {
                this.$emit('update', {label: label, annotation: this.annotation});
            }

            this.emitClose();
        },
        emitClose() {
            this.$emit('close', this.annotation);
        },
        handleTypeaheadFocus() {
            this.highlightedLabel = this.labels.length; // We don't set it to -1 because this will not trigger the highlightedLabel watcher at start.
            this.typeaheadFocused = true;
        },
        handleLabelbotFocus(hoveredLabel) {
            this.highlightedLabel = hoveredLabel;
        },
        handleEsc() {
            if (!this.isFocused) return;

            if (this.hasProgressBar) {
                this.hasProgressBar = false;
            } else {
                this.emitClose();
            }
        },
        labelUp() {
            if (!this.isFocused) return;

            this.highlightedLabel = (this.labels.length + this.highlightedLabel - 1) % this.labels.length;
        },
        labelDown() {
            if (!this.isFocused) return;

            this.highlightedLabel = (this.highlightedLabel + 1) % this.labels.length;
        },
        labelEnter() {
            if (!this.isFocused || this.highlightedLabel > (this.labels.length - 1)) {
                return;
            }

            // At the start the highlighted label is -1 so we need to check it before selecting the label.
            this.selectLabelbotLabel(this.labels[this.highlightedLabel < 0 ? 0 : this.highlightedLabel]);
        },
        handleTab(e) {
            if (e.key === "Tab") {
                e.preventDefault();
                this.labelTab();
            }
        },
        labelTab() {
            if (!this.isFocused) return;

            if (!this.typeaheadFocused) {
                this.$refs.popupTypeahead?.$refs.input.focus();
                this.highlightedLabel = this.labels.length;
                this.typeaheadFocused = true;
            } else {
                this.$refs.popupTypeahead?.$refs.input.blur();
                this.highlightedLabel = this.labels.length - 1;
                this.typeaheadFocused = false;
            }
        },
        deleteLabelAnnotation() {
            if (!this.isFocused) return;

            this.$emit('delete', this.annotation);
            this.emitClose();
        },
        emitFocus() {
            this.$emit('focus', this.annotation);
        },
        startDrag(e) {
            this.dragging = true;
            this.$parent.$el.addEventListener('mousemove', this.handleDrag);
            this.$parent.$el.addEventListener('mouseup', this.endDrag);
            this.dragStartMousePosition = [e.clientX, e.clientY];
            this.dragStartOverlayOffset = this.overlay.getOffset();
        },
        handleDrag(e) {
            // During dragging, update the popup position only by modifying the offset.
            // The position is updated when dragging ended.
            this.overlay.setOffset([
                this.dragStartOverlayOffset[0] + e.clientX - this.dragStartMousePosition[0],
                this.dragStartOverlayOffset[1] + e.clientY - this.dragStartMousePosition[1],
            ]);
            this.lineFeature._updateCoordinates();
        },
        endDrag() {
            this.dragging = false;
            this.$parent.$el.removeEventListener('mousemove', this.handleDrag);
            this.$parent.$el.removeEventListener('mouseup', this.endDrag);

            // When dragging is finished, update the popup position to the closest point
            // on the annotation and recalculate the offset so the popup stays where it
            // was dragged. This feels most natural during zooming.
            const currentPosition = this.overlay.getPosition();
            const currentOffset = this.overlay.getOffset();
            const resolution = this.overlay.getMap().getView().getResolution();
            const realPosition = [
                currentPosition[0] + currentOffset[0] * resolution,
                currentPosition[1] - currentOffset[1] * resolution,
            ];
            const newPosition = this.overlay._annotationGeometry.getClosestPoint(realPosition);
            this.overlay.setPosition(newPosition);
            this.overlay.setOffset([
                (realPosition[0] - newPosition[0]) / resolution,
                (newPosition[1] - realPosition[1]) / resolution,
            ]);

        },
        createOverlay(annotationCanvas) {
            const annotationFeature = annotationCanvas.annotationSource.getFeatureById(this.annotation.id);
            const annotationGeometry = annotationFeature.getGeometry();
            const annotationExtent = annotationGeometry.getExtent();
            const popupPosition = [
                annotationExtent[2],
                (annotationExtent[1] + annotationExtent[3]) / 2,
            ];

            const overlay = new Overlay({
                element: this.$el,
                positioning: 'center-center',
                position: popupPosition,
                offset: [LABELBOT_OVERLAY_OFFSET, 0],
                insertFirst: false, // last added overlay appears on top
            });
            this.overlay = markRaw(overlay);
            this.overlay._annotationGeometry = annotationGeometry;
            annotationCanvas.map.addOverlay(overlay)

            const line = new LineString([popupPosition, popupPosition]);
            this.lineFeature = markRaw(new Feature(line));
            this.lineFeature.set('unselectable', true);
            this.lineFeature.set('color', this.labels[0].color);
            this.lineFeature.setStyle(Styles.editing);

            this.lineFeature._updateCoordinates = () => {
                const position = overlay.getPosition();
                const offset = overlay.getOffset();
                const resolution = annotationCanvas.map.getView().getResolution();
                const end = [
                    position[0] + offset[0] * resolution,
                    position[1] - offset[1] * resolution,
                ];
                const start = annotationGeometry.getClosestPoint(end);
                line.setCoordinates([start, end]);
            };
            this.lineFeature._updateCoordinates();

            annotationCanvas.annotationSource.addFeature(this.lineFeature);

            this.listenerKeys.push(annotationCanvas.map.getView().on('change:resolution', this.lineFeature._updateCoordinates));
            this.listenerKeys.push(annotationGeometry.on('change', this.lineFeature._updateCoordinates));
        },
        selectLabel1() {
            if (this.isFocused && this.labels[0]) {
                this.selectLabelbotLabel(this.labels[0]);
            }
        },
        selectLabel2() {
            if (this.isFocused && this.labels[1]) {
                this.selectLabelbotLabel(this.labels[1]);
            }
        },
        selectLabel3() {
            if (this.isFocused && this.labels[2]) {
                this.selectLabelbotLabel(this.labels[2]);
            }
        },
    },
    created() {
        this.trees = biigle.$require('annotations.labelTrees');

        Keyboard.on('Escape', this.handleEsc, 0, 'labelbot');
        Keyboard.on('arrowup', this.labelUp, 0, 'labelbot');
        Keyboard.on('arrowdown', this.labelDown, 0, 'labelbot');
        Keyboard.on('Enter', this.labelEnter, 0, 'labelbot');
        Keyboard.on('delete', this.deleteLabelAnnotation, 0, 'labelbot');
        Keyboard.on('tab', this.labelTab, 0, 'labelbot');

        if (this.labels.length > 0) {
            this.selectedLabel = this.labels[0];
            Keyboard.on('1', this.selectLabel1, 0, 'labelbot');
            Keyboard.on('2', this.selectLabel2, 0, 'labelbot');
            Keyboard.on('3', this.selectLabel3, 0, 'labelbot');
        }
    },
    mounted() {
        this.createOverlay(this.$parent);

        // So the user can leave the focused input
        this.$refs.popupTypeahead?.$refs.input?.addEventListener("keydown", (e) => {
            this.handleTab(e);
        });
    },
    beforeUnmount() {
        this.$parent.map.removeOverlay(this.overlay);
        this.$parent.annotationSource.removeFeature(this.lineFeature);
        this.listenerKeys.forEach(unByKey);

        Keyboard.off('Escape', this.handleEsc, 0, 'labelbot');
        Keyboard.off('arrowup', this.labelUp, 0, 'labelbot');
        Keyboard.off('arrowdown', this.labelDown, 0, 'labelbot');
        Keyboard.off('Enter', this.labelEnter, 0, 'labelbot');
        Keyboard.off('delete', this.deleteLabelAnnotation, 0, 'labelbot');
        Keyboard.off('tab', this.labelTab, 0, 'labelbot');

        if (this.labels.length > 0) {
            Keyboard.off('1', this.selectLabel1, 0, 'labelbot');
            Keyboard.off('2', this.selectLabel2, 0, 'labelbot');
            Keyboard.off('3', this.selectLabel3, 0, 'labelbot');
        }
    },
};
</script>
