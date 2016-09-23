/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AnnotationFilterController
 * @memberOf dias.annotations
 * @description Controller for the annotations filter function in the sidebar
 */
angular.module('dias.annotations').controller('AnnotationFilterController', function ($scope, annotations, AnnotationFilters, ANNOTATION_SESSIONS) {
    "use strict";

    var clearFilter = function () {
        $scope.selected.input = null;
        if (annotations.hasActiveFilters()) {
            annotations.clearActiveFilters();
            annotations.refreshFiltering();
        }
    };

    $scope.available = {
        filters: [
            {
                name: 'label',
                typeahead: annotations.getAvailableLabels,
                create: AnnotationFilters.label
            },
            {
                name: 'user',
                typeahead: function () {
                    var users = annotations.getAvailableUsers();
                    return users.map(function (user) {
                        user = angular.copy(user);
                        user.name = user.firstname + ' ' + user.lastname;
                        return user;
                    });
                },
                create: AnnotationFilters.user
            },
            {
                name: 'shape',
                typeahead: annotations.getAvailableShapes,
                create: AnnotationFilters.shape
            },
            {
                name: 'session',
                typeahead: function () {
                    return ANNOTATION_SESSIONS;
                },
                create: AnnotationFilters.session
            }
        ]
    };

    $scope.selected = {
        filter: $scope.available.filters[0],
        input: null
    };

    $scope.getTypeaheadItems = function () {
        return $scope.selected.filter.typeahead();
    };

    $scope.selectFilter = function (item) {
        annotations.setFilter($scope.selected.filter.create(item.id));
        annotations.refreshFiltering();
    };

    $scope.$on('$destroy', clearFilter);
});
