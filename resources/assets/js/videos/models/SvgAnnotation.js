import {watch} from 'vue';

export const KEYFRAME_HEIGHT = 20;
const KEYFRAME_WIDTH = 9;
const KEYFRAME_COMPACT_WIDTH = 3;

const BORDER_RADIUS = 3;

const SELECTED_COLOR = '#ff5e00';

const COMPACTNESS = {
    LOW: Symbol(),
    MEDIUM: Symbol(),
    HIGH: Symbol(),
};

/**
 * Why does this class exist? We could do this more elegantly with Vue components!
 * Explanation: Video annotations in the timeline were implemented as nested Vue components
 * before. This was very slow, though. This lower-level implementation with SVGs is much
 * faster. It may also allow future performance optimizations such as only rendering the
 * content of the visible viewport in the timeline (when it is zoomed in).
 */
export default class SvgAnnotation {
    constructor(args) {
        this.annotation = args.annotation;
        this.color = args.label.color || '000000';
        this.svg = args.svg;
        this.xFactor = args.xFactor;
        this.onSelect = args.onSelect;
        this.onDeselect = args.onDeselect;

        this.fill = this._getFill();
        this.keyframeRects = this._getKeyframeRects();
        this.selectedFill = undefined;

        this.segments = [];
        this.gaps = [];
        this.keyframes = [];
        this.borders = [];
        this.annotationBorder = undefined;

        this.watchers = [];
    }

    addTo(svg) {
        if (this.svg === svg) {
            return;
        }

        this.svg = svg;
        this.segments.forEach(s => s.addTo(this.svg));
        this.gaps.forEach(g => g.addTo(this.svg));
        this.borders.forEach(g => g.addTo(this.svg));
        if (this.compactness !== COMPACTNESS.HIGH) {
            this.keyframes.forEach(k => k.addTo(this.svg));
        }
    }

    draw() {
        this.compactness = this._getCompactness();
        const segments = this._getSegments();
        const hasSingleAfterGap = segments.length > 2 &&
            segments[segments.length - 1].frames.length === 1 &&
            segments[segments.length - 2].gap;

        segments.forEach((s, i) => {
            if (s.gap) {
                this._drawGap(s);
            } else {
                const singleAfterGap = hasSingleAfterGap && i === (segments.length - 1)
                this._drawSegment(s, singleAfterGap);
            }
        });

        if (this.segments.length > 0) {
            this.annotationBorder = this._drawBorder().addClass('svg-border--multi-frame');
            this.borders.push(this.annotationBorder);
            this.segments[this.segments.length - 1].after(this.annotationBorder);
        }

        if (this.annotation.pending) {
            this.borders.push(this._drawBorder(2).addClass('svg-border--pending'));
        }

        this.segments.forEach((s) => s.on('click', (e) => {
            e.preventDefault();
            if (this.annotation.isSelected && e.shiftKey) {
                this.onDeselect(this.annotation);
            } else {
                this.onSelect(this.annotation, e.layerX / this.xFactor, e.shiftKey);
            }
            e.stopPropagation();
        }));

        this.keyframes.forEach((k) => k.on('click', (e) => {
            e.preventDefault();
            this.onSelect(this.annotation, k.frame, e.shiftKey);
            e.stopPropagation();
        }));

        this.watchers.push(watch(this.annotation._frames, this._redraw.bind(this), {deep: true}));
        this.watchers.push(watch(this.annotation._selected, this._updateSelected.bind(this)));
        this.watchers.push(watch(this.annotation._tracking, this._updateTracking.bind(this)));

        // Update selected border if the annotation is linked, split or keyframes change.
        if (this.annotation.isSelected) {
            this._updateSelected(this.annotation.selected);
        }
    }

    updateXFactor(xFactor) {
        this.xFactor = xFactor;
        this._updateCompactness();
        this._updateGaps();
        this._updateSegments();
        this._updateKeyframes();
        this._updateBorders();
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
        this.annotationBorder = undefined;
    }

    _getFill() {
        if (this.annotation.wholeFrame) {
            let fill;

            if (this._hasDarkColor()) {
                if (!(fill = this.svg.root().remember('dark-pattern'))) {
                    fill = this._generatePattern('white');
                    this.svg.root().remember('dark-pattern', fill);
                }
            } else {
                if (!(fill = this.svg.root().remember('bright-pattern'))) {
                    fill = this._generatePattern('black');
                    this.svg.root().remember('bright-pattern', fill);
                }
            }

            return fill;
        }

        return '#' + this.color;
    }

    _getKeyframeRects() {
        let rects = this.svg.root().remember('keyframe-rects');

        if (!rects) {
            rects = {};
            // Draw a rectangle with "inset" border. This is done with the double stroke
            // width and a clip rectangle.
            rects.default = this.svg.root().defs()
                .rect(KEYFRAME_WIDTH, KEYFRAME_HEIGHT)
                .attr({rx: BORDER_RADIUS, ry: BORDER_RADIUS})
                .clipWith(
                    this.svg.root().defs()
                        .rect(KEYFRAME_WIDTH, KEYFRAME_HEIGHT)
                        .attr({rx: BORDER_RADIUS, ry: BORDER_RADIUS})
                );

            rects.compact = this.svg.root().defs()
                .rect(KEYFRAME_COMPACT_WIDTH, KEYFRAME_HEIGHT)
                .attr({rx: BORDER_RADIUS, ry: BORDER_RADIUS})
                .clipWith(
                    this.svg.root().defs()
                        .rect(KEYFRAME_COMPACT_WIDTH, KEYFRAME_HEIGHT)
                        .attr({rx: BORDER_RADIUS, ry: BORDER_RADIUS})
                );

            this.svg.root().remember('keyframe-rects', rects);
        }

        return rects;
    }

    _getSelectedFill() {
        if (this.annotation.wholeFrame) {
            let color = this.svg.root().remember('selected-pattern');
            if (!color) {
                color = this._generatePattern('white', SELECTED_COLOR);
                this.svg.root().remember('selected-pattern', color);
            }

            return color;
        }

        return SELECTED_COLOR;
    }

    _redraw() {
        this.remove();
        this.draw();
    }

    _updateTracking(tracking) {
        if (tracking) {
            this.keyframes[0]
                .addClass('svg-keyframe--tracking')
                .add(this.svg.element('title').words('Tracking in progress'));
        } else {
            this.keyframes[0]
                .removeClass('svg-keyframe--tracking')
                .clear();
        }
    }

    _updateSelected(selected) {
        if (!this.selectedFill) {
            this.selectedFill = this._getSelectedFill();
        }

        if (this.annotationBorder) {
            if (selected === false) {
                this.annotationBorder.removeClass('svg-border--selected');
                if (this.segments.length > 0) {
                    this.segments[this.segments.length - 1].after(this.annotationBorder);
                }
            } else {
                this.annotationBorder.addClass('svg-border--selected');
                this.annotationBorder.front();
            }
        }

        this.keyframes.forEach((k) => {
            if (k.frame === selected) {
                k.attr({fill: this.selectedFill}).addClass('svg-keyframe--selected');
            } else if (k.hasClass('svg-keyframe--selected')) {
                k.attr({fill: this.fill}).removeClass('svg-keyframe--selected');
            }
        })
    }

    _drawBorder(strokeWidth) {
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
            class: 'svg-border',
            // This must not be set with CSS as it is used for redrawing later.
            'stroke-width': strokeWidth,
        });
        rect.firstFrame = firstFrame;
        rect.lastFrame = lastFrame;

        return rect;
    }

    _drawGap(segment) {
        const firstFrame = segment.frames[0];
        const lastFrame = segment.frames[segment.frames.length - 1];

        // This is an invisible "segment" of the pattern to allow click events in this
        // area, too.
        const rect = this.svg.rect((lastFrame - firstFrame) * this.xFactor, KEYFRAME_HEIGHT).attr({
            x: firstFrame * this.xFactor,
            y: 0,
            fill: 'transparent',
            class: 'svg-annotation-selectable',
        });

        rect.firstFrame = firstFrame;
        rect.lastFrame = lastFrame;
        rect.back();
        this.segments.push(rect);

        const line = this.svg
            .line(firstFrame * this.xFactor, KEYFRAME_HEIGHT / 2, lastFrame * this.xFactor, KEYFRAME_HEIGHT / 2)
            .attr({
                stroke: '#' + this.color,
                class: 'svg-gap',
            });

        line.firstFrame = firstFrame;
        line.lastFrame = lastFrame;

        this.gaps.push(line);
    }

    _drawSegment(segment, singleAfterGap) {
        const frames = segment.frames;
        if (frames.length > 1) {
            const firstFrame = frames[0];
            const lastFrame = frames[frames.length - 1];

            let width = Math.max((lastFrame - firstFrame) * this.xFactor, KEYFRAME_COMPACT_WIDTH);

            const rect = this.svg.rect(width, KEYFRAME_HEIGHT).attr({
                x: firstFrame * this.xFactor,
                y: 0,
                fill: this.fill,
                rx: BORDER_RADIUS,
                ry: BORDER_RADIUS,
                class: 'svg-annotation-selectable svg-segment',
            });

            rect.firstFrame = firstFrame;
            rect.lastFrame = lastFrame;

            this.segments.push(rect);
        }

        frames.forEach((f, i) => this._drawKeyframe(f, i > 0 && i === (frames.length - 1), singleAfterGap));
    }

    _drawKeyframe(frame, last, singleAfterGap) {
        let width = this.compactness === COMPACTNESS.LOW ? KEYFRAME_WIDTH : KEYFRAME_COMPACT_WIDTH;
        let rect = this.compactness === COMPACTNESS.LOW ? this.keyframeRects.default : this.keyframeRects.compact;
        let x = frame * this.xFactor;

        if (last || singleAfterGap) {
            x -= width;
        }

        // Prevent overflow.
        x = Math.min(x, this.svg.root().width() - width);

        const keyframe = this.svg.use(rect)
            .move(x, 0)
            .fill(this.fill)
            .addClass('svg-annotation-selectable svg-keyframe');

        if (!singleAfterGap && this.compactness === COMPACTNESS.HIGH) {
            keyframe.remove();
        }

        keyframe.frame = frame;
        keyframe.last = last;
        keyframe.singleAfterGap = singleAfterGap;

        this.keyframes.push(keyframe);
    }

    _updateCompactness() {
        const newCompactness = this._getCompactness();

        if (newCompactness !== this.compactness) {
            this.compactness = newCompactness;

            if (newCompactness === COMPACTNESS.HIGH) {
                this.keyframes.filter(k => !k.singleAfterGap).forEach(k => k.remove());
            } else {
                this.keyframes.filter(k => !k.singleAfterGap).forEach(k => this.svg.add(k));
            }
        }
    }

    _updateKeyframes() {
        if (this.compactness === COMPACTNESS.HIGH) {
            // No need to update invisible keyframes.
            return;
        }

        const svgWidth = this.svg.root().width();
        let width = this.compactness === COMPACTNESS.LOW ? KEYFRAME_WIDTH : KEYFRAME_COMPACT_WIDTH;
        let rect = this.compactness === COMPACTNESS.LOW ? this.keyframeRects.default : this.keyframeRects.compact;
        // Call id() instead of attr('id') because the first will generate a new ID if the
        // rect was never used before.
        const rectId = '#' + rect.id();
        let switchRect = this.keyframes[0].attr('href') !== rectId;

        this.keyframes.forEach((k) => {
            const attrs = {
                x: k.frame * this.xFactor,
            };
            if (k.last || k.singleAfterGap) {
                attrs.x -= width;
            }
            // Prevent overflow.
            attrs.x = Math.min(attrs.x, svgWidth - width);

            if (switchRect) {
                attrs.href = rectId;
            }

            k.attr(attrs);
        });
    }

    _updateSegments() {
        this.segments.forEach((s) => s.attr({
            x: s.firstFrame * this.xFactor,
            width: Math.max((s.lastFrame - s.firstFrame) * this.xFactor, KEYFRAME_COMPACT_WIDTH),
        }));
    }

    _updateGaps() {
        this.gaps.forEach((g) => g.attr({
            x1: g.firstFrame * this.xFactor,
            x2: g.lastFrame * this.xFactor,
        }));
    }

    _updateBorders() {
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

    _getSegments() {
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

    _getCompactness() {
        // Get frames not through getter to avoid Vue proxy.
        const frames = this.annotation._frames.value;

        if (frames.length <= 1) {
            return COMPACTNESS.LOW;
        }

        let minDistance = Infinity;
        // Avoid recomputing if only xFactor changes.
        if (this._compactnessCache?.frameCount !== frames.length) {
            for (let i = frames.length - 1; i > 0; i--) {
                if (frames[i] === null || frames[i - 1] === null) {
                    continue;
                }

                minDistance = Math.min(minDistance, frames[i] - frames[i - 1]);
            }

            this._compactnessCache = {
                frameCount: frames.length,
                minDistance: minDistance,
            };
        } else {
            minDistance = this._compactnessCache.minDistance;
        }

        minDistance *= this.xFactor;

        if (minDistance <= (KEYFRAME_COMPACT_WIDTH * 2)) {
            return COMPACTNESS.HIGH;
        } else if (minDistance <= (KEYFRAME_WIDTH * 2)) {
            return COMPACTNESS.MEDIUM;
        }

        return COMPACTNESS.LOW;
    }

    _hasDarkColor() {
        // see: https://stackoverflow.com/a/12043228/1796523
        let rgb = parseInt(this.color, 16);
        let r = (rgb >> 16) & 0xff;
        let g = (rgb >>  8) & 0xff;
        let b = (rgb >>  0) & 0xff;
        let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        return luma < 128;
    }

    _generatePattern(strokeColor, backgroundColor) {
        backgroundColor = backgroundColor || '#' + this.color;
        return this.svg.root().pattern(6, 6, (add) => {
            add.rect(6, 6).fill(backgroundColor);
            add.line(-3, 0, 6, 9).attr({stroke: strokeColor, 'stroke-width': 2, opacity: 0.5});
            add.line(-3, -6, 9, 6).attr({stroke: strokeColor, 'stroke-width': 2, opacity: 0.5});
        });
    }
}
