/**
 * @ngdoc factory
 * @name Report
 * @memberOf dias.projects
 * @description Provides the resource for requesting project reports
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// request a basic report
Report.getBasic({project_id: 1}, {});

// request a extended report
Report.getExtended({project_id: 1}, {});

// request a full report
Report.getFull({project_id: 1}, {});

 */
angular.module('dias.projects').factory('Report', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/projects/:project_id/reports/:type', {}, {
        getBasic: {method: 'POST', params: {type: 'basic'}},
        getExtended: {method: 'POST', params: {type: 'extended'}},
        getFull: {method: 'POST', params: {type: 'full'}}
    });
});
