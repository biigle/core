/**
 * Mixin for the annotationCanvas component that contains logic for the polygon brush interaction.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.polygonBrushInteraction', function () {

    var polygonBrushInteraction;

    return {
        computed: {
            isUsingPolygonBrush: function () {
                return this.interactionMode === 'polygonBrush';
            },
        },
        methods: {
            togglePolygonBrush: function () {
                if (this.isUsingPolygonBrush) {
                    this.resetInteractionMode();
                } else if (this.canAdd) {
                    this.interactionMode = 'polygonBrush';
                }
            },
            togglePolygonBrushInteraction: function (isUsingPolygonBrush) {
                if (!isUsingPolygonBrush) {
                    this.map.removeInteraction(polygonBrushInteraction);
                } else if (this.hasSelectedLabel) {
                    polygonBrushInteraction = new ol.interaction.PolygonBrush({
                        map: this.map,
                        source: this.annotationSource,
                        style: this.styles.editing,
                        brushRadius: 50,
                    });
                    polygonBrushInteraction.on('drawend', this.handleNewFeature);
                    this.map.addInteraction(polygonBrushInteraction);
                } else {
                    this.requireSelectedLabel();
                }
            }
        },
        created: function () {
            if (this.canAdd) {
                // biigle.$require('keyboard').on('Shift+g', this.togglePolygonBrush, 0, this.listenerSet);
                this.$watch('isUsingPolygonBrush', this.togglePolygonBrushInteraction);
            }
        },
    };
});
