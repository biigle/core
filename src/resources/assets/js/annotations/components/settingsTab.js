/**
 * The settings tab of the annotator
 *
 * @type {Object}
 */
biigle.$component('annotations.components.settingsTab', {
    components: {
        screenshotButton: biigle.$require('annotations.components.screenshotButton'),
        powerToggle: biigle.$require('core.components.powerToggle'),
    },
    data: function () {
        return {
            annotationOpacity: 1.0,
            mousePosition: false,
            zoomLevel: false,
            scaleLine: false,
            labelTooltip: false,
            measureTooltip: false,
            minimap: true,
            progressIndicator: true,
        };
    },
    props: {
        image: {
            type: Object,
            default: null,
        },
    },
    computed: {
        settings: function () {
            return biigle.$require('annotations.stores.settings');
        },
        plugins: function () {
            return biigle.$require('annotations.components.settingsTabPlugins');
        },
        crossOrigin: function () {
            return this.image && this.image.crossOrigin;
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
        showScaleLine: function () {
            this.scaleLine = true;
        },
        hideScaleLine: function () {
            this.scaleLine = false;
        },
        showLabelTooltip: function () {
            this.labelTooltip = true;
            this.measureTooltip = false;
        },
        hideLabelTooltip: function () {
            this.labelTooltip = false;
        },
        showMeasureTooltip: function () {
            this.measureTooltip = true;
            this.labelTooltip = false;
        },
        hideMeasureTooltip: function () {
            this.measureTooltip = false;
        },
        showMinimap: function () {
            this.minimap = true;
        },
        hideMinimap: function () {
            this.minimap = false;
        },
        showProgressIndicator: function () {
            this.progressIndicator = true;
        },
        hideProgressIndicator: function () {
            this.progressIndicator = false;
        },
        toggleAnnotationOpacity: function () {
            if (this.annotationOpacity > 0) {
                this.annotationOpacity = 0;
            } else {
                this.annotationOpacity = 1;
            }
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
        scaleLine: function (show) {
            if (show) {
                this.settings.set('scaleLine', true);
            } else {
                this.settings.delete('scaleLine');
            }
            this.$emit('change', 'scaleLine', show);
        },
        labelTooltip: function (show) {
            if (show) {
                this.settings.set('labelTooltip', true);
            } else {
                this.settings.delete('labelTooltip');
            }
            this.$emit('change', 'labelTooltip', show);
        },
        measureTooltip: function (show) {
            if (show) {
                this.settings.set('measureTooltip', true);
            } else {
                this.settings.delete('measureTooltip');
            }
            this.$emit('change', 'measureTooltip', show);
        },
        minimap: function (show) {
            if (show) {
                this.settings.delete('minimap');
            } else {
                this.settings.set('minimap', false);
            }
            this.$emit('change', 'minimap', show);
        },
        progressIndicator: function (show) {
            if (show) {
                this.settings.delete('progressIndicator');
            } else {
                this.settings.set('progressIndicator', false);
            }
            this.$emit('change', 'progressIndicator', show);
        },
    },
    created: function () {
        this.settings.restoreProperties(this, [
            // Take care when modifying these variable names as they are mentioned as
            // configurable URL parameters in the documentation.
            'annotationOpacity',
            'mousePosition',
            'zoomLevel',
            'scaleLine',
            'labelTooltip',
            'measureTooltip',
            'minimap',
            'progressIndicator',
        ], true);

        biigle.$require('keyboard').on('o', this.toggleAnnotationOpacity);
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
