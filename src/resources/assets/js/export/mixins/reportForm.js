/**
 * A mixin for a report form
 *
 * @type {Object}
 */
biigle.$component('export.mixins.reportForm', {
    mixins: [biigle.$require('core.mixins.loader')],
    data: {
        variants: {},
        allowedOptions: {},
        selectedType: 'annotations',
        selectedVariant: 'basic',
        success: false,
        errors: {},
        options: {
            exportArea: false,
            separateLabelTrees: false,
        },
    },
    computed: {
        availableVariants: function () {
            return this.variants[this.selectedType];
        },
        selectedOptions: function () {
            var allowed = this.allowedOptions[this.selectedType];
            var options = {};
            for (var i = allowed.length - 1; i >= 0; i--) {
                options[allowed[i]] = this.options[allowed[i]];
            }

            return options;
        }
    },
    methods: {
        request: function (id, model) {
            if (this.loading) return;
            this.success = false;
            this.startLoading();
            biigle.$require('export.api.reports').request({
                    id: id,
                    model: model,
                    type: this.selectedType,
                    variant: this.selectedVariant,
                }, this.selectedOptions)
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
