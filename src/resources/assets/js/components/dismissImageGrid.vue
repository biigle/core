<script>
import {ImageGrid} from '../import';
import Image from './dismissImageGridImage';

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
    props: {
        singleImageSort: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        displayedImages() {
            // Prevent showing single image twice when sorting
            return this.singleImageSort ? [] : this.images.slice(this.imagesOffset, this.imagesOffsetEnd);
        },
    }
};
</script>
