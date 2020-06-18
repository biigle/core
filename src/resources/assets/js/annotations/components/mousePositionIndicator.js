/**
 * The mouse position indicator of the canvas element
 *
 * @type {Object}
 */
export default {
    template: `<div
        class="mouse-position-indicator"
        title="Mouse position in the image"
        v-text="positionText"
        ></div>`,
    props: {
        position: {
            type: Array,
            required: true,
        },
    },
    computed: {
        positionText() {
            return this.position.join(' × ');
        },
    },
};
