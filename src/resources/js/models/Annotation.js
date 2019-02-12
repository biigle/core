/**
 * Annotation model.
 *
 * @type {Object}
 */
biigle.$declare('videos.models.Annotation', function () {
    var POLL_INTERVAL = 5000;

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
            api: function () {
                return biigle.$require('videos.api.videoAnnotations');
            },
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
            gapRanges: function () {
                var ranges = [];
                this.frames.map(function (value, index, frames) {
                    if (value === null) {
                        ranges.push([frames[index - 1], frames[index + 1]]);
                    }
                });

                return ranges;
            },
            isSelected: function () {
                return this.selected !== false;
            },
            isClip: function () {
                return this.frames.length > 1;
            },
        },
        methods: {
            startPollTracking: function () {
                this.tracking = true;
                this.continuePollTracking();
            },
            pollTracking: function () {
                biigle.$require('videos.api.videoAnnotations').get({id: this.id})
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
                biigle.$require('messages.store')
                    .danger('Tracking of annotation ' + this.id + ' failed.');
                this.tracking = false;
                this.$emit('tracking-failed', this);
            },
            interpolatePoints: function (time) {
                // This function must be equivalent to the interpolatePoints method of
                // the PHP VideoAnnotation model!
                if (time < this.startFrame || time > this.endFrame) {
                    return [];
                }

                if (this.hasGapAt(time)) {
                    return [];
                }

                var frames = this.frames;
                var i = frames.length - 1;
                for (; i >= 0; i--) {
                    if (frames[i] <= time && frames[i] !== null) {
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
            hasGapAt: function (time) {
                if (time < this.startFrame || time > this.endFrame) {
                    return false;
                }

                for (var i = this.gapRanges.length - 1; i >= 0; i--) {
                    if (this.gapRanges[i][0] < time && this.gapRanges[i][1] > time) {
                        return true;
                    }
                }

                return false;
            },
            detachAnnotationLabel: function (annotationLabel) {
                console.log('detach', this.id, annotationLabel.id);

                return Vue.Promise.resolve();
            },
            hasKeyframe: function (frame) {
                return this.frames.indexOf(frame) !== -1;
            },
            modify: function (frame, points) {
                var index = this.frames.indexOf(frame);

                if (index !== -1) {
                    this.points.splice(index, 1, points);
                } else {
                    for (var i = this.frames.length - 1; i >= 0; i--) {
                        if (this.frames[i] <= frame) {
                            break;
                        }
                    }

                    this.frames.splice(i + 1, 0, frame);
                    this.points.splice(i + 1, 0, points);
                }

                return this.api.update({id: this.id}, {
                    frames: this.frames,
                    points: this.points,
                });
            },
            split: function (time) {
                return this.api.split({id: this.id}, {time: time})
                    .then(this.handleFinishedSplit);
            },
            handleFinishedSplit: function (response) {
                this.frames = response.body[0].frames;
                this.points = response.body[0].points;
                response.body = response.body[1];

                return response;
            },
            link: function (other) {
                return this.api.link({id: this.id}, {annotation_id: other.id})
                    .then(this.handleFinishedLink);
            },
            handleFinishedLink: function (response) {
                this.frames = response.body.frames;
                this.points = response.body.points;
                this.labels = response.body.labels;

                return response;
            },
            deleteKeyframe: function (frame) {
                var index = this.frames.indexOf(frame);

                if (index !== -1) {
                    this.frames.splice(index, 1);
                    this.points.splice(index, 1);

                    return this.api.update({id: this.id}, {
                        frames: this.frames,
                        points: this.points
                    });
                }

                return Vue.Promise.reject('Unknown keyframe ' + frame + ' of annotation ' + this.id);
            },
            delete: function () {
                return this.api.delete({id: this.id});
            },
        },
        watch: {
            points: function (points) {
                this.revision += 1;
            },
        },
    });
});
