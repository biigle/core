/**
 * @namespace biigle.volumes.edit
 * @description The BIIGLE volumes module.
 */
angular.module('biigle.volumes.edit', ['biigle.api', 'biigle.ui.messages']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('biigle.volumes.edit').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});
