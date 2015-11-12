/**
 * @namespace dias.ui.utils
 * @ngdoc factory
 * @name filterSubset
 * @memberOf dias.ui.utils
 * @description Provides a function that removes all numbers of the first argument array (in place!) that are not present in the second argument array. Accepts a third argument boolean as to whether the second argument array is already sorted.
 */
angular.module('dias.ui.utils').factory('filterSubset', function () {
        "use strict";
        // comparison function for array.sort() with numbers
        var compareNumbers = function (a, b) {
            return a - b;
        };

        // returns the subset array without the elements that are not present in superset
        // assumes that superset is sorted if sorted evaluates to true
        // doesn't change the ordering of elements in the subset array
        var filterSubset = function (subset, superset, sorted) {
            if (!sorted) {
                // clone array so sorting doesn't affect original
                superset = superset.slice(0).sort(compareNumbers);
            }
            // clone the input array (so it isn't changed by sorting), then sort it
            var sortedSubset = subset.slice(0).sort(compareNumbers);
            // here we will put all items of subset that are not present in superset
            var notThere = [];
            var i = 0, j = 0;
            while (i < superset.length && j < sortedSubset.length) {
                if (superset[i] < sortedSubset[j]) {
                    i++;
                } else if (superset[i] === sortedSubset[j]) {
                    i++;
                    j++;
                } else {
                    notThere.push(sortedSubset[j++]);
                }
            }
            // ad possible missing items if sortedSubset is longer than superset
            while (j < sortedSubset.length) {
                notThere.push(sortedSubset[j++]);
            }

            // now remove all elements from subset that are not in superset
            // we do it this way because the notThere array will probably always be very small
            for (i = 0; i < notThere.length; i++) {
                // we can assume that indexOf is never <0
                subset.splice(subset.indexOf(notThere[i]), 1);
            }
        };

        return filterSubset;
    }
);
