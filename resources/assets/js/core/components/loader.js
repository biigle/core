/**
 * A component for a loading spinner
 *
 * @type {Object}
 */
export default {
    template: '<span class="loader" :class="classObject"></span>',
    props: {
        active: {
            type: Boolean,
            required: true,
        },
        fancy: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        classObject() {
            return {
                'loader--active': this.active,
                'loader--fancy': this.fancy,
            };
        },
    },
};
