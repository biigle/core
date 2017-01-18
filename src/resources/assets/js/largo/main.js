/**
 * @namespace biigle.largo
 * @description The BIIGLE Largo module.
 */
angular.module('biigle.largo', ['biigle.volumes']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('biigle.largo').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
