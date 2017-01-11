/**
 * @namespace biigle.transects
 * @description The BIIGLE transects module.
 */
angular.module('biigle.transects', ['biigle.api', 'biigle.ui']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('biigle.transects').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
