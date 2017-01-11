/**
 * @namespace biigle.ate
 * @description The BIIGLE ATE module.
 */
angular.module('biigle.ate', ['biigle.transects']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('biigle.ate').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
