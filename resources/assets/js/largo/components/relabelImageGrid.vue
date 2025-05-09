<script>
import ImageGrid from '@/volumes/components/imageGrid.vue';
import Image from './relabelImageGridImage.vue';

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
