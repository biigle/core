/**
 * @namespace biigle.label-trees
 * @description The BIIGLE label trees module.
 */
angular.module('biigle.label-trees', ['biigle.api', 'biigle.ui']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('biigle.label-trees').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
