/**
 * Mixin for the annotationCanvas component that contains logic for the annotation tooltip.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.annotationTooltip', function () {
    var map;

    return {
        components: {
            annotationTooltip: biigle.$require('annotations.components.annotationTooltip'),
        },
        props: {
            showAnnotationTooltip: {
                type: Boolean,
                default: false,
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
                map.forEachFeatureAtPixel(e.pixel,
                    function (feature) {
                        if (feature.get('annotation')) {
                            annotations.push(feature.get('annotation'));
                        }
                    },
                    {
                        layerFilter: function (layer) {
                            return layer.get('name') === 'annotations';
                        }
                    }
                );

                var hash = annotations.map(function (a) {return a.id;}).sort().join('');

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
                    map.on('pointermove', this.updateMouseDomPosition);
                    map.on('pointermove', this.updateHoveredAnnotations);
                } else {
                    map.un('pointermove', this.updateMouseDomPosition);
                    map.un('pointermove', this.updateHoveredAnnotations);
                    this.resetHoveredAnnotations();
                }
            },
        },
        created: function () {
            map = biigle.$require('annotations.stores.map');
        },
    };
});
