/**
 * @namespace biigle.volumes
 * @ngdoc controller
 * @name AnnotationsUserFilterController
 * @memberOf biigle.volumes
 * @description Manages the user filter feature
 */
angular.module('biigle.volumes').controller('AnnotationsUserFilterController', function (  AnnotationUserImage, filter, VOLUME_ID) {
        "use strict";

        filter.add({
            name: 'annotation label by user',
            helpText: 'All images that contain one or more annotations with a label attached by the given user.',
            helpTextNegate: 'All images that contain no annotations with a label attached by the given user.',
            template: 'annotationLabelByUserFilterRule.html',
            typeahead: 'annotationUserFilterTypeahead.html',
            getSequence: function (user) {
                return AnnotationUserImage.query({volume_id: VOLUME_ID, data: user.id});
            }
        });
    }
);
