/**
 * The scale line indicator of the canvas element
 *
 * @type {Object}
 */
biigle.$component('annotations.components.scaleLineIndicator', {
    props: {
        image: {
            required: true,
        },
        resolution: {
            required: true,
        },
        areas: {
            required: true,
        },
    },
    data: function () {
        return {
            targetWidth: 100,
            leadingDigits: [1, 2, 5],
            unitMultipliers: [1e+3, 1, 1e-2, 1e-3, 1e-6, 1e-9],
            unitNames: ['km', 'm', 'cm', 'mm', 'µm', 'nm'],
        };
    },
    computed: {
        area: function () {
            if (this.areas && this.image && this.areas.hasOwnProperty(this.image.id)) {
                return this.areas[this.image.id];
            }

            return -1;
        },
        hasArea: function () {
            return this.area !== -1;
        },
        pxWidthInMeter: function () {
            return Math.sqrt(this.area / (this.image.width * this.image.height));
        },
        scaleMultiplier: function () {
            if (this.hasArea) {
                return this.resolution * this.pxWidthInMeter;
            }

            return this.resolution;
        },
        scale: function () {
            return this.targetWidth * this.scaleMultiplier;
        },
        powerOfTen: function () {
            return Math.pow(10, Math.floor(Math.log10(this.scale)));
        },
        scaleNearest: function () {
            var smallestIndex = 0;
            var smallestDistance = Infinity;
            for (var i = this.leadingDigits.length - 1; i >= 0; i--) {
                var check = this.leadingDigits[i] * this.powerOfTen;
                if (Math.abs(this.scale - check) < smallestDistance) {
                    smallestIndex = i;
                    smallestDistance = Math.abs(this.scale - check);
                }
            }

            return this.leadingDigits[smallestIndex] * this.powerOfTen;
        },
        unitNearest: function () {
            var smallestIndex = 0;
            var smallestDistance = Infinity;
            for (var i = this.unitMultipliers.length - 1; i >= 0; i--) {
                if (Math.abs(this.unitMultipliers[i] - this.powerOfTen) < smallestDistance) {
                    smallestIndex = i;
                    smallestDistance = Math.abs(this.unitMultipliers[i] - this.powerOfTen);
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
                return (this.scaleNearest / this.unitMultipliers[this.unitNearest]) + ' ' + this.unitNames[this.unitNearest];
            }

            return this.scaleNearest + ' px';
        },
    },
});
