<script>
import Events from '@/core/events.js';
import Keyboard from '@/core/keyboard.vue';
import PowerToggle from '@/core/components/powerToggle.vue';
import Settings from '../stores/settings.js';
import {urlParams as UrlParams} from '@/core/utils.js';

/**
 * The annotation modes tab of the annotator
 *
 * @type {Object}
 */
export default {
    components: {
        powerToggle: PowerToggle,
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
        setMode(mode) {
            if (this.modes.indexOf(mode) !== -1) {
                this.mode = mode;
            }
        },
        resetMode() {
            this.mode = 'default';
        },
        emitAttachLabel() {
            this.$emit('attach-label');
        },
        emitCreateSample() {
            this.$emit('create-sample');
        },
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
    },
    created() {
        this.restoreKeys.forEach((key) => this[key] = Settings.get(key));

        let mode = UrlParams.get('annotationMode');
        if (mode) {
            Events.$once('images.change', () => this.setMode(mode));
        }
    },
};
</script>
