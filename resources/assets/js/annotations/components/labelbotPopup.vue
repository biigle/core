<template>
<div
    class="labelbot-popup"
    :class="classObject"
    @mouseover="emitFocus"
    >
    <div
        class="labelbot-overlay-grap-area"
        :style="{cursor: isDragging ? 'grabbing' : 'grab'}"
        @mousedown="emitGrab"
        @mouseup="emitRelease"
        >
        <div class="labelbot-overlay-grap-area-notch"></div>
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
                    v-if="index === 0"
                    v-show="progressBarWidth > -1"
                    class="labelbot-label__progress-bar"
                    :style="{ width: progressBarWidth + '%' }"
                    @transitionend="closeLabelbotPopup"
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
import LabelBotPopup from '../models/LabelBotPopup.js';
import LineString from '@biigle/ol/geom/LineString';
import Overlay from '@biigle/ol/Overlay';
import Styles from '../stores/styles.js';
import Typeahead from '../../label-trees/components/labelTypeahead.vue';
import {markRaw} from 'vue';
import {unByKey} from '@biigle/ol/Observable';

// Offset is half of max-width (300px) plus 100px.
const LABELBOT_OVERLAY_OFFSET = 250;

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
        popup: {
            type: LabelBotPopup,
            required: true,
        },
    },
    data() {
        return {
            progressBarWidth: -1,
            highlightedLabel: -1,
            typeaheadFocused: false,
            selectedLabel: null,
            trees: [],
            overlay: null,
            lineFeature: null,
            listenerKey: null,
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
        isDragging() {
            return this.popup.isDragging;
        },
        labels() {
            return this.popup.labels;
        },
        classObject() {
            return {
                'labelbot-popup--focused': this.isFocused,
            };
        },
        popupKey() {
            return this.popup.getKey();
        },
    },
    watch: {
        // labels() {
        //     this.progressBarWidth = 0;
        //     if (this.labels.length > 0) {
        //         this.selectedLabel = this.labels[0];
        //         setTimeout(() => this.progressBarWidth = 100, 10);
        //     }
        // },
        highlightedLabel() {
            if (this.progressBarWidth > 0) {
                this.progressBarWidth = -1; // setting it to 0 will cause backward transition for the Top 1 Label.
            }
        },
        isDragging() {
            if (this.isDragging && this.progressBarWidth > -1) {
                this.progressBarWidth = -1;
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
                this.$emit('update', {label: label, annotation: this.popup.annotation});
            }

            this.closeLabelbotPopup();
        },
        resetPopup() {
            this.$refs.popupTypeahead?.clear();
            this.highlightedLabel = -1;
            this.typeaheadFocused = false;
        },
        closeLabelbotPopup() {
            // TODO
            this.resetPopup();

            this.$emit('close', this.popup);
        },
        handleTypeaheadFocus() {
            this.highlightedLabel = this.labels.length; // We don't set it to -1 because this will not trigger the highlightedLabel watcher at start.
            this.typeaheadFocused = true;
        },
        handleLabelbotFocus(hoveredLabel) {
            this.highlightedLabel = hoveredLabel;
        },
        labelClose() {
            if (!this.isFocused) return;

            this.closeLabelbotPopup();
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

            this.resetPopup();

            this.$emit('delete', this.popupKey);
        },
        emitFocus() {
            this.$emit('focus', this.popupKey);
        },
        emitGrab() {
            this.$emit('grab', this.popupKey);
        },
        emitRelease() {
            this.$emit('release', this.popupKey);
        },
        getOverlayPosition(annotation) {
            const points = annotation.points;

            let position;

            // TODO use actual annotation shape
            if (points.length === 2) {
                return points;
            }

            if (points.length === 3) {
                // Circle
                const [x, y, r] = points;

                return [x + r, y];
            }

            // Polygon: convert flat array to [x, y] pairs
            const pointPairs = [];
            for (let i = 0; i < points.length; i += 2) {
                pointPairs.push([points[i], points[i + 1]]);
            }

            // Sort by X descending
            pointPairs.sort((a, b) => b[0] - a[0]);

            return pointPairs[0];
        },
        createOverlay(annotationCanvas) {
            const popupPosition = this.getOverlayPosition(this.popup.annotation);
            const convertedPoints = annotationCanvas.convertPointsFromDbToOl(popupPosition)[0];

            const overlay = new Overlay({
                element: this.$el,
                positioning: 'center-center',
                position: convertedPoints,
                offset: [LABELBOT_OVERLAY_OFFSET, 0],
                insertFirst: false, // last added overlay appears on top
            });
            this.overlay = markRaw(overlay);
            annotationCanvas.map.addOverlay(overlay)

            const line = new LineString([convertedPoints, convertedPoints]);
            this.lineFeature = markRaw(new Feature(line));
            this.lineFeature.setStyle(Styles.labelbotPopupLineStyle(this.popup.annotation.labels[0].label.color));

            const updateLineCoordinates = () => {
                const start = convertedPoints;
                const end = [start[0] + LABELBOT_OVERLAY_OFFSET * annotationCanvas.map.getView().getResolution(), start[1]];
                line.setCoordinates([start, end]);
            };
            updateLineCoordinates();

            annotationCanvas.annotationSource.addFeature(this.lineFeature);

            this.listenerKey = annotationCanvas.map.getView().on('change:resolution', updateLineCoordinates);
        },
    },
    created() {
        this.trees = biigle.$require('annotations.labelTrees');

        Keyboard.on('Escape', this.labelClose, 0, 'labelbot');
        Keyboard.on('arrowup', this.labelUp, 0, 'labelbot');
        Keyboard.on('arrowdown', this.labelDown, 0, 'labelbot');
        Keyboard.on('Enter', this.labelEnter, 0, 'labelbot');
        Keyboard.on('delete', this.deleteLabelAnnotation, 0, 'labelbot');
        Keyboard.on('tab', this.labelTab, 0, 'labelbot');

        if (this.labels.length > 0) {
            this.selectedLabel = this.labels[0];
            setTimeout(() => this.progressBarWidth = 100, 10);

            // TODO Keyboard.off
            for (let key = 1; key <= 3; key++) {
                Keyboard.on(`${key}`, () => {
                    if (this.labels[key - 1] && this.isFocused) {
                        this.selectLabelbotLabel(this.labels[key - 1]);
                    }
                }, 0, 'labelbot');
            }
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
        unByKey(this.listenerKey);

        Keyboard.off('Escape', this.labelClose, 0, 'labelbot');
        Keyboard.off('arrowup', this.labelUp, 0, 'labelbot');
        Keyboard.off('arrowdown', this.labelDown, 0, 'labelbot');
        Keyboard.off('Enter', this.labelEnter, 0, 'labelbot');
        Keyboard.off('delete', this.deleteLabelAnnotation, 0, 'labelbot');
        Keyboard.off('tab', this.labelTab, 0, 'labelbot');
    },
};
</script>
