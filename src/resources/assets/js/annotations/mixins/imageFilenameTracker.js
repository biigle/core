import {Events} from '../import';

/**
 * A mixin that keeps track of the current image filename
 *
 * @type {Object}
 */
export default {
    data() {
        return {
            filenameMap: {},
            currentImageId: null,
            defaultFilename: '',
        };
    },
    computed: {
        currentImageFilename() {
            return this.filenameMap[this.currentImageId] || this.defaultFilename;
        },
    },
    methods: {
        updateImageId(id) {
            this.currentImageId = id;
        },
    },
    created() {
        let imagesIds = biigle.$require('annotations.imagesIds');
        let imagesFilenames = biigle.$require('annotations.imagesFilenames');
        let map = this.filenameMap;

        imagesIds.forEach(function (id, index) {
            map[id] = imagesFilenames[index];
        });
        Events.$on('images.change', this.updateImageId);
    },
};
