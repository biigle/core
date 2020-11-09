<template>
    <div
        class="current-time"
        :class="classObject"
        >
            <loader v-if="seeking" :active="true"></loader>
            <span v-else>
                <span
                    v-text="currentTimeText"
                    ></span>
                <span
                    class="hover-time"
                    v-show="showHoverTime"
                    v-text="hoverTimeText"
                    ></span>
            </span>
    </div>
</template>

<script>
import Loader from '../../core/components/loader';

export default {
    props: {
        currentTime: {
            type: Number,
            required: true,
        },
        hoverTime: {
            type: Number,
            default: 0,
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
            return Vue.filter('videoTime')(this.currentTime);
        },
        hoverTimeText() {
            return Vue.filter('videoTime')(this.hoverTime);
        },
        classObject() {
            return {
                'current-time--seeking': this.seeking,
                'current-time--hover': this.showHoverTime,
            };
        },
        showHoverTime() {
            return this.hoverTime !== 0;
        },
    },
};
</script>
