/**
 * @namespace biigle.transects.edit
 * @description The BIIGLE transects module.
 */
angular.module('biigle.transects.edit', ['biigle.api', 'biigle.ui.messages']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('biigle.transects.edit').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
