/**
 * A variant of the image grid used to display vomule images
 *
 * @type {Object}
 */
biigle.$component('volumes.components.volumeImageGrid', {
    mixins: [biigle.$require('volumes.components.imageGrid')],
    template: '<div class="image-grid" @wheel.prevent="scroll">' +
        '<div class="image-grid__images" ref="images">' +
            '<image-grid-image v-for="image in displayedImages" :key="image.id" :image="image" :empty-url="emptyUrl" :selected-label="selectedLabel" :label-mode="labelMode" @select="emitSelect" @deselect="emitDeselect"></image-grid-image>' +
        '</div>' +
        '<image-grid-progress v-if="canScroll" :progress="progress" @top="jumpToStart" @prev-page="reversePage" @prev-row="reverseRow" @jump="jumpToPercent" @next-row="advanceRow" @next-page="advancePage" @bottom="jumpToEnd"></image-grid-progress>' +
    '</div>',
    components: {
        imageGridImage: biigle.$require('volumes.components.volumeImageGridImage'),
    },
    props: {
        labelMode: {
            type: Boolean,
            default: false,
        },
        selectedLabel: {
            type: Object,
            default: null,
        },
    },
});
