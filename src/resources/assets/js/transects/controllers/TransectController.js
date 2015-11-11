/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name TransectController
 * @memberOf dias.transects
 * @description Global controller for the transects page
 */
angular.module('dias.transects').controller('TransectController', function ($scope, $attrs, TransectImage) {
		"use strict";

        // number of initially shown images
        var initialLimit = 20;

        var imagesLocalStorageKey = 'dias.transects.' + $attrs.transectId + '.images';

        $scope.transectId = $attrs.transectId;

        $scope.images = {
            // all image IDs of the transect in arbirtary ordering
            ids: [],
            // the currently displayed ordering of images (as array of image IDs)
            sequence: [],
            // number of currently shown images
            limit: initialLimit,
            // number of overall images
            length: undefined
        };

        // comparison function for array.sort() with numbers
        var compareNumbers = function (a, b) {
            return a - b;
        };

        // returns the ids array without the elements that are not present in $scope.images.ids
        // assumes that $scope.images.ids is sorted
        // doesn't change the ordering of elements in the ids array
        var filterSubsetOfTransectIDs = function (ids) {
            var transectIds = $scope.images.ids;
            // clone the input array (so it isn't changed by sorting), then sort it
            var sortedIds = ids.slice(0).sort(compareNumbers);
            // here we will put all items of ids that are not present in transectIds
            var notThere = [];
            var i = 0, j = 0;
            while (i < transectIds.length && j < sortedIds.length) {
                if (transectIds[i] < sortedIds[j]) {
                    i++;
                } else if (transectIds[i] === sortedIds[j]) {
                    i++;
                    j++;
                } else {
                    notThere.push(sortedIds[j++]);
                }
            }
            // ad possible missing items if sortedIds is longer than transectIds
            while (j < sortedIds.length) {
                notThere.push(sortedIds[j++]);
            }

            // now remove all elements from ids that are not in transectIds
            // we do it this way because the notThere array will probably always be very small
            for (i = 0; i < notThere.length; i++) {
                // we can assume that indexOf is never <0
                ids.splice(ids.indexOf(notThere[i]), 1);
            }
        };

        $scope.progress = function () {
            return {
                width:  ($scope.images.length ?
                            Math.min($scope.images.limit / $scope.images.length, 1) * 100
                            : 0
                        ) + '%'
            };
        };

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
                filterSubsetOfTransectIDs($scope.images.sequence);
            }

            window.localStorage[imagesLocalStorageKey] = JSON.stringify($scope.images.sequence);
            // reset limit
            $scope.images.limit = initialLimit;
            $scope.$broadcast('transects.images.new-sequence');
        };

        // array of all image ids of this transect
        $scope.images.ids = TransectImage.query({transect_id: $scope.transectId}, function (ids) {
            // sort the IDs, we'll need this for the later subset-check of new image seuqences
            $scope.images.ids.sort(compareNumbers);
            $scope.images.length = ids.length;

            if (window.localStorage[imagesLocalStorageKey]) {
                $scope.images.sequence = JSON.parse(window.localStorage[imagesLocalStorageKey]);
                // check if all images loaded from storage are still there in the transect.
                // some of them may have been deleted in the meantime.
                filterSubsetOfTransectIDs($scope.images.sequence);
            } else {
                $scope.images.sequence = ids;
            }
        });
	}
);
