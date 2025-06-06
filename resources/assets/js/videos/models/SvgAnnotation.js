import {watch} from 'vue';

export const KEYFRAME_HEIGHT = 20;
const KEYFRAME_STROKE = 'rgba(255, 255, 255, 0.5)';
const KEYFRAME_STROKE_WIDTH = 1;
const KEYFRAME_WIDTH = 9;
const KEYFRAME_COMPACT_WIDTH = 3;

const SELECTED_COLOR = '#ff5e00';

const BORDER_RADIUS = 3;

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

        if (this.annotation.wholeFrame) {
            if (this.hasDarkColor()) {
                this.fill = this.svg.root().findOne('.dark-pattern') || this.generatePattern('white').attr({class: 'dark-pattern'});
            } else {
                this.fill = this.svg.root().findOne('.bright-pattern') || this.generatePattern('black').attr({class: 'bright-pattern'});
            }
        } else {
            this.fill = '#' + this.color;
        }

        this.selectedFill = undefined;

        this.segments = [];
        this.gaps = [];
        this.keyframes = [];
        this.borders = [];

        this.watchers = [];

        this.onSelect = args.onSelect;
        this.onDeselect = args.onDeselect;
    }

    addTo(svg) {
        if (this.svg === svg) {
            return;
        }

        this.svg = svg;
        this.segments.forEach(s => s.addTo(this.svg));
        this.gaps.forEach(g => g.addTo(this.svg));
        if (this.compactness !== COMPACTNESS.HIGH) {
            this.keyframes.forEach(k => k.addTo(this.svg));
        }
    }

    remove() {
        this.segments.forEach(s => s.remove());
        this.segments = [];
        this.gaps.forEach(g => g.remove());
        this.gaps = [];
        this.keyframes.forEach(k => k.remove());
        this.keyframes = [];
        this.borders.forEach(k => k.remove());
        this.borders = [];
        this.watchers.forEach(unwatch => unwatch());
        this.watchers = [];
    }

    draw() {
        this.compactness = this.getCompactness();
        // TODO watch annotation selected and tracking state and redraw automatically
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

        if (this.annotation.pending) {
            const rect = this.drawBorder(2).attr({
                stroke: 'white',
                'stroke-dasharray': '6 2',
            });
            this.borders.push(rect);
        }

        this.watchers.push(watch(this.annotation.frames, () => this.redraw()));
        this.watchers.push(watch(this.annotation._selected, this.updateSelected.bind(this)));
        this.keyframes.forEach((k) => {
            k.on('click', (e) => {
                e.preventDefault();
                this.onSelect(this.annotation, k.frame, e.shiftKey);
                e.stopPropagation();
            });
        });
    }

    redraw() {
        this.remove();
        this.draw();
    }

    updateSelected(selected) {
        if (!this.selectedFill) {
            if (this.annotation.wholeFrame) {
                this.selectedFill = this.svg.root().findOne('.selected-pattern') || this.generatePattern('white', SELECTED_COLOR).attr({class: 'selected-pattern'});
            } else {
                this.selectedFill = SELECTED_COLOR;
            }
        }

        this.keyframes.forEach((k) => {
            if (k.frame === selected) {
                k.attr({
                    fill: this.selectedFill,
                    'stroke-width': 2,
                    stroke: 'white',
                });
                k.selected = true;
            } else if (k.selected) {
                k.attr({
                    fill: this.fill,
                    'stroke-width': 1,
                    stroke: KEYFRAME_STROKE,
                });
                delete k.selected;
            }
        })
    }

    drawBorder(strokeWidth) {
        strokeWidth = strokeWidth || 1;
        const firstFrame = this.annotation.frames[0];
        const lastFrame = this.annotation.frames[this.annotation.frames.length - 1];
        const minWidth = this.compactness !== COMPACTNESS.LOW ? KEYFRAME_COMPACT_WIDTH : KEYFRAME_WIDTH;
        let width = Math.max((lastFrame - firstFrame) * this.xFactor, minWidth) - strokeWidth;
        const rect = this.svg.rect(width, KEYFRAME_HEIGHT - strokeWidth).attr({
            x: firstFrame * this.xFactor + strokeWidth / 2,
            y: strokeWidth / 2,
            rx: BORDER_RADIUS,
            ry: BORDER_RADIUS,
            fill: 'transparent',
            'stroke-width': strokeWidth,
        });
        rect.firstFrame = firstFrame;
        rect.lastFrame = lastFrame;

        return rect;
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

            let width = Math.max((lastFrame - firstFrame) * this.xFactor, KEYFRAME_COMPACT_WIDTH);

            const rect = this.svg.rect(width, KEYFRAME_HEIGHT).attr({
                x: firstFrame * this.xFactor,
                y: 0,
                rx: BORDER_RADIUS,
                ry: BORDER_RADIUS,
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
        // TODO fix border display with clip element and double border width.
        // See: https://stackoverflow.com/a/32162431/1796523
        let width = this.compactness === COMPACTNESS.MEDIUM ? KEYFRAME_COMPACT_WIDTH : KEYFRAME_WIDTH;
        width -= KEYFRAME_STROKE_WIDTH;
        let x = frame * this.xFactor + (KEYFRAME_STROKE_WIDTH / 2);

        if (last) {
            x -= width;
        }

        // Prevent overflow.
        x = Math.min(x, this.svg.root().width() - width - (KEYFRAME_STROKE_WIDTH / 2));

        const rect = this.svg.rect(width, KEYFRAME_HEIGHT - KEYFRAME_STROKE_WIDTH).attr({
            x: x,
            y: KEYFRAME_STROKE_WIDTH / 2,
            rx: BORDER_RADIUS,
            ry: BORDER_RADIUS,
            fill: this.fill,
            stroke: KEYFRAME_STROKE,
            class: 'svg-annotation-keyframe',
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
        this.updateCompactness();
        this.updateKeyframes();
        this.updateSegments();
        this.updateGpas();
        this.updateBorders();

    }

    updateCompactness() {
        const newCompactness = this.getCompactness();

        if (newCompactness !== this.compactness) {
            this.compactness = newCompactness;

            if (newCompactness === COMPACTNESS.HIGH) {
                this.keyframes.forEach(f => f.remove());
            } else {
                this.keyframes.forEach(f => this.svg.add(f));
            }
        }
    }

    updateKeyframes() {
        const svgWidth = this.svg.root().width();
        let width = this.compactness === COMPACTNESS.MEDIUM ? KEYFRAME_COMPACT_WIDTH : KEYFRAME_WIDTH;
        width -= KEYFRAME_STROKE_WIDTH;
        this.keyframes.forEach((k) => {
            const shape = {
                x: k.frame * this.xFactor + (KEYFRAME_STROKE_WIDTH / 2),
                width: width,
            };
            if (k.last) {
                shape.x -= width;
            }
            // Prevent overflow.
            shape.x = Math.min(shape.x, svgWidth - width - (KEYFRAME_STROKE_WIDTH / 2));
            k.attr(shape);
        });
    }

    updateSegments() {
        this.segments.forEach((s) => s.attr({
            x: s.firstFrame * this.xFactor,
            width: Math.max((s.lastFrame - s.firstFrame) * this.xFactor, KEYFRAME_COMPACT_WIDTH),
        }));
    }

    updateGpas() {
        this.gaps.forEach((g) => g.attr({
            x1: g.firstFrame * this.xFactor,
            x2: g.lastFrame * this.xFactor,
        }));
    }

    updateBorders() {
        const borderMinWidth = this.compactness !== COMPACTNESS.LOW ? KEYFRAME_COMPACT_WIDTH : KEYFRAME_WIDTH;
        this.borders.forEach((b) => {
            const strokeWidth = b.attr('stroke-width');
            b.attr({
                x: b.firstFrame * this.xFactor + strokeWidth / 2,
                width: Math.max((b.lastFrame - b.firstFrame) * this.xFactor, borderMinWidth) - strokeWidth,
            });
            // Keyframes might be put in front of the border when added for new compactness
            // so move the border to front here.
            b.front();
        });
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

    generatePattern(strokeColor, backgroundColor) {
        backgroundColor = backgroundColor || '#' + this.color;
        return this.svg.root().pattern(6, 6, (add) => {
            add.rect(6, 6).fill(backgroundColor);
            add.line(-3, 0, 6, 9).attr({stroke: strokeColor, 'stroke-width': 2, opacity: 0.5});
            add.line(-3, -6, 9, 6).attr({stroke: strokeColor, 'stroke-width': 2, opacity: 0.5});
        });
    }
}
