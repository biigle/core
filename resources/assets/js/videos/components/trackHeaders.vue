<template>
    <div class="track-headers">
        <div class="track-header" v-for="track in tracks">
            <div class="header-info" :class="{'single-lane': track.lanes.length < 2}">
                <div
                    class="label-name"
                    v-text="track.label.name"
                    :title="track.label.name"
                    :class="{'text-muted': track.label.pending}"
                    ></div>
                <!-- With only one lane there is no space for a second line, so only the number is shown after the label name. -->
                <span
                    v-if="showMaxN && track.maxN > 0"
                    class="max-n label label-default"
                    :title="`MaxN: Maximum ${track.maxN} annotations in a single frame`"
                    v-text="track.lanes.length > 1 ? `MaxN: ${track.maxN}` : track.maxN"
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
