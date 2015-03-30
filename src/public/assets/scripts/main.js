/**
 * @namespace dias.annotations
 * @description The DIAS annotations module.
 */
angular.module('dias.annotations', ['dias.api']);

/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AnnotatorController
 * @memberOf dias.annotations
 * @description Main controller of the Annotator application.
 */
angular.module('dias.annotations').controller('AnnotatorController', ["$scope", "$element", function ($scope, $element) {
		"use strict";
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name CanvasController
 * @memberOf dias.annotations
 * @description Main controller for the annotation canvas element
 */
angular.module('dias.annotations').controller('CanvasController', ["$scope", "$element", function ($scope, $element) {
		"use strict";

		var offsetTop = 0;

		// the current mouse position relative to the canvas container
		$scope.mouseX = 0;
		$scope.mouseY = 0;

		// the dimensions of the canvas container
		var updateDimensions = function () {
			$scope.width = $element[0].offsetWidth;
			$scope.height = $element[0].offsetHeight;
		};

		updateDimensions();

		window.addEventListener('resize', function () {
			$scope.$apply(updateDimensions);
		});

		$scope.updateMouse = function (e) {
			$scope.mouseX = e.clientX;
			$scope.mouseY = e.clientY - offsetTop;
		};

		var updateOffset = function () {
			offsetTop = $element[0].offsetTop;
		};

		updateOffset();

		window.addEventListener('resize', updateOffset);
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name SVGController
 * @memberOf dias.annotations
 * @description Controller for the annotation canvas SVG element
 */
angular.module('dias.annotations').controller('SVGController', ["$scope", "$element", function ($scope, $element) {
		"use strict";

		var scaleStep = 0.05;
		var scaleTmp;

		$scope.scale = 1;
		// translate the elements so they appear to be zooming towards the cursor
		$scope.scaleTranslateX = 0;
		$scope.scaleTranslateY = 0;
		$scope.translateX = 0;
		$scope.translateY = 0;
		// mouse position taking zooming and translating into account
		$scope.relativeMouseX = $scope.mouseX;
		$scope.relativeMouseY = $scope.mouseY;

		var updateScaleTranslate = function (scale) {
			scaleTmp = 1 - scale;
			$scope.scaleTranslateX = $scope.relativeMouseX * scaleTmp;
			$scope.scaleTranslateY = $scope.relativeMouseY * scaleTmp;
		};

		var updateRelativeMouseX = function (mouseX) {
			$scope.relativeMouseX = (mouseX - $scope.scaleTranslateX) / $scope.scale - $scope.translateX;
		};

		var updateRelativeMouseY = function (mouseY) {
			$scope.relativeMouseY = (mouseY - $scope.scaleTranslateY) / $scope.scale - $scope.translateY;
		};

		var transform = function (e) {
			if (e.ctrlKey) {
				$scope.scale += scaleStep * e.deltaY;
				e.preventDefault();
			} else {
				$scope.translateX += e.deltaX;
				$scope.translateY += e.deltaY;
				$scope.scale += e.deltaZ;
			}
		};

		$element.on('wheel', function (e) {
			$scope.$apply(function () { transform(e); });
		});

		// scale around the cursor
		// see http://commons.oreilly.com/wiki/index.php/SVG_Essentials/Transforming_the_Coordinate_System#Technique:_Scaling_Around_a_Center_Point
		$scope.$watch('scale', updateScaleTranslate);

		$scope.$watch('mouseX', updateRelativeMouseX);
		$scope.$watch('mouseY', updateRelativeMouseY);
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc directive
 * @name ngSVG
 * @memberOf dias.annotations
 * @description A general directive that enables manipulation of SVG 
 * attributes like `width` or `x` by Angular.
 */
angular.forEach(
	[
		'x',
		'cx',
		'y',
		'cy',
		'r',
		'width',
		'height',
		'transform'
	],
	function(name) {
		var ngName = 'ng' + name[0].toUpperCase() + name.slice(1);
		angular.module('dias.annotations').directive(ngName, function() {
			return function(scope, element, attrs) {
				attrs.$observe(ngName, function(value) {
					attrs.$set(name, value); 
				});
			};
		});
	}
);
//# sourceMappingURL=main.js.map