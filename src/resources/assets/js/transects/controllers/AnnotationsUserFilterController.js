/**
 * @namespace biigle.transects
 * @ngdoc controller
 * @name AnnotationsUserFilterController
 * @memberOf biigle.transects
 * @description Manages the user filter feature
 */
angular.module('biigle.transects').controller('AnnotationsUserFilterController', function (  AnnotationUserImage, filter, TRANSECT_ID) {
        "use strict";

        filter.add({
            name: 'annotation label by user',
            helpText: 'All images that contain one or more annotations with a label attached by the given user.',
            helpTextNegate: 'All images that contain no annotations with a label attached by the given user.',
            template: 'annotationLabelByUserFilterRule.html',
            typeahead: 'annotationUserFilterTypeahead.html',
            getSequence: function (user) {
                return AnnotationUserImage.query({transect_id: TRANSECT_ID, data: user.id});
            }
        });
    }
);
