import ScaleLineIndicator from '../scaleLineIndicator';

/**
 * Mixin for the annotationCanvas component that contains logic for the scale line indicator.
 *
 * @type {Object}
 */
export default {
    components: {
        scaleLineIndicator: ScaleLineIndicator,
    },
    props: {
        showScaleLine: {
            type: Boolean,
            default: false,
        },
        imagesArea: {
            type: Object,
            default: null,
        },
    },
};
