<script>
import AnnotationGuideline from '@/core/models/AnnotationGuideline.js';
import Events from '@/core/events.js';
import Keyboard from '@/core/keyboard.js';
import PowerToggle from '@/core/components/powerToggle.vue';
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
        'change',
        'create-sample',
    ],
    components: {
        powerToggle: PowerToggle,
    },
    props: {
        guideline: {
            type: AnnotationGuideline,
            default: null,
        },
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
        isSamplingActive() {
            return this.isRandomSamplingActive || this.isRegularSamplingActive;
        },
        // Labels can't have a shape that is not in only_shapes, so this is enough to
        // determine if any point annotations can be created at all.
        canSample() {
            return !this.guideline || this.guideline.allowsShape('Point');
        },
        randomSamplingTitle() {
            return this.canSample ? 'Start random sampling of annotations' : 'Random sampling is not allowed by the annotation guideline';
        },
        regularSamplingTitle() {
            return this.canSample ? 'Start regular sampling of annotations' : 'Regular sampling is not allowed by the annotation guideline';
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
            if (this.modes.indexOf(mode) === -1) {
                return;
            }

            if (mode.endsWith('Sampling') && !this.canSample) {
                return;
            }

            this.mode = mode;
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
        canSample(can) {
            if (!can && this.isSamplingActive) {
                this.resetMode();
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
            Events.once('images.change', () => this.setMode(mode));
        }
    },
};
</script>
