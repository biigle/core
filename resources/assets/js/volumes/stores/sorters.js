import SortComponent from '../components/sortComponent';

let filenameSorter = {
    id: 'filename',
    component: {
        mixins: [SortComponent],
        data() {
            return {
                imageIds: [],
                title: 'Sort images by filename',
                text: 'Filename',
                id: 'filename',
            };
        },
        methods: {
            getSequence() {
                return new Vue.Promise.resolve(this.imageIds);
            },
        },
        created() {
            this.imageIds = biigle.$require('volumes.imageIds');
        },
    },
};

let randomSorter = {
    id: 'random',
    component: {
        mixins: [SortComponent],
        data() {
            return {
                imageIds: [],
                title: 'Sort images randomly',
                text: 'Random',
                id: 'random',
            };
        },
        methods: {
            // Durstenfeld shuffle
            // see: http://stackoverflow.com/a/12646864/1796523
            shuffle(array) {
                let i, j, temp;
                for (i = array.length - 1; i > 0; i--) {
                    j = Math.floor(Math.random() * (i + 1));
                    temp = array[i];
                    array[i] = array[j];
                    array[j] = temp;
                }
                return array;
            },
            getSequence() {
                let ids = this.shuffle(this.imageIds.slice());

                return new Vue.Promise.resolve(ids);
            },
            handleClick() {
                // Emit the event even if active so a new random sequence is
                // generated.
                this.$emit('select', this);
            },
        },
        created() {
            this.imageIds = biigle.$require('volumes.imageIds');
        },
    },
};

/**
 * Store for the volume image sorters
 */
export default [
    // default sorters
    filenameSorter,
    randomSorter,
];
