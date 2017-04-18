/**
 * View model for the volume sorting tab
 */
biigle.$component('volumes.components.sortingTab', {
    mixins: [biigle.$require('core.mixins.loader')],
    props: {
        volumeId: {
            type: Number,
            required: true,
        },
        imageIds: {
            type: Array,
            required: true,
        }
    },
    data: function () {
        return {
            sorters: biigle.$require('volumes.stores.sorters'),
            // true for ascending, false for descending
            direction: true,
            activeSorter: null,
            privateSequence: biigle.$require('volumes.imageIds'),
        };
    },
    computed: {
        isSortedAscending: function () {
            return this.direction;
        },
        isSortedDescending: function () {
            return !this.direction;
        },
        sorterStorageKey: function () {
            return 'biigle.volumes.' + biigle.$require('volumes.volumeId') + '.sorting.sorter';
        },
        directionStorageKey: function () {
            return 'biigle.volumes.' + biigle.$require('volumes.volumeId') + '.sorting.direction';
        },
        sequence: function () {
            if (this.direction) {
                return this.privateSequence;
            }

            return this.privateSequence.slice().reverse();
        },
    },
    methods: {
        reset: function () {
            this.direction = true;
            this.activeSorter = this.sorters[0].id;
            this.privateSequence = biigle.$require('volumes.imageIds');
        },
        sortAscending: function () {
            this.direction = true;
        },
        sortDescending: function () {
            this.direction = false;
        },
        handleSelect: function (sorter) {
            if (this.loading) return;

            var self = this;
            this.startLoading();
            sorter.getSequence()
                .then(function (sequence) {
                    self.activeSorter = sorter.id;
                    self.privateSequence = sequence;
                })
                .catch(biigle.$require('messages.store').handleErrorResponse)
                .finally(this.finishLoading);
        },
    },
    watch: {
        sequence: function () {
            this.$emit('update', this.sequence);
        },
        privateSequence: function () {
            if (this.activeSorter === this.sorters[0].id) {
                localStorage.removeItem(this.sorterStorageKey);
            } else {
                localStorage.setItem(this.sorterStorageKey, JSON.stringify({
                    id: this.activeSorter,
                    sequence: this.privateSequence,
                }));
            }
        },
        direction: function () {
            if (this.direction) {
                localStorage.removeItem(this.directionStorageKey);
            } else {
                localStorage.setItem(this.directionStorageKey, this.direction);
            }
        },
    },
    created: function () {
        var sorter = JSON.parse(localStorage.getItem(this.sorterStorageKey));
        if (sorter) {
            this.activeSorter = sorter.id;
            this.privateSequence = sorter.sequence;
        } else {
            this.activeSorter = this.sorters[0].id;
        }

        var direction = JSON.parse(localStorage.getItem(this.directionStorageKey));
        if (direction !== null) {
            this.direction = direction;
        }
    },
});
