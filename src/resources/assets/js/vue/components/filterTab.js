/**
 * View model for the volume filter tab
 */
biigle.$component('volumes.components.filterTab', {
    mixins: [biigle.$require('core.mixins.loader')],
    components: {},
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
            filters: biigle.$require('volumes.stores.filters'),
            rules: [],
            selectedFilterId: null,
            negate: false,
        };
    },
    computed: {
        selectedFilter: function () {
            for (var i = this.filters.length - 1; i >= 0; i--) {
                if (this.filters[i].id === this.selectedFilterId) {
                    return this.filters[i];
                }
            }

            return null;
        },
        hasSelectComponent: function () {
            return this.selectedFilter && this.selectedFilter.selectComponent;
        },
        selectComponent: function () {
            return this.selectedFilter.id + 'Select';
        },
        hasRules: function () {
            return this.rules.length > 0;
        },
        sequence: function () {
            var only = [];
            var except = [];
            for (var i = this.rules.length - 1; i >= 0; i--) {
                if (this.rules[i].negate) {
                    Array.prototype.push.apply(except, this.rules[i].sequence);
                } else {
                    Array.prototype.push.apply(only, this.rules[i].sequence);
                }
            }

            var ids;

            if (only.length > 0) {
                // Remove duplicates.
                ids = only.filter(function (value, index, self) {
                    return self.indexOf(value) === index;
                });
            } else {
                ids = this.imageIds;
            }

            return ids.filter(function (value) {
                return except.indexOf(value) === -1;
            });
        },
    },
    methods: {
        filterValid: function (filter) {
            return typeof filter.id === 'string' &&
                typeof filter.label === 'string' &&
                typeof filter.listComponent === 'object' &&
                typeof filter.getSequence === 'function';
        },
        addRule: function (data) {
            if (!this.selectedFilter) return;

            this.startLoading();
            var self = this;
            var rule = {
                id: this.selectedFilter.id,
                data: data,
                negate: this.negate,
            };

            this.selectedFilter.getSequence(this.volumeId, data)
                .catch(biigle.$require('messages.store').handleErrorResponse)
                .then(function (response) {
                    self.ruleAdded(rule, response);
                })
                .finally(this.finishLoading);
        },
        ruleAdded: function (rule, response) {
            rule.sequence = response.data;
            this.rules.push(rule);
        },
        removeRule: function (index) {
            this.rules.splice(index, 1);
        },
    },
    watch: {
        sequence: function (sequence) {
            this.$emit('update', sequence);
        },
    },
    created: function () {
        var filter;
        for (var i = 0; i < this.filters.length; i++) {
            filter = this.filters[i];

            if (!this.filterValid(filter)) {
                console.error('Filter ' + filter.id + ' invalid. Ignoring...');
                this.filters.splice(i, 1);
            }

            this.$options.components[filter.id + 'List'] = filter.listComponent;

            if (filter.selectComponent) {
                this.$options.components[filter.id + 'Select'] = filter.selectComponent;
            }
        }
    },
});
