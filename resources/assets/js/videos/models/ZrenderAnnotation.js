import {Rect, Line, Pattern} from 'zrender';

export const KEYFRAME_HEIGHT = 20;
const KEYFRAME_STROKE = 'rgba(255, 255, 255, 0.5)';
const KEYFRAME_WIDTH = 9;
const KEYFRAME_COMPACT_WIDTH = 3;

const COMPACTNESS = {
    LOW: Symbol(),
    MEDIUM: Symbol(),
    HIGH: Symbol(),
};

const generateCrosshatchPattern = function (color) {
    const crosshatch = document.createElement('canvas');
    crosshatch.height = 6;
    crosshatch.width = 6;
    const crosshatchCtx = crosshatch.getContext('2d');
    const gradient = crosshatchCtx.createLinearGradient(crosshatch.width, 0, 0, crosshatch.height);
    gradient.addColorStop(0.000, color);
    gradient.addColorStop(0.125, color);
    gradient.addColorStop(0.125, "transparent");
    gradient.addColorStop(0.375, "transparent");
    gradient.addColorStop(0.375, color);
    gradient.addColorStop(0.625, color);
    gradient.addColorStop(0.625, "transparent");
    gradient.addColorStop(0.875, "transparent");
    gradient.addColorStop(0.875, color);
    gradient.addColorStop(1.000, color);
    crosshatchCtx.fillStyle = gradient;
    crosshatchCtx.fillRect(0, 0, crosshatch.width, crosshatch.height);

    return new Pattern(crosshatch, 'repeat');
};

let PATTERN_BRIGHT;
let PATTERN_DARK;


export default class ZrenderAnnotation {
    constructor(args) {
        if (!PATTERN_BRIGHT) {
            PATTERN_BRIGHT = generateCrosshatchPattern('black');
            PATTERN_DARK = generateCrosshatchPattern('white');
        }

        this.annotation = args.annotation;
        this.label = args.label; // TODO One annotation can be drawn multiple times with different labels
        this.zr = args.zr;
        this.xFactor = args.xFactor;
        this.yOffset = args.yOffset;
        this.compactness = this.getCompactness();
        this.pattern = this.hasDarkColor() ? PATTERN_DARK : PATTERN_BRIGHT;

        this.segments = [];
        this.gaps = [];
        this.keyframes = [];
    }

    draw() {
        this.segments.forEach(s => this.zr.remove(s));
        this.segments = [];
        this.gaps.forEach(g => this.zr.remove(g));
        this.gaps = [];
        this.keyframes.forEach(k => this.zr.remove(k));
        this.keyframes = [];

        // TODO watch annotation frames, pending, selected, tracking and redraw automatically
        const segments = this.getSegments();
        const hasSingleLast = segments.length > 2 &&
            segments[segments.length - 1].frames.length === 1 &&
            segments[segments.length - 2].gap;

        // TODO draw whole-frame annotations with crosshatched pattern
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

    drawSegment(segment, singleLast) {
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

            let rect = new Rect({
                rectHover: true,
                shape,
                style,
            });

            rect.firstFrame = firstFrame;
            rect.lastFrame = lastFrame;

            this.segments.push(rect);
            this.zr.add(rect);

            if (this.annotation.wholeFrame) {
                style.fill = this.pattern;
                style.opacity = 0.2;
                rect = new Rect({
                    rectHover: true,
                    shape,
                    style,
                });
                rect.firstFrame = firstFrame;
                rect.lastFrame = lastFrame;

                this.segments.push(rect);
                this.zr.add(rect);
            }
        }

        frames.forEach((f, i) => this.drawKeyframe(f, singleLast || i > 0 && i === (frames.length - 1)));
    }

    drawKeyframe(frame, last) {
        const width = this.compactness === COMPACTNESS.MEDIUM ? KEYFRAME_COMPACT_WIDTH : KEYFRAME_WIDTH;
        const shape = {
            x: frame * this.xFactor,
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

        // Prevent overflow.
        shape.x = Math.min(shape.x, this.zr.getWidth() - width);

        let style = {
            fill: '#' + (this.label.color || '000'),
            stroke: KEYFRAME_STROKE,
        };

        let rect = new Rect({
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

        if (this.annotation.wholeFrame) {
            style = {
                fill: this.pattern,
                opacity: 0.4,
            };
            rect = new Rect({
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
                x: k.frame * this.xFactor,
                width: width,
            };
            if (k.last) {
                shape.x -= width;
            }
            shape.x = Math.min(shape.x, zwWidth - width);
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

    hasDarkColor() {
        // see: https://stackoverflow.com/a/12043228/1796523
        let color = this.label.color || '000000';
        let rgb = parseInt(color, 16);
        let r = (rgb >> 16) & 0xff;
        let g = (rgb >>  8) & 0xff;
        let b = (rgb >>  0) & 0xff;
        let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        return luma < 128;
    }
}
