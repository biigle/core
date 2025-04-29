<template>
    <div
        class="current-time">
            <loader v-if="seeking" :active="true"></loader>
            <span v-else>
                <span
                    v-text="currentTimeText"
                    ></span>
            </span>
    </div>
</template>

<script>
import Loader from '@/core/components/loader.vue';
import videoTime from '@/videos/filters/videoTime';

export default {
    props: {
        currentTime: {
            type: Number,
            required: true,
        },
        seeking: {
            type: Boolean,
            default: false,
        },
    },
    components: {
        loader: Loader,
    },
    computed: {
        currentTimeText() {
            return videoTime(this.currentTime);
        },
    },
};
</script>
