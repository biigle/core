/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name AnnotationsUserFilterController
 * @memberOf dias.transects
 * @description Manages the user filter feature
 */
angular.module('dias.transects').controller('AnnotationsUserFilterController', function (  AnnotationUserImage, filter) {
        "use strict";

        filter.add({
            name: 'annotation label by user',
            template: 'annotationLabelByUserFilterRule.html',
            resource: AnnotationUserImage,
            typeahead: 'annotationUserFilterTypeahead.html',
            transformData: function (user) {
                return user.id;
            }
        });
    }
);
