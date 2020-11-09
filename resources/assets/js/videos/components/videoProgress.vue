<template>
    <div
        class="video-progress"
        @click="emitSeek"
        >
            <tick
                v-for="time in ticks"
                :key="time"
                :time="time"
                ></tick>
    </div>
</template>

<script>
import Tick from './videoProgressTick';

export default {
    props: {
        duration: {
            type: Number,
            required: true,
        },
        elementWidth: {
            type: Number,
            required: true,
        },
    },
    components: {
        tick: Tick,
    },
    data() {
        return {
            tickSpacing: 100,
        };
    },
    computed: {
        tickCount() {
            return Math.floor(this.elementWidth / this.tickSpacing);
        },
        ticks() {
            if (!this.hasTicks) {
                return [];
            }

            let step = this.duration / this.tickCount;

            return Array.apply(null, {length: this.tickCount})
                .map((item, index) => step * index);
        },
        hasTicks() {
            return this.tickCount > 0 && this.duration > 0;
        },
    },
    methods: {
        emitSeek(e) {
            this.$emit('seek', (e.clientX - e.target.getBoundingClientRect().left) / e.target.clientWidth * this.duration);
        },
    },
};
</script>
