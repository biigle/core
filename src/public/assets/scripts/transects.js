/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name AnnotatorButtonController
 * @memberOf dias.transects
 * @description Controls the button for going to the image annotator when clicking on an image of the transects view.
 */
try {
angular.module('dias.transects').controller('AnnotatorButtonController', ["$scope", "$attrs", function ($scope, $attrs) {
		"use strict";

		var prefix = $attrs.annotatorUrl + '/';
		var suffix = '';
		var id = 'image-annotator-button';

		$scope.selected = false;

		$scope.activate = function () {
			$scope.toggleButton(id);
		};

		$scope.$on('button.setActive', function (e, buttonId) {
			$scope.selected = id === buttonId;
			if ($scope.selected) {
				$scope.setImageUrl(prefix, suffix);
			}
		});
	}]
);
} catch (e) {
	// dias.transects is not loaded on this page
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbnRyb2xsZXJzL0Fubm90YXRvckJ1dHRvbkNvbnRyb2xsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUFPQSxJQUFBO0FBQ0EsUUFBQSxPQUFBLGtCQUFBLFdBQUEsa0RBQUEsVUFBQSxRQUFBLFFBQUE7RUFDQTs7RUFFQSxJQUFBLFNBQUEsT0FBQSxlQUFBO0VBQ0EsSUFBQSxTQUFBO0VBQ0EsSUFBQSxLQUFBOztFQUVBLE9BQUEsV0FBQTs7RUFFQSxPQUFBLFdBQUEsWUFBQTtHQUNBLE9BQUEsYUFBQTs7O0VBR0EsT0FBQSxJQUFBLG9CQUFBLFVBQUEsR0FBQSxVQUFBO0dBQ0EsT0FBQSxXQUFBLE9BQUE7R0FDQSxJQUFBLE9BQUEsVUFBQTtJQUNBLE9BQUEsWUFBQSxRQUFBOzs7OztFQUtBLE9BQUEsR0FBQTs7Q0FFQSIsImZpbGUiOiJ0cmFuc2VjdHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBbm5vdGF0b3JCdXR0b25Db250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9scyB0aGUgYnV0dG9uIGZvciBnb2luZyB0byB0aGUgaW1hZ2UgYW5ub3RhdG9yIHdoZW4gY2xpY2tpbmcgb24gYW4gaW1hZ2Ugb2YgdGhlIHRyYW5zZWN0cyB2aWV3LlxuICovXG50cnkge1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29udHJvbGxlcignQW5ub3RhdG9yQnV0dG9uQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRhdHRycykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHByZWZpeCA9ICRhdHRycy5hbm5vdGF0b3JVcmwgKyAnLyc7XG5cdFx0dmFyIHN1ZmZpeCA9ICcnO1xuXHRcdHZhciBpZCA9ICdpbWFnZS1hbm5vdGF0b3ItYnV0dG9uJztcblxuXHRcdCRzY29wZS5zZWxlY3RlZCA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLmFjdGl2YXRlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLnRvZ2dsZUJ1dHRvbihpZCk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kb24oJ2J1dHRvbi5zZXRBY3RpdmUnLCBmdW5jdGlvbiAoZSwgYnV0dG9uSWQpIHtcblx0XHRcdCRzY29wZS5zZWxlY3RlZCA9IGlkID09PSBidXR0b25JZDtcblx0XHRcdGlmICgkc2NvcGUuc2VsZWN0ZWQpIHtcblx0XHRcdFx0JHNjb3BlLnNldEltYWdlVXJsKHByZWZpeCwgc3VmZml4KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuKTtcbn0gY2F0Y2ggKGUpIHtcblx0Ly8gZGlhcy50cmFuc2VjdHMgaXMgbm90IGxvYWRlZCBvbiB0aGlzIHBhZ2Vcbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=