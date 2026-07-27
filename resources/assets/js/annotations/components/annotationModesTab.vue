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
            lawnmowerPausedAt: null,
            volarePausedAt: null,
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
        lawnmowerPausedAtText() {
            return this.lawnmowerPausedAt ? this.timeAgo(this.lawnmowerPausedAt) : null;
        },
        volarePausedAtText() {
            return this.volarePausedAt ? this.timeAgo(this.volarePausedAt) : null;
        },
        currentLawnmowerState() {
            if (this.mode === 'lawnmower') {
                return PlayPauseState.ACTIVE;
            } else if (this.mode === 'lawnmowerPaused') {
                return PlayPauseState.PAUSED;
            } else {
                return PlayPauseState.INACTIVE;
            }
        },
        currentVolareState() {
            if (this.mode === 'volare') {
                return PlayPauseState.ACTIVE;
            } else if (this.mode === 'volarePaused') {
                return PlayPauseState.PAUSED;
            } else {
                return PlayPauseState.INACTIVE;
            }
        }
    },
    methods: {
        startVolare() {
            this.setMode('volare');
        },
        pauseVolare(timestamp) {
            this.setMode('volarePaused');
            this.volarePausedAt = timestamp;
        },
        startLawnmower() {
            this.setMode('lawnmower');
        },
        pauseLawnmower(timestamp) {
            this.setMode('lawnmowerPaused');
            this.lawnmowerPausedAt = timestamp;
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

            this.mode = newMode;
            this.lawnmowerPausedAt = null;
            this.volarePausedAt = null;
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
        },
        onLawnmowerPlayPauseTransitionRequested(targetState) {
            this.updateLawnmowerState(targetState);
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
        },
        onVolarePlayPauseTransitionRequested(targetState) {
            this.updateVolareState(targetState);
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
        timeAgo(timestamp) {
            const seconds = Math.floor((Date.now() - timestamp) / 1000);
            const secondsPerDay = 86400;

            const units = [
                { name: 'y', seconds: secondsPerDay * 365},
                { name: 'd', seconds: secondsPerDay },
                { name: 'h', seconds: 3600 },
                { name: 'min', seconds: 60 },
                { name: 's', seconds: 1 },
            ];

            for (const unit of units) {
                if (seconds >= unit.seconds) {
                    const value = Math.round(seconds / unit.seconds);
                    return `${value}${unit.name} ago`;
                }
            }

            return '0s ago';
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
