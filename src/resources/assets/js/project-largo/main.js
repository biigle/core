/**
 * @namespace biigle.project-largo
 * @description The BIIGLE Largo module por a whole project.
 */
angular.module('biigle.project-largo', ['biigle.largo']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('biigle.project-largo').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
