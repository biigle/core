export const KEYFRAME_HEIGHT = 20;
const KEYFRAME_STROKE = 'rgba(255, 255, 255, 0.5)';
const KEYFRAME_WIDTH = 9;
const KEYFRAME_COMPACT_WIDTH = 3;

const COMPACTNESS = {
    LOW: Symbol(),
    MEDIUM: Symbol(),
    HIGH: Symbol(),
};

export default class SvgAnnotation {
    constructor(args) {
        this.annotation = args.annotation;
        this.color = args.label.color || '000000';
        this.svg = args.svg;
        this.xFactor = args.xFactor;
        this.compactness = this.getCompactness();

        if (this.annotation.wholeFrame) {
            if (this.hasDarkColor()) {
                this.fill = this.svg.root().findOne('.dark-pattern') || this.generatePattern('white').attr({class: 'dark-pattern'});
            } else {
                this.fill = this.svg.root().findOne('.bright-pattern') || this.generatePattern('black').attr({class: 'bright-pattern'});
            }
        } else {
            this.fill = '#' + this.color;
        }

        this.segments = [];
        this.gaps = [];
        this.keyframes = [];
    }

    draw() {
        this.segments.forEach(s => s.remove());
        this.segments = [];
        this.gaps.forEach(g => g.remove());
        this.gaps = [];
        this.keyframes.forEach(k => k.remove());
        this.keyframes = [];

        // TODO watch annotation frames, pending, selected, tracking and redraw automatically
        const segments = this.getSegments();
        const hasSingleLast = segments.length > 2 &&
            segments[segments.length - 1].frames.length === 1 &&
            segments[segments.length - 2].gap;

        segments.forEach((s, i) => {
            if (s.gap) {
                this.drawGap(s);
            } else {
                const singleLast = hasSingleLast && i === (segments.length - 1)
                this.drawSegment(s, singleLast);
            }
        });
    }

    drawGap(segment) {
        const firstFrame = segment.frames[0];
        const lastFrame = segment.frames[segment.frames.length - 1];

        const line = this.svg
            .line(firstFrame * this.xFactor, KEYFRAME_HEIGHT / 2, lastFrame * this.xFactor, KEYFRAME_HEIGHT / 2)
            .attr({
                stroke: '#' + this.color,
                'stroke-width': 3,
                'stroke-dasharray': '0 6',
                'stroke-dashoffset': '1',
                'stroke-linecap': 'round',
            });

        line.firstFrame = firstFrame;
        line.lastFrame = lastFrame;

        this.gaps.push(line);
    }

    drawSegment(segment, singleLast) {
        const frames = segment.frames;
        if (frames.length > 1) {
            const firstFrame = frames[0];
            const lastFrame = frames[frames.length - 1];

            let width = (lastFrame - firstFrame) * this.xFactor;

            const rect = this.svg.rect(width, KEYFRAME_HEIGHT).attr({
                x: firstFrame * this.xFactor,
                y: 0,
                rx: 3,
                ry: 3,
                fill: this.fill,
                opacity: 0.4,
            });

            rect.firstFrame = firstFrame;
            rect.lastFrame = lastFrame;

            this.segments.push(rect);
        }

        frames.forEach((f, i) => this.drawKeyframe(f, singleLast || i > 0 && i === (frames.length - 1)));
    }

    drawKeyframe(frame, last) {
        const width = this.compactness === COMPACTNESS.MEDIUM ? KEYFRAME_COMPACT_WIDTH : KEYFRAME_WIDTH;
        let x = frame * this.xFactor;

        if (last) {
            x -= width;
        }

        // Prevent overflow. Subtract 0.5 for hald the stroke width.
        x = Math.min(x, this.svg.root().width() - width - 0.5);

        // Subtract stroke width from height.
        const rect = this.svg.rect(width, KEYFRAME_HEIGHT - 1).attr({
            x: x,
            y: 0.5, // Add half the stroke width.
            rx: 3,
            ry: 3,
            fill: this.fill,
            stroke: KEYFRAME_STROKE,
        });

        if (this.compactness === COMPACTNESS.HIGH) {
            rect.remove();
        }

        rect.frame = frame;
        rect.last = last;

        this.keyframes.push(rect);
    }

    updateXFactor(xFactor) {
        this.xFactor = xFactor;
        const newCompactness = this.getCompactness();

        if (newCompactness !== this.compactness) {
            this.compactness = newCompactness;

            if (newCompactness === COMPACTNESS.HIGH) {
                this.keyframes.forEach(f => f.remove());
            } else {
                this.keyframes.forEach(f => this.svg.add(f));
            }
        }

        const svgWidth = this.svg.root().width();
        const width = this.compactness === COMPACTNESS.MEDIUM ? KEYFRAME_COMPACT_WIDTH : KEYFRAME_WIDTH;
        this.keyframes.forEach((k) => {
            const shape = {
                x: k.frame * this.xFactor,
                width: width,
            };
            if (k.last) {
                shape.x -= width;
            }
            // Prevent overflow. Subtract 0.5 for hald the stroke width.
            shape.x = Math.min(shape.x, svgWidth - width - 0.5);
            k.attr(shape);
        });

        this.segments.forEach((s) => s.attr({
            x: s.firstFrame * this.xFactor,
            width: (s.lastFrame - s.firstFrame) * this.xFactor,
        }));

        this.gaps.forEach((g) => g.attr({
            x1: g.firstFrame * this.xFactor,
            x2: g.lastFrame * this.xFactor,
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

        if (minDistance <= (KEYFRAME_COMPACT_WIDTH * 3)) {
            return COMPACTNESS.HIGH;
        } else if (minDistance <= (KEYFRAME_WIDTH * 3)) {
            return COMPACTNESS.MEDIUM;
        }

        return COMPACTNESS.LOW;
    }

    hasDarkColor() {
        // see: https://stackoverflow.com/a/12043228/1796523
        let rgb = parseInt(this.color, 16);
        let r = (rgb >> 16) & 0xff;
        let g = (rgb >>  8) & 0xff;
        let b = (rgb >>  0) & 0xff;
        let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        return luma < 128;
    }

    generatePattern(color) {
        return this.svg.root().pattern(6, 6, (add) => {
            add.rect(6, 6).fill('#' + this.color);
            add.line(-3, 0, 6, 9).attr({stroke: color, 'stroke-width': 2, opacity: 0.5});
            add.line(-3, -6, 9, 6).attr({stroke: color, 'stroke-width': 2, opacity: 0.5});
        });
    }
}
