import {ImageGrid} from '../import';
import Image from './catalogImageGridImage';

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
