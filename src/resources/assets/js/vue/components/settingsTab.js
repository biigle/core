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
        isVolareActive: function () {
            return this.cycleMode === 'volare';
        },
    },
    methods: {
        startVolare: function () {
            this.cycleMode = 'volare';
        },
        resetCycleMode: function () {
            this.cycleMode = 'default';
        },
        emitAttachLabel: function () {
            // TODO
            console.log('attach');
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
        },
    },
    created: function () {
        // TODO listen to ESC to reset cycle mode if not default
        if (this.settings.has('annotationOpacity')) {
            this.annotationOpacity = this.settings.get('annotationOpacity');
        }
    },
});
