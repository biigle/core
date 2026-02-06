import Messages from '@/core/messages/store.js';
import VideoAnnotationApi from '../api/videoAnnotations.js';
import {getRoundToPrecision} from '../utils.js';
import {interpolate} from 'polymorph-js';
import {ref, watch} from 'vue';

let SHAPE_CACHE;
let PENDING_ID_COUNTER = 0;

export default class Annotation {
    constructor(args) {
        // With LabelBOT, multiple pending annotations could be created, so they need
        // unique IDs (that don't clash with the database IDs).
        this.id = args.id || 'pending-' + PENDING_ID_COUNTER++;
        this._frames = ref(args.frames);
        this._points = args.points;
        this.video_id = args.video_id;
        this.shape_id = args.shape_id;
        this.created_at = args.created_at;
        this.updated_at = args.updated_at;
        this.screenshotPromise = args.screenshotPromise;
        this._labels = ref(args.labels);
        this._labelBOTLabels = ref(args.labelBOTLabels);

        this._pending = ref(args.pending || false);
        this._selected = ref(false);
        this._revision = ref(1);
        this._tracking = ref(false);

        // The startFrame and endFrame are used for overlapsTime(). This is used each time
        // for all annotations whenever an annotation is updated, to determine the timeline
        // annotation tracks. If we just take the refs from this.frames naively, this triggers
        // a huge cascade of Vue getters and produces a significant lag starting with a couple
        // of thousand annotations. The watcher eliminates this inefficiency.
        watch(this._revision, () => {
            this.startFrame = this.frames[0];
            this.endFrame = this.frames[this.frames.length - 1];
        }, { immediate: true });
    }
    
    get pending() {
        return this._pending.value;
    }

    set pending(value) {
        this._pending.value = value;
    }

    get selected() {
        return this._selected.value;
    }

    set selected(value) {
        this._selected.value = value;
    }

    get revision() {
        return this._revision.value;
    }

    set revision(value) {
        this._revision.value = value;
    }

    get tracking() {
        return this._tracking.value;
    }

    set tracking(value) {
        this._tracking.value = value;
    }

    get labels() {
        return this._labels.value;
    }

    set labels(value) {
        this._labels.value = value;
    }
    
    get labelBOTLabels() {
        return this._labelBOTLabels.value;
    }

    get color() {
        // If no color, return the info color as a default
        if (this.labels && this.labels.length === 0) {
            return '5bc0de';
        }
        return this.labels?.[0].label.color;
    }

    get frames() {
        return this._frames.value;
    }

    set frames(value) {
        this._frames.value = value;
    }

    get interpolationPoints() {
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
    }

    get gapRanges() {
        let ranges = [];
        this.frames.map(function (value, index, frames) {
            if (value === null) {
                ranges.push([frames[index - 1], frames[index + 1]]);
            }
        });

        return ranges;
    }

    get isSelected() {
        return this.selected !== false;
    }

    get isClip() {
        return this.frames.length > 1;
    }

    get wholeFrame() {
        return this.shape === 'WholeFrame';
    }

    get points() {
        return this._points;
    }

    set points(values) {
        this._points = values;
        this._newRevision();
    }

    get shape() {
        if (!SHAPE_CACHE) {
            SHAPE_CACHE = biigle.$require('annotations.shapes');
        }

        return SHAPE_CACHE[this.shape_id];
    }

    _newRevision() {
        this.revision += 1;
    }

    startTracking() {
        this.tracking = true;
    }

    finishTracking(annotation) {
        this.tracking = false;
        this.frames = annotation.frames;
        this.points = annotation.points;
    }

    failTracking() {
        Messages.danger(`Tracking of annotation ${this.id} failed.`);
        this.tracking = false;
    }

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
    }

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
    }

    interpolateNaive(from, to, progress) {
        return from.map((value, index) => value + (to[index] - value) * progress);
    }

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
    }

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
    }

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
    }

    polygonToSvgPath(points) {
        points = points.slice();
        points.unshift('M');
        points.splice(3, 0, 'L');

        return points.join(' ');
    }

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
    }

    overlapsTime(other) {
        // Start of this overlaps with other.
        return this.startFrame >= other.startFrame && this.startFrame < other.endFrame ||
            // End of this overlaps with other.
            this.endFrame > other.startFrame && this.endFrame <= other.endFrame ||
            // Start of other overlaps with this.
            other.startFrame >= this.startFrame && other.startFrame < this.endFrame ||
            // End of other overlaps with this.
            other.endFrame > this.startFrame && other.endFrame <= this.endFrame ||
            // this equals other.
            this.startFrame === other.startFrame && this.endFrame === other.endFrame;
    }

    detachAnnotationLabel(annotationLabel) {
        let index = this.labels.indexOf(annotationLabel);
        if (index !== -1) {
            this.labels.splice(index, 1);
        }

        this.revision += 1;

        return VideoAnnotationApi.detachLabel({id: annotationLabel.id})
            .catch(e => {
                this.labels.splice(index, 0, annotationLabel);

                throw e;
            });
    }

    attachAnnotationLabel(label) {
        return VideoAnnotationApi
            .attachLabel({id: this.id}, {label_id: label.id})
            .then(this.handleAttachedLabel.bind(this));
    }

    handleAttachedLabel(response) {
        this.labels.push(response.body);
        this.revision += 1;

        return response;
    }

    hasKeyframe(frame) {
        return this.frames.indexOf(frame) !== -1;
    }

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

        this._newRevision();

        return VideoAnnotationApi.update({id: this.id}, {
            frames: this.frames,
            points: this.points,
        });
    }

    split(time) {
        return VideoAnnotationApi
            .split({id: this.id}, {time: time})
            .then(this.handleFinishedSplit.bind(this));
    }

    handleFinishedSplit(response) {
        this.frames = response.body[0].frames;
        this.points = response.body[0].points;
        response.body = response.body[1];

        return response;
    }

    link(other) {
        return VideoAnnotationApi
            .link({id: this.id}, {annotation_id: other.id})
            .then(this.handleFinishedLink.bind(this));
    }

    handleFinishedLink(response) {
        this.frames = response.body.frames;
        this.points = response.body.points;
        this.labels = response.body.labels;

        return response;
    }

    deleteKeyframe(frame) {
        let index = this.frames.indexOf(frame);

        if (index !== -1) {
            this.frames.splice(index, 1);
            this.points.splice(index, 1);

            // Remove "null" elements of adjacent gaps to
            // avoid multiple consecutive "null"s.
            if (index === 0 && this.frames[0] === null) {
                this.frames.splice(0, 1);
                this.points.splice(0, 1);
            } else if (this.frames[index - 1] === null) {
                this.frames.splice(index - 1, 1);
                this.points.splice(index - 1, 1);
            }

            this._newRevision();

            return VideoAnnotationApi.update({id: this.id}, {
                frames: this.frames,
                points: this.points
            });
        }

        return Promise.reject(`Unknown keyframe ${frame} of annotation ${this.id}`);
    }

    delete() {
        return VideoAnnotationApi.delete({id: this.id});
    }
}
