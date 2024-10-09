import SortComponent from '../components/sortComponent';
import VolumeApi from '../api/volumes';
import {handleErrorResponse} from '../../core/messages/store';

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

let annotationTime = {
    id: 'annotationTime',
    types: ['image', 'video'],
    component: {
        mixins: [SortComponent],
        data() {
            return {
                volumeId: -1,
                fileIds: [],
                title: 'Sort images by last created annotation',
                text: 'Last annotated',
                id: 'annotationTime',

            };
        },
        methods: {
            getSequence() {
                return VolumeApi.getFileIdsSortedByAnnotationTimestamps({'id': this.volumeId})
                .then((res) => res.body)
                .catch(handleErrorResponse);           
            },
        },
        created() {
            this.volumeId = biigle.$require('volumes.volumeId');
            this.fileIds = biigle.$require('volumes.fileIds');
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
    annotationTime,
];
