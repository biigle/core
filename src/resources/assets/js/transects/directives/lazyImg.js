/**
 * @namespace dias.transects
 * @ngdoc directive
 * @name lazyImg
 * @memberOf dias.transects
 * @description An image element that loads and shows the image only if it is 
 * visible and hides it again when it is hidden for better performance.
 */
angular.module('dias.transects').directive('lazyImg', function () {
		"use strict";

		return {
			restrict: 'A',
			scope: true,
			template: '<img data-ng-src="{{src}}" data-ng-if="src">',
			controller: function ($scope, $element, $attrs) {
				var rect, isVisible, setSrc, check;
				var elm = $element[0];

				isVisible = function () {
					rect = elm.getBoundingClientRect();
					return rect.bottom >= 0 && rect.top <= window.innerHeight;
				};

				setSrc = function () {
					window.removeEventListener('scroll', check);
					window.removeEventListener('resize', check);
					$scope.src = $attrs.lazyImg;
				};

				check = function () {
					if (isVisible()) $scope.$apply(setSrc);
				};

				window.addEventListener('scroll', check);
				// fires initially
				window.addEventListener('resize', check);
			}
		};
	}
);
