/**
 * @namespace dias.transects
 * @ngdoc directive
 * @name lazyImage
 * @memberOf dias.transects
 * @description A lazy loading image
 */
angular.module('dias.transects').directive('lazyImage', function ($q) {
        "use strict";

        return {
            restrict: 'A',

            link: function (scope, element, attrs) {
                // promise that is resolved when the image was loaded
                var deferred = $q.defer();
                var loaded = function () {
                    element.replaceWith(this);
                    deferred.resolve();
                };
                scope.enqueueImage(deferred.promise).then(function () {
                    // check if the image is available
                    // if yes, show it instead, else keep the current image
                    var image = document.createElement('img');
                    image.onload = loaded;
                    image.onerror = deferred.resolve;
                    image.src = attrs.lazyImage;
                });
            }
        };
    }
);
