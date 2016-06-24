/**
 * @namespace dias.ate
 * @description The DIAS ATE module.
 */
angular.module('dias.ate', ['dias.transects']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('dias.ate').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
