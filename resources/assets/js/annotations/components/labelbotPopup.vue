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
            :class="{'labelbot-label--progress': index === 0 && hasProgressBar}"
            :key="index"
            @click="selectLabel(index)"
            :title="`Choose label ${label.name}`"
            >
                <div
                    v-if="index === 0 && hasProgressBar"
                    class="labelbot-label__progress-bar"
                    :style="progressBarStyle"
                    @animationend="confirmAndClose"
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
                @select="selectTypeaheadLabel"
                ></typeahead>
        </li>
    </ul>
</div>
</template>

<script>
import Events from '@/core/events';
import Keyboard from '@/core/keyboard';
import Overlay from '@biigle/ol/Overlay';
import Styles from '../stores/styles.js';
import Typeahead from '@/label-trees/components/labelTypeahead.vue';
import {debounce} from '@/core/utils.js';
import {
    anchorAnnotationOverlay,
    createAnnotationOverlayConnector,
    dragAnnotationOverlay,
    getInitialAnnotationOverlayPlacement,
} from '../utils.js';
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
    },
    inject: ['labelTrees'],
    data() {
        return {
            shouldHaveProgressBar: true,
            maybeGetsAttention: false,
            typeaheadFocused: false,
            selectedLabel: null,
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
        labels() {
            return [this.annotation.labels[0].label].concat(this.annotation.labelBOTLabels);
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
        updateAndClose(label) {
            // Top 1 label is already attached/selected
            if (this.selectedLabel.id !== label.id) {
                this.$emit('update', {label: label, annotation: this.annotation});
            }

            this.emitClose();
        },
        confirmAndClose() {
            this.emitClose();
            Events.emit('labelbot.chose_label_1');
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
            dragAnnotationOverlay(this.overlay, this.dragStartOverlayOffset, this.dragStartMousePosition, e);
            this.lineFeature._updateCoordinates();
        },
        endDrag() {
            this.dragging = false;
            this.$parent.$el.removeEventListener('mousemove', this.handleDrag);
            this.$parent.$el.removeEventListener('mouseup', this.endDrag);

            // When dragging is finished, update the popup position to the closest point
            // on the annotation and recalculate the offset so the popup stays where it
            // was dragged. This feels most natural during zooming.
            anchorAnnotationOverlay(this.overlay, this.overlay.getMap());
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
                offset: [OVERLAY_OFFSET, 0],
                insertFirst: false, // last added overlay appears on top
            });
            this.overlay = markRaw(overlay);
            this.overlay._annotationGeometry = annotationGeometry;
            annotationCanvas.map.addOverlay(overlay);

            const placement = getInitialAnnotationOverlayPlacement(
                annotationExtent,
                annotationCanvas.map.getView().calculateExtent(annotationCanvas.map.getSize()),
                annotationCanvas.map.getView().getResolution(),
                [this.$el.offsetWidth, this.$el.offsetHeight],
                OVERLAY_OFFSET,
                true
            );
            overlay.setPosition(placement.position);
            overlay.setOffset(placement.offset);

            this.lineFeature = markRaw(createAnnotationOverlayConnector(
                overlay, annotationCanvas.map, this.labels[0].color, Styles.editing
            ));

            annotationCanvas.labelbotSource.addFeature(this.lineFeature);

            this.listenerKeys.push(annotationCanvas.map.getView().on('change:resolution', this.lineFeature._updateCoordinates));
            this.listenerKeys.push(annotationGeometry.on('change', this.lineFeature._updateCoordinates));
        },
        selectLabel1() {
            if (this.isFocused) {
                this.confirmAndClose();
            }
        },
        selectLabel2() {
            if (this.isFocused && this.labels[1]) {
                this.updateAndClose(this.labels[1]);
                Events.emit('labelbot.chose_label_2');
            }
        },
        selectLabel3() {
            if (this.isFocused && this.labels[2]) {
                this.updateAndClose(this.labels[2]);
                Events.emit('labelbot.chose_label_3');
            }
        },
        selectTypeaheadLabel(label) {
            this.updateAndClose(label);
            Events.emit('labelbot.chose_label_other');
        },
        selectLabel(index) {
            switch (index) {
                case 0: return this.selectLabel1();
                case 1: return this.selectLabel2();
                case 2: return this.selectLabel3();
            }
        }
    },
    created() {
        if (this.timeout === (TIMEOUTS.length - 1)) {
            this.shouldHaveProgressBar = false;
        }

        Keyboard.on('Escape', this.handleEsc, 0, 'labelbot');
        Keyboard.on('Backspace', this.deleteLabelAnnotation, 0, 'labelbot');
        Keyboard.on('Tab', this.enterTypeahead, 0, 'labelbot');

        if (this.labels.length > 0) {
            this.selectedLabel = this.labels[0];
            Keyboard.on('Enter', this.selectLabel1, 0, 'labelbot');
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
            Keyboard.off('Enter', this.selectLabel1, 'labelbot');
            Keyboard.off('1', this.selectLabel1, 'labelbot');
            Keyboard.off('2', this.selectLabel2, 'labelbot');
            Keyboard.off('3', this.selectLabel3, 'labelbot');
        }
    },
};
</script>
