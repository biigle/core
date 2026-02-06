<template>
    <div class="track-headers">
        <div class="track-header" v-for="track in tracks">
            <div
                class="label-name"
                v-text="track.label.name"
                :title="track.label.name"
                :class="{'text-muted': track.label.pending}"
                ></div>
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
    },
    watch: {
        scrollTop(scrollTop) {
            this.$el.scrollTop = scrollTop;
        },
    },
};
</script>
