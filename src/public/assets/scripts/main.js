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
angular.module('dias.annotations').controller('AnnotatorController', ["$scope", "$element", "$attrs", "images", function ($scope, $element, $attrs, images) {
		"use strict";

		$scope.images = images;
		images.init($attrs.transectId);
		images.show(parseInt($attrs.imageId));
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
			//TODO still jumps around while zooming, don't know why
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
				$scope.translateX -= e.deltaX / $scope.scale;
				$scope.translateY -= e.deltaY / $scope.scale;
				$scope.scale += scaleStep * e.deltaZ;
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
 * @ngdoc service
 * @name images
 * @memberOf dias.annotations
 * @description Manages (pre-)loading of the images to annotate.
 */
angular.module('dias.annotations').service('images', ["$rootScope", "TransectImage", "URL", function ($rootScope, TransectImage, URL) {
		"use strict";

		// svg namespace
		var SVGNS = "http://www.w3.org/2000/svg";
		var _this = this;
		var imageIds = [];
		var currentId;

		this.buffer = [];
		this.loading = true;

		var show = function (id) {
			for (var i = _this.buffer.length - 1; i >= 0; i--) {
				_this.buffer[i]._show = _this.buffer[i]._id == id;
			}
			_this.loading = false;
			currentId = id;
		};

		var hasIdInBuffer = function (id) {
			for (var i = _this.buffer.length - 1; i >= 0; i--) {
				if (_this.buffer[i]._id == id) {
					return true;
				}
			}
			return false;
		};

		var fetchImage = function (id) {
			if (hasIdInBuffer(id)) {
				show(id);
				return;
			}

			_this.loading = true;
			var img = document.createElement('img');
			img._id = id;
			img.onload = function () {
				_this.buffer.push(img);
				show(id);
				$rootScope.$apply();
			};
			img.src = URL + "/api/v1/images/" + id + "/file";
			// var img = document.createElementNS(SVGNS, "image");
			// img.href.baseVal = URL + "/api/v1/images/" + 1 + "/file";
			// img.width.baseVal.value = 100;
			// img.height.baseVal.value = 100;
			// console.log(img, img2);
		};

		// initializes the service for a given transect and a given "start" image
		this.init = function (transectId) {
			imageIds = TransectImage.query({transect_id: transectId});
			
		};

		this.show = function (id) {
			fetchImage(id);
		};

		this.next = function () {
			var index = imageIds.indexOf(currentId);
			fetchImage(imageIds[(index + 1) % imageIds.length]);
		};

		this.prev = function () {
			var index = imageIds.indexOf(currentId);
			var length = imageIds.length;
			fetchImage(imageIds[(index - 1 + length) % length]);
		};
	}]
);
//# sourceMappingURL=main.js.map