<template>
    <button
        type="button"
        class="btn btn-default"
        :class="playButtonClass"
        :title="playButtonTitle"
        @click="playButtonClicked"
    ><i class="fa fa-fw" :class="playButtonIconClass"></i></button>

    <button
        type="button"
        class="btn btn-default"
        :title="pauseButtonTitleText"
        :disabled="pauseButtonDisabled"
        :class="pauseButtonClass"
        @click="pauseButtonClicked"
    ><i class="fa fa-fw fa-pause"></i></button>
</template>

<script>
export const PlayPauseState = Object.freeze({
    STOPPED: 'stopped',
    PLAYING: 'playing',
    PAUSED: 'paused'
});

const STOPPED = PlayPauseState.STOPPED;
const PLAYING = PlayPauseState.PLAYING;
const PAUSED = PlayPauseState.PAUSED;

export default {
    emits: [
        'transitionRequested'
    ],
    props: {
        state: {
            type: String,
            required: true
        },
        playButtonTitleText: {
            type: String,
            required: true
        },
        stopButtonTitleText: {
            type: String,
            required: true
        },
        pauseButtonTitleText: {
            type: String,
            required: true
        }
    },
    computed: {
        playButtonIconClass() {
            return this.is(PLAYING) ? 'fa-stop' : 'fa-play';
        },
        playButtonClass() {
            return this.is(PLAYING) ? 'active btn-info' : '';
        },
        pauseButtonClass() {
            return this.is(PAUSED) ? 'active btn-info' : '';
        },
        playButtonTitle() {
            return this.is(PLAYING) ? this.stopButtonTitleText : this.playButtonTitleText;
        },
        pauseButtonDisabled() {
            return this.is(STOPPED);
        },
    },
    methods: {
        is(state) {
            return this.state === state;
        },
        playButtonClicked() {
            const target = this.is(PLAYING) ? STOPPED : PLAYING;
            this.$emit('transitionRequested', target);
        },
        pauseButtonClicked() {
            const target = this.is(PLAYING) ? PAUSED : STOPPED;
            this.$emit('transitionRequested', target);
        }
    }
}
</script>