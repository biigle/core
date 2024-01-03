<script>
import Messages from '../../core/messages/store';
import VideoAnnotationApi from '../api/videoAnnotations';
import {getRoundToPrecision} from '../utils';
import {interpolate} from 'polymorph-js';


export default Vue.extend({
    data() {
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
            pending: false,
        };
    },
    computed: {
        startFrame() {
            return this.frames[0];
        },
        endFrame() {
            return this.frames[this.frames.length - 1];
        },
        interpolationPoints() {
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
        gapRanges() {
            let ranges = [];
            this.frames.map(function (value, index, frames) {
                if (value === null) {
                    ranges.push([frames[index - 1], frames[index + 1]]);
                }
            });

            return ranges;
        },
        isSelected() {
            return this.selected !== false;
        },
        isClip() {
            return this.frames.length > 1;
        },
        wholeFrame() {
            return this.shape === 'WholeFrame';
        },
    },
    methods: {
        startTracking() {
            this.tracking = true;
        },
        finishTracking(annotation) {
            this.tracking = false;
            this.frames = annotation.frames;
            this.points = annotation.points;
        },
        failTracking() {
            Messages.danger(`Tracking of annotation ${this.id} failed.`);
            this.tracking = false;
        },
        interpolatePoints(time) {
            const rtp = getRoundToPrecision(time);
            // This function must be equivalent to the interpolatePoints method of
            // the PHP VideoAnnotation model!
            if (time < rtp(this.startFrame) || time > rtp(this.endFrame)) {
                return [];
            }

            if (this.hasGapAt(time)) {
                return [];
            }

            let frames = this.frames;
            let i = frames.length - 1;

            if (i === 0) {
                return this.points[0];
            }

            for (; i >= 0; i--) {
                if (rtp(frames[i]) <= time && frames[i] !== null) {
                    break;
                }
            }

            if (rtp(frames[i]) === time) {
                return this.points[i];
            }

            let progress = (time - frames[i]) / (frames[i + 1] - frames[i]);

            return this.interpolateBetweenFrames(i, i + 1, progress);
        },
        interpolateBetweenFrames(index1, index2, progress) {
            let points1 = this.interpolationPoints[index1];
            let points2 = this.interpolationPoints[index2];

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
        interpolateNaive(from, to, progress) {
            return from.map((value, index) => value + (to[index] - value) * progress);
        },
        interpolatePolymorph(from, to, progress) {
            // Polymorph expects SVG path strings as input.
            let interpolator = interpolate([from, to]);

            return interpolator(progress)
                // Replace any SVG draw command or whitespace with a single space.
                .replace(/[MCL\s]+/g, ' ')
                // Trim whitespace.
                .trim()
                // Split coordinates.
                .split(' ')
                // Parse coordinates to int.
                .map((n) => parseInt(n, 10));
        },
        rectangleToInterpolationPoints(points) {
            // Return the center point, the normalized vector from the first point
            // (A) to the second point (B), the width (A->B) and the height (A->D).
            let ab = [points[2] - points[0], points[3] - points[1]];
            let ad = [points[6] - points[0], points[7] - points[1]];
            let w = Math.sqrt(ad[0] * ad[0] + ad[1] * ad[1]);
            let h = Math.sqrt(ab[0] * ab[0] + ab[1] * ab[1]);
            let normalizedAb = [ab[0] / h, ab[1] / h];

            let center = [
                (points[0] + points[2] + points[4] + points[6]) / 4,
                (points[1] + points[3] + points[5] + points[7]) / 4,
            ];

            return [center[0], center[1], normalizedAb[0], normalizedAb[1], w, h];
        },
        interpolationPointsToRectangle(points) {
            // Reconstruct a rectangle from the center point, the normalized vector
            // from the first point (A) to the second point (B), the width and the
            // height.
            let normalizedAb = [points[2], points[3]];
            let perpendicularAb = [-normalizedAb[1], normalizedAb[0]];
            let halfWpAb0 = points[4] / 2 * perpendicularAb[0];
            let halfWpAb1 = points[4] / 2 * perpendicularAb[1];
            let halfHnAb0 = points[5] / 2 * normalizedAb[0];
            let halfHnAb1 = points[5] / 2 * normalizedAb[1];

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
        polygonToSvgPath(points) {
            points = points.slice();
            points.unshift('M');
            points.splice(3, 0, 'L');

            return points.join(' ');
        },
        hasGapAt(time) {
            const rtp = getRoundToPrecision(time);

            if (time < rtp(this.startFrame) || time > rtp(this.endFrame)) {
                return false;
            }

            for (let i = this.gapRanges.length - 1; i >= 0; i--) {
                if (rtp(this.gapRanges[i][0]) < time && rtp(this.gapRanges[i][1]) > time) {
                    return true;
                }
            }

            return false;
        },
        detachAnnotationLabel(annotationLabel) {
            let index = this.labels.indexOf(annotationLabel);
            if (index !== -1) {
                this.labels.splice(index, 1);
            }

            return VideoAnnotationApi.detachLabel({id: annotationLabel.id});
        },
        attachAnnotationLabel(label) {
            return VideoAnnotationApi.attachLabel({id: this.id}, {label_id: label.id})
                .then(this.handleAttachedLabel);
        },
        handleAttachedLabel(response) {
            this.labels.push(response.body);

            return response;
        },
        hasKeyframe(frame) {
            return this.frames.indexOf(frame) !== -1;
        },
        modify(frame, points) {
            let index = this.frames.indexOf(frame);

            if (index !== -1) {
                this.points.splice(index, 1, points);
            } else {
                let i = this.frames.length - 1;
                for (; i >= 0; i--) {
                    if (this.frames[i] <= frame) {
                        break;
                    }
                }

                this.frames.splice(i + 1, 0, frame);
                this.points.splice(i + 1, 0, points);
            }

            return VideoAnnotationApi.update({id: this.id}, {
                frames: this.frames,
                points: this.points,
            });
        },
        split(time) {
            return VideoAnnotationApi.split({id: this.id}, {time: time})
                .then(this.handleFinishedSplit);
        },
        handleFinishedSplit(response) {
            this.frames = response.body[0].frames;
            this.points = response.body[0].points;
            response.body = response.body[1];

            return response;
        },
        link(other) {
            return VideoAnnotationApi.link({id: this.id}, {annotation_id: other.id})
                .then(this.handleFinishedLink);
        },
        handleFinishedLink(response) {
            this.frames = response.body.frames;
            this.points = response.body.points;
            this.labels = response.body.labels;

            return response;
        },
        deleteKeyframe(frame) {
            let index = this.frames.indexOf(frame);

            if (index !== -1) {
                this.frames.splice(index, 1);
                this.points.splice(index, 1);

                // Remove null (gap filler) as first/last element to prevent validation errors
                if (this.frames[0] === null) {
                    this.frames.shift();
                    this.points.shift();
                }

                if (this.frames.at(-1) === null) {
                    this.frames.pop();
                    this.points.pop();
                }

                return VideoAnnotationApi.update({id: this.id}, {
                    frames: this.frames,
                    points: this.points
                });
            }

            return Vue.Promise.reject(`Unknown keyframe ${frame} of annotation ${this.id}`);
        },
        delete() {
            return VideoAnnotationApi.delete({id: this.id});
        },
    },
    watch: {
        points() {
            this.revision += 1;
        },
    },
    created() {
        this.shape = biigle.$require('videos.shapes')[this.shape_id]
    },
});
</script>
