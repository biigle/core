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
        defaultSorter: function () {
            return this.sorters[0];
        },
        isActive: function () {
            return this.activeSorter !== this.defaultSorter.id || !this.direction;
        },
        isSortedAscending: function () {
            return this.direction;
        },
        isSortedDescending: function () {
            return !this.direction;
        },
        // Use "sorting2" to avoid conflicts with the previous version of the volume
        // sorter written in AngularJS.
        sorterStorageKey: function () {
            return 'biigle.volumes.' + biigle.$require('volumes.volumeId') + '.sorting2.sorter';
        },
        directionStorageKey: function () {
            return 'biigle.volumes.' + biigle.$require('volumes.volumeId') + '.sorting2.direction';
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
            this.activeSorter = this.defaultSorter.id;
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
        isValidSequence: function (sequence) {
            // A stored sorting sequence is invalid if it does not contain the IDs of all
            // images of the volume. It may contain more IDs if images have been
            // deleted in the meantime.
            var map = {};
            var ids = this.imageIds;

            for (var i = sequence.length - 1; i >= 0; i--) {
                map[sequence[i]] = true;
            }

            for (i = ids.length - 1; i >= 0; i--) {
                if (!map.hasOwnProperty(ids[i])) {
                    return false;
                }
            }

            return true;
        },
    },
    watch: {
        sequence: function () {
            this.$emit('update', this.sequence, this.isActive);
        },
        privateSequence: function () {
            if (this.activeSorter === this.defaultSorter.id) {
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
        if (sorter && this.isValidSequence(sorter.sequence)) {
            this.activeSorter = sorter.id;
            this.privateSequence = sorter.sequence;
        } else {
            this.activeSorter = this.defaultSorter.id;
            // Delete any invalid stored sorting sequence.
            localStorage.removeItem(this.sorterStorageKey);
        }

        var direction = JSON.parse(localStorage.getItem(this.directionStorageKey));
        if (direction !== null) {
            this.direction = direction;
        }
    },
});
