<script>
/**
 * The color adjustment tab of the annotator
 *
 * @type {Object}
 */
export default {
    emits: ['change'],
    data() {
        return {
            isBrightnessRgbActive: false,
            colorAdjustmentDefaults: {
                brightnessContrast: [0, 0],
                brightnessRGB: [0, 0, 0],
                hueSaturation: [0, 0],
                vibrance: [0],
                gamma: [1],
            },
            colorAdjustment: {
                brightnessContrast: [0, 0],
                brightnessRGB: [0, 0, 0],
                hueSaturation: [0, 0],
                vibrance: [0],
                gamma: [1],
            },
        };
    },
    methods: {
        resetType(type, index) {
            if (index !== undefined) {
                // Use splice so Vue is able to detect the change.
                this.colorAdjustment[type].splice(index, 1, this.colorAdjustmentDefaults[type][index]);
            } else {
                this.colorAdjustment[type] = this.colorAdjustmentDefaults[type].slice();
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
