<script>
import {ImageGrid} from '../import.js';
import Image from './catalogImageGridImage.vue';

/**
 * A variant of the image grid used for the annotation catalog
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
