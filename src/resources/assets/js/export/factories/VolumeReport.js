/**
 * @ngdoc factory
 * @name VolumeReport
 * @memberOf biigle.export
 * @description Provides the resource for requesting volume reports
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// request a basic report with restricted annotation area
VolumeReport.requestBasicAnnotationReport({volume_id: 1}, {restrict: 1});

// request a extended report without restricted annotation area
VolumeReport.requestExtendedAnnotationReport({volume_id: 1}, {restrict: 0});

// request a full report without restricted annotation area
VolumeReport.requestFullAnnotationReport({volume_id: 1}, {});

// request an image label report
VolumeReport.requestBasicImageLabelReport({volume_id: 1}, {});

 */
angular.module('biigle.export').factory('VolumeReport', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/volumes/:volume_id/reports/:type/:variant', {}, {
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
