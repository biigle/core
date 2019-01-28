/**
 * Mixin for the videoScreen component that contains logic for the annotation playback.
 *
 * @type {Object}
 */
biigle.$component('videos.components.videoScreen.annotationPlayback', function () {
    return {
        data: function () {
            return {
                // A map of annotation IDs to OpenLayers feature objects for all
                // currently rendered annotations.
                renderedAnnotationMap: {},
            };
        },
        computed: {
            annotationLength: function () {
                return this.annotations.length;
            },
            annotationsPreparedToRender: function () {
                // Extract start and end times of the annotations as well as sort them so
                // they can be accessed fast during rendering.
                return this.annotations.map(function (annotation) {
                        return {
                            id: annotation.id,
                            start: annotation.frames[0],
                            end: annotation.frames[annotation.frames.length - 1],
                            self: annotation,
                        };
                    })
                    .sort(function (a, b) {
                        return a.start - b.start;
                    });
            },
        },
        methods: {
            refreshAnnotations: function (time) {
                var source = this.annotationSource;
                var selected = this.selectedFeatures;
                var annotations = this.annotationsPreparedToRender;
                var oldRendered = this.renderedAnnotationMap;
                var newRendered = {};
                this.renderedAnnotationMap = newRendered;
                var toCreate = [];
                var annotation;
                var hasRenderedFeatures = false;

                for (var i = 0, length = annotations.length; i < length; i++) {
                    // We can skip ahead and break early because of the sorting in the
                    // annotationsPreparedToRender array.
                    // Check for start!=time in case this is a single frame annotation
                    // (start==end). It wwould never be shown otherwise.
                    if (annotations[i].end <= time && annotations[i].start !== time) {
                        continue;
                    }

                    if (annotations[i].start > time) {
                        break;
                    }

                    annotation = annotations[i];
                    hasRenderedFeatures = true;
                    if (oldRendered.hasOwnProperty(annotation.id)) {
                        newRendered[annotation.id] = oldRendered[annotation.id];
                        delete oldRendered[annotation.id];
                    } else {
                        toCreate.push(annotation.self);
                    }
                }

                if (hasRenderedFeatures) {
                    Object.values(oldRendered).forEach(function (feature) {
                        source.removeFeature(feature);
                        selected.remove(feature);
                    });
                } else {
                    source.clear();
                    selected.clear();
                }


                var features = toCreate.map(this.createFeature);
                features.forEach(function (feature) {
                    newRendered[feature.getId()] = feature;
                    if (feature.get('annotation').selected !== false) {
                        selected.push(feature);
                    }
                });

                if (features.length > 0) {
                    source.addFeatures(features);
                }

                Object.values(newRendered).forEach(function (feature) {
                    this.updateGeometry(feature, time);
                }, this);
            },
            invertPointsYAxis: function (points) {
                // Expects a points array like [x1, y1, x2, y2]. Inverts the y axis of
                // the points. CAUTION: Modifies the array in place!
                // The y axis should be switched from "top to bottom" to "bottom to top"
                // or vice versa. Our database expects ttb, OpenLayers expects btt.

                var height = this.videoCanvas.height;
                for (var i = 1; i < points.length; i += 2) {
                    points[i] = height - points[i];
                }

                return points;
            },
            createGeometry: function (shape, coordinates) {
                // Only supports points for now.
                return new ol.geom.Point(this.invertPointsYAxis(coordinates.slice()));
            },
            createFeature: function (annotation) {
                var feature = new ol.Feature(
                    this.createGeometry('Point', annotation.points[0])
                );

                feature.setId(annotation.id);
                feature.set('annotation', annotation);
                if (annotation.labels && annotation.labels.length > 0) {
                    feature.set('color', annotation.labels[0].label.color);
                }

                return feature;
            },
            updateGeometry: function (feature, time) {
                var annotation = feature.get('annotation');
                var frames = annotation.frames;

                if (frames.length <= 1) {
                    return;
                }

                var i;
                for (i = frames.length - 1; i >= 0; i--) {
                    if (frames[i] <= time) {
                        break;
                    }
                }

                var points = annotation.points;
                var progress = (time - frames[i]) / (frames[i + 1] - frames[i]);
                feature.setGeometry(this.createGeometry('Point',
                    this.interpolatePoints(points[i], points[i + 1], progress)));
            },
            interpolatePoints: function (point1, point2, progress) {
                return point1.map(function (value, index) {
                    return value + (point2[index] - value) * progress;
                });
            },
        },
        watch: {
            //
        },
        created: function () {
            this.$on('refresh', this.refreshAnnotations);
            this.$once('map-ready', function () {
                // This is called when an annotation is deleted.
                this.$watch('annotationLength', function () {
                    this.refreshAnnotations(this.video.currentTime);
                });
            });
        },
    };
});
