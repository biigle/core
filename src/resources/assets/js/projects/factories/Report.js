/**
 * @ngdoc factory
 * @name Report
 * @memberOf dias.projects
 * @description Provides the resource for requesting project reports
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// request a basic report with restricted annotation area
Report.getBasic({project_id: 1}, {restrict: 1});

// request a extended report without restricted annotation area
Report.getExtended({project_id: 1}, {restrict: 0});

// request a full report without restricted annotation area
Report.getFull({project_id: 1}, {});

// request an image label report
Report.getImageLabel({project_id: 1}, {});

 */
angular.module('dias.projects').factory('Report', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/projects/:project_id/reports/:type', {}, {
        getBasic: {method: 'POST', params: {type: 'annotations/basic'}},
        getExtended: {method: 'POST', params: {type: 'annotations/extended'}},
        getFull: {method: 'POST', params: {type: 'annotations/full'}},
        getCsv: {method: 'POST', params: {type: 'annotations/csv'}},
        getImageLabel: {method: 'POST', params: {type: 'image-labels/standard'}}
    });
});
