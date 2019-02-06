/**
 * Annotation model.
 *
 * @type {Object}
 */
biigle.$declare('videos.models.Annotation', function () {
    var ANNOTATION_API = biigle.$require('videos.api.videoAnnotations');
    var POLL_INTERVAL = 5000;
    var MSG = biigle.$require('messages.store');

    return Vue.extend({
        data: function () {
            return {
                id: 0,
                frames: [],
                points: [],
                video_id: 0,
                shape_id: 0,
                created_at: '',
                updated_at: '',
                labels: [],
                selected: false,
                revision: 1,
                tracking: false,
            };
        },
        computed: {
            shape: function () {
                return biigle.$require('videos.shapes')[this.shape_id];
            },
            startFrame: function () {
                return this.frames[0];
            },
            endFrame: function () {
                return this.frames[this.frames.length - 1];
            },
            interpolationPoints: function () {
                switch (this.shape) {
                    case 'Rectangle':
                    case 'Ellipse':
                        return this.points.map(this.rectangleToInterpolationPoints);
                    case 'LineString':
                    case 'Polygon':
                        return this.points.map(this.polygonToSvgPath);
                    default:
                        return this.points;
                }
            },
        },
        methods: {
            startPollTracking: function () {
                this.tracking = true;
                this.continuePollTracking();
            },
            pollTracking: function () {
                ANNOTATION_API.get({id: this.id})
                    .then(this.maybeFinishPollTracking, this.cancelPollTracking);
            },
            maybeFinishPollTracking: function (response) {
                var annotation = response.body;
                if (annotation.frames.length > 1) {
                    this.tracking = false;
                    this.frames = annotation.frames;
                    this.points = annotation.points;
                } else {
                    this.continuePollTracking();
                }
            },
            continuePollTracking: function () {
                this.pollTimeout = window.setTimeout(this.pollTracking, POLL_INTERVAL);
            },
            cancelPollTracking: function () {
                MSG.danger('Tracking of annotation ' + this.id + ' failed.');
                this.tracking = false;
                this.$emit('tracking-failed', this);
            },
            interpolatePoints: function (time) {
                // This function must give the same results than interpolatePoints of
                // the PHP VideoAnnotation model!
                if (time < this.startFrame || time > this.endFrame) {
                    return [];
                }

                var frames = this.frames;
                var i = frames.length - 1;
                for (; i >= 0; i--) {
                    if (frames[i] <= time) {
                        break;
                    }
                }

                if (frames[i] === time) {
                    return this.points[i];
                }

                var progress = (time - frames[i]) / (frames[i + 1] - frames[i]);

                return this.interpolateBetweenFrames(i, i + 1, progress);
            },
            interpolateBetweenFrames: function (index1, index2, progress) {
                var points1 = this.interpolationPoints[index1];
                var points2 = this.interpolationPoints[index2];

                switch (this.shape) {
                    case 'Rectangle':
                    case 'Ellipse':
                        return this.interpolationPointsToRectangle(
                            // The points come from interpolationPoints and only
                            // have to converted back to rectangle points after
                            // interpolation.
                            this.interpolateNaive(points1, points2, progress)
                        );
                    case 'LineString':
                    case 'Polygon':
                        // The points come from interpolationPoints and are
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
            polygonToSvgPath: function (points) {
                points = points.slice();
                points.unshift('M');
                points.splice(3, 0, 'L');

                return points.join(' ');
            },
        },
        watch: {
            points: function (points) {
                this.revision += 1;
            },
        },
    });
});
