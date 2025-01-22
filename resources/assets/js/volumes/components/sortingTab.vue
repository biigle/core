<script>
import LoaderMixin from '@/core/mixins/loader.vue';
import SorterStore from '../stores/sorters.js';
import {handleErrorResponse} from '@/core/messages/store.js';

/**
 * View model for the volume sorting tab
 */
export default {
    compatConfig: {
        WATCH_ARRAY: false,
    },
    template: '#sorting-tab-template',
    emits: ['update'],
    mixins: [LoaderMixin],
    props: {
        volumeId: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        fileIds: {
            type: Array,
            required: true,
        },
    },
    data() {
        return {
            // true for ascending, false for descending
            direction: true,
            activeSorter: null,
            privateSequence: [],
        };
    },
    computed: {
        sorters() {
            return SorterStore.filter((sorter) => {
                return sorter.types && sorter.types.includes(this.type);
            });
        },
        defaultSorter() {
            return this.sorters[0];
        },
        isActive() {
            return this.activeSorter !== this.defaultSorter.id || !this.direction;
        },
        isSortedAscending() {
            return this.direction;
        },
        isSortedDescending() {
            return !this.direction;
        },
        // Use "sorting2" to avoid conflicts with the previous version of the volume
        // sorter written in AngularJS.
        sorterStorageKey() {
            return `biigle.volumes.${this.volumeId}.sorting2.sorter`;
        },
        directionStorageKey() {
            return `biigle.volumes.${this.volumeId}.sorting2.direction`;
        },
        sequence() {
            if (this.direction) {
                return this.privateSequence;
            }

            return this.privateSequence.slice().reverse();
        },
    },
    methods: {
        reset() {
            this.direction = true;
            this.activeSorter = this.defaultSorter.id;
            this.privateSequence = biigle.$require('volumes.fileIds');
        },
        sortAscending() {
            this.direction = true;
        },
        sortDescending() {
            this.direction = false;
        },
        handleSelect(sorter) {
            if (this.loading) return;

            this.startLoading();
            sorter.getSequence()
                .then((sequence) => {
                    this.activeSorter = sorter.id;
                    this.privateSequence = sequence;
                })
                .catch(handleErrorResponse)
                .finally(this.finishLoading);
        },
        isValidSequence(sequence) {
            // A stored sorting sequence is invalid if it does not contain the IDs of all
            // images of the volume. It may contain more IDs if images have been
            // deleted in the meantime.
            let map = {};
            let ids = this.fileIds;

            for (let i = sequence.length - 1; i >= 0; i--) {
                map[sequence[i]] = true;
            }

            for (let i = ids.length - 1; i >= 0; i--) {
                if (!map.hasOwnProperty(ids[i])) {
                    return false;
                }
            }

            return true;
        },
    },
    watch: {
        privateSequence: {
            deep: true,
            handler() {
                if (this.activeSorter === this.defaultSorter.id) {
                    localStorage.removeItem(this.sorterStorageKey);
                } else {
                    localStorage.setItem(this.sorterStorageKey, JSON.stringify({
                        id: this.activeSorter,
                        sequence: this.privateSequence,
                    }));
                }

                this.$emit('update', this.sequence, this.isActive);
            },
        },
        direction() {
            if (this.direction) {
                localStorage.removeItem(this.directionStorageKey);
            } else {
                localStorage.setItem(this.directionStorageKey, this.direction);
            }

            this.$emit('update', this.sequence, this.isActive);
        },
    },
    created() {
        this.privateSequence = biigle.$require('volumes.fileIds');

        let sorter = JSON.parse(localStorage.getItem(this.sorterStorageKey));
        if (sorter && this.isValidSequence(sorter.sequence)) {
            this.activeSorter = sorter.id;
            this.privateSequence = sorter.sequence;
        } else {
            this.activeSorter = this.defaultSorter.id;
            // Delete any invalid stored sorting sequence.
            localStorage.removeItem(this.sorterStorageKey);
        }

        let direction = JSON.parse(localStorage.getItem(this.directionStorageKey));
        if (direction !== null) {
            this.direction = direction;
        }
    },
};
</script>
