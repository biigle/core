import ImagesStore from './stores/image';

/**
 * View model for the image count of the volume overview
 */
export default {
    data() {
        return {
            imageIds: [],
        };
    },
    computed: {
        count() {
            return ImagesStore.count;
        },
        text() {
            if (this.count === this.imageIds.length) {
                return this.count;
            }

            return this.count + ' of ' + this.imageIds.length;
        },
    },
    created() {
        this.imageIds = biigle.$require('volumes.imageIds');
    },
};
