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

		// the scale change per scaling operation
		var scaleStep = 0.05;
		// the minimal scale
		var minScale = 1;
		// is the user currently panning?
		var panning = false;
		// translate values when panning starts
		var panningStartTranslateX = 0;
		var panningStartTranslateY = 0;
		// mouse position when panning starts
		var panningStartMouseX = 0;
		var panningStartMouseY = 0;

		// the current scale of the elements
		$scope.scale = 1;
		// the current translation (position) of the elements
		$scope.translateX = 0;
		$scope.translateY = 0;
		// mouse position taking zooming and translating into account
		$scope.relativeMouseX = $scope.mouseX;
		$scope.relativeMouseY = $scope.mouseY;

		// makes sure the translate boundaries are kept
		var updateTranslate = function (translateX, translateY) {
			// scaleFactor for the right/bottom edge
			var scaleFactor = 1 - $scope.scale;
			// right
			translateX = Math.max(translateX, $scope.width * scaleFactor);
			// bottom
			translateY = Math.max(translateY, $scope.height * scaleFactor);
			// left
			$scope.translateX = Math.min(translateX, 0);
			// top
			$scope.translateY = Math.min(translateY, 0);
		};

		// scale towards the cursor
		// see http://stackoverflow.com/a/20996105/1796523
		var updateScaleTranslate = function (scale, oldScale) {
			var scaleDifference = scale / oldScale;

			var translateX = scaleDifference * ($scope.translateX - $scope.mouseX) + $scope.mouseX;
			var translateY = scaleDifference * ($scope.translateY - $scope.mouseY) + $scope.mouseY;

			updateTranslate(translateX, translateY);
		};

		$scope.$watch('scale', updateScaleTranslate);

		var updateRelativeMouseX = function (mouseX) {
			$scope.relativeMouseX = (mouseX - $scope.translateX) / $scope.scale;
		};

		$scope.$watch('mouseX', updateRelativeMouseX);

		var updateRelativeMouseY = function (mouseY) {
			$scope.relativeMouseY = (mouseY - $scope.translateY) / $scope.scale;
		};

		$scope.$watch('mouseY', updateRelativeMouseY);

		var zoom = function (e) {
			var scale = $scope.scale - scaleStep * e.deltaY;
			$scope.scale = Math.max(scale, minScale);
			e.preventDefault();
		};

		$element.on('wheel', function (e) {
			$scope.$apply(function () { zoom(e); });
		});

		$scope.startPanning = function (event) {
			panning = true;
			panningStartTranslateX = $scope.translateX;
			panningStartTranslateY = $scope.translateY;
			panningStartMouseX = $scope.mouseX;
			panningStartMouseY = $scope.mouseY;

			// prevent default drag & drop behaviour for images
			event.preventDefault();
		};

		$scope.pan = function () {
			if (!panning) return;

			var translateX = panningStartTranslateX - (panningStartMouseX - $scope.mouseX);
			var translateY = panningStartTranslateY - (panningStartMouseY - $scope.mouseY);

			updateTranslate(translateX, translateY);
		};

		$scope.stopPanning = function () {
			panning = false;
		};
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

		var getImage = function (id) {
			for (var i = _this.buffer.length - 1; i >= 0; i--) {
				if (_this.buffer[i]._id == id) return _this.buffer[i];
			}

			return undefined;
		};

		var show = function (id) {
			for (var i = _this.buffer.length - 1; i >= 0; i--) {
				_this.buffer[i]._show = _this.buffer[i]._id == id;
			}
			_this.loading = false;
			currentId = id;

			$rootScope.$broadcast('images::show', getImage(id));
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

		/**
		 * Initializes the service for a given transect.
		 */
		this.init = function (transectId) {
			imageIds = TransectImage.query({transect_id: transectId});
			
		};

		/**
		 * Show the image with the specified ID.
		 */
		this.show = function (id) {
			fetchImage(id);
		};

		/**
		 * Show the next image.
		 */
		this.next = function () {
			var index = imageIds.indexOf(currentId);
			_this.show(imageIds[(index + 1) % imageIds.length]);
		};

		/**
		 * Show the previous image.
		 */
		this.prev = function () {
			var index = imageIds.indexOf(currentId);
			var length = imageIds.length;
			_this.show(imageIds[(index - 1 + length) % length]);
		};

		/**
		 * Returns the currently displayed image.
		 */
		this.current = function () {
			return getImage(currentId);
		};
	}]
);
//# sourceMappingURL=main.js.map