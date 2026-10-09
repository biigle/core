<template>
<annotation-overlay
    v-slot="{startDrag}"
    class="labelbot-popup"
    :class="classObject"
    centered
    dragging-class="labelbot-popup--dragging"
    :connector-color="labels[0].color"
    :feature="feature"
    :gap="overlayOffset"
    :line-source="lineSource"
    :map="map"
    :z-index="overlayZIndex"
    @dragstart="handleDragStart"
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
</annotation-overlay>
</template>

<script>
import AnnotationOverlay from './annotationOverlay.vue';
import Events from '@/core/events';
import Keyboard from '@/core/keyboard';
import Typeahead from '@/label-trees/components/labelTypeahead.vue';
import {debounce} from '@/core/utils.js';

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
        annotationOverlay: AnnotationOverlay,
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
                'labelbot-popup--typing': this.typeaheadFocused,
            };
        },
        overlayOffset() {
            return OVERLAY_OFFSET;
        },
        overlayZIndex() {
            return this.isFocused ? 100 : null;
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
        handleDragStart() {
            this.shouldHaveProgressBar = false;
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
        this.$refs.popupTypeahead?.$refs.input?.addEventListener("keydown", this.handleTypeaheadKey);
    },
    beforeUnmount() {
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
