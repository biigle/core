/**
 * @namespace dias.export
 * @ngdoc controller
 * @name TransectReportRequestController
 * @memberOf dias.export
 * @description Controller for requesting a new transect report
 */
angular.module('dias.export').controller('TransectReportRequestController', function ($scope, TransectReport, msg, TRANSECT_ID) {
        "use strict";

        var variants = {
            'annotations': [
                'basic',
                'extended',
                'full',
                'csv'
            ],
            'image-labels': [
                'basic',
                'csv'
            ]
        };

        var allowedOptions = {
            'annotations': [
                'exportArea',
                'separateLabelTrees',
                'annotationSession'
            ],
            'image-labels': [
                'annotationSession'
            ]
        };

        var defaultForm = {
            type: 'annotations',
            variant: 'basic',
            options: {
                exportArea: false,
                separateLabelTrees: false,
                annotationSession: null
            }
        };

        $scope.form = angular.copy(defaultForm);

        $scope.state = {
            success: false,
            loading: false
        };

        $scope.error = {};

        $scope.availableVariants = variants[$scope.form.type];

        var handleRequestSuccess = function () {
            $scope.state.success = true;
            $scope.state.loading = false;
            $scope.form = angular.copy(defaultForm);
            $scope.error = {};
        };

        var handleRequestError = function (response) {
            $scope.state.loading = false;
            $scope.success = false;
            if (response.status === 422) {
                $scope.error = response.data;
            } else {
                msg.responseError(response);
            }
        };

        $scope.selectType = function (type) {
            $scope.form.type = type;
        };

        $scope.wantsType = function (type) {
            return $scope.form.type === type;
        };

        $scope.wantsCombination = function (type, variant) {
            return $scope.wantsType(type) && $scope.form.variant === variant;
        };

        $scope.submit = function () {
            var options = {};
            var allowed = allowedOptions[$scope.form.type];
            for (var i = allowed.length - 1; i >= 0; i--) {
                options[allowed[i]] = $scope.form.options[allowed[i]];
            }

            $scope.state.loading = true;
            TransectReport.requestGenericReport({
                transect_id: TRANSECT_ID,
                type: $scope.form.type,
                variant: $scope.form.variant,
            }, options, handleRequestSuccess, handleRequestError);
        };

        $scope.$watch('form.type', function (type) {
            $scope.availableVariants = variants[type];
            $scope.form.variant = $scope.availableVariants[0];
        });
    }
);
