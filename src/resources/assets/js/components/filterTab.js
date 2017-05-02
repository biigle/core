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
            operator: 'and',
        };
    },
    computed: {
        selectedFilter: function () {
            return this.getFilter(this.selectedFilterId);
        },
        hasSelectComponent: function () {
            return this.selectedFilter && this.selectedFilter.selectComponent;
        },
        selectComponent: function () {
            return this.selectedFilter.selectComponent;
        },
        hasRules: function () {
            return this.rules.length > 0;
        },
        sequence: function () {
            if (!this.hasRules) {
                return this.imageIds;
            }

            var only = {};
            var except = {};
            var negatedRules = 0;
            var nonNegatedRules = 0;

            this.rules.forEach(function (rule) {
                if (rule.negate) {
                    negatedRules++;
                    rule.sequence.forEach(function (id) {
                        except[id] = (except[id] + 1) || 1;
                    });
                } else {
                    nonNegatedRules++;
                    rule.sequence.forEach(function (id) {
                        only[id] = (only[id] + 1) || 1;
                    });
                }
            });

            if (this.operator === 'and') {
                if (nonNegatedRules > 0) {
                    // All IDs that occur in every non-negated rule and not in a negated
                    // rule. Example: a && b && !c && !d === a && b && !(c || d)
                    return this.imageIds.filter(function (id) {
                        return only[id] === nonNegatedRules && !except.hasOwnProperty(id);
                    });
                } else {
                    // All IDs that don't occur in a negated rule.
                    return this.imageIds.filter(function (id) {
                        return !except.hasOwnProperty(id);
                    });
                }
            } else {
                if (negatedRules > 0) {
                    // All IDs that occur in a non-negated rule or not in every negated
                    // rule. Example: a || b || !c || !d === a || b || !(c && d)
                    return this.imageIds.filter(function (id) {
                        return only.hasOwnProperty(id) || except[id] !== negatedRules;
                    });
                } else {
                    // All IDs that occur in a non-negated rule.
                    return this.imageIds.filter(function (id) {
                        return only.hasOwnProperty(id);
                    });
                }
            }
        },
        inFilterMode: function () {
            return this.mode === 'filter';
        },
        inFlagMode: function () {
            return this.mode === 'flag';
        },
        usesAndOperator: function () {
            return this.operator === 'and';
        },
        usesOrOperator: function () {
            return this.operator === 'or';
        },
        helpText: function () {
            return this.selectedFilter ? this.selectedFilter.help : null;
        },
        // Use "filter2" to avoid conflicts with the previous version of the volume
        // filter written in AngularJS.
        rulesStorageKey: function () {
            return 'biigle.volumes.' + biigle.$require('volumes.volumeId') + '.filter2.rules';
        },
        modeStorageKey: function () {
            return 'biigle.volumes.' + biigle.$require('volumes.volumeId') + '.filter2.mode';
        },
        operatorStorageKey: function () {
            return 'biigle.volumes.' + biigle.$require('volumes.volumeId') + '.filter2.operator';
        },
    },
    methods: {
        filterValid: function (filter) {
            return typeof filter.id === 'string' &&
                typeof filter.label === 'string' &&
                typeof filter.listComponent === 'object' &&
                typeof filter.getSequence === 'function';
        },
        getFilter: function (id) {
            for (var i = this.filters.length - 1; i >= 0; i--) {
                if (this.filters[i].id === id) {
                    return this.filters[i];
                }
            }

            return null;
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
        refreshRule: function (rule) {
            var filter = this.getFilter(rule.id);
            if (!filter) return;

            this.startLoading();
            filter.getSequence(this.volumeId, rule.data)
                .catch(biigle.$require('messages.store').handleErrorResponse)
                .then(function (response) {
                    rule.sequence = response.data;
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
            this.operator = 'and';
        },
        activateFilterMode: function () {
            this.mode = 'filter';
        },
        activateFlagMode: function () {
            this.mode = 'flag';
        },
        activateAndOperator: function () {
            this.operator = 'and';
        },
        activateOrOperator: function () {
            this.operator = 'or';
        },
        emitUpdate: function () {
            this.$emit('update', this.sequence, this.mode, this.hasRules);
        },
        getListComponent: function (rule) {
            for (var i = this.filters.length - 1; i >= 0; i--) {
                if (this.filters[i].id === rule.id) {
                    return this.filters[i].listComponent;
                }
            }
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
        operator: function () {
            this.emitUpdate();
            if (this.operator !== 'and') {
                localStorage.setItem(this.operatorStorageKey, this.operator);
            } else {
                localStorage.removeItem(this.operatorStorageKey);
            }
        },
        rules: {
            handler: function () {
                if (this.rules.length > 0) {
                    localStorage.setItem(
                        this.rulesStorageKey,
                        JSON.stringify(this.rules)
                    );
                } else {
                    localStorage.removeItem(this.rulesStorageKey);
                }
            },
            deep: true,
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

        var operator = localStorage.getItem(this.operatorStorageKey);
        if (operator) {
            this.operator = operator;
        }
    },
});
