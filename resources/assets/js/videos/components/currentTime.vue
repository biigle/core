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
        classObject() {
            return {
                'current-time--seeking': this.seeking,
            };
        },
    },
};
</script>
