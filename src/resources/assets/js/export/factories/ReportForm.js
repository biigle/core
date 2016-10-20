/**
 * @namespace dias.export
 * @ngdoc factory
 * @name ReportForm
 * @memberOf dias.export
 * @description Service to help with request report forms
 */
angular.module('dias.export').factory('ReportForm', function (msg) {
    "use strict";

    function ReportForm(variants, allowedOptions, defaultForm) {
        this.variants = variants;
        this.allowedOptions = allowedOptions;
        this.defaultForm = defaultForm;
        this.data = angular.copy(this.defaultForm);
        this.state = {
            success: false,
            loading: false
        };
        this.availableVariants = this.variants[this.data.type];
    }

    ReportForm.prototype.handleRequestSuccess = function () {
        this.state.success = true;
        this.state.loading = false;
        this.error = {};
    };

    ReportForm.prototype.handleRequestError = function (response) {
        this.state.loading = false;
        this.success = false;
        if (response.status === 422) {
            this.error = response.data;
        } else {
            msg.responseError(response);
        }
    };

    ReportForm.prototype.selectType = function (type) {
        this.data.type = type;
        this.availableVariants = this.variants[type];
        this.data.variant = this.availableVariants[0];
    };

    ReportForm.prototype.wantsType = function (type) {
        return this.data.type === type;
    };

    ReportForm.prototype.wantsCombination = function (type, variant) {
        return this.wantsType(type) && this.data.variant === variant;
    };

    ReportForm.prototype.submit = function (factory, params) {
        var _this = this;
        var options = {};
        var allowed = this.allowedOptions[this.data.type];
        for (var i = allowed.length - 1; i >= 0; i--) {
            options[allowed[i]] = this.data.options[allowed[i]];
        }

        this.state.loading = true;
        this.state.success = false;

        params = angular.extend(params, {
            type: this.data.type,
            variant: this.data.variant,
        });

        factory.requestGenericReport(params, options, function () {
            _this.handleRequestSuccess();
        }, function (response) {
            _this.handleRequestError(response);
        });
    };

    return ReportForm;
});
