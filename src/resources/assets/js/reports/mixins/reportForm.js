/**
 * A mixin for a report form
 *
 * @type {Object}
 */
biigle.$component('reports.mixins.reportForm', {
    mixins: [biigle.$require('core.mixins.loader')],
    data: {
        variants: {
            'Annotations': [
                'Basic',
                'Extended',
                'Area',
                'Full',
                'Csv',
            ],
            'ImageLabels': [
                'Basic',
                'Csv',
            ]
        },
        allowedOptions: {},
        selectedType: 'Annotations',
        selectedVariant: 'Basic',
        success: false,
        errors: {},
        options: {
            export_area: false,
            newest_label: false,
            separate_label_trees: false,
        },
    },
    computed: {
        availableReportTypes: function () {
            var types = {};
            biigle.$require('reports.reportTypes').forEach(function (type) {
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
});
