<template>
    <div class="track-headers">
        <div class="track-header" v-for="track in tracks">
            <div class="header-info">
                <div
                    class="label-name"
                    v-text="track.label.name"
                    :title="track.label.name"
                    :class="{'text-muted': track.label.pending}"
                    ></div>
                <!-- With only one lane the max is obviously 1 and there is no space for the pill. -->
                <span
                    v-if="showMaxN && track.maxN > 1"
                    class="max-n label label-default"
                    :title="`Maximum ${track.maxN} annotations in a single frame`"
                    v-text="`max: ${track.maxN}`"
                    ></span>
            </div>
            <!-- eslint-disable-next-line vue/no-unused-vars -->
            <div class="lane-dummy" v-for="lane in track.lanes"></div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        tracks: {
            type: Array,
            required: true,
        },
        scrollTop: {
            type: Number,
            default: 0,
        },
        showMaxN: {
            type: Boolean,
            default: true,
        },
    },
    watch: {
        scrollTop(scrollTop) {
            this.$el.scrollTop = scrollTop;
        },
    },
};
</script>
