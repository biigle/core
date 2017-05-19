/**
 * The color adjustment tab of the annotator
 *
 * @type {Object}
 */
biigle.$component('annotations.components.colorAdjustmentTab', {
    data: function () {
        return {
            isBrightnessRgbActive: false,
            colorAdjustment: {
                brightnessContrast: [0, 0],
                brightnessRGB: [0, 0, 0],
                hueSaturation: [0, 0],
                vibrance: [0],
            },
        };
    },
    methods: {
        resetType: function (type, index) {
            if (index !== undefined) {
                // Use splice so Vue is able to detect the change.
                this.colorAdjustment[type].splice(index, 1, 0);
            } else {
                this.colorAdjustment[type] = this.colorAdjustment[type].map(function () {
                    return 0;
                });
            }
        },
        reset: function () {
            for (var type in this.colorAdjustment) {
                if (this.colorAdjustment.hasOwnProperty(type)) {
                    this.resetType(type);
                }
            }
        },
        toggleBrightnessRgb: function () {
            if (this.isBrightnessRgbActive) {
                this.resetType('brightnessRGB');
            } else {
                this.resetType('brightnessContrast', 0);
            }
            this.isBrightnessRgbActive = !this.isBrightnessRgbActive;
        },
    },
    watch: {
        colorAdjustment: {
            handler: function () {
                this.$emit('change', this.colorAdjustment);
            },
            deep: true,
        },
    },
});
