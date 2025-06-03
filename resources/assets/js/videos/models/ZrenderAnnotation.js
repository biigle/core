import {Rect, Line} from 'zrender';

export const KEYFRAME_HEIGHT = 20;
const KEYFRAME_STROKE = 'rgba(255, 255, 255, 0.75)';
const KEYFRAME_WIDTH = 9;
const KEYFRAME_COMPACT_WIDTH = 3;

const COMPACTNESS = {
    LOW: Symbol(),
    MEDIUM: Symbol(),
    HIGH: Symbol(),
};

export default class ZrenderAnnotation {
    constructor(args) {
        this.annotation = args.annotation;
        this.label = args.label; // TODO One annotation can be drawn multiple times with different labels
        this.zr = args.zr;
        this.xFactor = args.xFactor;
        this.yOffset = args.yOffset;
        this.compactness = this.getCompactness();

        this.segments = [];
        this.gaps = [];
        this.keyframes = [];
    }

    draw() {
        // TODO watch annotation frames, pending, selected, tracking and redraw automatically
        const segments = this.getSegments();

        segments.forEach((s) => {
            if (s.gap) {
                this.drawGap(s);
                console.log('paint gap', s);
            } else {
                // TODO Handle case with single keyframe after gap. Should be "last" too.
                this.drawSegment(s);
            }
        });
    }

    drawGap(segment) {
        const firstFrame = segment.frames[0];
        const lastFrame = segment.frames[segment.frames.length - 1];
        const y = this.yOffset + KEYFRAME_HEIGHT / 2;

        const shape = {
            x1: firstFrame * this.xFactor,
            y1: y,
            x2: lastFrame * this.xFactor,
            y2: y,
        };

        const style = {
            stroke: '#' + (this.label.color || '000'),
            lineWidth: 3,
            lineDash: [3, 3],
        };

        const line = new Line({
            rectHover: true,
            shape,
            style,
        });

        line.firstFrame = firstFrame;
        line.lastFrame = lastFrame;

        this.gaps.push(line);
        this.zr.add(line);
    }

    drawSegment(segment) {
        const frames = segment.frames;
        if (frames.length > 1) {
            const firstFrame = frames[0];
            const lastFrame = frames[frames.length - 1];

            const shape = {
                y: 1 + this.yOffset,
                x: firstFrame * this.xFactor,
                r: 3,
                width: (lastFrame - firstFrame) * this.xFactor,
                height: KEYFRAME_HEIGHT - 2,
            };

            const style = {
                fill: '#' + (this.label.color || '000'),
                opacity: 0.4,
            };

            const rect = new Rect({
                rectHover: true,
                shape,
                style,
            });

            rect.firstFrame = firstFrame;
            rect.lastFrame = lastFrame;

            this.segments.push(rect);
            this.zr.add(rect);
        }

        // TODO apply "last" if keyframe would overflow right end of timeline
        frames.forEach((f, i) => this.drawKeyframe(f, i > 0 && i === (frames.length - 1)));
    }

    drawKeyframe(frame, last) {
        const width = this.compactness === COMPACTNESS.MEDIUM ? KEYFRAME_COMPACT_WIDTH : KEYFRAME_WIDTH;
        const shape = {
            x: Math.min(frame * this.xFactor, this.zr.getWidth() - width),
            // Add 1 for the top border.
            y: 1 + this.yOffset,
            r: 3,
            width: width,
            // Subtract 2 for the top/bottom border.
            height: KEYFRAME_HEIGHT - 2,
        };


        if (last) {
            shape.x -= width;
        }

        const style = {
            fill: '#' + (this.label.color || '000'),
            stroke: KEYFRAME_STROKE,
        };

        const rect = new Rect({
            rectHover: true,
            shape,
            style,
        });

        rect.frame = frame;
        rect.last = last;

        this.keyframes.push(rect);

        if (this.compactness !== COMPACTNESS.HIGH) {
            this.zr.add(rect);
        }
    }

    updateXFactor(xFactor) {
        this.xFactor = xFactor;
        const newCompactness = this.getCompactness();

        if (newCompactness !== this.compactness) {
            this.compactness = newCompactness;

            if (newCompactness === COMPACTNESS.HIGH) {
                this.keyframes.forEach(f => this.zr.remove(f));
            } else {
                this.keyframes.forEach(f => this.zr.add(f));
            }
        }

        const zwWidth = this.zr.getWidth();
        this.keyframes.forEach((k) => {
            const width = this.compactness === COMPACTNESS.MEDIUM ? KEYFRAME_COMPACT_WIDTH : KEYFRAME_WIDTH;
            const shape = {
                x: Math.min(k.frame * this.xFactor, zwWidth - width),
                width: width,
            };
            if (k.last) {
                shape.x -= width;
            }

            k.attr({shape});
        });

        this.segments.forEach((s) => s.attr({
            shape: {
                x: s.firstFrame * this.xFactor,
                width: (s.lastFrame - s.firstFrame) * this.xFactor,
            },
        }));

        this.gaps.forEach((g) => g.attr({
            shape: {
                x1: g.firstFrame * this.xFactor,
                x2: g.lastFrame * this.xFactor,
            },
        }));
    }

    getSegments() {
        let frames = [this.annotation.frames.slice()];
        let gaps = [false];
        let i = 0;
        let gapIndex;

        while ((gapIndex = frames[i].indexOf(null)) !== -1) {
            let oldFrames = frames[i];
            frames[i] = oldFrames.slice(0, gapIndex);
            frames.push([oldFrames[gapIndex - 1], oldFrames[gapIndex + 1]]);
            gaps.push(true);
            frames.push(oldFrames.slice(gapIndex + 1));
            gaps.push(false);
            i += 2;
        }

        return frames.map(function (value, index) {
            return {
                frames: value,
                gap: gaps[index],
            };
        });
    }

    getCompactness() {
        let minDistance = Infinity;
        for (let i = this.annotation.frames.length - 1; i > 0; i--) {
            if (this.annotation.frames[i] === null || this.annotation.frames[i - 1] === null) {
                continue;
            }

            minDistance = Math.min(minDistance, this.annotation.frames[i] - this.annotation.frames[i - 1]);
        }
        minDistance *= this.xFactor;

        if (minDistance <= (KEYFRAME_COMPACT_WIDTH * 2)) {
            return COMPACTNESS.HIGH;
        } else if (minDistance <= (KEYFRAME_WIDTH * 2)) {
            return COMPACTNESS.MEDIUM;
        }

        return COMPACTNESS.LOW;
    }
}
