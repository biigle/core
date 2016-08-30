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
            helpText: 'All images that contain one or more annotations with a label attached by the given user.',
            helpTextNegate: 'All images that contain no annotations with a label attached by the given user.',
            template: 'annotationLabelByUserFilterRule.html',
            resource: AnnotationUserImage,
            typeahead: 'annotationUserFilterTypeahead.html',
            transformData: function (user) {
                return user.id;
            }
        });
    }
);
