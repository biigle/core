/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AnnotatorController
 * @memberOf dias.annotations
 * @description Main controller of the Annotator application.
 */
angular.module('dias.annotations').controller('AnnotatorController', function ($scope, images, urlParams, msg, IMAGE_ID, keyboard) {
        "use strict";

        // set the content of the navbar element "manually" because it is outside of
        // the scope of the angular app
        var navbarFilename = document.querySelector('.navbar-annotations-filename');

        $scope.imageLoading = true;

        // the current canvas viewport, synced with the URL parameters
        $scope.viewport = {
            zoom: urlParams.get('z'),
            center: [urlParams.get('x'), urlParams.get('y')]
        };

        var updateNavbarFilename = function (image) {
            navbarFilename.innerHTML = image._filename;

            return image;
        };

        // finish image loading process
        var finishLoading = function (image) {
            $scope.imageLoading = false;
            $scope.$broadcast('image.shown', image);

            return image;
        };

        // create a new history entry
        var pushState = function (image) {
            urlParams.setSlug(image._id);

            return image;
        };

        // start image loading process
        var startLoading = function () {
            $scope.imageLoading = true;
        };

        // load the image by id. doesn't create a new history entry by itself
        var loadImage = function (id) {
            startLoading();
            return images.show(id)
                 .then(finishLoading)
                 .catch(msg.responseError);
        };

        // show the next image and create a new history entry
        $scope.nextImage = function () {
            startLoading();
            return images.next()
                  .then(updateNavbarFilename)
                  .then(finishLoading)
                  .then(pushState)
                  .catch(msg.responseError);
        };

        // show the previous image and create a new history entry
        $scope.prevImage = function () {
            startLoading();
            return images.prev()
                  .then(updateNavbarFilename)
                  .then(finishLoading)
                  .then(pushState)
                  .catch(msg.responseError);
        };

        // update the URL parameters of the viewport
        $scope.$on('canvas.moveend', function(e, params) {
            $scope.viewport.zoom = params.zoom;
            $scope.viewport.center[0] = Math.round(params.center[0]);
            $scope.viewport.center[1] = Math.round(params.center[1]);
            urlParams.set({
                z: $scope.viewport.zoom,
                x: $scope.viewport.center[0],
                y: $scope.viewport.center[1]
            });
        });

        keyboard.on(37, function () {
            $scope.prevImage();
            $scope.$apply();
        });

        keyboard.on(39, function () {
            $scope.nextImage();
            $scope.$apply();
        });

        keyboard.on(32, function () {
            $scope.nextImage();
            $scope.$apply();
        });

        // initialize the images service
        images.init();
        // display the first image
        loadImage(parseInt(IMAGE_ID)).then(pushState);
    }
);
