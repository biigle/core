/**
 * Mixin for the annotationCanvas component that contains logic for the annotation tooltip.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.annotationTooltip', function () {
    return {
        components: {
            labelTooltip: biigle.$require('annotations.components.labelTooltip'),
            measureTooltip: biigle.$require('annotations.components.measureTooltip'),
        },
        props: {
            showLabelTooltip: {
                type: Boolean,
                default: false,
            },
            showMeasureTooltip: {
                type: Boolean,
                default: false,
            },
        },
        computed: {
            showAnnotationTooltip: function () {
                return this.isDefaultInteractionMode && (this.showLabelTooltip || this.showMeasureTooltip);
            },
        },
        data: function () {
            return {
                // Used to determine when to notify watchers for hovered annotations.
                hoveredFeaturesHash: '',
            };
        },
        methods: {
            annotationLayerFilter: function (layer) {
                return layer.get('name') === 'annotations';
            },
            updateHoveredAnnotations: function (e) {
                var features = this.map.getFeaturesAtPixel(e.pixel, {layerFilter: this.annotationLayerFilter}) || [];
                var hash = features.map(function (f) {return f.getId();}).join('-');

                if (this.hoveredFeaturesHash !== hash) {
                    this.hoveredFeaturesHash = hash;
                    this.$emit('hoverFeatures', features);
                }
            },
            resetHoveredAnnotations: function () {
                this.hoveredFeaturesHash = '';
                this.$emit('hoverFeatures', []);
            },
        },
        watch: {
            showAnnotationTooltip: function (show) {
                if (show) {
                    this.map.on('pointermove', this.updateHoveredAnnotations);
                } else {
                    this.map.un('pointermove', this.updateHoveredAnnotations);
                    this.resetHoveredAnnotations();
                }
            },
        },
    };
});
