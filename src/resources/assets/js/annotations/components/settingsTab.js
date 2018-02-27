/**
 * The settings tab of the annotator
 *
 * @type {Object}
 */
biigle.$component('annotations.components.settingsTab', {
    components: {
        screenshotButton: biigle.$require('annotations.components.screenshotButton'),
        powerButton: biigle.$require('annotations.components.powerButton'),
    },
    data: function () {
        return {
            annotationOpacity: 1.0,
            mousePosition: false,
            zoomLevel: false,
            annotationTooltip: false,
            minimap: true,
        };
    },
    computed: {
        settings: function () {
            return biigle.$require('annotations.stores.settings');
        },
        plugins: function () {
            return biigle.$require('annotations.components.settingsTabPlugins');
        },
    },
    methods: {
        showMousePosition: function () {
            this.mousePosition = true;
        },
        hideMousePosition: function () {
            this.mousePosition = false;
        },
        showZoomLevel: function () {
            this.zoomLevel = true;
        },
        hideZoomLevel: function () {
            this.zoomLevel = false;
        },
        showAnnotationTooltip: function () {
            this.annotationTooltip = true;
        },
        hideAnnotationTooltip: function () {
            this.annotationTooltip = false;
        },
        showMinimap: function () {
            this.minimap = true;
        },
        hideMinimap: function () {
            this.minimap = false;
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
        mousePosition: function (show) {
            if (show) {
                this.settings.set('mousePosition', true);
            } else {
                this.settings.delete('mousePosition');
            }
            this.$emit('change', 'mousePosition', show);
        },
        zoomLevel: function (show) {
            if (show) {
                this.settings.set('zoomLevel', true);
            } else {
                this.settings.delete('zoomLevel');
            }
            this.$emit('change', 'zoomLevel', show);
        },
        annotationTooltip: function (show) {
            if (show) {
                this.settings.set('annotationTooltip', true);
            } else {
                this.settings.delete('annotationTooltip');
            }
            this.$emit('change', 'annotationTooltip', show);
        },
        minimap: function (show) {
            if (show) {
                this.settings.delete('minimap');
            } else {
                this.settings.set('minimap', false);
            }
            this.$emit('change', 'minimap', show);
        },
    },
    created: function () {
        this.settings.restoreProperties(this, [
            'annotationOpacity',
            'mousePosition',
            'zoomLevel',
            'annotationTooltip',
            'minimap',
        ]);
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
