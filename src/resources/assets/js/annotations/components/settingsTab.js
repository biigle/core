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
    props: {
        image: {
            type: Object,
            default: null,
        },
    },
    data: function () {
        return {
            restoreKeys: [
                'annotationOpacity',
                'mousePosition',
                'zoomLevel',
                'scaleLine',
                'labelTooltip',
                'measureTooltip',
                'minimap',
                'progressIndicator',
            ],
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
            this.$emit('change', 'annotationOpacity', opacity);
            this.settings.set('annotationOpacity', opacity);
        },
        mousePosition: function (show) {
            this.$emit('change', 'mousePosition', show);
            this.settings.set('mousePosition', show);
        },
        zoomLevel: function (show) {
            this.$emit('change', 'zoomLevel', show);
            this.settings.set('zoomLevel', show);
        },
        scaleLine: function (show) {
            this.$emit('change', 'scaleLine', show);
            this.settings.set('scaleLine', show);
        },
        labelTooltip: function (show) {
            this.$emit('change', 'labelTooltip', show);
            this.settings.set('labelTooltip', show);
        },
        measureTooltip: function (show) {
            this.$emit('change', 'measureTooltip', show);
            this.settings.set('measureTooltip', show);
        },
        minimap: function (show) {
            this.$emit('change', 'minimap', show);
            this.settings.set('minimap', show);
        },
        progressIndicator: function (show) {
            this.$emit('change', 'progressIndicator', show);
            this.settings.set('progressIndicator', show);
        },
    },
    created: function () {
        this.restoreKeys.forEach(function (key) {
            this[key] = this.settings.get(key);
        }, this);
        biigle.$require('keyboard').on('o', this.toggleAnnotationOpacity);
    },
});
