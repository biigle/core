<script>
import MeasureComponent from '../mixins/measureComponent.vue';

/**
 * The scale line indicator of the canvas element
 *
 * @type {Object}
 */
export default {
    mixins: [MeasureComponent],
    props: {
        resolution: {
            required: true,
        },
    },
    data() {
        return {
            targetWidth: 100,
            leadingDigits: [1, 2, 5],
        };
    },
    computed: {
        scale() {
            return this.targetWidth * this.scaleMultiplier;
        },
        scalePowerOfTen() {
            return this.powerOfTen(this.scale);
        },
        scaleMultiplier() {
            if (this.hasArea) {
                return this.resolution * this.pxWidthInMeter;
            }

            return this.resolution || 0;
        },
        scaleNearest() {
            let smallestIndex = 0;
            let smallestDistance = Infinity;
            for (let i = this.leadingDigits.length - 1; i >= 0; i--) {
                let check = this.leadingDigits[i] * this.scalePowerOfTen;
                if (Math.abs(this.scale - check) < smallestDistance) {
                    smallestIndex = i;
                    smallestDistance = Math.abs(this.scale - check);
                }
            }

            return this.leadingDigits[smallestIndex] * this.scalePowerOfTen;
        },
        unitNearest() {
            let smallestIndex = 0;
            let smallestDistance = Infinity;
            for (let i = this.unitMultipliers.length - 1; i >= 0; i--) {
                if (Math.abs(this.unitMultipliers[i] - this.scalePowerOfTen) < smallestDistance) {
                    smallestIndex = i;
                    smallestDistance = Math.abs(this.unitMultipliers[i] - this.scalePowerOfTen);
                }
            }

            return smallestIndex;
        },
        width() {
            return Math.round(this.scaleNearest / this.scaleMultiplier);
        },
        styleObject() {
            return {width: this.width + 'px'};
        },
        text() {
            if (this.hasArea) {
                return Math.round(this.scaleNearest / this.unitMultipliers[this.unitNearest]) + ' ' + this.unitNames[this.unitNearest];
            }

            return Math.round(this.scaleNearest) + ' px';
        },
    },
};
</script>
