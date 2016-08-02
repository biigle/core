/**
 * @namespace dias.annotations
 * @ngdoc factory
 * @name AnnotationFilters
 * @memberOf dias.annotations
 * @description Provides functions that filter annotations based on different properties
 */
angular.module('dias.annotations').factory('AnnotationFilters', function () {
    "use strict";

    /*
     * Each item is a function that gets one or more parameters for filtering.
     * The function returns a filter function which is specific for the given
     * parameter(s). The filter function gets an input object that consists of
     * a 'flat' list of annotations and a 'groupedByLabel' object (see the annotations
     * service). The filter function should return an object similar to the input object
     * but with the filtered out items removed from 'flat' and 'groupedByLabel'.
     */
    return {
        label: function (labelId) {
            return function (input) {
                var groupedByLabel = {};
                if (input.groupedByLabel.hasOwnProperty(labelId)) {
                    groupedByLabel[labelId] = input.groupedByLabel[labelId];
                }

                var flat = input.flat.filter(function (item) {
                    item.labels = item.labels.filter(function (annotationLabel) {
                        return annotationLabel.label.id === labelId;
                    });

                    return item.labels.length > 0;
                });

                return {
                    groupedByLabel: groupedByLabel,
                    flat: flat
                };
            };
        },
        user: function (userId) {
            return function (input) {
                var groupedByLabel = input.groupedByLabel;
                var annotations;
                for (var id in groupedByLabel) {
                    if (groupedByLabel.hasOwnProperty(id)) {
                        annotations = groupedByLabel[id].annotations;
                        for (var i = annotations.length - 1; i >= 0; i--) {
                            if (annotations[i].label.user.id !== userId) {
                                annotations.splice(i, 1);
                            }
                        }

                        if (annotations.length === 0) {
                            delete groupedByLabel[id];
                        }
                    }
                }

                var flat = input.flat.filter(function (item) {
                    item.labels = item.labels.filter(function (annotationLabel) {
                        return annotationLabel.user.id === userId;
                    });

                    return item.labels.length > 0;
                });

                return {
                    groupedByLabel: groupedByLabel,
                    flat: flat
                };
            };
        },
        shape: function (shapeId) {
            return function (input) {
                var groupedByLabel = input.groupedByLabel;
                var annotations;
                for (var id in groupedByLabel) {
                    if (groupedByLabel.hasOwnProperty(id)) {
                        annotations = groupedByLabel[id].annotations;
                        for (var i = annotations.length - 1; i >= 0; i--) {
                            if (annotations[i].annotation.shape_id !== shapeId) {
                                annotations.splice(i, 1);
                            }
                        }

                        if (annotations.length === 0) {
                            delete groupedByLabel[id];
                        }
                    }
                }

                var flat = input.flat.filter(function (item) {
                    return item.shape_id === shapeId;
                });

                return {
                    groupedByLabel: groupedByLabel,
                    flat: flat
                };
            };
        }
    };
});
