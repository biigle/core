/**
 * Mixin for the videoScreen component that contains logic for the edit/delete
 * interactions.
 *
 * @type {Object}
 */
biigle.$component('videos.components.videoScreen.modifyInteractions', function () {
    return {
        data: function () {
            return {
                // This is no interaction mode because we want the select interaction to
                // be active while translating, too. The select interaction is only
                // enabled in default interaction mode.
                isTranslating: false,
            };
        },
        computed: {
            cannotSplitAnnotation: function () {
                var allowedShapes = ['Point', 'Circle', 'Rectangle'];

                return this.selectedAnnotations.length !== 1 ||
                    allowedShapes.indexOf(this.selectedAnnotations[0].shape) === -1;
            },
        },
        methods: {
            initModifyInteraction: function (map) {
                // Map to detect which features were changed between modifystart and
                // modifyend events of the modify interaction.
                this.featureRevisionMap = {};
                this.modifyInteraction = new ol.interaction.Modify({
                    features: this.selectInteraction.getFeatures(),
                    // The Shift key must be pressed to delete vertices, so that new
                    // vertices can be drawn at the same position of existing
                    // vertices.
                    deleteCondition: function(event) {
                        return ol.events.condition.shiftKeyOnly(event) &&
                            ol.events.condition.singleClick(event);
                    },
                });

                this.modifyInteraction.on('modifystart', this.handleModifyStart);
                this.modifyInteraction.on('modifyend', this.handleModifyEnd);

                map.addInteraction(this.modifyInteraction);
            },
            handleModifyStart: function (e) {
                e.features.forEach(function (feature) {
                    this.featureRevisionMap[feature.getId()] = feature.getRevision();
                }, this);
            },
            handleModifyEnd: function (e) {
                var payload = e.features.getArray()
                    .filter(function (feature) {
                        return this.featureRevisionMap[feature.getId()] !== feature.getRevision();
                    }, this)
                    .map(function (feature) {
                        return {
                            annotation: feature.get('annotation'),
                            points: this.getPointsFromGeometry(feature.getGeometry()),
                            time: this.video.currentTime,
                        };
                    }, this);

                if (payload.length > 0) {
                    this.$emit('modify', payload);
                }
            },
            maybeUpdateModifyInteractionMode: function (isDefault) {
                if (this.modifyInteraction) {
                    this.modifyInteraction.setActive(isDefault);
                }
            },
            emitDelete: function () {
                if (this.canDelete && this.hasSelectedAnnotations) {
                    this.$emit('delete', this.selectedAnnotations.map(function (a) {
                        return {
                            annotation: a,
                            time: this.video.currentTime,
                        };
                    }, this));
                }
            },
            toggleTranslating: function () {
                this.resetInteractionMode();
                this.isTranslating = !this.isTranslating;
            },
            initTranslateInteraction: function (map) {
                var Interaction = biigle.$require('annotations.ol.ExtendedTranslateInteraction');
                this.translateInteraction = new Interaction({
                    features: this.selectedFeatures,
                    map: map,
                });
                this.translateInteraction.setActive(false);
                this.translateInteraction.on('translatestart', this.handleModifyStart);
                this.translateInteraction.on('translateend', this.handleModifyEnd);
                this.map.addInteraction(this.translateInteraction);
            },
            maybeUpdateIsTranslating: function (isDefault) {
                if (this.translateInteraction && !isDefault) {
                    this.isTranslating = false;
                }
            },
            resetTranslating: function () {
                this.isTranslating = false;
            },
            emitSplitAnnotation: function () {
                this.$emit('split-annotation', this.selectedAnnotations[0], this.video.currentTime);
            },
        },
        watch: {
            isTranslating: function (translating) {
                if (this.translateInteraction) {
                    this.translateInteraction.setActive(translating);
                    if (translating) {
                        this.modifyInteraction.setActive(false);
                    } else if (this.isDefaultInteractionMode) {
                        this.modifyInteraction.setActive(true);
                    }
                }
            },
        },
        created: function () {
            var kb = biigle.$require('keyboard');

            if (this.canModify) {
                this.$once('map-created', function () {
                    // Add the event listener after initLayersAndInteractions of
                    // videoScreen so the select interaction is created before the
                    // modify interaction.
                    this.$once('map-ready', this.initModifyInteraction);
                    this.$once('map-ready', this.initTranslateInteraction);
                });

                this.$watch('isDefaultInteractionMode', this.maybeUpdateModifyInteractionMode);
                this.$watch('isDefaultInteractionMode', this.maybeUpdateIsTranslating);
                kb.on('m', this.toggleTranslating, 0, this.listenerSet);
                kb.on('Escape', this.resetTranslating, 0, this.listenerSet);
            }

            if (this.canDelete) {
                kb.on('Delete', this.emitDelete);
            }
        },
    };
});
