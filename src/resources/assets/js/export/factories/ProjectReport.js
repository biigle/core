/**
 * @ngdoc factory
 * @name ProjectReport
 * @memberOf biigle.export
 * @description Provides the resource for requesting project reports
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// request a basic report with restricted annotation area
ProjectReport.requestBasicAnnotationReport({project_id: 1}, {restrict: 1});

// request a extended report without restricted annotation area
ProjectReport.requestExtendedAnnotationReport({project_id: 1}, {restrict: 0});

// request a full report without restricted annotation area
ProjectReport.requestFullAnnotationReport({project_id: 1}, {});

// request an image label report
ProjectReport.requestBasicImageLabelReport({project_id: 1}, {});

 */
angular.module('biigle.export').factory('ProjectReport', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/projects/:project_id/reports/:type/:variant', {}, {
        requestGenericReport: {
            method: 'POST'
        },
        requestBasicAnnotationReport: {
            method: 'POST',
            params: {type: 'annotations', variant: 'basic'}
        },
        requestExtendedAnnotationReport: {
            method: 'POST',
            params: {type: 'annotations', variant: 'extended'}
        },
        requestFullAnnotationReport: {
            method: 'POST',
            params: {type: 'annotations', variant: 'full'}
        },
        requestCsvAnnotationReport: {
            method: 'POST',
            params: {type: 'annotations', variant: 'csv'}
        },
        requestAnnotationAreaReport: {
            method: 'POST',
            params: {type: 'annotations', variant: 'area'}
        },
        requestBasicImageLabelReport: {
            method: 'POST',
            params: {type: 'image-labels', variant: 'basic'}
        },
        requestCsvImageLabelReport: {
            method: 'POST',
            params: {type: 'image-labels', variant: 'csv'
        }}
    });
});
