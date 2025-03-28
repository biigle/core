<script>
import LabelTrees from '@/label-trees/components/labelTrees.vue';
import LoaderMixin from '@/core/mixins/loader.vue';

/**
 * A mixin for a report form
 *
 * @type {Object}
 */
export default {
    mixins: [LoaderMixin],
    components: {
        labelTrees: LabelTrees,
    },
    data() {
        return {
            allowedOptions: {},
            selectedType: '',
            selectedVariant: '',
            reportTypes: [],
            labelTrees: [],
            hasOnlyLabels: false,
            success: false,
            errors: {},
            options: {
                export_area: false,
                newest_label: false,
                separate_label_trees: false,
                separate_users: false,
                only_labels: [],
                aggregate_child_labels: false,
            },
        };
    },
    computed: {
        flatLabels() {
            let labels = [];
            this.labelTrees.forEach(function (tree) {
                Array.prototype.push.apply(labels, tree.labels);
            });

            return labels;
        },
        selectedLabels() {
            return this.flatLabels.filter((label) => label.selected);
        },
        selectedLabelsCount() {
            return this.selectedLabels.length;
        },
        variants() {
            let variants = {};
            this.reportTypes.forEach(function (type) {
                let fragments = type.name.split('\\');
                if (!variants.hasOwnProperty(fragments[0])) {
                    variants[fragments[0]] = [];
                }
                if (fragments[1]) {
                    variants[fragments[0]].push(fragments[1]);
                }
            });

            return variants;
        },
        availableReportTypes() {
            let types = {};
            this.reportTypes.forEach(function (type) {
                types[type.name] = type.id;
            });

            return types;
        },
        selectedReportTypeId() {
            if (this.selectedVariant) {
                return this.availableReportTypes[this.selectedType + '\\' + this.selectedVariant];
            }

            return this.availableReportTypes[this.selectedType];
        },
        availableVariants() {
            return this.variants[this.selectedType];
        },
        hasAvailableVariants() {
            return this.availableVariants.length > 0;
        },
        onlyOneAvailableVariant() {
            return this.availableVariants.length === 1;
        },
        selectedOptions() {
            let options = {};
            this.allowedOptions[this.selectedType].forEach((allowed) => {
                options[allowed] = this.options[allowed];
            });

            options.type_id = this.selectedReportTypeId;

            return options;
        },
    },
    methods: {
        request(id, resource) {
            if (this.loading) return;
            this.success = false;
            this.startLoading();
            resource.save({id: id}, this.selectedOptions)
                .then(this.submitted, this.handleError)
                .finally(this.finishLoading);
        },
        submitted() {
            this.success = true;
            this.errors = {};
        },
        handleError(response) {
            if (response.status === 422) {
                if (response.data.hasOwnProperty('errors')) {
                    this.errors = response.data.errors;
                } else {
                    this.errors = response.data;
                }
            } else {
                this.handleErrorResponse(response);
            }
        },
        selectType(type) {
            this.selectedType = type;
            if (this.availableVariants.indexOf(this.selectedVariant) === -1) {
                this.selectedVariant = this.availableVariants[0] || '';
            }
        },
        wantsType(type) {
            return this.selectedType === type;
        },
        wantsVariant(variant) {
            if (Array.isArray(variant)) {
                return variant.indexOf(this.selectedVariant) !== -1;
            }

            return this.selectedVariant === variant;
        },
        hasOption(key) {
            return this.allowedOptions[this.selectedType].includes(key);
        },
        hasError(key) {
            return this.errors.hasOwnProperty(key);
        },
        getError(key) {
            return this.errors[key] ? this.errors[key].join(' ') : '';
        },
        wantsCombination(type, variant) {
            return this.wantsType(type) && this.wantsVariant(variant);
        },
    },
    watch: {
        selectedLabels: {
            deep: true,
            handler(labels) {
                this.options.only_labels = labels.map((label) => label.id);
            },
        },
        hasOnlyLabels(has) {
            if (!has) {
                this.flatLabels.forEach(function (label) {
                    label.selected = false;
                });
            }
        },
        'options.separate_label_trees'(separate) {
            if (separate) {
                this.options.separate_users = false;
            }
        },
        'options.separate_users'(separate) {
            if (separate) {
                this.options.separate_label_trees = false;
            }
        },
    },
    created() {
        this.reportTypes = biigle.$require('reports.reportTypes');
        this.selectedType = Object.keys(this.variants)[0];
        this.selectedVariant = this.availableVariants[0];
        let trees = biigle.$require('reports.labelTrees');
        // The "selected" property is automatically set by the label trees component.
        // However, this may not be fast enough for very large label trees to complete
        // before the selectedLabels computed property is evaluated. The computed
        // property won't work correctly in that case so we explicitly set the "selected"
        // property here.
        trees.forEach(function (tree) {
            tree.labels.forEach(function (label) {
                label.selected = false;
            });
        });
        this.labelTrees = trees;
    },
};
</script>
