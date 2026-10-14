<template>
<div
    class="labelbot-popup"
    :class="classObject"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @mousemove="handleMouseMove"
    >
    <div class="labelbot-popup-grab-area" @mousedown="startDrag">
        <i class="fas fa-grip-lines"></i>
    </div>
    <ul class="labelbot-labels">
        <li
            v-for="(label, index) in labels"
            class="labelbot-label"
            :class="getLabelClass(index)"
            :key="index"
            @click="selectLabel(index)"
            :title="getLabelTitle(label)"
            >
                <div
                    v-if="index === attachedIndex && hasProgressBar"
                    class="labelbot-label__progress-bar"
                    :style="progressBarStyle"
                    @animationend="confirmAndClose"
                    ></div>
                <div class="labelbot-label__name">
                    <span class="labelbot-label__color" :style="{ backgroundColor: '#'+label.color }"></span>
                    <span>{{ label.name }}</span>
                    <span class="labelbot-label__indicators">
                        <i
                            v-if="guideline?.hasLabel(label.id)"
                            class="fa fa-fw fa-clipboard-list"
                            title="This label is included in the annotation guideline"
                            ></i>
                        <span class="labelbot-label__keyboard">
                            <span class="fa fa-keyboard" aria-hidden="true"></span>
                            <span v-text="index + 1"></span>
                        </span>
                    </span>
                </div>
        </li>
        <li>
            <typeahead
                :items="choosableLabels"
                class="typeahead--block"
                more-info="tree.versionedName"
                placeholder="Find label"
                ref="popupTypeahead"
                title="Choose a different label"
                @focus="handleTypeaheadFocus"
                @select="selectTypeaheadLabel"
                ></typeahead>
        </li>
    </ul>
</div>
</template>

<script>
import AnnotationGuideline from '@/core/models/AnnotationGuideline.js';
import Events from '@/core/events';
import Feature from '@biigle/ol/Feature';
import Keyboard from '@/core/keyboard';
import LineString from '@biigle/ol/geom/LineString';
import Overlay from '@biigle/ol/Overlay';
import Styles from '../stores/styles.js';
import Typeahead from '@/label-trees/components/labelTypeahead.vue';
import {debounce} from '@/core/utils.js';
import {markRaw} from 'vue';
import {unByKey} from '@biigle/ol/Observable';

// Defined in CSS.
const OVERLAY_MAX_WIDTH = 300;
const OVERLAY_OFFSET = OVERLAY_MAX_WIDTH / 2 + 50;

// Defines the available settings options.
export const TIMEOUTS = [
    '3s',
    '5s',
    '10s',
    'off',
];

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
        timeout: {
            type: Number,
            default: 1,
        },
        // The selected annotation guideline.
        guideline: {
            type: AnnotationGuideline,
            default: null,
        },
    },
    inject: ['labelTrees'],
    data() {
        return {
            shouldHaveProgressBar: true,
            maybeGetsAttention: false,
            typeaheadFocused: false,
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
            this.labelTrees.forEach(function (tree) {
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
        choosableLabels() {
            return this.allLabels.filter(this.canChoose);
        },
        labels() {
            return this.annotation.labelBOTLabels;
        },
        attachedLabel() {
            return this.annotation.labels[0]?.label;
        },
        // The attached label is not necessarily the top 1 label of LabelBOT because the
        // backend chooses the first label that is allowed by the annotation guideline.
        attachedIndex() {
            return this.labels.findIndex(l => l.id === this.attachedLabel?.id);
        },
        classObject() {
            return {
                'labelbot-popup--focused': this.isFocused,
                'labelbot-popup--dragging': this.dragging,
                'labelbot-popup--typing': this.typeaheadFocused,
            };
        },
        popupKey() {
            return this.annotation.id;
        },
        hasProgressBar() {
            return this.isFocused && this.shouldHaveProgressBar;
        },
        timeoutValue() {
            return TIMEOUTS[this.timeout];
        },
        progressBarStyle() {
            return {
                'animation-duration': this.timeoutValue,
            };
        },
    },
    watch: {
        dragging() {
            if (this.dragging && this.shouldHaveProgressBar) {
                this.shouldHaveProgressBar = false;
            }
        },
        isFocused(isFocused) {
            this.overlay.getElement().parentNode.style.zIndex = isFocused ? 100 : '';
        },
    },
    methods: {
        canChoose(label) {
            if (!this.guideline) {
                return true;
            }

            return this.guideline.allowsLabel(label.id)
                && this.guideline.allowsShape(this.annotation.shape, label.id);
        },
        getLabelClass(index) {
            return {
                'labelbot-label--attached': index === this.attachedIndex,
                'labelbot-label--progress': index === this.attachedIndex && this.hasProgressBar,
                'labelbot-label--disabled': !this.canChoose(this.labels[index]),
                'labelbot-label--muted': this.isOutsideOfGuideline(this.labels[index]),
            };
        },
        // Labels of informational guidelines can be chosen but labels outside of the
        // guideline are muted (like in the label trees).
        isOutsideOfGuideline(label) {
            return this.guideline?.labels.length > 0 && !this.guideline.hasLabel(label.id);
        },
        getLabelTitle(label) {
            if (this.guideline && !this.guideline.allowsLabel(label.id)) {
                return `The label ${label.name} is not allowed by the annotation guideline`;
            }

            if (!this.canChoose(label)) {
                return `The annotation guideline does not allow the shape ${this.annotation.shape} for the label ${label.name}`;
            }

            return `Choose label ${label.name}`;
        },
        updateAndClose(label) {
            // The attached label doesn't have to be updated.
            if (this.attachedLabel?.id !== label.id) {
                this.$emit('update', {label: label, annotation: this.annotation});
            }

            this.emitClose();
        },
        confirmAndClose() {
            this.emitClose();
            if (this.attachedIndex === -1) {
                Events.emit('labelbot.chose_label_other');
            } else {
                Events.emit(`labelbot.chose_label_${this.attachedIndex + 1}`);
            }
        },
        emitClose() {
            this.$emit('close', this.annotation);
        },
        handleTypeaheadFocus() {
            this.typeaheadFocused = true;
            this.shouldHaveProgressBar = false;
        },
        handleMouseEnter() {
            this.maybeGetsAttention = true;

            if (!this.isFocused) {
                this.shouldHaveProgressBar = false;
            }

            this.$emit('focus', this.annotation);
        },
        handleMouseLeave() {
            this.maybeGetsAttention = false;
        },
        handleMouseMove() {
            debounce(() => {
                if (this.maybeGetsAttention) {
                    this.shouldHaveProgressBar = false;
                }
            }, 100, 'labelbot-popup-attention');
        },
        handleEsc() {
            if (!this.isFocused) return;

            if (this.shouldHaveProgressBar) {
                this.shouldHaveProgressBar = false;
            } else {
                this.confirmAndClose();
            }
        },
        handleTypeaheadKey(e) {
            if (e.key === "Tab" || e.key === "Escape") {
                e.preventDefault();
                this.leaveTypeahead();
            }
        },
        enterTypeahead() {
            if (this.isFocused && !this.typeaheadFocused) {
                this.$refs.popupTypeahead?.$refs.input.focus();
                this.typeaheadFocused = true;
            }
        },
        leaveTypeahead() {
            if (this.isFocused && this.typeaheadFocused) {
                this.$refs.popupTypeahead?.$refs.input.blur();
                this.typeaheadFocused = false;
            }
        },
        deleteLabelAnnotation() {
            if (!this.isFocused) return;

            this.$emit('delete', this.annotation);
            this.emitClose();
            Events.emit('labelbot.dismissed');
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
            let popupPosition = [
                annotationExtent[2],
                (annotationExtent[1] + annotationExtent[3]) / 2,
            ];

            const overlay = new Overlay({
                element: this.$el,
                positioning: 'center-center',
                position: popupPosition,
                offset: [OVERLAY_OFFSET, 0],
                insertFirst: false, // last added overlay appears on top
            });
            this.overlay = markRaw(overlay);
            this.overlay._annotationGeometry = annotationGeometry;
            annotationCanvas.map.addOverlay(overlay);

            // Check if the popup must be moved so it is fully contained in the viewport.
            // This must be done after the element was added to the map so the offsetWidth
            // and offsetHeight are known.
            const mapExtent = annotationCanvas.map.getView().calculateExtent(annotationCanvas.map.getSize());
            const resolution = annotationCanvas.map.getView().getResolution();
            const shouldSwapX = ((mapExtent[2] - popupPosition[0]) / resolution) < (OVERLAY_OFFSET + this.$el.offsetWidth / 2);
            if (shouldSwapX) {
                popupPosition = [annotationExtent[0], popupPosition[1]];
                overlay.setPosition(popupPosition);
                overlay.setOffset([-OVERLAY_OFFSET, 0]);
            }

            // If the annotation is as wide as the viewport, the popup could now overflow
            // in the other direction. Here is a check if the popup should be moved yet
            // again so it remains visible.
            const shouldMoveX = ((popupPosition[0] - mapExtent[0]) / resolution) < (OVERLAY_OFFSET + this.$el.offsetWidth / 2);
            if (shouldMoveX) {
                overlay.setOffset([OVERLAY_OFFSET, 0]);
            }

            const yOverflowBottom = (mapExtent[1] - popupPosition[1]) / resolution + this.$el.offsetHeight / 2;
            const yOverflowTop = this.$el.offsetHeight / 2 - (mapExtent[3] - popupPosition[1]) / resolution;
            if (yOverflowBottom > 0) {
                overlay.setOffset([overlay.getOffset()[0], -yOverflowBottom]);
            } else if (yOverflowTop > 0) {
                overlay.setOffset([overlay.getOffset()[0], yOverflowTop]);
            }

            const line = new LineString([popupPosition, popupPosition]);
            this.lineFeature = markRaw(new Feature(line));
            this.lineFeature.set('unselectable', true);
            this.lineFeature.set('color', this.attachedLabel.color);
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

            annotationCanvas.labelbotSource.addFeature(this.lineFeature);

            this.listenerKeys.push(annotationCanvas.map.getView().on('change:resolution', this.lineFeature._updateCoordinates));
            this.listenerKeys.push(annotationGeometry.on('change', this.lineFeature._updateCoordinates));
        },
        confirmAttachedLabel() {
            if (this.isFocused) {
                this.confirmAndClose();
            }
        },
        selectLabel1() {
            this.selectLabel(0);
        },
        selectLabel2() {
            this.selectLabel(1);
        },
        selectLabel3() {
            this.selectLabel(2);
        },
        selectTypeaheadLabel(label) {
            this.updateAndClose(label);
            Events.emit('labelbot.chose_label_other');
        },
        selectLabel(index) {
            const label = this.labels[index];
            if (!this.isFocused || !label || !this.canChoose(label)) {
                return;
            }

            if (index === this.attachedIndex) {
                this.confirmAndClose();
            } else {
                this.updateAndClose(label);
                Events.emit(`labelbot.chose_label_${index + 1}`);
            }
        },
    },
    created() {
        if (this.timeout === (TIMEOUTS.length - 1)) {
            this.shouldHaveProgressBar = false;
        }

        Keyboard.on('Escape', this.handleEsc, 0, 'labelbot');
        Keyboard.on('Backspace', this.deleteLabelAnnotation, 0, 'labelbot');
        Keyboard.on('Tab', this.enterTypeahead, 0, 'labelbot');

        if (this.labels.length > 0) {
            Keyboard.on('Enter', this.confirmAttachedLabel, 0, 'labelbot');
            Keyboard.on('1', this.selectLabel1, 0, 'labelbot');
            Keyboard.on('2', this.selectLabel2, 0, 'labelbot');
            Keyboard.on('3', this.selectLabel3, 0, 'labelbot');
        }
    },
    mounted() {
        this.createOverlay(this.$parent);

        this.$refs.popupTypeahead?.$refs.input?.addEventListener("keydown", this.handleTypeaheadKey);
    },
    beforeUnmount() {
        this.$parent.map.removeOverlay(this.overlay);
        this.$parent.labelbotSource.removeFeature(this.lineFeature);
        this.listenerKeys.forEach(unByKey);

        Keyboard.off('Escape', this.handleEsc, 'labelbot');
        Keyboard.off('Backspace', this.deleteLabelAnnotation, 'labelbot');
        Keyboard.off('Tab', this.enterTypeahead, 'labelbot');

        if (this.labels.length > 0) {
            Keyboard.off('Enter', this.confirmAttachedLabel, 'labelbot');
            Keyboard.off('1', this.selectLabel1, 'labelbot');
            Keyboard.off('2', this.selectLabel2, 'labelbot');
            Keyboard.off('3', this.selectLabel3, 'labelbot');
        }
    },
};
</script>
