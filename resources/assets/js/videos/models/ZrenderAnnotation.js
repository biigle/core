import {Rect} from 'zrender';

export const HEIGHT = 20;

const STROKE = 'rgba(255, 255, 255, 0.75)';

export default class ZrenderAnnotation {
    constructor(args) {
        this.annotation = args.annotation;
        this.label = args.label; // TODO One annotation can be drawn multiple times with different labels
        this.zr = args.zr;
        this.xFactor = args.xFactor;
        this.yOffset = args.yOffset;
        this.rect = null;
    }

    draw() {
        // TODO watch annotation frames, pending, selected, tracking and redraw automatically

        const shape = {
            x: this.annotation.frames[0] * this.xFactor,
            // Add 1 for the top border.
            y: 1 + this.yOffset,
            r: 3,
            width: 9,
            // Subtract 2 for the top/bottom border.
            height: HEIGHT - 2,
        };
        const style = {
            fill: '#' + (this.label.color || '000'),
            stroke: STROKE,
        };

        this.rect = new Rect({
            rectHover: true,
            shape,
            style,
        });

        this.zr.add(this.rect);
    }

    updateXFactor(xFactor) {
        this.xFactor = xFactor;
        this.rect.attr({
            shape: {
                x: this.annotation.frames[0] * this.xFactor,
            },
        });
    }
}
