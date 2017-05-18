/**
 * The settings tab of the annotator
 *
 * @type {Object}
 */
biigle.$component('annotations.components.settingsTab', {
    components: {
        screenshotButton: biigle.$require('annotations.components.screenshotButton'),
    },
    data: function () {
        return {
            annotationOpacity: 1.0,
            cycleMode: 'default',
            mousePosition: false,
        };
    },
    computed: {
        settings: function () {
            return biigle.$require('annotations.stores.settings');
        },
        keyboard: function () {
            return biigle.$require('core.keyboard');
        },
        isVolareActive: function () {
            return this.cycleMode === 'volare';
        },
        isLawnmowerActive: function () {
            return this.cycleMode === 'lawnmower';
        },
        plugins: function () {
            return biigle.$require('annotations.components.settingsTabPlugins');
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
        showMousePosition: function () {
            this.mousePosition = true;
        },
        hideMousePosition: function () {
            this.mousePosition = false;
        },
    },
    watch: {
        annotationOpacity: function (opacity) {
            opacity = parseFloat(opacity);
            if (opacity === 1) {
                this.settings.delete('annotationOpacity');
            } else {
                this.settings.set('annotationOpacity', opacity);
            }
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
        mousePosition: function (position) {
            if (position) {
                this.settings.set('mousePosition', true);
            } else {
                this.settings.delete('mousePosition');
            }
            this.$emit('change', 'mousePosition', position);
        },
    },
    created: function () {
        var storedProperties = ['annotationOpacity', 'mousePosition'];
        storedProperties.forEach(function (property) {
            if (this.settings.has(property)) {
                this[property] = this.settings.get(property);
            }
        }, this);
    },
});

/**
 * Additional components that can be dynamically added by other Biigle modules via
 * view mixins. These components are meant for the "annotationsSettingsTab" view mixin
 * mount point.
 *
 * @type {Object}
 */
biigle.$declare('annotations.components.settingsTabPlugins', {});
