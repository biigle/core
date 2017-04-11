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
            direction: 'asc',
            activeSorter: null,
            privateSequence: biigle.$require('volumes.imageIds'),
        };
    },
    computed: {
        isSortedAscending: function () {
            return this.direction === 'asc';
        },
        isSortedDescending: function () {
            return this.direction === 'desc';
        },
        sorterStorageKey: function () {
            return 'biigle.volumes.' + biigle.$require('volumes.volumeId') + '.sorting.sorter';
        },
        directionStorageKey: function () {
            return 'biigle.volumes.' + biigle.$require('volumes.volumeId') + '.sorting.direction';
        },
        sequence: function () {
            if (this.direction === 'desc') {
                return this.privateSequence.slice().reverse();
            }

            return this.privateSequence;
        },
    },
    methods: {
        reset: function () {
            this.direction = 'asc';
            this.activeSorter = this.sorters[0].id;
            this.privateSequence = biigle.$require('volumes.imageIds');
        },
        sortAscending: function () {
            this.direction = 'asc';
        },
        sortDescending: function () {
            this.direction = 'desc';
        },
        handleSelect: function (sorter) {
            if (this.loading) return;

            var self = this;
            this.startLoading();
            sorter.getSequence()
                .catch(biigle.$require('messages.store').handleErrorResponse)
                .then(function (sequence) {
                    self.activeSorter = sorter.id;
                    self.privateSequence = sequence;
                })
                .finally(this.finishLoading);
        },
    },
    watch: {
        sequence: function () {
            this.$emit('update', this.sequence);
        },
        privateSequence: function () {
            // store
        },
        direction: function () {
            // store
        },
    },
    created: function () {
        this.activeSorter = this.sorters[0].id;
    },
});
