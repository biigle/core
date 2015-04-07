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

		$scope.images = images.buffer;
		$scope.imageLoading = true;

		var finishLoading = function () {
			$scope.imageLoading = false;
		};

		var startLoading = function () {
			$scope.imageLoading = true;
		};

		images.init($attrs.transectId);
		images.show(parseInt($attrs.imageId)).then(finishLoading);

		// state of the svg
		$scope.svg = {
			// the current scale of the elements
			scale: 1,
			// the current translation (position) of the elements
			translateX: 0,
			translateY: 0,
			// mouse position taking zooming and translating into account
			mouseX: 0,
			mouseY: 0
		};

		$scope.nextImage = function () {
			startLoading();
			images.next().then(finishLoading);
		};

		$scope.prevImage = function () {
			startLoading();
			images.prev().then(finishLoading);
		};
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

		// the inherited svg state object
		var svg = $scope.svg;

		// makes sure the translate boundaries are kept
		var updateTranslate = function (translateX, translateY) {
			// scaleFactor for the right/bottom edge
			var scaleFactor = 1 - svg.scale;
			// right
			translateX = Math.max(translateX, $scope.width * scaleFactor);
			// bottom
			translateY = Math.max(translateY, $scope.height * scaleFactor);
			// left
			svg.translateX = Math.min(translateX, 0);
			// top
			svg.translateY = Math.min(translateY, 0);
		};

		// scale towards the cursor
		// see http://stackoverflow.com/a/20996105/1796523
		var updateScaleTranslate = function (scale, oldScale) {
			var scaleDifference = scale / oldScale;

			var translateX = scaleDifference * (svg.translateX - $scope.mouseX) + $scope.mouseX;
			var translateY = scaleDifference * (svg.translateY - $scope.mouseY) + $scope.mouseY;

			updateTranslate(translateX, translateY);
		};

		$scope.$watch('svg.scale', updateScaleTranslate);

		var updateMouseX = function (mouseX) {
			svg.mouseX = (mouseX - svg.translateX) / svg.scale;
		};

		$scope.$watch('mouseX', updateMouseX);

		var updateMouseY = function (mouseY) {
			svg.mouseY = (mouseY - svg.translateY) / svg.scale;
		};

		$scope.$watch('mouseY', updateMouseY);

		var zoom = function (e) {
			var scale = svg.scale - scaleStep * e.deltaY;
			svg.scale = Math.max(scale, minScale);
			e.preventDefault();
		};

		$element.on('wheel', function (e) {
			$scope.$apply(function () { zoom(e); });
		});

		$scope.startPanning = function (event) {
			panning = true;
			panningStartTranslateX = svg.translateX;
			panningStartTranslateY = svg.translateY;
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
angular.module('dias.annotations').service('images', ["TransectImage", "URL", "$q", function (TransectImage, URL, $q) {
		"use strict";

		var _this = this;
		// array of all image IDs of the transect
		var imageIds = [];
		// ID of the image currently in `show` state
		var currentId;
		// maximum number of images to hold in buffer
		var MAX_BUFFER_SIZE = 10;

		// buffer of already loaded images
		this.buffer = [];

		/**
		 * Returns the next ID of the specified image or the next ID of the 
		 * current image if no image was specified.
		 */
		var nextId = function (id) {
			id = id || currentId;
			var index = imageIds.indexOf(id);
			return imageIds[(index + 1) % imageIds.length];
		};

		/**
		 * Returns the previous ID of the specified image or the previous ID of
		 * the current image if no image was specified.
		 */
		var prevId = function (id) {
			id = id || currentId;
			var index = imageIds.indexOf(currentId);
			var length = imageIds.length;
			return imageIds[(index - 1 + length) % length];
		};

		/**
		 * Returns the specified image from the buffer or `undefined` if it is
		 * not buffered.
		 */
		var getImage = function (id) {
			id = id || currentId;
			for (var i = _this.buffer.length - 1; i >= 0; i--) {
				if (_this.buffer[i]._id == id) return _this.buffer[i];
			}

			return undefined;
		};

		/**
		 * Sets the specified image to the `show` state.
		 */
		var show = function (id) {
			for (var i = _this.buffer.length - 1; i >= 0; i--) {
				_this.buffer[i]._show = _this.buffer[i]._id == id;
			}
			currentId = id;
		};

		/**
		 * Loads the specified image either from buffer or from the external 
		 * resource. Returns a promise that gets resolved when the image is
		 * loaded.
		 */
		var fetchImage = function (id) {
			var deferred = $q.defer();
			var img = getImage(id);

			if (img) {
				deferred.resolve(img);
			} else {
				img = document.createElement('img');
				img._id = id;
				img.onload = function () {
					_this.buffer.push(img);
					// control maximum buffer size
					if (_this.buffer.length > MAX_BUFFER_SIZE) {
						_this.buffer.shift();
					}
					deferred.resolve(img);
				};
				img.onerror = function (msg) {
					deferred.reject(msg);
				};
				img.src = URL + "/api/v1/images/" + id + "/file";
			}

			return deferred.promise;
		};

		/**
		 * Initializes the service for a given transect. Returns a promise that
		 * is resolved, when the service is initialized.
		 */
		this.init = function (transectId) {
			imageIds = TransectImage.query({transect_id: transectId});
			
			return imageIds.$promise;
		};

		/**
		 * Show the image with the specified ID. Returns a promise that is
		 * resolved when the image is shown.
		 */
		this.show = function (id) {
			var promise = fetchImage(id).then(function() {
				show(id);
			});

			// wait for imageIds to be loaded
			imageIds.$promise.then(function () {
				// pre-load previous and next images but don't display them
				fetchImage(nextId(id));
				fetchImage(prevId(id));
			});

			return promise;
		};

		/**
		 * Show the next image. Returns a promise that is
		 * resolved when the image is shown.
		 */
		this.next = function () {
			return _this.show(nextId());
		};

		/**
		 * Show the previous image. Returns a promise that is
		 * resolved when the image is shown.
		 */
		this.prev = function () {
			return _this.show(prevId());
		};
	}]
);
//# sourceMappingURL=main.js.map