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
                //
            };
        },
        computed: {
            //
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
            maybeUpdateModifyInteractionMode: function (mode) {
                if (this.modifyInteraction) {
                    this.modifyInteraction.setActive(mode === 'default');
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
        },
        watch: {
            //
        },
        created: function () {

            var kb = biigle.$require('keyboard');


            if (this.canModify) {
                this.$once('map-created', function () {
                    // Add the event listener after initLayersAndInteractions of
                    // videoScreen so the select interaction is created before the
                    // modify interaction.
                    this.$once('map-ready', this.initModifyInteraction);
                });

                this.$watch('interactionMode', this.maybeUpdateModifyInteractionMode);
            }

            if (this.canDelete) {
                kb.on('Delete', this.emitDelete);
            }
        },
    };
});
