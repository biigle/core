/**
 * @namespace dias.transects
 * @description The DIAS transects module.
 */
angular.module('dias.transects', ['dias.api', 'dias.ui']);

/*
 * Disable debug info in production for better performance.
 */
angular.module('dias.transects').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
