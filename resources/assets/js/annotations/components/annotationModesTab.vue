<script>
import Events from '@/core/events.js';
import Keyboard from '@/core/keyboard.js';
import PowerToggle from '@/core/components/powerToggle.vue';
import PlayPause from '@/core/components/playPause.vue';
import { PlayPauseState } from '@/core/components/playPause.vue';
import Settings from '../stores/settings.js';
import {urlParams as UrlParams} from '@/core/utils.js';

/**
 * The annotation modes tab of the annotator
 *
 * @type {Object}
 */
export default {
    props: {
        currentLawnmowerState: {
            type: String,
            required: true
        },
        currentVolareState: {
            type: String,
            required: true
        },
    },
    template: '#annotation-modes-tab-template',
    emits: [
        'attach-label',
        'change',
        'create-sample',
        'lawnmowerStateRequested',
        'volare-state-requested',
    ],
    components: {
        powerToggle: PowerToggle,
        playPause: PlayPause
    },
    data() {
        return {
            mode: 'default',
            modes: [
                'default',
                'volare',
                'lawnmower',
                'randomSampling',
                'regularSampling',
            ],
            restoreKeys: [
                'randomSamplingNumber',
                'regularSamplingRows',
                'regularSamplingColumns',
            ],
            randomSamplingNumber: 9,
            regularSamplingRows: 3,
            regularSamplingColumns: 3,
        };
    },
    computed: {
        isVolareActive() {
            return this.mode === 'volare';
        },
        isLawnmowerActive() {
            return this.mode === 'lawnmower';
        },
        isRandomSamplingActive() {
            return this.mode === 'randomSampling';
        },
        isRegularSamplingActive() {
            return this.mode === 'regularSampling';
        },
    },
    methods: {
        startVolare() {
            this.setMode('volare');
        },
        startLawnmower() {
            this.setMode('lawnmower');
        },
        startRandomSampling() {
            this.setMode('randomSampling');
        },
        startRegularSampling() {
            this.setMode('regularSampling');
        },
        deactivateResumableModes(oldMode, newMode) {
            // Switching from lawnmower/volare to default is caused by pausing and does not deactivate the mode
            if (newMode === 'default') {
                return;
            }

            if (oldMode === 'lawnmower' || this.currentLawnmowerState === PlayPauseState.PAUSED && newMode !== 'lawnmower') {
                this.emitLawnmowerStateRequested(PlayPauseState.INACTIVE);
            } else if (oldMode === 'volare' || this.currentVolareState === PlayPauseState.PAUSED && newMode !== 'volare') {
                this.emitVolareStateRequested(PlayPauseState.INACTIVE);
            }
        },
        setMode(newMode) {
            if (this.modes.indexOf(newMode) === -1) {
                return;
            }

            const oldMode = this.mode;
            this.mode = newMode;

            this.deactivateResumableModes(oldMode, newMode);
        },
        resetMode() {
            this.setMode('default');
        },
        emitAttachLabel() {
            this.$emit('attach-label');
        },
        emitCreateSample() {
            this.$emit('create-sample');
        },
        emitLawnmowerStateRequested(targetState) {
            this.$emit('lawnmowerStateRequested', targetState);
        },
        emitVolareStateRequested(targetState) {
            this.$emit('volare-state-requested', targetState);
        }
    },
    watch: {
        mode(mode, oldMode) {
            switch (oldMode) {
                case 'volare':
                    Keyboard.off('Enter', this.emitAttachLabel);
                    break;
                case 'randomSampling':
                case 'regularSampling':
                    Keyboard.off('Enter', this.emitCreateSample);
                    break;
            }

            switch (mode) {
                case 'volare':
                    Keyboard.on('Enter', this.emitAttachLabel);
                    break;
                case 'randomSampling':
                case 'regularSampling':
                    Keyboard.on('Enter', this.emitCreateSample);
                    break;
            }

            // Emit event.
            switch (mode) {
                case 'randomSampling':
                    this.$emit('change', mode, this.randomSamplingNumber);
                    break;
                case 'regularSampling':
                    this.$emit('change', mode, [this.regularSamplingRows, this.regularSamplingColumns]);
                    break;
                default:
                    this.$emit('change', mode);
            }
        },
        randomSamplingNumber(number) {
            Settings.set('randomSamplingNumber', number);
        },
        regularSamplingRows(number) {
            Settings.set('regularSamplingRows', number);
        },
        regularSamplingColumns(number) {
            Settings.set('regularSamplingColumns', number);
        },
        currentLawnmowerState(newState) {
            if (newState === PlayPauseState.ACTIVE) {
                this.startLawnmower();
            } else if (newState === PlayPauseState.PAUSED) {
                this.resetMode();
            }
        },
        currentVolareState(newState) {
            if (newState === PlayPauseState.ACTIVE) {
                this.startVolare();
            } else if (newState === PlayPauseState.PAUSED) {
                this.resetMode();
            }
        }
    },
    created() {
        this.restoreKeys.forEach((key) => this[key] = Settings.get(key));

        let mode = UrlParams.get('annotationMode');
        if (mode) {
            Events.once('images.change', () => this.setMode(mode));
        }
    },
};
</script>
