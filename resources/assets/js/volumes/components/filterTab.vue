<script>
import FiltersStore from '../stores/filters.js';
import LoaderMixin from '@/core/mixins/loader.vue';
import PowerToggle from '@/core/components/powerToggle.vue';
import {capitalize} from '@/core/utils.js';
import {handleErrorResponse} from '@/core/messages/store.js';


/**
 * View model for the volume filter tab
 */
export default {
    mixins: [LoaderMixin],
    components: {
        powerToggle: PowerToggle,
    },
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
        showFilenames: {
            type: Boolean,
            default: false,
        },
        loadingFilenames: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            rules: [],
            selectedFilterId: null,
            negate: false,
            mode: 'filter',
            operator: 'and',
        };
    },
    computed: {
        filters() {
            return FiltersStore.filter((filter) => {
                return filter.types && filter.types.includes(this.type);
            });
        },
        selectedFilter() {
            return this.getFilter(this.selectedFilterId);
        },
        hasSelectComponent() {
            return this.selectedFilter && this.selectedFilter.selectComponent;
        },
        selectComponent() {
            return this.selectedFilter.selectComponent;
        },
        hasRules() {
            return this.rules.length > 0;
        },
        sequence() {
            if (!this.hasRules) {
                return this.fileIds;
            }

            let only = {};
            let except = {};
            let negatedRules = 0;
            let nonNegatedRules = 0;

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
                    return this.fileIds.filter(
                        id => only[id] === nonNegatedRules && !except.hasOwnProperty(id)
                    );
                } else {
                    // All IDs that don't occur in a negated rule.
                    return this.fileIds.filter((id) => !except.hasOwnProperty(id));
                }
            } else {
                if (negatedRules > 0) {
                    // All IDs that occur in a non-negated rule or not in every negated
                    // rule. Example: a || b || !c || !d === a || b || !(c && d)
                    return this.fileIds.filter(
                        (id) => only.hasOwnProperty(id) || except[id] !== negatedRules
                    );
                } else {
                    // All IDs that occur in a non-negated rule.
                    return this.fileIds.filter((id) => only.hasOwnProperty(id));
                }
            }
        },
        inFilterMode() {
            return this.mode === 'filter';
        },
        inFlagMode() {
            return this.mode === 'flag';
        },
        usesAndOperator() {
            return this.operator === 'and';
        },
        usesOrOperator() {
            return this.operator === 'or';
        },
        helpText() {
            if (this.selectedFilter) {
                return this.selectedFilter.help.replace(':type', this.type);
            }

            return null;
        },
        // Use "filter2" to avoid conflicts with the previous version of the volume
        // filter written in AngularJS.
        rulesStorageKey() {
            return `biigle.volumes.${this.volumeId}.filter2.rules`;
        },
        modeStorageKey() {
            return `biigle.volumes.${this.volumeId}.filter2.mode`;
        },
        operatorStorageKey() {
            return `biigle.volumes.${this.volumeId}.filter2.operator`;
        },
        typeText() {
            return capitalize(this.type) + 's';
        },
    },
    methods: {
        filterValid(filter) {
            return typeof filter.id === 'string' &&
                typeof filter.label === 'string' &&
                typeof filter.listComponent === 'object' &&
                typeof filter.getSequence === 'function';
        },
        getFilter(id) {
            for (let i = this.filters.length - 1; i >= 0; i--) {
                if (this.filters[i].id === id) {
                    return this.filters[i];
                }
            }

            return null;
        },
        itemsAreEqual(itemData, ruleData) {
            // handle Array
            if (itemData !== null && ruleData !== null) {
                if (itemData instanceof Array) {
                    return itemData.length === ruleData.length &&
                        itemData.every((val, index) => val === ruleData[index]);
                }
            }
            // handle all other types (Objects, null)
            return itemData === ruleData;
        },
        hasRule(rule) {
            return this.rules.findIndex((item) => {
                return item.id === rule.id &&
                    item.negate === rule.negate &&
                    this.itemsAreEqual(item.data, rule.data);
            }) !== -1;
        },
        addRule(data) {
            if (!this.selectedFilter) return;

            let rule = {
                id: this.selectedFilter.id,
                data: data,
                negate: this.negate,
            };
            if (this.hasRule(rule)) return;

            this.startLoading();
            this.selectedFilter.getSequence(this.volumeId, data)
                .catch(handleErrorResponse)
                .then((response) => this.ruleAdded(rule, response))
                .finally(this.finishLoading);
        },
        refreshRule(rule) {
            let filter = this.getFilter(rule.id);
            if (!filter) return;

            this.startLoading();
            filter.getSequence(this.volumeId, rule.data)
                .catch(handleErrorResponse)
                .then((response) => rule.sequence = response.data)
                .finally(this.finishLoading);
        },
        ruleAdded(rule, response) {
            rule.sequence = response.data;
            this.rules.push(rule);
        },
        removeRule(index) {
            this.rules.splice(index, 1);
        },
        reset() {
            this.rules = [];
            this.selectedFilterId = null;
            this.negate = false;
            this.mode = 'filter';
            this.operator = 'and';
        },
        activateFilterMode() {
            this.mode = 'filter';
        },
        activateFlagMode() {
            this.mode = 'flag';
        },
        activateAndOperator() {
            this.operator = 'and';
        },
        activateOrOperator() {
            this.operator = 'or';
        },
        emitUpdate() {
            this.$emit('update', this.sequence, this.mode, this.hasRules);
        },
        getListComponent(rule) {
            for (let i = this.filters.length - 1; i >= 0; i--) {
                if (this.filters[i].id === rule.id) {
                    return this.filters[i].listComponent;
                }
            }
        },
        enableFilenames() {
            this.$emit('enable-filenames');
        },
        disableFilenames() {
            this.$emit('disable-filenames');
        },
    },
    watch: {
        sequence() {
            this.emitUpdate();
        },
        mode() {
            this.emitUpdate();
            if (this.mode !== 'filter') {
                localStorage.setItem(this.modeStorageKey, this.mode);
            } else {
                localStorage.removeItem(this.modeStorageKey);
            }
        },
        operator() {
            this.emitUpdate();
            if (this.operator !== 'and') {
                localStorage.setItem(this.operatorStorageKey, this.operator);
            } else {
                localStorage.removeItem(this.operatorStorageKey);
            }
        },
        rules: {
            handler() {
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
    created() {
        let filter;
        for (let i = 0; i < this.filters.length; i++) {
            filter = this.filters[i];

            if (!this.filterValid(filter)) {
                console.error(`Filter ${filter.id} invalid. Ignoring...`);
                this.filters.splice(i, 1);
            }
        }

        // Load saved state from local storage
        let rules = JSON.parse(localStorage.getItem(this.rulesStorageKey));
        if (rules) {
            this.rules = rules;
        }

        let mode = localStorage.getItem(this.modeStorageKey);
        if (mode) {
            this.mode = mode;
        }

        let operator = localStorage.getItem(this.operatorStorageKey);
        if (operator) {
            this.operator = operator;
        }
    },
};
</script>
