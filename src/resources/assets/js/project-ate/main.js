/**
 * @namespace dias.project-ate
 * @description The DIAS ATE module por a whole project.
 */
angular.module('dias.project-ate', ['dias.ate']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('dias.project-ate').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
