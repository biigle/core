/**
 * The annotation modes tab of the annotator
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationModesTab', {
    components: {
        powerButton: biigle.$require('annotations.components.powerButton'),
    },
    data: function () {
        return {
            mode: 'default',
            defaults: {
                randomSamplingNumber: 9,
                regularSamplingRows: 3,
                regularSamplingColumns: 3,
            },
            randomSamplingNumber: 9,
            regularSamplingRows: 3,
            regularSamplingColumns: 3,
        };
    },
    computed: {
        keyboard: function () {
            return biigle.$require('keyboard');
        },
        isVolareActive: function () {
            return this.mode === 'volare';
        },
        isLawnmowerActive: function () {
            return this.mode === 'lawnmower';
        },
        isRandomSamplingActive: function () {
            return this.mode === 'randomSampling';
        },
        isRegularSamplingActive: function () {
            return this.mode === 'regularSampling';
        },
        settings: function () {
            return biigle.$require('annotations.stores.settings');
        },
    },
    methods: {
        startVolare: function () {
            this.mode = 'volare';
        },
        startLawnmower: function () {
            this.mode = 'lawnmower';
        },
        startRandomSampling: function () {
            this.mode = 'randomSampling';
        },
        startRegularSampling: function () {
            this.mode = 'regularSampling';
        },
        resetMode: function () {
            this.mode = 'default';
        },
        emitAttachLabel: function () {
            this.$emit('attach-label');
        },
        emitCreateSample: function () {
            this.$emit('create-sample');
        },
    },
    watch: {
        mode: function (mode, oldMode) {
            switch (oldMode) {
                case 'default':
                    // ESC key.
                    this.keyboard.on(27, this.resetMode);
                    break;
                case 'volare':
                    // Enter key.
                    this.keyboard.off(13, this.emitAttachLabel);
                    break;
                case 'randomSampling':
                case 'regularSampling':
                    // Enter key.
                    this.keyboard.off(13, this.emitCreateSample);
                    break;
            }

            switch (mode) {
                case 'default':
                    // ESC key.
                    this.keyboard.off(27, this.resetMode);
                    break;
                case 'volare':
                    // Enter key.
                    this.keyboard.on(13, this.emitAttachLabel);
                    break;
                case 'randomSampling':
                case 'regularSampling':
                    // Enter key.
                    this.keyboard.on(13, this.emitCreateSample);
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
        randomSamplingNumber: function (number) {
            if (number !== this.defaults.randomSamplingNumber) {
                this.settings.set('randomSamplingNumber', number);
            } else {
                this.settings.delete('randomSamplingNumber');
            }
        },
        regularSamplingRows: function (number) {
            if (number !== this.defaults.regularSamplingRows) {
                this.settings.set('regularSamplingRows', number);
            } else {
                this.settings.delete('regularSamplingRows');
            }
        },
        regularSamplingColumns: function (number) {
            if (number !== this.defaults.regularSamplingColumns) {
                this.settings.set('regularSamplingColumns', number);
            } else {
                this.settings.delete('regularSamplingColumns');
            }
        },
    },
    created: function () {
        this.settings.restoreProperties(this, [
            // Take care when modifying these variable names as they are mentioned as
            // configurable URL parameters in the documentation.
            'randomSamplingNumber',
            'regularSamplingRows',
            'regularSamplingColumns',
        ], true);
    },
});
