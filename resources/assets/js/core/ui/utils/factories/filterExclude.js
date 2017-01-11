/**
 * @namespace biigle.ui.utils
 * @ngdoc factory
 * @name filterExclude
 * @memberOf biigle.ui.utils
 * @description Provides a function that removes all numbers of the first argument array (in place!) that are not present in the second argument array. Accepts a third argument boolean as to whether the second argument array is already sorted.
 */
angular.module('biigle.ui.utils').factory('filterExclude', function () {
        "use strict";
        // comparison function for array.sort() with numbers
        var compareNumbers = function (a, b) {
            return a - b;
        };

        // returns the array containing only elements that are not present in superset
        // assumes that superset is sorted if sorted evaluates to true
        // doesn't change the ordering of elements in the subset array
        var filterExclude = function (subset, superset, sorted) {
            if (!sorted) {
                // clone array so sorting doesn't affect original
                superset = superset.slice(0).sort(compareNumbers);
            }
            // clone the input array (so it isn't changed by sorting), then sort it
            var sortedSubset = subset.slice(0).sort(compareNumbers);
            var i = 0, j = 0;
            while (i < superset.length && j < sortedSubset.length) {
                if (superset[i] < sortedSubset[j]) {
                    i++;
                } else if (superset[i] === sortedSubset[j]) {
                    // remove tha value that is both in subset and superset
                    subset.splice(subset.indexOf(sortedSubset[j]), 1);
                    i++;
                    j++;
                } else {
                    j++;
                }
            }
        };

        return filterExclude;
    }
);
