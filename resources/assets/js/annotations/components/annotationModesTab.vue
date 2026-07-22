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
    template: '#annotation-modes-tab-template',
    emits: [
        'attach-label',
        'annotation-mode-changed',
        'create-sample',
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
                'volarePaused',
                'lawnmower',
                'lawnmowerPaused',
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
            currentLawnmowerState: PlayPauseState.INACTIVE,
            currentVolareState: PlayPauseState.INACTIVE,
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
        pauseVolare() {
            this.setMode('volarePaused');
        },
        startLawnmower() {
            this.setMode('lawnmower');
        },
        pauseLawnmower() {
            this.setMode('lawnmowerPaused');
        },
        startRandomSampling() {
            this.setMode('randomSampling');
        },
        startRegularSampling() {
            this.setMode('regularSampling');
        },
        setMode(newMode) {
            if (this.modes.indexOf(newMode) === -1) {
                return;
            }

            const oldMode = this.mode;
            this.mode = newMode;
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
        updateLawnmowerState(targetState) {
            switch (targetState) {
                case PlayPauseState.INACTIVE:
                    this.resetMode();
                    break;
                case PlayPauseState.ACTIVE:
                    this.startLawnmower();
                    break;
                case PlayPauseState.PAUSED:
                    this.pauseLawnmower();
                    break;
            }
            this.currentLawnmowerState = targetState;
        },
        updateVolareState(targetState) {
            switch (targetState) {
                case PlayPauseState.INACTIVE:
                    this.resetMode();
                    break;
                case PlayPauseState.ACTIVE:
                    this.startVolare();
                    break;
                case PlayPauseState.PAUSED:
                    this.pauseVolare();
                    break;
            }
            this.currentVolareState = targetState;
        },
        updateKeyBinds(newMode, oldMode) {
            switch (oldMode) {
                case 'volare':
                    Keyboard.off('Enter', this.emitAttachLabel);
                    break;
                case 'randomSampling':
                case 'regularSampling':
                    Keyboard.off('Enter', this.emitCreateSample);
                    break;
            }

            switch (newMode) {
                case 'volare':
                    Keyboard.on('Enter', this.emitAttachLabel);
                    break;
                case 'randomSampling':
                case 'regularSampling':
                    Keyboard.on('Enter', this.emitCreateSample);
                    break;
            }
        },
        emitModeSignals(newMode) {
            switch (newMode) {
                case 'randomSampling':
                    this.$emit('annotation-mode-changed', newMode, this.randomSamplingNumber);
                    break;
                case 'regularSampling':
                    this.$emit('annotation-mode-changed', newMode, [this.regularSamplingRows, this.regularSamplingColumns]);
                    break;
                default:
                    this.$emit('annotation-mode-changed', newMode);
            }
        },
    },
    watch: {
        mode(newMode, oldMode) {
            this.updateKeyBinds(newMode, oldMode);
            this.emitModeSignals(newMode);
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
