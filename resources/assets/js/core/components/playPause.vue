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
    INACTIVE: 'inactive',
    ACTIVE: 'active',
    PAUSED: 'paused'
});

const INACTIVE = PlayPauseState.INACTIVE;
const ACTIVE = PlayPauseState.ACTIVE;
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
            return this.is(ACTIVE) ? 'fa-stop' : 'fa-play';
        },
        playButtonClass() {
            return this.is(ACTIVE) ? 'active btn-info' : '';
        },
        pauseButtonClass() {
            return this.is(PAUSED) ? 'active btn-info' : '';
        },
        playButtonTitle() {
            return this.is(ACTIVE) ? this.stopButtonTitleText : this.playButtonTitleText;
        },
        pauseButtonDisabled() {
            return this.is(INACTIVE);
        },
    },
    methods: {
        is(state) {
            return this.state === state;
        },
        playButtonClicked() {
            const targetState = this.is(ACTIVE) ? INACTIVE : ACTIVE;
            this.$emit('transitionRequested', targetState);
        },
        pauseButtonClicked() {
            const targetState = this.is(ACTIVE) ? PAUSED : INACTIVE;
            this.$emit('transitionRequested', targetState);
        }
    }
}
</script>