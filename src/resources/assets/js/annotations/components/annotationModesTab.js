/**
 * The annotation modes tab of the annotator
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationModesTab', {
    components: {
        powerToggle: biigle.$require('core.components.powerToggle'),
    },
    data: function () {
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
            this.setMode('volare');
        },
        startLawnmower: function () {
            this.setMode('lawnmower');
        },
        startRandomSampling: function () {
            this.setMode('randomSampling');
        },
        startRegularSampling: function () {
            this.setMode('regularSampling');
        },
        setMode: function (mode) {
            if (this.modes.indexOf(mode) !== -1) {
                this.mode = mode;
            }
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
                case 'volare':
                    this.keyboard.off('Enter', this.emitAttachLabel);
                    break;
                case 'randomSampling':
                case 'regularSampling':
                    this.keyboard.off('Enter', this.emitCreateSample);
                    break;
            }

            switch (mode) {
                case 'volare':
                    this.keyboard.on('Enter', this.emitAttachLabel);
                    break;
                case 'randomSampling':
                case 'regularSampling':
                    this.keyboard.on('Enter', this.emitCreateSample);
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
            this.settings.set('randomSamplingNumber', number);
        },
        regularSamplingRows: function (number) {
            this.settings.set('regularSamplingRows', number);
        },
        regularSamplingColumns: function (number) {
            this.settings.set('regularSamplingColumns', number);
        },
    },
    created: function () {
        this.restoreKeys.forEach(function (key) {
            this[key] = this.settings.get(key);
        }, this);

        var mode = biigle.$require('urlParams').get('annotationMode');
        if (mode) {
            var self = this;
            biigle.$require('events').$once('images.change', function () {
                self.setMode(mode);
            });
        }
    },
});
