/**
 * Mixin for the videoScreen component that contains logic for the polygon brush
 * interactions.
 *
 * @type {Object}
 */
biigle.$component('videos.components.videoScreen.polygonBrushInteractions', function () {
    return {
        data: function () {
            return {
                polygonBrushRadius: 50,
            };
        },
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
                } else if (!this.hasSelectedLabel) {
                    this.requireSelectedLabel();
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
                    this.polygonBrushRadius = this.polygonBrushInteraction.getBrushRadius();
                    this.map.removeInteraction(this.polygonBrushInteraction);
                } else if (this.hasSelectedLabel) {
                    this.polygonBrushInteraction = new ol.interaction.PolygonBrush({
                        source: this.pendingAnnotationSource,
                        style: biigle.$require('annotations.stores.styles').editing,
                        brushRadius: this.polygonBrushRadius,
                    });
                    this.polygonBrushInteraction.on('drawend', this.extendPendingAnnotation);
                    this.pendingAnnotation.shape = 'Polygon';
                    this.map.addInteraction(this.polygonBrushInteraction);
                }
            },
            togglePolygonEraserInteraction: function (isUsingPolygonEraser) {
                if (!isUsingPolygonEraser) {
                    this.polygonBrushRadius = this.polygonEraserInteraction.getBrushRadius();
                    this.map.removeInteraction(this.polygonEraserInteraction);
                    this.polygonEraserInteraction = null;
                    this.map.removeInteraction(this.shiftClickSelectInteraction);
                } else {
                    this.polygonEraserInteraction = new ol.interaction.ModifyPolygonBrush({
                        features: this.selectInteraction.getFeatures(),
                        style: biigle.$require('annotations.stores.styles').editing,
                        brushRadius: this.polygonBrushRadius,
                        allowRemove: false,
                        addCondition: ol.events.condition.never,
                        subtractCondition: ol.events.condition.noModifierKeys,
                    });
                    this.polygonEraserInteraction.on('modifystart', this.handleModifyStart);
                    this.polygonEraserInteraction.on('modifyend', this.handleModifyEnd);
                    this.map.addInteraction(this.polygonEraserInteraction);
                    this.map.addInteraction(this.shiftClickSelectInteraction);
                }
            },
            togglePolygonFillInteraction: function (isUsingPolygonFill) {
                if (!isUsingPolygonFill) {
                    this.polygonBrushRadius = this.polygonFillInteraction.getBrushRadius();
                    this.map.removeInteraction(this.polygonFillInteraction);
                    this.polygonFillInteraction = null;
                    this.map.removeInteraction(this.shiftClickSelectInteraction);
                } else {
                    this.polygonFillInteraction = new ol.interaction.ModifyPolygonBrush({
                        features: this.selectInteraction.getFeatures(),
                        style: biigle.$require('annotations.stores.styles').editing,
                        brushRadius: this.polygonBrushRadius,
                        allowRemove: false,
                        addCondition: ol.events.condition.noModifierKeys,
                        subtractCondition: ol.events.condition.never,
                    });
                    this.polygonFillInteraction.on('modifystart', this.handleModifyStart);
                    this.polygonFillInteraction.on('modifyend', this.handleModifyEnd);
                    this.map.addInteraction(this.polygonFillInteraction);
                    this.map.addInteraction(this.shiftClickSelectInteraction);
                }
            },
            initShiftSelectInteraction: function (map) {
                this.shiftClickSelectInteraction = new ol.interaction.Select({
                    condition: function (e) {
                        return ol.events.condition.click(e) && ol.events.condition.shiftKeyOnly(e);
                    },
                    style: biigle.$require('annotations.stores.styles').highlight,
                    layers: [this.annotationLayer],
                    features: this.selectInteraction.getFeatures(),
                    multi: true
                });
                this.shiftClickSelectInteraction.on('select', this.handleFeatureSelect);
            },
        },
        created: function () {
            var kb = biigle.$require('keyboard');

            if (this.canAdd) {
                this.$watch('isUsingPolygonBrush', this.togglePolygonBrushInteraction);
                kb.on('e', this.togglePolygonBrush, 0, this.listenerSet);
            }

            if (this.canModify) {
                this.$once('map-created', function () {
                    this.$once('map-ready', this.initShiftSelectInteraction);
                });

                this.$watch('isUsingPolygonEraser', this.togglePolygonEraserInteraction);
                kb.on('r', this.togglePolygonEraser, 0, this.listenerSet);
                this.$watch('isUsingPolygonFill', this.togglePolygonFillInteraction);
                kb.on('t', this.togglePolygonFill, 0, this.listenerSet);
            }
        },
    };
});
