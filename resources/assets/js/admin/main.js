/**
 * @namespace dias.admin
 * @description The DIAS admin AngularJS module.
 */
angular.module('dias.admin', ['dias.api', 'dias.ui.messages']);

/*
 * Disable debug info in production for better performance.
 */
angular.module('dias.admin').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
