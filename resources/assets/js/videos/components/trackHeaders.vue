<template>
    <div class="track-headers">
        <div class="track-header" v-for="track in labeledTracks">
            <div
                class="label-name"
                v-text="track.label.name"
                :title="track.label.name"
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
    computed: {
        labeledTracks() {
            return (this.tracks || []).filter(t => t?.label);
        }
    },
    watch: {
        scrollTop(scrollTop) {
            this.$el.scrollTop = scrollTop;
        },
    },
};
</script>
