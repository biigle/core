<script>
import {ImageGrid} from '../import';
import Image from './relabelImageGridImage';

/**
 * A variant of the image grid used for the relabel step of Largo
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
