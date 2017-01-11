/**
 * @namespace biigle.annotations
 * @description The BIIGLE annotations module.
 */
angular.module('biigle.annotations', ['biigle.api', 'biigle.ui']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('biigle.annotations').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
