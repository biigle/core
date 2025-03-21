<template>
    <div class="image-grid" @wheel.prevent="scroll">
        <div class="image-grid__images" ref="images">
            <image-grid-image v-for="image in displayedImages" :key="image.id" :image="image" :empty-url="emptyUrl" :selected-label="selectedLabel" :selectable="selectable" :selected-fade="false" :show-filename="showFilenames" :show-labels="showLabels" :type="type" @select="emitSelect"></image-grid-image>
        </div>
        <image-grid-progress v-if="canScroll" :progress="progress" @top="jumpToStart" @prev-page="reversePage" @prev-row="reverseRow" @jump="jumpToPercent" @next-row="advanceRow" @next-page="advancePage" @bottom="jumpToEnd"></image-grid-progress>
    </div>
</template>

<script>
import Image from './volumeImageGridImage.vue';
import ImageGrid from './imageGrid.vue';

/**
 * A variant of the image grid used to display vomule images
 *
 * @type {Object}
 */
export default {
    mixins: [ImageGrid],
    components: {
        imageGridImage: Image,
    },
    props: {
        selectedLabel: {
            type: Object,
            default: null,
        },
        showFilenames: {
            type: Boolean,
            default: false,
        },
        showLabels: {
            type: Boolean,
            default: false,
        },
        type: {
            type: String,
            default: 'image',
        },
    },
};
</script>
