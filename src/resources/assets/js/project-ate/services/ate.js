/**
 * @namespace biigle.ate
 * @ngdoc service
 * @name ate
 * @memberOf biigle.ate
 * @description Override the biigle.ate ate service to work for a whole project.
 */
angular.module('biigle.project-ate').service('ate', function (PROJECT_ID, ProjectFilterAnnotationLabel, Ate) {
    "use strict";

    this.getAnnotations = function (label_id) {
        return ProjectFilterAnnotationLabel.query({
            project_id: PROJECT_ID,
            label_id: label_id
        });
    };

    this.save = function (dismissed, changed) {
        return Ate.save(
            {project_id: PROJECT_ID},
            {dismissed: dismissed, changed: changed}
        );
    };
});
