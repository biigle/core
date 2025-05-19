<template>
<div
    class="zoom-level-indicator"
    title="Zoom level of the viewport"
    v-text="zoomLevelText"
    ></div>
</template>
<script>
/**
 * The zoom level indicator of the canvas element
 *
 * @type {Object}
 */
export default {
    props: {
        resolution: {
            required: true,
        },
    },
    computed: {
        zoomLevelText() {
            let level = Math.round(100 / this.resolution) / 100;

            // Level may be NaN if the resolution has not been initialized.
            return (level || 0) + 'x';
        },
    },
};
</script>
