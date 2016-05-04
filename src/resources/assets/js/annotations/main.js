/**
 * @namespace dias.annotations
 * @description The DIAS annotations module.
 */
angular.module('dias.annotations', ['dias.api', 'dias.ui']);

/*
 * Disable debug info in production for better performance.
 */
angular.module('dias.annotations').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
