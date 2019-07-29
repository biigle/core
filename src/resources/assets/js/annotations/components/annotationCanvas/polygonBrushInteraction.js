/**
 * Mixin for the annotationCanvas component that contains logic for the polygon brush interaction.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.polygonBrushInteraction', function () {

    var brushRadius = 50;
    var polygonBrushInteraction;
    var shiftClickSelectInteraction;
    var polygonEraserInteraction;
    var polygonFillInteraction;

    return {
        computed: {
            isUsingPolygonBrush: function () {
                return this.interactionMode === 'polygonBrush';
            },
            isUsingPolygonEraser: function () {
                return this.interactionMode === 'polygonEraser';
            },
            isUsingPolygonFill: function () {
                return this.interactionMode === 'polygonFill';
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
            togglePolygonEraser: function () {
                if (this.isUsingPolygonEraser) {
                    this.resetInteractionMode();
                } else if (this.canModify) {
                    this.interactionMode = 'polygonEraser';
                }
            },
            togglePolygonFill: function () {
                if (this.isUsingPolygonFill) {
                    this.resetInteractionMode();
                } else if (this.canModify) {
                    this.interactionMode = 'polygonFill';
                }
            },
            togglePolygonBrushInteraction: function (isUsingPolygonBrush) {
                if (!isUsingPolygonBrush) {
                    brushRadius = polygonBrushInteraction.getBrushRadius();
                    this.map.removeInteraction(polygonBrushInteraction);
                } else if (this.hasSelectedLabel) {
                    polygonBrushInteraction = new ol.interaction.PolygonBrush({
                        map: this.map,
                        source: this.annotationSource,
                        style: this.styles.editing,
                        brushRadius: brushRadius,
                    });
                    polygonBrushInteraction.on('drawend', this.handleNewFeature);
                    this.map.addInteraction(polygonBrushInteraction);
                } else {
                    this.requireSelectedLabel();
                }
            },
            togglePolygonEraserInteraction: function (isUsingPolygonEraser) {
                if (!isUsingPolygonEraser) {
                    brushRadius = polygonEraserInteraction.getBrushRadius();
                    this.map.removeInteraction(polygonEraserInteraction);
                    this.map.removeInteraction(shiftClickSelectInteraction);
                } else {
                    polygonEraserInteraction = new ol.interaction.ModifyPolygonBrush({
                        map: this.map,
                        features: this.selectInteraction.getFeatures(),
                        style: this.styles.editing,
                        brushRadius: brushRadius,
                        allowRemove: false,
                        addCondition: ol.events.condition.never,
                        subtractCondition: ol.events.condition.noModifierKeys,
                    });
                    polygonEraserInteraction.on('modifystart', this.handleFeatureModifyStart);
                    polygonEraserInteraction.on('modifyend', this.handleFeatureModifyEnd);
                    this.map.addInteraction(polygonEraserInteraction);
                    this.map.addInteraction(shiftClickSelectInteraction);
                }
            },
            togglePolygonFillInteraction: function (isUsingPolygonFill) {
                if (!isUsingPolygonFill) {
                    brushRadius = polygonFillInteraction.getBrushRadius();
                    this.map.removeInteraction(polygonFillInteraction);
                    this.map.removeInteraction(shiftClickSelectInteraction);
                } else {
                    polygonFillInteraction = new ol.interaction.ModifyPolygonBrush({
                        map: this.map,
                        features: this.selectInteraction.getFeatures(),
                        style: this.styles.editing,
                        brushRadius: brushRadius,
                        addCondition: ol.events.condition.noModifierKeys,
                        subtractCondition: ol.events.condition.never,
                    });
                    polygonFillInteraction.on('modifystart', this.handleFeatureModifyStart);
                    polygonFillInteraction.on('modifyend', this.handleFeatureModifyEnd);
                    this.map.addInteraction(polygonFillInteraction);
                    this.map.addInteraction(shiftClickSelectInteraction);
                }
            },
        },
        created: function () {
            if (this.canAdd) {
                biigle.$require('keyboard').on('e', this.togglePolygonBrush, 0, this.listenerSet);
                this.$watch('isUsingPolygonBrush', this.togglePolygonBrushInteraction);
            }

            if (this.canModify) {
                biigle.$require('keyboard').on('r', this.togglePolygonEraser, 0, this.listenerSet);
                biigle.$require('keyboard').on('t', this.togglePolygonFill, 0, this.listenerSet);
                this.$watch('isUsingPolygonEraser', this.togglePolygonEraserInteraction);
                this.$watch('isUsingPolygonFill', this.togglePolygonFillInteraction);
            }
        },
        mounted: function () {
            if (this.canModify) {
                shiftClickSelectInteraction = new ol.interaction.Select({
                    condition: function (e) {
                        return ol.events.condition.click(e) && ol.events.condition.shiftKeyOnly(e);
                    },
                    style: this.styles.highlight,
                    layers: [this.annotationLayer],
                    features: this.selectInteraction.getFeatures(),
                    multi: true
                });
                shiftClickSelectInteraction.on('select', this.handleFeatureSelect);
            }
        },
    };
});
