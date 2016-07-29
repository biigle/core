/**
 * @namespace dias.ate
 * @ngdoc service
 * @name ate
 * @memberOf dias.ate
 * @description Override the dias.ate ate service to work for a whole project.
 */
angular.module('dias.project-ate').service('ate', function (PROJECT_ID, ProjectFilterAnnotationLabel, Ate) {
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
