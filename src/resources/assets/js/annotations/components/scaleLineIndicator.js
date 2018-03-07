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
    },
    data: function () {
        return {
            targetWidth: 100,
            leadingDigits: [1, 2, 5],
        };
    },
    computed: {
        pxScale: function () {
            return this.targetWidth * this.resolution;
        },
        pxMultiplicator: function () {
            return Math.pow(10, Math.floor(Math.log10(this.pxScale)));
        },
        pxScaleNearest: function () {
            var smallestIndex = 0;
            var smallestDistance = Infinity;
            for (var i = this.leadingDigits.length - 1; i >= 0; i--) {
                var check = this.leadingDigits[i] * this.pxMultiplicator;
                if (Math.abs(this.pxScale - check) < smallestDistance) {
                    smallestIndex = i;
                    smallestDistance = Math.abs(this.pxScale - check);
                }
            }

            return this.leadingDigits[smallestIndex] * this.pxMultiplicator;
        },
        width: function () {
            return Math.round(this.pxScaleNearest / this.resolution);
        },
        styleObject: function () {
            return {
                width: this.width + 'px'
            };
        },
        text: function () {
            return this.pxScaleNearest + ' px';
        },
    },
});
