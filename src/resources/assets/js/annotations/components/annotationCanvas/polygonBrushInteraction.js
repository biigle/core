/**
 * Mixin for the annotationCanvas component that contains logic for the polygon brush interaction.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.polygonBrushInteraction', function () {

    var brushRadius = 50;
    var shiftClickSelectInteraction;
    var currentInteraction;

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
            toggleCurrentInteraction: function (mode) {
                if (currentInteraction) {
                    brushRadius = currentInteraction.getBrushRadius();
                    this.map.removeInteraction(currentInteraction);
                    currentInteraction = null;
                }

                if (this.canAdd && mode === 'polygonBrush') {
                    currentInteraction = new ol.interaction.PolygonBrush({
                        map: this.map,
                        source: this.annotationSource,
                        style: this.styles.editing,
                        brushRadius: brushRadius,
                    });
                    currentInteraction.on('drawend', this.handleNewFeature);
                    this.map.addInteraction(currentInteraction);
                } else if (this.canModify && mode === 'polygonEraser') {
                    currentInteraction = new ol.interaction.ModifyPolygonBrush({
                        map: this.map,
                        features: this.selectInteraction.getFeatures(),
                        style: this.styles.editing,
                        brushRadius: brushRadius,
                        allowRemove: false,
                        addCondition: ol.events.condition.never,
                        subtractCondition: ol.events.condition.noModifierKeys,
                    });
                    currentInteraction.on('modifystart', this.handleFeatureModifyStart);
                    currentInteraction.on('modifyend', this.handleFeatureModifyEnd);
                    this.map.addInteraction(currentInteraction);
                    this.map.addInteraction(shiftClickSelectInteraction);
                } else if (this.canModify && mode === 'polygonFill') {
                    currentInteraction = new ol.interaction.ModifyPolygonBrush({
                        map: this.map,
                        features: this.selectInteraction.getFeatures(),
                        style: this.styles.editing,
                        brushRadius: brushRadius,
                        addCondition: ol.events.condition.noModifierKeys,
                        subtractCondition: ol.events.condition.never,
                    });
                    currentInteraction.on('modifystart', this.handleFeatureModifyStart);
                    currentInteraction.on('modifyend', this.handleFeatureModifyEnd);
                    this.map.addInteraction(currentInteraction);
                    this.map.addInteraction(shiftClickSelectInteraction);
                }
            },
        },
        created: function () {
            if (this.canAdd) {
                biigle.$require('keyboard').on('e', this.togglePolygonBrush, 0, this.listenerSet);
            }

            if (this.canModify) {
                biigle.$require('keyboard').on('r', this.togglePolygonEraser, 0, this.listenerSet);
                biigle.$require('keyboard').on('t', this.togglePolygonFill, 0, this.listenerSet);
            }

            if (this.canAdd || this.canModify) {
                this.$watch('interactionMode', this.toggleCurrentInteraction);
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
