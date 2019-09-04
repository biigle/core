/**
 * A mixin for a report form
 *
 * @type {Object}
 */
biigle.$component('reports.mixins.reportForm', {
    mixins: [biigle.$require('core.mixins.loader')],
    components: {
        labelTrees: biigle.$require('labelTrees.components.labelTrees'),
    },
    data: {
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
            only_labels: [],
        },
    },
    computed: {
        flatLabels: function () {
            var labels = [];
            this.labelTrees.forEach(function (tree) {
                Array.prototype.push.apply(labels, tree.labels);
            });

            return labels;
        },
        selectedLabels: function () {
            return this.flatLabels.filter(function (label) {
                return label.selected;
            });
        },
        selectedLabelsCount: function () {
            return this.selectedLabels.length;
        },
        variants: function () {
            var variants = {};
            this.reportTypes.forEach(function (type) {
                var fragments = type.name.split('\\');
                if (!variants.hasOwnProperty(fragments[0])) {
                    variants[fragments[0]] = [];
                }
                variants[fragments[0]].push(fragments[1]);
            });

            return variants;
        },
        availableReportTypes: function () {
            var types = {};
            this.reportTypes.forEach(function (type) {
                types[type.name] = type.id;
            });

            return types;
        },
        selectedReportTypeId: function () {
            return this.availableReportTypes[this.selectedType + '\\' + this.selectedVariant];
        },
        availableVariants: function () {
            return this.variants[this.selectedType];
        },
        onlyOneAvailableVariant: function () {
            return this.availableVariants.length === 1;
        },
        selectedOptions: function () {
            var options = {};
            this.allowedOptions[this.selectedType].forEach(function (allowed) {
                options[allowed] = this.options[allowed];
            }, this);

            options.type_id = this.selectedReportTypeId;

            return options;
        },
    },
    methods: {
        request: function (id, resource) {
            if (this.loading) return;
            this.success = false;
            this.startLoading();
            resource.save({id: id}, this.selectedOptions)
                .then(this.submitted, this.handleError)
                .finally(this.finishLoading);
        },
        submitted: function () {
            this.success = true;
            this.errors = {};
        },
        handleError: function (response) {
            if (response.status === 422) {
                this.errors = response.data;
            } else {
                biigle.$require('messages.store').handleErrorResponse(response);
            }
        },
        selectType: function (type) {
            this.selectedType = type;
            if (this.availableVariants.indexOf(this.selectedVariant) === -1) {
                this.selectedVariant = this.availableVariants[0];
            }
        },
        wantsType: function (type) {
            return this.selectedType === type;
        },
        hasError: function (key) {
            return this.errors.hasOwnProperty(key);
        },
        getError: function (key) {
            return this.errors[key] ? this.errors[key].join(' ') : '';
        },
        wantsCombination: function (type, variant) {
            return this.selectedType === type && this.selectedVariant === variant;
        },
    },
    watch: {
        selectedLabels: function (labels) {
            this.options.only_labels = labels.map(function (label) {
                return label.id;
            });
        },
        hasOnlyLabels: function (has) {
            if (!has) {
                this.flatLabels.forEach(function (label) {
                    label.selected = false;
                });
            }
        },
    },
    created: function () {
        this.reportTypes = biigle.$require('reports.reportTypes');
        this.selectedType = Object.keys(this.variants)[0];
        this.selectedVariant = this.availableVariants[0];
        this.labelTrees = biigle.$require('reports.labelTrees');
    },
});
