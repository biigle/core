/**
 * The annotation modes tab of the annotator
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationModesTab', {
    data: function () {
        return {
            mode: 'default',
        };
    },
    computed: {
        keyboard: function () {
            return biigle.$require('keyboard');
        },
        isVolareActive: function () {
            return this.mode === 'volare';
        },
        isLawnmowerActive: function () {
            return this.mode === 'lawnmower';
        },
    },
    methods: {
        startVolare: function () {
            this.mode = 'volare';
        },
        startLawnmower: function () {
            this.mode = 'lawnmower';
        },
        resetMode: function () {
            this.mode = 'default';
        },
        emitAttachLabel: function () {
            this.$emit('attach-label');
        },
    },
    watch: {
        mode: function (mode) {
            this.$emit('change', mode);

            if (mode === 'default') {
                this.keyboard.off(27, this.resetMode);
            } else {
                // ESC key.
                this.keyboard.on(27, this.resetMode);
            }

            if (mode === 'volare') {
                // Enter key.
                this.keyboard.on(13, this.emitAttachLabel);
            } else {
                this.keyboard.off(13, this.emitAttachLabel);
            }
        },
    },
});
