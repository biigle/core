/**
 * @namespace biigle.project-ate
 * @description The BIIGLE ATE module por a whole project.
 */
angular.module('biigle.project-ate', ['biigle.ate']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('biigle.project-ate').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
