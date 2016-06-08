/**
 * @namespace dias.label-trees
 * @description The DIAS label trees module.
 */
angular.module('dias.label-trees', ['dias.api', 'dias.ui']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('dias.label-trees').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
