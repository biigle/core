/**
 * View model for the volume filter tab
 */
biigle.$component('volumes.components.filterTab', {
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
            filters: biigle.$require('volumes.stores.filters'),
            rules: [],
            selectedFilterId: null,
            negate: false,
            mode: 'filter',
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
            var i;
            var nonNegatedRules = 0;

            for (i = this.rules.length - 1; i >= 0; i--) {
                if (this.rules[i].negate) {
                    Array.prototype.push.apply(except, this.rules[i].sequence);
                } else {
                    nonNegatedRules++;
                    Array.prototype.push.apply(only, this.rules[i].sequence);
                }
            }

            var ids = [];

            if (nonNegatedRules > 0) {
                var occurrence = {};
                // Remove duplicates and take only those IDs that are accepted by all
                // non-negated filter rules.
                for (i = only.length - 1; i >= 0; i--) {
                    if (occurrence.hasOwnProperty(only[i])) {
                        occurrence[only[i]]++;
                    } else {
                        occurrence[only[i]] = 1;
                    }

                    if (occurrence[only[i]] === nonNegatedRules) {
                        ids.push(only[i]);
                    }
                }
            } else {
                ids = this.imageIds;
            }

            return ids.filter(function (value) {
                return except.indexOf(value) === -1;
            });
        },
        inFilterMode: function () {
            return this.mode === 'filter';
        },
        inFlagMode: function () {
            return this.mode === 'flag';
        },
        helpText: function () {
            return this.selectedFilter ? this.selectedFilter.help : null;
        },
        rulesStorageKey: function () {
            return 'biigle.volumes.' + biigle.$require('volumes.volumeId') + '.filter.rules';
        },
        modeStorageKey: function () {
            return 'biigle.volumes.' + biigle.$require('volumes.volumeId') + '.filter.mode';
        },
    },
    methods: {
        filterValid: function (filter) {
            return typeof filter.id === 'string' &&
                typeof filter.label === 'string' &&
                typeof filter.listComponent === 'object' &&
                typeof filter.getSequence === 'function';
        },
        hasRule: function (rule) {
            return this.rules.findIndex(function (item) {
                return item.id === rule.id &&
                    item.negate === rule.negate &&
                    item.data === rule.data;
            }) !== -1;
        },
        addRule: function (data) {
            if (!this.selectedFilter) return;

            var rule = {
                id: this.selectedFilter.id,
                data: data,
                negate: this.negate,
            };

            if (this.hasRule(rule)) return;

            this.startLoading();
            var self = this;

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
        reset: function () {
            this.rules = [];
            this.selectedFilterId = null;
            this.negate = false;
            this.mode = 'filter';
        },
        activateFilterMode: function () {
            this.mode = 'filter';
        },
        activateFlagMode: function () {
            this.mode = 'flag';
        },
        emitUpdate: function () {
            this.$emit('update', {
                sequence: this.sequence,
                mode: this.mode,
            });
        },
    },
    watch: {
        sequence: function () {
            this.emitUpdate();
        },
        mode: function () {
            this.emitUpdate();
            if (this.mode !== 'filter') {
                localStorage.setItem(this.modeStorageKey, this.mode);
            } else {
                localStorage.removeItem(this.modeStorageKey);
            }
        },
        rules: function () {
            if (this.rules.length > 0) {
                localStorage.setItem(this.rulesStorageKey, JSON.stringify(this.rules));
            } else {
                localStorage.removeItem(this.rulesStorageKey);
            }
        },
    },
    created: function () {
        // Dynamically assign the components of the available filters.
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

        // Load saved state from local storage
        var rules = JSON.parse(localStorage.getItem(this.rulesStorageKey));
        if (rules) {
            Vue.set(this, 'rules', rules);
        }

        var mode = localStorage.getItem(this.modeStorageKey);
        if (mode) {
            this.mode = mode;
        }
    },
});
