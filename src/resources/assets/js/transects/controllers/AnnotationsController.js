/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name AnnotationsController
 * @memberOf dias.transects
 * @description Global controller for the annotations feature
 */
angular.module('dias.transects').controller('AnnotationsController', function ($attrs, AnnotationImage, flags, TRANSECT_ID) {
        "use strict";

        var ids = AnnotationImage.query({transect_id: TRANSECT_ID}, function () {
            flags.add('has-annotation', ids, $attrs.flagTitle);
        });
    }
);
