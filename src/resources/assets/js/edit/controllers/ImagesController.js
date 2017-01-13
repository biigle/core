/**
 * @namespace biigle.volumes.edit
 * @ngdoc controller
 * @name ImagesController
 * @memberOf biigle.volumes.edit
 * @description Controller for adding, editing and deleting volume images
 */
angular.module('biigle.volumes.edit').controller('ImagesController', function ($scope, $element, Image, VolumeImage, VOLUME_ID, msg) {
		"use strict";

        var messages = {
            confirm: $element.attr('data-confirmation'),
            success: $element.attr('data-success')
        };

        $scope.data = {
            addingNewImages: false,
            filenames: '',
            newImages: []
        };

        var removeImageListItem = function (id) {
            var element = document.getElementById('volume-image-' + id);

            if (element) {
                element.remove();
            } else {
                for (var i = $scope.data.newImages.length - 1; i >= 0; i--) {
                    if ($scope.data.newImages[i].id === id) {
                        $scope.data.newImages.splice(i, 1);
                        break;
                    }
                }
            }
        };

        $scope.deleteImage = function (id, filename) {
            var question = messages.confirm.replace(':img', '#' + id + ' (' + filename + ')');
            if (confirm(question)) {
                Image.delete({id: id}, function () {
                    removeImageListItem(id);
                    msg.success(messages.success);
                }, msg.responseError);
            }
        };

        /*
         * Use this function in global scope and onclick instead of a function in the
         * scope of this controller and ngClick because it has a much better performance
         * if the volume has thousands of images.
         */
        window.$biigleVolumesEditDeleteImage = function (id, filename) {
            $scope.$apply(function () {
                $scope.deleteImage(id, filename);
            });
        };


        $scope.toggleAddingNewImage = function () {
            $scope.data.addingNewImages = !$scope.data.addingNewImages;
        };

        $scope.addNewImages = function () {
            var images = VolumeImage.save({volume_id: VOLUME_ID}, {images: $scope.data.filenames}, function () {
                Array.prototype.push.apply($scope.data.newImages, images);
                $scope.data.filenames = '';
            }, msg.responseError);
        };
	}
);
