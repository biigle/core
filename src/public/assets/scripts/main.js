/**
 * @namespace dias.ate
 * @description The DIAS ATE module.
 */
angular.module('dias.ate', ['dias.transects']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('dias.ate').config(["$compileProvider", function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
}]);

/**
 * @namespace dias.ate
 * @ngdoc controller
 * @name AteController
 * @memberOf dias.ate
 * @description Controller for the transect view
 */
angular.module('dias.ate').controller('AteController', ["$scope", "TRANSECT_IMAGES", "ATE_TRANSECT_ID", "labels", "images", "TransectFilterAnnotationLabel", "msg", function ($scope, TRANSECT_IMAGES, ATE_TRANSECT_ID, labels, images, TransectFilterAnnotationLabel, msg) {
		"use strict";

        // cache that maps label IDs to IDs of annotations with this label
        var labelMapCache = {};

        var step = 0;

        var annotationsExist = false;

        var loading = false;

        var handleError = function (response) {
            loading = false;
            msg.responseError(response);
        };

        var updateDisplayedAnnotations = function (ids) {
            loading = false;
            annotationsExist = ids.length > 0;
            if (annotationsExist) {
                Array.prototype.push.apply(TRANSECT_IMAGES, ids);
            }
            images.updateFiltering();
        };

        var handleSelectedLabel = function (label) {
            if (!label) {
                return;
            }

            var id = label.id;
            TRANSECT_IMAGES.length = 0;
            images.updateFiltering();
            images.scrollToPercent(0);

            if (labelMapCache.hasOwnProperty(id)) {
                updateDisplayedAnnotations(labelMapCache[id]);
            } else {
                loading = true;
                labelMapCache[id] = TransectFilterAnnotationLabel.query(
                    {transect_id: ATE_TRANSECT_ID, label_id: id},
                    updateDisplayedAnnotations,
                    msg.responseError
                );
            }
        };

        $scope.annotationsExist = function () {
            return annotationsExist;
        };

        $scope.isInDismissMode = function () {
            return step === 0;
        };

        $scope.hasSelectedLabel = labels.hasSelectedLabel;

        $scope.getSelectedLabelName = function () {
            return labels.getSelectedLabel().name;
        };

        $scope.isLoading = function () {
            return loading;
        };

        $scope.$watch(labels.getSelectedLabel, handleSelectedLabel);
	}]
);

/**
 * @namespace dias.ate
 * @ngdoc directive
 * @name ateFigure
 * @memberOf dias.ate
 * @description An ATE annotation patch image
 */
angular.module('dias.ate').directive('ateFigure', function () {
        "use strict";

        return {
            restrict: 'A',

            controller: ["$scope", "annotations", "msg", function ($scope, annotations, msg) {

                var dismissed = false;

                $scope.handleClick = function (e) {
                    annotations.toggleDismiss($scope.id);
                };

                $scope.isDismissed = function () {
                    return annotations.isDismissed($scope.id);
                };

                $scope.getClass = function () {
                    return {
                        'label-dismissed': $scope.isDismissed()
                    };
                };
            }]
        };
    }
);

/**
 * @ngdoc factory
 * @name TransectFilterAnnotationLabel
 * @memberOf dias.ate
 * @description Provides the resource to get annotations with a specific label in a transect
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get annotations with label 2
var annotations = TransectFilterAnnotationLabel.query({transect_id: 1, label_id: 2}, function () {
   console.log(annotations); // [12, 24, 32, ...]
});
 *
 */
angular.module('dias.ate').factory('TransectFilterAnnotationLabel', ["$resource", "URL", function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/transects/:transect_id/annotations/filter/label/:label_id');
}]);

/**
 * @namespace dias.ate
 * @ngdoc service
 * @name annotations
 * @memberOf dias.ate
 * @description Service for managing the dismissed/replaced annotation labels of the ATE view
 */
angular.module('dias.ate').service('annotations', ["labels", function (labels) {
        "use strict";

        // maps label IDs to the IDs of dismissed annotations for the label
        var dismissed = {};
        // array of unique IDs of dismissed annotations
        // (they may occur multiple times in the 'dismissed' map)
        var dismissedFlat = [];

        var addToDismissedFlat = function (id) {
            if (dismissedFlat.indexOf(id) === -1) {
                dismissedFlat.push(id);
            }
        };

        var removeFromDismissedFlat = function (id) {
            var index = dismissedFlat.indexOf(id);
            if (index !== -1) {
                dismissedFlat.splice(index, 1);
            }
        };

        this.toggleDismiss = function (annotationId) {
            var labelId = labels.getSelectedLabel().id;
            if (dismissed.hasOwnProperty(labelId)) {
                var index = dismissed[labelId].indexOf(annotationId);
                if (index !== -1) {
                    // if annotation already was dismissed, revert
                    dismissed[labelId].splice(index, 1);
                    removeFromDismissedFlat(annotationId);
                } else {
                    // if annotation wasn't dismissed, dismiss
                    dismissed[labelId].push(annotationId);
                    addToDismissedFlat(annotationId);
                }
            } else {
                // if property didn't exist, the annotation wasn't already dismissed
                dismissed[labelId] = [annotationId];
                addToDismissedFlat(annotationId);
            }
        };

        // checks if the annotation was dismissed *for the currently selected label*
        this.isDismissed = function (annotationId) {
            var labelId = labels.getSelectedLabel().id;
            return dismissed.hasOwnProperty(labelId) &&
                dismissed[labelId].indexOf(annotationId) !== -1;
        };

        this.getDismissedIds = function () {
            return dismissedFlat;
        };
    }]
);

/**
 * @namespace dias.ate
 * @ngdoc service
 * @name labels
 * @memberOf dias.ate
 * @description Service managing the list of labels. This service overrides the labels service of dias.transects!
 */
angular.module('dias.ate').service('labels', ["LABEL_TREES", function (LABEL_TREES) {
        "use strict";

        var labels = [];

        // data structure used to build the tree display. for each label tree there is
        // a map of label IDs to the child label objects
        var treesCompiled = {};

        // IDs of all labels that are currently open
        // (all parent labels of the selected label)
        var openHierarchy = [];

        var selectedLabel = null;

        var init = function () {
            // parse label trees to spcial data format for display
            var name;
            var compileTree = function (label) {
                var parent = label.parent_id;
                if (treesCompiled[name][parent]) {
                    treesCompiled[name][parent].push(label);
                } else {
                    treesCompiled[name][parent] = [label];
                }
            };

            for (var i = LABEL_TREES.length - 1; i >= 0; i--) {
                name = LABEL_TREES[i].name;
                treesCompiled[name] = {};
                LABEL_TREES[i].labels.forEach(compileTree);
                labels = labels.concat(LABEL_TREES[i].labels);
            }
        };

        var getLabel = function (id) {
            for (var i = labels.length - 1; i >= 0; i--) {
                if (labels[i].id === id) {
                    return labels[i];
                }
            }

            return null;
        };

        var updateOpenHierarchy = function (label) {
            var currentLabel = label;
            openHierarchy.length = 0;

            if (!currentLabel) return;

            while (currentLabel.parent_id !== null) {
                openHierarchy.unshift(currentLabel.parent_id);
                currentLabel = getLabel(currentLabel.parent_id);
            }
        };

        this.getLabels = function () {
            return labels;
        };

        this.getLabelTrees = function () {
            return treesCompiled;
        };

        this.selectLabel = function (label) {
            updateOpenHierarchy(label);
            selectedLabel = label;
        };

        this.treeItemIsOpen = function (label) {
            return openHierarchy.indexOf(label.id) !== -1;
        };

        this.treeItemIsSelected = function (label) {
            return selectedLabel && selectedLabel.id === label.id;
        };

        this.getSelectedLabel = function () {
            return selectedLabel;
        };

        this.hasSelectedLabel = function () {
            return selectedLabel !== null;
        };

        init();
    }]
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9BdGVDb250cm9sbGVyLmpzIiwiZGlyZWN0aXZlcy9hdGVGaWd1cmUuanMiLCJmYWN0b3JpZXMvVHJhbnNlY3RGaWx0ZXJBbm5vdGF0aW9uTGFiZWwuanMiLCJzZXJ2aWNlcy9hbm5vdGF0aW9ucy5qcyIsInNlcnZpY2VzL2xhYmVscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUlBLFFBQUEsT0FBQSxZQUFBLENBQUE7Ozs7OztBQU1BLFFBQUEsT0FBQSxZQUFBLDRCQUFBLFVBQUEsa0JBQUE7SUFDQTs7SUFFQSxpQkFBQSxpQkFBQTs7Ozs7Ozs7OztBQ05BLFFBQUEsT0FBQSxZQUFBLFdBQUEsOEhBQUEsVUFBQSxRQUFBLGlCQUFBLGlCQUFBLFFBQUEsUUFBQSwrQkFBQSxLQUFBO0VBQ0E7OztRQUdBLElBQUEsZ0JBQUE7O1FBRUEsSUFBQSxPQUFBOztRQUVBLElBQUEsbUJBQUE7O1FBRUEsSUFBQSxVQUFBOztRQUVBLElBQUEsY0FBQSxVQUFBLFVBQUE7WUFDQSxVQUFBO1lBQ0EsSUFBQSxjQUFBOzs7UUFHQSxJQUFBLDZCQUFBLFVBQUEsS0FBQTtZQUNBLFVBQUE7WUFDQSxtQkFBQSxJQUFBLFNBQUE7WUFDQSxJQUFBLGtCQUFBO2dCQUNBLE1BQUEsVUFBQSxLQUFBLE1BQUEsaUJBQUE7O1lBRUEsT0FBQTs7O1FBR0EsSUFBQSxzQkFBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLENBQUEsT0FBQTtnQkFDQTs7O1lBR0EsSUFBQSxLQUFBLE1BQUE7WUFDQSxnQkFBQSxTQUFBO1lBQ0EsT0FBQTtZQUNBLE9BQUEsZ0JBQUE7O1lBRUEsSUFBQSxjQUFBLGVBQUEsS0FBQTtnQkFDQSwyQkFBQSxjQUFBO21CQUNBO2dCQUNBLFVBQUE7Z0JBQ0EsY0FBQSxNQUFBLDhCQUFBO29CQUNBLENBQUEsYUFBQSxpQkFBQSxVQUFBO29CQUNBO29CQUNBLElBQUE7Ozs7O1FBS0EsT0FBQSxtQkFBQSxZQUFBO1lB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QUE7WUFDQSxJQUFBLGVBQUE7WUFDQSxjQUFBLFNBQUE7O1lBRUEsSUFBQSxDQUFBLGNBQUE7O1lBRUEsT0FBQSxhQUFBLGNBQUEsTUFBQTtnQkFDQSxjQUFBLFFBQUEsYUFBQTtnQkFDQSxlQUFBLFNBQUEsYUFBQTs7OztRQUlBLEtBQUEsWUFBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsS0FBQSxnQkFBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsS0FBQSxjQUFBLFVBQUEsT0FBQTtZQUNBLG9CQUFBO1lBQ0EsZ0JBQUE7OztRQUdBLEtBQUEsaUJBQUEsVUFBQSxPQUFBO1lBQ0EsT0FBQSxjQUFBLFFBQUEsTUFBQSxRQUFBLENBQUE7OztRQUdBLEtBQUEscUJBQUEsVUFBQSxPQUFBO1lBQ0EsT0FBQSxpQkFBQSxjQUFBLE9BQUEsTUFBQTs7O1FBR0EsS0FBQSxtQkFBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsS0FBQSxtQkFBQSxZQUFBO1lBQ0EsT0FBQSxrQkFBQTs7O1FBR0E7OztBQUdBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hdGVcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyBBVEUgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hdGUnLCBbJ2RpYXMudHJhbnNlY3RzJ10pO1xuXG4vKlxuICogRGlzYWJsZSBkZWJ1ZyBpbmZvIGluIHByb2R1Y3Rpb24gZm9yIGJldHRlciBwZXJmb3JtYW5jZS5cbiAqIHNlZTogaHR0cHM6Ly9jb2RlLmFuZ3VsYXJqcy5vcmcvMS40LjcvZG9jcy9ndWlkZS9wcm9kdWN0aW9uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmF0ZScpLmNvbmZpZyhmdW5jdGlvbiAoJGNvbXBpbGVQcm92aWRlcikge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgJGNvbXBpbGVQcm92aWRlci5kZWJ1Z0luZm9FbmFibGVkKGZhbHNlKTtcbn0pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYXRlXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQXRlQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYXRlXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHRyYW5zZWN0IHZpZXdcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXRlJykuY29udHJvbGxlcignQXRlQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFRSQU5TRUNUX0lNQUdFUywgQVRFX1RSQU5TRUNUX0lELCBsYWJlbHMsIGltYWdlcywgVHJhbnNlY3RGaWx0ZXJBbm5vdGF0aW9uTGFiZWwsIG1zZykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIC8vIGNhY2hlIHRoYXQgbWFwcyBsYWJlbCBJRHMgdG8gSURzIG9mIGFubm90YXRpb25zIHdpdGggdGhpcyBsYWJlbFxuICAgICAgICB2YXIgbGFiZWxNYXBDYWNoZSA9IHt9O1xuXG4gICAgICAgIHZhciBzdGVwID0gMDtcblxuICAgICAgICB2YXIgYW5ub3RhdGlvbnNFeGlzdCA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBsb2FkaW5nID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIGhhbmRsZUVycm9yID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICBtc2cucmVzcG9uc2VFcnJvcihyZXNwb25zZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHVwZGF0ZURpc3BsYXllZEFubm90YXRpb25zID0gZnVuY3Rpb24gKGlkcykge1xuICAgICAgICAgICAgbG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgYW5ub3RhdGlvbnNFeGlzdCA9IGlkcy5sZW5ndGggPiAwO1xuICAgICAgICAgICAgaWYgKGFubm90YXRpb25zRXhpc3QpIHtcbiAgICAgICAgICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShUUkFOU0VDVF9JTUFHRVMsIGlkcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbWFnZXMudXBkYXRlRmlsdGVyaW5nKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZVNlbGVjdGVkTGFiZWwgPSBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIGlmICghbGFiZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBpZCA9IGxhYmVsLmlkO1xuICAgICAgICAgICAgVFJBTlNFQ1RfSU1BR0VTLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICBpbWFnZXMudXBkYXRlRmlsdGVyaW5nKCk7XG4gICAgICAgICAgICBpbWFnZXMuc2Nyb2xsVG9QZXJjZW50KDApO1xuXG4gICAgICAgICAgICBpZiAobGFiZWxNYXBDYWNoZS5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcbiAgICAgICAgICAgICAgICB1cGRhdGVEaXNwbGF5ZWRBbm5vdGF0aW9ucyhsYWJlbE1hcENhY2hlW2lkXSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGxhYmVsTWFwQ2FjaGVbaWRdID0gVHJhbnNlY3RGaWx0ZXJBbm5vdGF0aW9uTGFiZWwucXVlcnkoXG4gICAgICAgICAgICAgICAgICAgIHt0cmFuc2VjdF9pZDogQVRFX1RSQU5TRUNUX0lELCBsYWJlbF9pZDogaWR9LFxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVEaXNwbGF5ZWRBbm5vdGF0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgbXNnLnJlc3BvbnNlRXJyb3JcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5hbm5vdGF0aW9uc0V4aXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGFubm90YXRpb25zRXhpc3Q7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzSW5EaXNtaXNzTW9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBzdGVwID09PSAwO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5oYXNTZWxlY3RlZExhYmVsID0gbGFiZWxzLmhhc1NlbGVjdGVkTGFiZWw7XG5cbiAgICAgICAgJHNjb3BlLmdldFNlbGVjdGVkTGFiZWxOYW1lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGxhYmVscy5nZXRTZWxlY3RlZExhYmVsKCkubmFtZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNMb2FkaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGxvYWRpbmc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLiR3YXRjaChsYWJlbHMuZ2V0U2VsZWN0ZWRMYWJlbCwgaGFuZGxlU2VsZWN0ZWRMYWJlbCk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hdGVcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGF0ZUZpZ3VyZVxuICogQG1lbWJlck9mIGRpYXMuYXRlXG4gKiBAZGVzY3JpcHRpb24gQW4gQVRFIGFubm90YXRpb24gcGF0Y2ggaW1hZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXRlJykuZGlyZWN0aXZlKCdhdGVGaWd1cmUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxuXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBhbm5vdGF0aW9ucywgbXNnKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgZGlzbWlzc2VkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUuaGFuZGxlQ2xpY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBhbm5vdGF0aW9ucy50b2dnbGVEaXNtaXNzKCRzY29wZS5pZCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICRzY29wZS5pc0Rpc21pc3NlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFubm90YXRpb25zLmlzRGlzbWlzc2VkKCRzY29wZS5pZCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICRzY29wZS5nZXRDbGFzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdsYWJlbC1kaXNtaXNzZWQnOiAkc2NvcGUuaXNEaXNtaXNzZWQoKVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFRyYW5zZWN0RmlsdGVyQW5ub3RhdGlvbkxhYmVsXG4gKiBAbWVtYmVyT2YgZGlhcy5hdGVcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgdG8gZ2V0IGFubm90YXRpb25zIHdpdGggYSBzcGVjaWZpYyBsYWJlbCBpbiBhIHRyYW5zZWN0XG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbm5vdGF0aW9ucyB3aXRoIGxhYmVsIDJcbnZhciBhbm5vdGF0aW9ucyA9IFRyYW5zZWN0RmlsdGVyQW5ub3RhdGlvbkxhYmVsLnF1ZXJ5KHt0cmFuc2VjdF9pZDogMSwgbGFiZWxfaWQ6IDJ9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhhbm5vdGF0aW9ucyk7IC8vIFsxMiwgMjQsIDMyLCAuLi5dXG59KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmF0ZScpLmZhY3RvcnkoJ1RyYW5zZWN0RmlsdGVyQW5ub3RhdGlvbkxhYmVsJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICByZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3RyYW5zZWN0cy86dHJhbnNlY3RfaWQvYW5ub3RhdGlvbnMvZmlsdGVyL2xhYmVsLzpsYWJlbF9pZCcpO1xufSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hdGVcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBhbm5vdGF0aW9uc1xuICogQG1lbWJlck9mIGRpYXMuYXRlXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSBmb3IgbWFuYWdpbmcgdGhlIGRpc21pc3NlZC9yZXBsYWNlZCBhbm5vdGF0aW9uIGxhYmVscyBvZiB0aGUgQVRFIHZpZXdcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXRlJykuc2VydmljZSgnYW5ub3RhdGlvbnMnLCBmdW5jdGlvbiAobGFiZWxzKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIC8vIG1hcHMgbGFiZWwgSURzIHRvIHRoZSBJRHMgb2YgZGlzbWlzc2VkIGFubm90YXRpb25zIGZvciB0aGUgbGFiZWxcbiAgICAgICAgdmFyIGRpc21pc3NlZCA9IHt9O1xuICAgICAgICAvLyBhcnJheSBvZiB1bmlxdWUgSURzIG9mIGRpc21pc3NlZCBhbm5vdGF0aW9uc1xuICAgICAgICAvLyAodGhleSBtYXkgb2NjdXIgbXVsdGlwbGUgdGltZXMgaW4gdGhlICdkaXNtaXNzZWQnIG1hcClcbiAgICAgICAgdmFyIGRpc21pc3NlZEZsYXQgPSBbXTtcblxuICAgICAgICB2YXIgYWRkVG9EaXNtaXNzZWRGbGF0ID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBpZiAoZGlzbWlzc2VkRmxhdC5pbmRleE9mKGlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBkaXNtaXNzZWRGbGF0LnB1c2goaWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciByZW1vdmVGcm9tRGlzbWlzc2VkRmxhdCA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gZGlzbWlzc2VkRmxhdC5pbmRleE9mKGlkKTtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBkaXNtaXNzZWRGbGF0LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy50b2dnbGVEaXNtaXNzID0gZnVuY3Rpb24gKGFubm90YXRpb25JZCkge1xuICAgICAgICAgICAgdmFyIGxhYmVsSWQgPSBsYWJlbHMuZ2V0U2VsZWN0ZWRMYWJlbCgpLmlkO1xuICAgICAgICAgICAgaWYgKGRpc21pc3NlZC5oYXNPd25Qcm9wZXJ0eShsYWJlbElkKSkge1xuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGRpc21pc3NlZFtsYWJlbElkXS5pbmRleE9mKGFubm90YXRpb25JZCk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBhbm5vdGF0aW9uIGFscmVhZHkgd2FzIGRpc21pc3NlZCwgcmV2ZXJ0XG4gICAgICAgICAgICAgICAgICAgIGRpc21pc3NlZFtsYWJlbElkXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVGcm9tRGlzbWlzc2VkRmxhdChhbm5vdGF0aW9uSWQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGFubm90YXRpb24gd2Fzbid0IGRpc21pc3NlZCwgZGlzbWlzc1xuICAgICAgICAgICAgICAgICAgICBkaXNtaXNzZWRbbGFiZWxJZF0ucHVzaChhbm5vdGF0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICBhZGRUb0Rpc21pc3NlZEZsYXQoYW5ub3RhdGlvbklkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGlmIHByb3BlcnR5IGRpZG4ndCBleGlzdCwgdGhlIGFubm90YXRpb24gd2Fzbid0IGFscmVhZHkgZGlzbWlzc2VkXG4gICAgICAgICAgICAgICAgZGlzbWlzc2VkW2xhYmVsSWRdID0gW2Fubm90YXRpb25JZF07XG4gICAgICAgICAgICAgICAgYWRkVG9EaXNtaXNzZWRGbGF0KGFubm90YXRpb25JZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gY2hlY2tzIGlmIHRoZSBhbm5vdGF0aW9uIHdhcyBkaXNtaXNzZWQgKmZvciB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGxhYmVsKlxuICAgICAgICB0aGlzLmlzRGlzbWlzc2VkID0gZnVuY3Rpb24gKGFubm90YXRpb25JZCkge1xuICAgICAgICAgICAgdmFyIGxhYmVsSWQgPSBsYWJlbHMuZ2V0U2VsZWN0ZWRMYWJlbCgpLmlkO1xuICAgICAgICAgICAgcmV0dXJuIGRpc21pc3NlZC5oYXNPd25Qcm9wZXJ0eShsYWJlbElkKSAmJlxuICAgICAgICAgICAgICAgIGRpc21pc3NlZFtsYWJlbElkXS5pbmRleE9mKGFubm90YXRpb25JZCkgIT09IC0xO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0RGlzbWlzc2VkSWRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGRpc21pc3NlZEZsYXQ7XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmF0ZVxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIGxhYmVsc1xuICogQG1lbWJlck9mIGRpYXMuYXRlXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSBtYW5hZ2luZyB0aGUgbGlzdCBvZiBsYWJlbHMuIFRoaXMgc2VydmljZSBvdmVycmlkZXMgdGhlIGxhYmVscyBzZXJ2aWNlIG9mIGRpYXMudHJhbnNlY3RzIVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hdGUnKS5zZXJ2aWNlKCdsYWJlbHMnLCBmdW5jdGlvbiAoTEFCRUxfVFJFRVMpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGxhYmVscyA9IFtdO1xuXG4gICAgICAgIC8vIGRhdGEgc3RydWN0dXJlIHVzZWQgdG8gYnVpbGQgdGhlIHRyZWUgZGlzcGxheS4gZm9yIGVhY2ggbGFiZWwgdHJlZSB0aGVyZSBpc1xuICAgICAgICAvLyBhIG1hcCBvZiBsYWJlbCBJRHMgdG8gdGhlIGNoaWxkIGxhYmVsIG9iamVjdHNcbiAgICAgICAgdmFyIHRyZWVzQ29tcGlsZWQgPSB7fTtcblxuICAgICAgICAvLyBJRHMgb2YgYWxsIGxhYmVscyB0aGF0IGFyZSBjdXJyZW50bHkgb3BlblxuICAgICAgICAvLyAoYWxsIHBhcmVudCBsYWJlbHMgb2YgdGhlIHNlbGVjdGVkIGxhYmVsKVxuICAgICAgICB2YXIgb3BlbkhpZXJhcmNoeSA9IFtdO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZExhYmVsID0gbnVsbDtcblxuICAgICAgICB2YXIgaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIHBhcnNlIGxhYmVsIHRyZWVzIHRvIHNwY2lhbCBkYXRhIGZvcm1hdCBmb3IgZGlzcGxheVxuICAgICAgICAgICAgdmFyIG5hbWU7XG4gICAgICAgICAgICB2YXIgY29tcGlsZVRyZWUgPSBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gbGFiZWwucGFyZW50X2lkO1xuICAgICAgICAgICAgICAgIGlmICh0cmVlc0NvbXBpbGVkW25hbWVdW3BhcmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdHJlZXNDb21waWxlZFtuYW1lXVtwYXJlbnRdLnB1c2gobGFiZWwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRyZWVzQ29tcGlsZWRbbmFtZV1bcGFyZW50XSA9IFtsYWJlbF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IExBQkVMX1RSRUVTLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9IExBQkVMX1RSRUVTW2ldLm5hbWU7XG4gICAgICAgICAgICAgICAgdHJlZXNDb21waWxlZFtuYW1lXSA9IHt9O1xuICAgICAgICAgICAgICAgIExBQkVMX1RSRUVTW2ldLmxhYmVscy5mb3JFYWNoKGNvbXBpbGVUcmVlKTtcbiAgICAgICAgICAgICAgICBsYWJlbHMgPSBsYWJlbHMuY29uY2F0KExBQkVMX1RSRUVTW2ldLmxhYmVscyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGdldExhYmVsID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gbGFiZWxzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxhYmVsc1tpXS5pZCA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxhYmVsc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciB1cGRhdGVPcGVuSGllcmFyY2h5ID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudExhYmVsID0gbGFiZWw7XG4gICAgICAgICAgICBvcGVuSGllcmFyY2h5Lmxlbmd0aCA9IDA7XG5cbiAgICAgICAgICAgIGlmICghY3VycmVudExhYmVsKSByZXR1cm47XG5cbiAgICAgICAgICAgIHdoaWxlIChjdXJyZW50TGFiZWwucGFyZW50X2lkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgb3BlbkhpZXJhcmNoeS51bnNoaWZ0KGN1cnJlbnRMYWJlbC5wYXJlbnRfaWQpO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRMYWJlbCA9IGdldExhYmVsKGN1cnJlbnRMYWJlbC5wYXJlbnRfaWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TGFiZWxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGxhYmVscztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExhYmVsVHJlZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJlZXNDb21waWxlZDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNlbGVjdExhYmVsID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICB1cGRhdGVPcGVuSGllcmFyY2h5KGxhYmVsKTtcbiAgICAgICAgICAgIHNlbGVjdGVkTGFiZWwgPSBsYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnRyZWVJdGVtSXNPcGVuID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICByZXR1cm4gb3BlbkhpZXJhcmNoeS5pbmRleE9mKGxhYmVsLmlkKSAhPT0gLTE7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy50cmVlSXRlbUlzU2VsZWN0ZWQgPSBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZExhYmVsICYmIHNlbGVjdGVkTGFiZWwuaWQgPT09IGxhYmVsLmlkO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0U2VsZWN0ZWRMYWJlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZExhYmVsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaGFzU2VsZWN0ZWRMYWJlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZExhYmVsICE9PSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIGluaXQoKTtcbiAgICB9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
