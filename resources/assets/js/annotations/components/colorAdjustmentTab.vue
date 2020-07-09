<script>
/**
 * The color adjustment tab of the annotator
 *
 * @type {Object}
 */
export default {
    data() {
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
        resetType(type, index) {
            if (index !== undefined) {
                // Use splice so Vue is able to detect the change.
                this.colorAdjustment[type].splice(index, 1, 0);
            } else {
                this.colorAdjustment[type] = this.colorAdjustment[type].map(function () {
                    return 0;
                });
            }
        },
        reset() {
            for (let type in this.colorAdjustment) {
                if (this.colorAdjustment.hasOwnProperty(type)) {
                    this.resetType(type);
                }
            }
        },
        toggleBrightnessRgb() {
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
            handler() {
                this.$emit('change', this.colorAdjustment);
            },
            deep: true,
        },
    },
};
</script>
