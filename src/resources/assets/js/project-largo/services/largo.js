/**
 * @namespace biigle.largo
 * @ngdoc service
 * @name largo
 * @memberOf biigle.largo
 * @description Override the biigle.largo largo service to work for a whole project.
 */
angular.module('biigle.project-largo').service('largo', function (PROJECT_ID, ProjectFilterAnnotationLabel, Largo) {
    "use strict";

    this.getAnnotations = function (label_id) {
        return ProjectFilterAnnotationLabel.query({
            project_id: PROJECT_ID,
            label_id: label_id
        });
    };

    this.save = function (dismissed, changed) {
        return Largo.save(
            {project_id: PROJECT_ID},
            {dismissed: dismissed, changed: changed}
        );
    };
});
