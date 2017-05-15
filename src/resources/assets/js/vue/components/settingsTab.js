/**
 * The settings tab of the annotator
 *
 * @type {Object}
 */
biigle.$component('annotations.components.settingsTab', {
    data: function () {
        return {
            annotationOpacity: 1.0,
        };
    },
    computed: {
        settings: function () {
            return biigle.$require('annotations.stores.settings');
        },
    },
    methods: {
    },
    watch: {
        annotationOpacity: function (opacity) {
            opacity = parseFloat(opacity);
            this.settings.setPermanent('annotationOpacity', opacity);
            this.$emit('change', 'annotationOpacity', opacity);
        },
    },
    created: function () {
        if (this.settings.has('annotationOpacity')) {
            this.annotationOpacity = this.settings.get('annotationOpacity');
        }
    },
});
