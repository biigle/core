/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name TransectController
 * @memberOf dias.transects
 * @description Global controller for the transects page
 */
angular.module('dias.transects').controller('TransectController', function ($scope, $attrs, TRANSECT_IMAGES, filterSubset) {
		"use strict";

        // number of initially shown images
        var initialLimit = 20;

        var imagesLocalStorageKey = 'dias.transects.' + $attrs.transectId + '.images';

        $scope.transectId = $attrs.transectId;

        $scope.images = {
            // all image IDs of the transect in ascending order
            ids: TRANSECT_IMAGES,
            // the currently displayed ordering of images (as array of image IDs)
            sequence: [],
            // number of currently shown images
            limit: initialLimit,
            // number of overall images
            length: TRANSECT_IMAGES.length,
            // flags to mark special images consisting of the image IDs to mark, a title
            // as description for the flag element and a flag name that will be used to identify
            // the flag and as additional class for the flag element
            flags: {}
        };

        // check for a stored image sorting sequence
        if (window.localStorage[imagesLocalStorageKey]) {
            $scope.images.sequence = JSON.parse(window.localStorage[imagesLocalStorageKey]);
            // check if all images loaded from storage are still there in the transect.
            // some of them may have been deleted in the meantime.
            filterSubset($scope.images.sequence, $scope.images.ids, true);
        } else {
            $scope.images.sequence = $scope.images.ids;
        }

        $scope.progress = function () {
            return {
                width:  ($scope.images.length ?
                            Math.min($scope.images.limit / $scope.images.length, 1) * 100
                            : 0
                        ) + '%'
            };
        };

        // set the ordering of the displayed images
        $scope.setImagesSequence = function (sequence) {
            // TODO distinguish between the image sequence (ordering) and filtering.
            // while one sequence should replace the other (like it is now), an image
            // sequence and filtering can be merged (currently not possible).
            // make one function for setting the sequence and one for setting the filtering,
            // then merge the two to the final set of displayed images.
            // this final set should be the one to be stored in local storage
            // (and e.g. used by the annotator).

            if (!sequence) {
                // reset, no filtering needed
                $scope.images.sequence = $scope.images.ids;
            } else {
                $scope.images.sequence = sequence;
                // take only those IDs that actually belong to the transect
                // (e.g. when IDs are taken from local storage but the transect has changed)
                filterSubset($scope.images.sequence, $scope.images.ids, true);
            }

            window.localStorage[imagesLocalStorageKey] = JSON.stringify($scope.images.sequence);
            // reset limit
            $scope.images.limit = initialLimit;
            $scope.$broadcast('transects.images.new-sequence');
        };

        $scope.addImageFlags = function (name, ids, title) {
            $scope.images.flags[name] = {
                name: name,
                ids: ids,
                title: title
            };
        };

        $scope.removeImageFlags = function (name) {
            delete $scope.images.flags[name];
        };

        $scope.getFlagsFor = function (id) {
            var output = [];
            var flags = $scope.images.flags;
            for (var name in flags) {
                if (flags[name].ids.indexOf(id) !== -1) {
                    output.push(flags[name]);
                }
            }

            return output;
        };
	}
);
