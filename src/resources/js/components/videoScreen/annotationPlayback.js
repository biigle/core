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
            preparedInterpolationPoints: function () {
                // This prepares the information used to interpolate each annotation
                // between keyframes. This has to be done only if the annotation points
                // change (and not in every rendering step).
                var map = {};
                this.annotations.forEach(function (annotation) {
                    map[annotation.id] = this.prepareInterpolationPoints(annotation);
                }, this);

                return map;
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
            createFeature: function (annotation) {
                var feature = new ol.Feature(this.getGeometryFromPoints(annotation.shape, annotation.points[0]));

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

                var progress = (time - frames[i]) / (frames[i + 1] - frames[i]);
                feature.setGeometry(this.getGeometryFromPoints(annotation.shape,
                    this.interpolatePoints(annotation, i, progress)
                ));
            },
            prepareInterpolationPoints: function (annotation) {
                switch (annotation.shape) {
                    case 'Rectangle':
                    case 'Ellipse':
                        return annotation.points.map(this.rectangleToInterpolationPoints);
                    case 'LineString':
                    case 'Polygon':
                        return annotation.points.map(this.polygonToSvgPath);
                    default:
                        return annotation.points;
                }
            },
            polygonToSvgPath: function (points) {
                points = points.slice();
                points.unshift('M');
                points.splice(3, 0, 'L');

                return points.join(' ');
            },
            interpolatePoints: function (annotation, frameIndex, progress) {
                var points = this.preparedInterpolationPoints[annotation.id];
                var points1 = points[frameIndex];
                var points2 = points[frameIndex + 1];

                switch (annotation.shape) {
                    case 'Rectangle':
                    case 'Ellipse':
                        return this.interpolationPointsToRectangle(
                            // The points come from preparedAnnotationPoints and only
                            // have to converted back to rectangle points after
                            // interpolation.
                            this.interpolateNaive(points1, points2, progress)
                        );
                    case 'LineString':
                    case 'Polygon':
                        // The points come from preparedInterpolationPoints and are
                        // already converted to SVG paths for Polymorph.
                        return this.interpolatePolymorph(points1, points2, progress);
                    default:
                        return this.interpolateNaive(points1, points2, progress);
                }
            },
            interpolateNaive: function (from, to, progress) {
                return from.map(function (value, index) {
                    return value + (to[index] - value) * progress;
                });
            },
            interpolatePolymorph: function (from, to, progress) {
                // Polymorph expects SVG path strings as input.
                var interpolator = polymorph.interpolate([from, to]);

                return interpolator(progress)
                    // Replace any SVG draw command or whitespace with a single space.
                    .replace(/[MCL\s]+/g, ' ')
                    // Trim whitespace.
                    .trim()
                    // Split coordinates.
                    .split(' ')
                    // Parse coordinates to int.
                    .map(function (n) {
                        return parseInt(n, 10);
                    });
            },
            rectangleToInterpolationPoints: function (points) {
                // Return the center point, the normalized vector from the first point
                // (A) to the second point (B), the width (A->B) and the height (A->D).
                var ab = [points[2] - points[0], points[3] - points[1]];
                var ad = [points[6] - points[0], points[7] - points[1]];
                var w = Math.sqrt(ad[0] * ad[0] + ad[1] * ad[1]);
                var h = Math.sqrt(ab[0] * ab[0] + ab[1] * ab[1]);
                var normalizedAb = [ab[0] / h, ab[1] / h];

                var center = [
                    (points[0] + points[2] + points[4] + points[6]) / 4,
                    (points[1] + points[3] + points[5] + points[7]) / 4,
                ];

                return [center[0], center[1], normalizedAb[0], normalizedAb[1], w, h];
            },
            interpolationPointsToRectangle: function (points) {
                // Reconstruct a rectangle from the center point, the normalized vector
                // from the first point (A) to the second point (B), the width and the
                // height.
                var normalizedAb = [points[2], points[3]];
                var perpendicularAb = [-normalizedAb[1], normalizedAb[0]];
                var halfWpAb0 = points[4] / 2 * perpendicularAb[0];
                var halfWpAb1 = points[4] / 2 * perpendicularAb[1];
                var halfHnAb0 = points[5] / 2 * normalizedAb[0];
                var halfHnAb1 = points[5] / 2 * normalizedAb[1];

                return [
                    // A: Move from center backwards half the height in normalizedAb
                    // direction and half the width in perpendicularAb direction.
                    points[0] - halfHnAb0 - halfWpAb0,
                    points[1] - halfHnAb1 - halfWpAb1,
                    // B
                    points[0] + halfHnAb0 - halfWpAb0,
                    points[1] + halfHnAb1 - halfWpAb1,
                    // C
                    points[0] + halfHnAb0 + halfWpAb0,
                    points[1] + halfHnAb1 + halfWpAb1,
                    // D
                    points[0] - halfHnAb0 + halfWpAb0,
                    points[1] - halfHnAb1 + halfWpAb1,
                ];
            },
            getGeometryFromPoints: function (shape, points) {
                points = this.convertPointsFromDbToOl(points);

                switch (shape) {
                    case 'Point':
                        return new ol.geom.Point(points[0]);
                    case 'Rectangle':
                        return new ol.geom.Rectangle([points]);
                    case 'Polygon':
                        return new ol.geom.Polygon([points]);
                    case 'LineString':
                        return new ol.geom.LineString(points);
                    case 'Circle':
                        // radius is the x value of the second point of the circle
                        return new ol.geom.Circle(points[0], points[1][0]);
                    case 'Ellipse':
                        return new ol.geom.Ellipse([points]);
                    default:
                        // unsupported shapes are ignored
                        console.error('Unknown annotation shape: ' + shape);
                        return;
                }
            },
            getPointsFromGeometry: function (geometry) {
                var points;
                switch (geometry.getType()) {
                    case 'Circle':
                        // radius is the x value of the second point of the circle
                        points = [geometry.getCenter(), [geometry.getRadius()]];
                        break;
                    case 'Polygon':
                    case 'Rectangle':
                    case 'Ellipse':
                        points = geometry.getCoordinates()[0];
                        break;
                    case 'Point':
                        points = [geometry.getCoordinates()];
                        break;
                    default:
                        points = geometry.getCoordinates();
                }

                return this.convertPointsFromOlToDb(points);
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
            convertPointsFromOlToDb: function (points) {
                // Merge the individual point arrays to a single array first.
                // [[x1, y1], [x2, y2]] -> [x1, y1, x2, y2]
                return this.invertPointsYAxis(Array.prototype.concat.apply([], points));
            },
            convertPointsFromDbToOl: function (points) {
                // Duplicate the points array because we don't want to modify the
                // original array.
                points = this.invertPointsYAxis(points.slice());
                var newPoints = [];
                for (var i = 0; i < points.length; i += 2) {
                    newPoints.push([
                        points[i],
                        // Circles have no fourth point so we take 0.
                        (points[i + 1] || 0)
                    ]);
                }

                return newPoints;
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
