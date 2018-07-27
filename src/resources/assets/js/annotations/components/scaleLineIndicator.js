/**
 * The scale line indicator of the canvas element
 *
 * @type {Object}
 */
biigle.$component('annotations.components.scaleLineIndicator', {
    mixins: [biigle.$require('annotations.mixins.measureComponent')],
    props: {
        resolution: {
            required: true,
        },
    },
    data: function () {
        return {
            targetWidth: 100,
            leadingDigits: [1, 2, 5],
        };
    },
    computed: {
        scale: function () {
            return this.targetWidth * this.scaleMultiplier;
        },
        scalePowerOfTen: function () {
            return this.powerOfTen(this.scale);
        },
        scaleMultiplier: function () {
            if (this.hasArea) {
                return this.resolution * this.pxWidthInMeter;
            }

            return this.resolution || 0;
        },
        scaleNearest: function () {
            var smallestIndex = 0;
            var smallestDistance = Infinity;
            for (var i = this.leadingDigits.length - 1; i >= 0; i--) {
                var check = this.leadingDigits[i] * this.scalePowerOfTen;
                if (Math.abs(this.scale - check) < smallestDistance) {
                    smallestIndex = i;
                    smallestDistance = Math.abs(this.scale - check);
                }
            }

            return this.leadingDigits[smallestIndex] * this.scalePowerOfTen;
        },
        unitNearest: function () {
            var smallestIndex = 0;
            var smallestDistance = Infinity;
            for (var i = this.unitMultipliers.length - 1; i >= 0; i--) {
                if (Math.abs(this.unitMultipliers[i] - this.scalePowerOfTen) < smallestDistance) {
                    smallestIndex = i;
                    smallestDistance = Math.abs(this.unitMultipliers[i] - this.scalePowerOfTen);
                }
            }

            return smallestIndex;
        },
        width: function () {
            return Math.round(this.scaleNearest / this.scaleMultiplier);
        },
        styleObject: function () {
            return {width: this.width + 'px'};
        },
        text: function () {
            if (this.hasArea) {
                return Math.round(this.scaleNearest / this.unitMultipliers[this.unitNearest]) + ' ' + this.unitNames[this.unitNearest];
            }

            return Math.round(this.scaleNearest) + ' px';
        },
    },
});
