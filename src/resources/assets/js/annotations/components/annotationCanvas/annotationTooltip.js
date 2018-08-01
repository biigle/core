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
                // Used to efficiently determine when to update hoveredAnnotations.
                hoveredAnnotationHash: '',
                hoveredAnnotations: [],
            };
        },
        methods: {
            updateHoveredAnnotations: function (e) {
                var annotations = [];
                this.map.forEachFeatureAtPixel(e.pixel,
                    function (feature) {
                        annotations.push(feature);
                    },
                    {
                        layerFilter: function (layer) {
                            return layer.get('name') === 'annotations';
                        },
                    }
                );

                var hash = annotations.map(function (a) {return a.getId();}).sort().join('');

                if (this.hoveredAnnotationHash !== hash) {
                    this.hoveredAnnotationHash = hash;
                    this.hoveredAnnotations = annotations;
                }
            },
            resetHoveredAnnotations: function () {
                this.hoveredAnnotationHash = '';
                this.hoveredAnnotations = [];
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
