/**
 * The settings tab of the annotator
 *
 * @type {Object}
 */
biigle.$component('annotations.components.settingsTab', {
    data: function () {
        return {
            annotationOpacity: 1.0,
            cycleMode: 'default',
        };
    },
    computed: {
        settings: function () {
            return biigle.$require('annotations.stores.settings');
        },
        keyboard: function () {
            return biigle.$require('labelTrees.stores.keyboard');
        },
        isVolareActive: function () {
            return this.cycleMode === 'volare';
        },
        isLawnmowerActive: function () {
            return this.cycleMode === 'lawnmower';
        },
    },
    methods: {
        startVolare: function () {
            this.cycleMode = 'volare';
        },
        startLawnmower: function () {
            this.cycleMode = 'lawnmower';
        },
        resetCycleMode: function () {
            this.cycleMode = 'default';
        },
        emitAttachLabel: function () {
            this.$emit('attach-label');
        },
    },
    watch: {
        annotationOpacity: function (opacity) {
            opacity = parseFloat(opacity);
            this.settings.set('annotationOpacity', opacity);
            this.$emit('change', 'annotationOpacity', opacity);
        },
        cycleMode: function (mode) {
            this.$emit('change', 'cycleMode', mode);

            if (mode === 'default') {
                this.keyboard.off(27, this.resetCycleMode);
            } else {
                // ESC key.
                this.keyboard.on(27, this.resetCycleMode);
            }

            if (mode === 'volare') {
                // Enter key.
                this.keyboard.on(13, this.emitAttachLabel);
            } else {
                this.keyboard.off(13, this.emitAttachLabel);
            }
        },
    },
    created: function () {
        if (this.settings.has('annotationOpacity')) {
            this.annotationOpacity = this.settings.get('annotationOpacity');
        }
    },
});
