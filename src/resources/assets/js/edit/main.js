/**
 * @namespace dias.transects.edit
 * @description The DIAS transects module.
 */
angular.module('dias.transects.edit', ['dias.api', 'dias.ui.messages']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('dias.transects.edit').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
