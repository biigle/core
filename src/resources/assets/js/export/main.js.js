/**
 * @namespace biigle.export
 * @description The BIIGLE export module
 */
angular.module('biigle.export', ['biigle.api', 'biigle.ui']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('biigle.export').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
