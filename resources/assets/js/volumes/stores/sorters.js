import SortComponent from '../components/sortComponent';
import VolumesApi from '../api/volumes';

let filenameSorter = {
    id: 'filename',
    types: ['image', 'video'],
    component: {
        mixins: [SortComponent],
        data() {
            return {
                fileIds: [],
                title: 'Sort images by filename',
                text: 'Filename',
                id: 'filename',
            };
        },
        methods: {
            getSequence() {
                return new Vue.Promise.resolve(this.fileIds);
            },
        },
        created() {
            this.fileIds = biigle.$require('volumes.fileIds');
        },
    },
};

let idSorter = {
    id: 'id',
    types: ['image', 'video'],
    component: {
        mixins: [SortComponent],
        data() {
            return {
                fileIds: [],
                title: 'Sort images by ID',
                text: 'ID',
                id: 'id',
            };
        },
        computed: {
            ids() {
                return this.fileIds.slice().sort(this.compare);
            },
        },
        methods: {
            getSequence() {
                return new Vue.Promise.resolve(this.ids);
            },
            compare(a, b) {
                return a - b;
            },
        },
        created() {
            this.fileIds = biigle.$require('volumes.fileIds');
        },
    },
};

let randomSorter = {
    id: 'random',
    types: ['image', 'video'],
    component: {
        mixins: [SortComponent],
        data() {
            return {
                fileIds: [],
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
                let ids = this.shuffle(this.fileIds.slice());
                return new Vue.Promise.resolve(ids);
            },
            handleClick() {
                // Emit the event even if active so a new random sequence is
                // generated.
                this.$emit('select', this);
            },
        },
        created() {
            this.fileIds = biigle.$require('volumes.fileIds');
        },
    },
};

let similaritySorter = {
    id: 'similarity',
    types: ['image'],
    component: {
        mixins: [SortComponent],
        data() {
            return {
                fileIds: [],
                title: 'Sort images by Similarity',
                text: 'Similarity',
                id: 'similarity',
            };
        },
        methods: {
            getSequence() {
                if (this.fileIds.length === 0) {
                    return this.getSimilarityIndices().then((sequence) => {
                        this.fileIds = this.sortSequence(sequence);
                        return this.fileIds;
                    });
                } else {
                    return  Vue.Promise.resolve(this.fileIds);
                }

            },
            getSimilarityIndices() {
                this.loadingSequence = true;
                return VolumesApi.querySimilarityIndices({id: this.volumeId})
                    .then(this.parseResponse)
                    .then((sequence) => {
                        return sequence;
                    })
                    .finally(() => this.loadingSequence = false);
            },
            parseResponse(response) {
                return response.data;
            },
            sortSequence(simIndices) {
                let sortable = [];
                for (let index in simIndices) {
                    sortable.push([index, simIndices[index]]);
                }

                sortable.sort(function(a, b) {
                    return a[1] - b[1];
                });
                return sortable.map(function (id) {
                    return id[0];
                })
            },

        },
        created() {
            this.volumeId = biigle.$require('volumes.volumeId');
        },
    },

};

/**
 * Store for the volume image sorters
 */
export default [
    // default sorters
    filenameSorter,
    idSorter,
    randomSorter,
    similaritySorter,
];
