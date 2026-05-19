<template>
<div class="scale-line-indicator" title="Scale">
    <span class="scale-line-indicator__line" :style="styleObject" v-text="text"></span>
</div>
</template>
<script>
import MeasureComponent from '../mixins/measureComponent.vue';
import { ScaleLineProperties } from '../utils';

/**
 * The scale line indicator of the canvas element
 *
 * @type {Object}
 */
export default {
    mixins: [MeasureComponent],
    props: {
        resolution: {
            required: true,
        },
    },
    data() {
        return {
            targetWidth: 100,
            leadingDigits: [1, 2, 5],
        };
    },
    computed: {
        scaleLineProperties() {
            return new ScaleLineProperties(this.resolution, this.hasArea, this.pxWidthInMeter, this.unitMultipliers, this.unitNames);
        },
        width() {
            return this.scaleLineProperties.width();
        },
        styleObject() {
            return {width: this.width + 'px'};
        },
        text() {
            return this.scaleLineProperties.text();
        },
    },
};
</script>
