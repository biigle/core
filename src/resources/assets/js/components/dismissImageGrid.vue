<script>
import {ImageGrid} from '../import.js';
import Image from './dismissImageGridImage.vue';

/**
 * A variant of the image grid used for the dismiss step of Largo
 *
 * @type {Object}
 */
export default {
    mixins: [ImageGrid],
    components: {
        imageGridImage: Image,
    },
};
</script>
