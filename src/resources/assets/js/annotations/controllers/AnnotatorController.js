/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AnnotatorController
 * @memberOf dias.annotations
 * @description Main controller of the Annotator application.
 */
angular.module('dias.annotations').controller('AnnotatorController', function ($scope, images, urlParams, msg, IMAGE_ID, keyboard, viewport, annotations, mapImage) {
        "use strict";

        // set the content of the navbar element "manually" because it is outside of
        // the scope of the angular app
        var navbarFilename = document.querySelector('.navbar-annotations-filename');

        $scope.imageLoading = true;

        var updateNavbarFilename = function (image) {
            navbarFilename.innerHTML = image._filename;

            return image;
        };

        // finish image loading process
        var finishLoading = function (image) {
            $scope.imageLoading = false;
            mapImage.renderImage(image);
            annotations.show(image._id);
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

        $scope.$on('image.fetching', function (e, image) {
            annotations.load(image._id);
        });

        // update the viewport
        $scope.$on('canvas.moveend', function(e, params) {
            viewport.set(params);
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
