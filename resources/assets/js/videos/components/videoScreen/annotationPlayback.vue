<script>
import Circle from '@biigle/ol/geom/Circle';
import Ellipse from '@biigle/ol/geom/Ellipse';
import Feature from '@biigle/ol/Feature';
import LineString from '@biigle/ol/geom/LineString';
import Point from '@biigle/ol/geom/Point';
import Polygon from '@biigle/ol/geom/Polygon';
import Rectangle from '@biigle/ol/geom/Rectangle';
import {getRoundToPrecision} from '@/videos/utils.js';
import {markRaw} from 'vue';

/**
 * Mixin for the videoScreen component that contains logic for the annotation playback.
 *
 * @type {Object}
 */
export default {
    data() {
        return {
            // A map of annotation IDs to OpenLayers feature objects for all
            // currently rendered annotations.
            renderedAnnotationMap: {},
            viewFitOptions: {
                padding: [50, 50, 50, 50],
                minResolution: 1,
            },
        };
    },
    computed: {
        annotationsRevision() {
            return this.annotations.reduce(function (carry, annotation) {
                return carry + annotation.revision;
            }, 0);
        },
        annotationsPreparedToRender() {
            // Extract start and end times of the annotations as well as sort them so
            // they can be accessed fast during rendering.
            return this.annotations
                .filter(a => a.shape !== 'WholeFrame')
                .map(function (annotation) {
                    return {
                        id: annotation.id,
                        start: annotation.startFrame,
                        end: annotation.endFrame,
                        self: annotation,
                    };
                })
                .sort((a, b) => a.start - b.start);
        },
    },
    methods: {
        refreshAllAnnotations() {
            let time = this.video.currentTime;
            let source = this.annotationSource;
            let selected = this.selectedFeatures;
            let annotations = this.annotationsPreparedToRender;
            let oldRendered = this.renderedAnnotationMap;
            // markRaw is crucial here, otherwise there will be a mixup between the actual
            // features and their Vue proxies which would be generated if this were not
            // marked as raw.
            let newRendered = markRaw({});
            this.renderedAnnotationMap = newRendered;
            let toCreate = [];
            let annotation;
            let hasRenderedFeatures = false;
            const rtp = getRoundToPrecision(time);
            // Sometimes the video currentTime does not match the annotation time even if
            // a seek was performed to the exact annotation time. Hence, we  round the
            // time here to the maximum of 4 decimals, too.
            time = rtp(time);

            for (let i = 0, length = annotations.length; i < length; i++) {
                // We can skip ahead and break early because of the sorting in the
                // annotationsPreparedToRender array.
                // Check for start!=time in case this is a single frame annotation
                // (start==end). It would never be shown otherwise.
                if (rtp(annotations[i].end) < time && rtp(annotations[i].start) !== time) {
                    continue;
                }

                if (annotations[i].self.hasGapAt(time)) {
                    continue;
                }

                if (rtp(annotations[i].start) > time) {
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
                // Clearing source and selected, even if they are empty, issues a redraw
                // of the map, so check if there is anything to clear first.
                if (source.getFeatures().length > 0) {
                    source.clear();
                }

                if (selected.getLength() > 0) {
                    selected.clear();
                }
            }


            let features = toCreate.map(this.createFeature);
            features.forEach(function (feature) {
                newRendered[feature.getId()] = feature;
                if (feature.get('annotation').isSelected) {
                    selected.push(feature);
                }
            });

            if (features.length > 0) {
                source.addFeatures(features);
            }

            Object.values(newRendered).forEach((feature) => {
                let annotation = feature.get('annotation');
                let points = annotation.interpolatePoints(time);
                let geometry = feature.getGeometry();
                this.updateGeometry(geometry, points);
            });
        },
        refreshSingleAnnotation(annotation) {
            let source = this.annotationSource;

            let feature = source.getFeatureById(annotation.id);

            feature.set('color', annotation.labels[0].label.color);
        },
        createFeature(annotation) {
            let feature = new Feature(this.getGeometryFromPoints(annotation.shape, annotation.points[0]));

            feature.setId(annotation.id);
            feature.set('annotation', annotation);
            if (annotation.labels && annotation.labels.length > 0) {
                feature.set('color', annotation.labels[0].label.color);
            }

            return feature;
        },
        getGeometryFromPoints(shape, points) {
            points = this.convertPointsFromDbToOl(points);

            switch (shape) {
                case 'Point':
                    return new Point(points[0]);
                case 'Rectangle':
                    return new Rectangle([points]);
                case 'Polygon':
                    return new Polygon([points]);
                case 'LineString':
                    return new LineString(points);
                case 'Circle':
                    // radius is the x value of the second point of the circle
                    return new Circle(points[0], points[1][0]);
                case 'Ellipse':
                    return new Ellipse([points]);
                default:
                    // unsupported shapes are ignored
                    console.error('Unknown annotation shape: ' + shape);
                    return;
            }
        },
        updateGeometry(geometry, points) {
            points = this.convertPointsFromDbToOl(points);

            if (geometry instanceof Point) {
                geometry.setCoordinates(points[0]);
            } else if (geometry instanceof LineString) {
                geometry.setCoordinates(points);
            } else if (geometry instanceof Circle) {
                geometry.setCenter(points[0]);
                geometry.setRadius(points[1][0]);
            } else {
                geometry.setCoordinates([points]);
            }
        },
        getPointsFromGeometry(geometry) {
            let points;
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
        invertPointsYAxis(points) {
            // Expects a points array like [x1, y1, x2, y2]. Inverts the y axis of
            // the points. CAUTION: Modifies the array in place!
            // The y axis should be switched from "top to bottom" to "bottom to top"
            // or vice versa. Our database expects ttb, OpenLayers expects btt.

            let height = this.video.videoHeight;
            for (let i = 1; i < points.length; i += 2) {
                points[i] = height - points[i];
            }

            return points;
        },
        convertPointsFromOlToDb(points) {
            // Merge the individual point arrays to a single array first.
            // [[x1, y1], [x2, y2]] -> [x1, y1, x2, y2]
            return this.invertPointsYAxis(Array.prototype.concat.apply([], points));
        },
        convertPointsFromDbToOl(points) {
            // Duplicate the points array because we don't want to modify the
            // original array.
            points = this.invertPointsYAxis(points.slice());
            let newPoints = [];
            for (let i = 0; i < points.length; i += 2) {
                newPoints.push([
                    points[i],
                    // Circles have no fourth point so we take 0.
                    (points[i + 1] || 0)
                ]);
            }

            return newPoints;
        },
        focusAnnotation(annotation) {
            let feature = this.annotationSource.getFeatureById(annotation.id);
            if (feature) {
                this.map.getView().fit(feature.getGeometry(), this.viewFitOptions);
            }
        },
    },
    created() {
        this.$once('map-ready', () => {
            this.$watch('annotationsRevision', this.refreshAllAnnotations);
            this.videoSource.on('change', this.refreshAllAnnotations);
        });
    },
};
</script>
