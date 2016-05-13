/**
 * @namespace dias.transects.edit
 * @description The DIAS transects module.
 */
angular.module('dias.transects.edit', ['dias.api', 'dias.ui.messages']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('dias.transects.edit').config(["$compileProvider", function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
}]);

/**
 * @namespace dias.transects.edit
 * @ngdoc controller
 * @name ImagesController
 * @memberOf dias.transects.edit
 * @description Controller for adding, editing and deleting transect images
 */
angular.module('dias.transects.edit').controller('ImagesController', ["$scope", "$element", "Image", "TransectImage", "TRANSECT_ID", "msg", function ($scope, $element, Image, TransectImage, TRANSECT_ID, msg) {
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
            var element = document.getElementById('transect-image-' + id);

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

        /*
         * Use this function in global scope and onclick instead of a function in the
         * scope of this controller and ngClick because it has a much better performance
         * if the transect has thousands of images.
         */
        window.$diasTransectsEditDeleteImage = function (id, filename) {
            var question = messages.confirm.replace(':img', '#' + id + ' (' + filename + ')');
            if (confirm(question)) {
                $scope.$apply(function () {
                    Image.delete({id: id}, function () {
                        removeImageListItem(id);
                        msg.success(messages.success);
                    }, msg.responseError);
                });
            }
        };

        $scope.toggleAddingNewImage = function () {
            $scope.data.addingNewImages = !$scope.data.addingNewImages;
        };

        $scope.addNewImages = function () {
            var images = TransectImage.save({transect_id: TRANSECT_ID}, {images: $scope.data.filenames}, function () {
                Array.prototype.push.apply($scope.data.newImages, images);
                $scope.data.filenames = '';
            }, msg.responseError);
        };
	}]
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9JbWFnZXNDb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLHVCQUFBLENBQUEsWUFBQTs7Ozs7O0FBTUEsUUFBQSxPQUFBLHVCQUFBLDRCQUFBLFVBQUEsa0JBQUE7SUFDQTs7SUFFQSxpQkFBQSxpQkFBQTs7Ozs7Ozs7OztBQ05BLFFBQUEsT0FBQSx1QkFBQSxXQUFBLDJGQUFBLFVBQUEsUUFBQSxVQUFBLE9BQUEsZUFBQSxhQUFBLEtBQUE7RUFDQTs7UUFFQSxJQUFBLFdBQUE7WUFDQSxTQUFBLFNBQUEsS0FBQTtZQUNBLFNBQUEsU0FBQSxLQUFBOzs7UUFHQSxPQUFBLE9BQUE7WUFDQSxpQkFBQTtZQUNBLFdBQUE7WUFDQSxXQUFBOzs7UUFHQSxJQUFBLHNCQUFBLFVBQUEsSUFBQTtZQUNBLElBQUEsVUFBQSxTQUFBLGVBQUEsb0JBQUE7O1lBRUEsSUFBQSxTQUFBO2dCQUNBLFFBQUE7bUJBQ0E7Z0JBQ0EsS0FBQSxJQUFBLElBQUEsT0FBQSxLQUFBLFVBQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO29CQUNBLElBQUEsT0FBQSxLQUFBLFVBQUEsR0FBQSxPQUFBLElBQUE7d0JBQ0EsT0FBQSxLQUFBLFVBQUEsT0FBQSxHQUFBO3dCQUNBOzs7Ozs7Ozs7OztRQVdBLE9BQUEsZ0NBQUEsVUFBQSxJQUFBLFVBQUE7WUFDQSxJQUFBLFdBQUEsU0FBQSxRQUFBLFFBQUEsUUFBQSxNQUFBLEtBQUEsT0FBQSxXQUFBO1lBQ0EsSUFBQSxRQUFBLFdBQUE7Z0JBQ0EsT0FBQSxPQUFBLFlBQUE7b0JBQ0EsTUFBQSxPQUFBLENBQUEsSUFBQSxLQUFBLFlBQUE7d0JBQ0Esb0JBQUE7d0JBQ0EsSUFBQSxRQUFBLFNBQUE7dUJBQ0EsSUFBQTs7Ozs7UUFLQSxPQUFBLHVCQUFBLFlBQUE7WUFDQSxPQUFBLEtBQUEsa0JBQUEsQ0FBQSxPQUFBLEtBQUE7OztRQUdBLE9BQUEsZUFBQSxZQUFBO1lBQ0EsSUFBQSxTQUFBLGNBQUEsS0FBQSxDQUFBLGFBQUEsY0FBQSxDQUFBLFFBQUEsT0FBQSxLQUFBLFlBQUEsWUFBQTtnQkFDQSxNQUFBLFVBQUEsS0FBQSxNQUFBLE9BQUEsS0FBQSxXQUFBO2dCQUNBLE9BQUEsS0FBQSxZQUFBO2VBQ0EsSUFBQTs7OztBQUlBIiwiZmlsZSI6ImVkaXQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHMuZWRpdFxuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIHRyYW5zZWN0cyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cy5lZGl0JywgWydkaWFzLmFwaScsICdkaWFzLnVpLm1lc3NhZ2VzJ10pO1xuXG4vKlxuICogRGlzYWJsZSBkZWJ1ZyBpbmZvIGluIHByb2R1Y3Rpb24gZm9yIGJldHRlciBwZXJmb3JtYW5jZS5cbiAqIHNlZTogaHR0cHM6Ly9jb2RlLmFuZ3VsYXJqcy5vcmcvMS40LjcvZG9jcy9ndWlkZS9wcm9kdWN0aW9uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cy5lZGl0JykuY29uZmlnKGZ1bmN0aW9uICgkY29tcGlsZVByb3ZpZGVyKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAkY29tcGlsZVByb3ZpZGVyLmRlYnVnSW5mb0VuYWJsZWQoZmFsc2UpO1xufSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHMuZWRpdFxuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEltYWdlc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0cy5lZGl0XG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgYWRkaW5nLCBlZGl0aW5nIGFuZCBkZWxldGluZyB0cmFuc2VjdCBpbWFnZXNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzLmVkaXQnKS5jb250cm9sbGVyKCdJbWFnZXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQsIEltYWdlLCBUcmFuc2VjdEltYWdlLCBUUkFOU0VDVF9JRCwgbXNnKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIG1lc3NhZ2VzID0ge1xuICAgICAgICAgICAgY29uZmlybTogJGVsZW1lbnQuYXR0cignZGF0YS1jb25maXJtYXRpb24nKSxcbiAgICAgICAgICAgIHN1Y2Nlc3M6ICRlbGVtZW50LmF0dHIoJ2RhdGEtc3VjY2VzcycpXG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmRhdGEgPSB7XG4gICAgICAgICAgICBhZGRpbmdOZXdJbWFnZXM6IGZhbHNlLFxuICAgICAgICAgICAgZmlsZW5hbWVzOiAnJyxcbiAgICAgICAgICAgIG5ld0ltYWdlczogW11cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcmVtb3ZlSW1hZ2VMaXN0SXRlbSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJhbnNlY3QtaW1hZ2UtJyArIGlkKTtcblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnJlbW92ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gJHNjb3BlLmRhdGEubmV3SW1hZ2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuZGF0YS5uZXdJbWFnZXNbaV0uaWQgPT09IGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZGF0YS5uZXdJbWFnZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgICogVXNlIHRoaXMgZnVuY3Rpb24gaW4gZ2xvYmFsIHNjb3BlIGFuZCBvbmNsaWNrIGluc3RlYWQgb2YgYSBmdW5jdGlvbiBpbiB0aGVcbiAgICAgICAgICogc2NvcGUgb2YgdGhpcyBjb250cm9sbGVyIGFuZCBuZ0NsaWNrIGJlY2F1c2UgaXQgaGFzIGEgbXVjaCBiZXR0ZXIgcGVyZm9ybWFuY2VcbiAgICAgICAgICogaWYgdGhlIHRyYW5zZWN0IGhhcyB0aG91c2FuZHMgb2YgaW1hZ2VzLlxuICAgICAgICAgKi9cbiAgICAgICAgd2luZG93LiRkaWFzVHJhbnNlY3RzRWRpdERlbGV0ZUltYWdlID0gZnVuY3Rpb24gKGlkLCBmaWxlbmFtZSkge1xuICAgICAgICAgICAgdmFyIHF1ZXN0aW9uID0gbWVzc2FnZXMuY29uZmlybS5yZXBsYWNlKCc6aW1nJywgJyMnICsgaWQgKyAnICgnICsgZmlsZW5hbWUgKyAnKScpO1xuICAgICAgICAgICAgaWYgKGNvbmZpcm0ocXVlc3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIEltYWdlLmRlbGV0ZSh7aWQ6IGlkfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlSW1hZ2VMaXN0SXRlbShpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtc2cuc3VjY2VzcyhtZXNzYWdlcy5zdWNjZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgbXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS50b2dnbGVBZGRpbmdOZXdJbWFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5kYXRhLmFkZGluZ05ld0ltYWdlcyA9ICEkc2NvcGUuZGF0YS5hZGRpbmdOZXdJbWFnZXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmFkZE5ld0ltYWdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBpbWFnZXMgPSBUcmFuc2VjdEltYWdlLnNhdmUoe3RyYW5zZWN0X2lkOiBUUkFOU0VDVF9JRH0sIHtpbWFnZXM6ICRzY29wZS5kYXRhLmZpbGVuYW1lc30sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSgkc2NvcGUuZGF0YS5uZXdJbWFnZXMsIGltYWdlcyk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmRhdGEuZmlsZW5hbWVzID0gJyc7XG4gICAgICAgICAgICB9LCBtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgIH07XG5cdH1cbik7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
