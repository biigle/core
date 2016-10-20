/**
 * @namespace dias.export
 * @description The DIAS export module
 */
angular.module('dias.export', ['dias.api', 'dias.ui']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('dias.export').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
